import {
	ChatResponse,
	ErrorResponse,
	Message,
	SessionRequest,
	SessionState,
} from "../types";
import { buildIncidentAnalysisPrompt } from "../lib/prompt";
import { runIncidentAnalysis } from "../lib/ai";

const STORAGE_KEY_PREFIX = "session:";
const MAX_HISTORY_MESSAGES = 20;

function isValidSessionRequest(value: unknown): value is SessionRequest {
	if (typeof value !== "object" || value === null || Array.isArray(value))
		return false;
	const record = value as Record<string, unknown>;
	return (
		typeof record.sessionId === "string" &&
		record.sessionId.trim().length > 0 &&
		typeof record.userText === "string" &&
		record.userText.trim().length > 0
	);
}

export class SessionObject {
	constructor(
		private readonly state: DurableObjectState,
		private readonly env: Env,
	) {}

	async fetch(request: Request): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", { status: 405 });
		}

		let body: SessionRequest;
		try {
			body = await request.json<SessionRequest>();
		} catch {
			const error: ErrorResponse = { error: "Invalid JSON body" };
			return Response.json(error, { status: 400 });
		}

		if (!isValidSessionRequest(body)) {
			const error: ErrorResponse = {
				error:
					"Request must include non-empty 'sessionId' and 'userText' fields",
			};
			return Response.json(error, { status: 400 });
		}

		const sessionId = body.sessionId.trim();
		const userText = body.userText?.trim();

		if (!userText || !sessionId) {
			return Response.json(
				{ error: "userText and sessionId are required" },
				{ status: 400 },
			);
		}

		const storageKey = `${STORAGE_KEY_PREFIX}${sessionId}`;
		const storedState = await this.state.storage.get<SessionState>(storageKey);

		const sessionState: SessionState = storedState || {
			sessionId,
			history: [],
			createdAt: new Date().toISOString(),
		};

		const prompt = buildIncidentAnalysisPrompt(userText, sessionState.history);

		let aiResponse: string;
		try {
			aiResponse = await runIncidentAnalysis(this.env, prompt);
		} catch {
			const error: ErrorResponse = {
				error: "Failed to get response from AI model",
			};
			return Response.json(error, { status: 502 });
		}

		const userMessage: Message = { role: "user", text: userText };
		sessionState.history.push(userMessage);

		const assistantMessage: Message = { role: "assistant", text: aiResponse };
		sessionState.history.push(assistantMessage);

		sessionState.history = sessionState.history.slice(-MAX_HISTORY_MESSAGES);

		await this.state.storage.put(storageKey, sessionState);
		const response: ChatResponse = {
			response: aiResponse,
			sessionId: sessionState.sessionId,
		};
		return Response.json(response);
	}
}
