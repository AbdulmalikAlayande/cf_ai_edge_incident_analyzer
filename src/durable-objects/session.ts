import type {
	ChatResponse,
	ErrorResponse,
	Message,
	SessionRequest,
	SessionState,
} from "../types";
import { runIncidentAnalysis, IncidentAiError } from "../lib/ai";
import { buildIncidentAnalysisPrompt } from "../lib/prompt";
import { isRecord, logEvent } from "../lib/utils";

const STORAGE_KEY = "session";
const MAX_HISTORY_MESSAGES = 20;
const MAX_USER_TEXT_CHARS = 220_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;

function isValidSessionRequest(value: unknown): value is SessionRequest {
	if (!isRecord(value)) return false;
	return (
		typeof value.sessionId === "string" &&
		value.sessionId.trim().length > 0 &&
		typeof value.userText === "string" &&
		value.userText.trim().length > 0
	);
}

function aiErrorToResponse(error: IncidentAiError): Response {
	let message = "Failed to get response from AI model";
	if (error.code === "ai_timeout") {
		message = "AI service timed out. Please retry.";
	}
	if (error.code === "ai_rate_limited") {
		message = "AI service is rate-limited. Please retry shortly.";
	}
	const response: ErrorResponse = { error: message };
	return Response.json(response, { status: error.status });
}

export class SessionObject {
	private readonly requestTimestamps: number[] = [];

	constructor(
		private readonly state: DurableObjectState,
		private readonly env: Env,
	) {}

	private isRateLimited(nowMs: number): boolean {
		const threshold = nowMs - RATE_LIMIT_WINDOW_MS;
		while (
			this.requestTimestamps.length > 0 &&
			this.requestTimestamps[0] < threshold
		) {
			this.requestTimestamps.shift();
		}
		if (this.requestTimestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
			return true;
		}
		this.requestTimestamps.push(nowMs);
		return false;
	}

	async fetch(request: Request): Promise<Response> {
		if (request.method !== "POST") {
			return new Response("Method Not Allowed", { status: 405 });
		}

		let body: unknown;
		try {
			body = await request.json<unknown>();
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
		const userText = body.userText.trim();
		const userTextLength = userText.length;

		if (userTextLength > MAX_USER_TEXT_CHARS) {
			return Response.json(
				{
					error: `userText exceeds maximum length of ${MAX_USER_TEXT_CHARS} characters`,
				},
				{ status: 413 },
			);
		}

		if (this.isRateLimited(Date.now())) {
			logEvent("warn", "session_rate_limited", {
				sessionId,
				windowMs: RATE_LIMIT_WINDOW_MS,
				maxRequests: RATE_LIMIT_MAX_REQUESTS,
			});
			return Response.json(
				{ error: "Rate limit exceeded for this session. Please retry shortly." },
				{ status: 429, headers: { "Retry-After": "60" } },
			);
		}

		const storedState = await this.state.storage.get<SessionState>(STORAGE_KEY);
		const sessionState: SessionState = storedState ?? {
			sessionId,
			history: [],
			createdAt: new Date().toISOString(),
		};

		const prompt = buildIncidentAnalysisPrompt(userText, sessionState.history);
		let aiResponse: string;

		try {
			aiResponse = await runIncidentAnalysis(this.env, prompt);
		} catch (error) {
			if (error instanceof IncidentAiError) {
				logEvent("error", "ai_analysis_failed", {
					sessionId,
					code: error.code,
					status: error.status,
					retryable: error.retryable,
				});
				return aiErrorToResponse(error);
			}
			logEvent("error", "ai_analysis_failed_unknown", {
				sessionId,
				error: error instanceof Error ? error.message : "Unknown error",
			});
			const failure: ErrorResponse = {
				error: "Failed to get response from AI model",
			};
			return Response.json(failure, { status: 502 });
		}

		const userMessage: Message = { role: "user", text: userText };
		sessionState.history.push(userMessage);

		const assistantMessage: Message = { role: "assistant", text: aiResponse };
		sessionState.history.push(assistantMessage);
		sessionState.history = sessionState.history.slice(-MAX_HISTORY_MESSAGES);

		await this.state.storage.put(STORAGE_KEY, sessionState);
		logEvent("info", "session_response_saved", {
			sessionId,
			historyLength: sessionState.history.length,
			userTextLength,
			responseLength: aiResponse.length,
		});

		const response: ChatResponse = {
			response: aiResponse,
			sessionId: sessionState.sessionId,
		};
		return Response.json(response);
	}
}
