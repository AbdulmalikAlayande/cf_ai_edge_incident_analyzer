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
			const message = requestBody.message;
			let sessionId = requestBody.sessionId || "";
			if (!sessionId) {
				sessionId = crypto.randomUUID();
			}
			console.table(requestBody);
			const response = {
				message: `Received your message: ${message}`,
				sessionId,
			};
			return new Response(JSON.stringify(response), {
				headers: { "Content-Type": "application/json" },
			});
		}
		return new Response("Not Found", { status: 404 });
	},
};
