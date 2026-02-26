import { parseChatRequest } from "./endpoints/chat";
import { ErrorResponse, SessionRequest } from "./types";
export { SessionObject } from "./durable-objects/session";

interface Env {
	SESSIONS: DurableObjectNamespace;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		if (request.method !== "POST" || url.pathname !== "/chat") {
			return new Response("Not Found", { status: 404 });
		}

		const parseResult = await parseChatRequest(request);
		if (parseResult.ok === false) {
			return parseResult.response;
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
			return await stub.fetch(forwardedRequest);
		} catch {
			const body: ErrorResponse = { error: "Failed to process chat request" };
			return Response.json(body, { status: 500 });
		}
	},
};
