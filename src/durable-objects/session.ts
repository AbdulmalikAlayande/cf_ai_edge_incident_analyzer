import { ChatRequest, ChatResponse, SessionState } from "../types";

export class SessionObject {
	constructor(
		private readonly state: DurableObjectState,
		private readonly env: Env,
	) {}

	async fetch(request: Request): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", { status: 405 });
		}

		let body: ChatRequest;
		try {
			body = await request.json<ChatRequest>();
		} catch (error) {
			return Response.json({ error: "Invalid JSON" }, { status: 400 });
		}

		const sessionId = body.sessionId.trim();
		const message = body.message?.trim();

		if (!message || !sessionId) {
			return Response.json(
				{ error: "Message and sessionId are required" },
				{ status: 400 },
			);
		}

		const storageKey = `session:${sessionId}`;
		const storedState = await this.state.storage.get<SessionState>(storageKey);

		const sessionState: SessionState = storedState || {
			sessionId,
			history: [],
			createdAt: new Date().toISOString(),
		};

		sessionState.history.push({ role: "user", text: message });

		// TODO: Here we would typically call our AI model to get a response based on the session history.
		const reply =
			"Wiring complete. Next step is prompt + Workers AI integration.";
		sessionState.history.push({ role: "assistant", text: reply });

		sessionState.history = sessionState.history.slice(-20);

		await this.state.storage.put(storageKey, sessionState);
		const response: ChatResponse = {
			response: reply,
			sessionId: sessionState.sessionId,
		};
		return Response.json(response);
	}
}
