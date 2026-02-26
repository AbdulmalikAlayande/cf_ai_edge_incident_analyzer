import type { ChatRequest } from "./types";
export { SessionObject } from "./durable-objects/session";

interface Env {
	SESSIONS: DurableObjectNamespace;
}
interface RequestBody {
	message: string;
	sessionId?: string;
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		if (request.method !== "POST" || url.pathname !== "/chat") {
			return new Response("Not Found", { status: 404 });
		}
		let body: ChatRequest;
		try {
			body = await request.json<ChatRequest>();
		} catch (error) {
			return Response.json({ error: "Invalid JSON" }, { status: 400 });
		}

		const message = body.message?.trim();
		if (!message) {
			return Response.json({ error: "Message is required" }, { status: 400 });
		}

		const sessionId = body.sessionId?.trim() || crypto.randomUUID();

		const stub = env.SESSIONS.getByName(sessionId);
		const forwardedRequest = new Request(request.url, {
			method: "POST",
			headers: request.headers,
			body: JSON.stringify({
				message,
				sessionId,
			}),
		});
		return stub.fetch(forwardedRequest);
	},
};
