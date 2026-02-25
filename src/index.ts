interface Env {
	SESSIONS: DurableObjectNamespace;
}
interface RequestBody {
	message: string;
	sessionId?: string;
}

export default {
	async fetch(request: Request, env: Env) {
		const url = new URL(request.url);
		if (request.method === "POST" && url.pathname === "/chat") {
			const requestBody = await request.json<RequestBody>();
			const sessionId = requestBody.sessionId || "";
			const id = env.SESSIONS.idFromName(sessionId);
			const stub = env.SESSIONS.get(id);
			return stub.fetch(request);
		}
		return new Response("Not Found", { status: 404 });
	},
};

export { SessionObject } from "./durable-objects/session";
