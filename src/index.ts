import { parseChatRequest } from "./endpoints/chat";
import { logEvent } from "./lib/utils";
import type { ErrorResponse, SessionRequest } from "./types";

export { SessionObject } from "./durable-objects/session";

const CORS_HEADERS: Record<string, string> = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "POST, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
};

function withCors(response: Response): Response {
	const patched = new Response(response.body, response);
	for (const [key, value] of Object.entries(CORS_HEADERS)) {
		patched.headers.set(key, value);
	}
	return patched;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);

		if (request.method === "OPTIONS") {
			return new Response(null, { status: 204, headers: CORS_HEADERS });
		}

		if (request.method !== "POST" || url.pathname !== "/chat") {
			return new Response("Not Found", { status: 404 });
		}

		const requestId = crypto.randomUUID();
		const parseResult = await parseChatRequest(request);
		if (parseResult.ok === false) {
			logEvent("warn", "chat_request_rejected", {
				requestId,
				status: parseResult.response.status,
			});
			return withCors(parseResult.response);
		}

		const sessionId = parseResult.value.sessionId || crypto.randomUUID();
		const payload: SessionRequest = {
			sessionId,
			userText: parseResult.value.userText,
		};

		const stub = env.SESSIONS.getByName(sessionId);
		const forwardedRequest = new Request(request.url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		try {
			const response = await stub.fetch(forwardedRequest);
			if (!response.ok) {
				logEvent("warn", "do_response_non_ok", {
					requestId,
					sessionId,
					status: response.status,
				});
			}
			return withCors(response);
		} catch (error) {
			logEvent("error", "chat_request_failed", {
				requestId,
				sessionId,
				error: error instanceof Error ? error.message : "Unknown error",
			});
			const body: ErrorResponse = { error: "Failed to process chat request" };
			return withCors(Response.json(body, { status: 500 }));
		}
	},
};
