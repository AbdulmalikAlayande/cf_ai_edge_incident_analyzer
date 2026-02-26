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

function buildHeuristicReply(userText: string): string {
	const lowerText = userText.toLowerCase();

	const patterns: string[] = [];
	if (lowerText.includes("error") || lowerText.includes("fail"))
		patterns.push("error");
	if (lowerText.includes("slow") || lowerText.includes("latency"))
		patterns.push("performance degradation");
	if (lowerText.includes("timeout")) patterns.push("timeout");
	if (lowerText.includes("retry")) patterns.push("retry storm risk");
	if (lowerText.includes("queue")) patterns.push("queue backlog");
	if (lowerText.includes("eu-west") || lowerText.includes("region"))
		patterns.push("regional failure");

	const mostLikelyIssue =
		patterns[0] ?? "insufficient information/evidence to determine issue type";
	return [
		"Most likely pattern:",
		mostLikelyIssue,
		"",
		"Why I think so:",
		"Initial signal matching from provided context. More confidence requires correlated timestamps, service boundaries, and error-rate trend.",
		"",
		"Top 3 hypotheses:",
		"1. Dependency latency or timeout amplification.",
		"2. Retry configuration creating load multiplication.",
		"3. Regional infrastructure or network degradation.",
		"",
		"What to check next:",
		"1. Compare error/latency by region and service.",
		"2. Inspect retry volume and saturation metrics.",
		"3. Verify recent deploy or config drift around incident start.",
		"",
		"What would change my mind:",
		"Evidence showing unaffected upstream dependencies and stable latency/error profiles during the same window.",
	].join("\n");
}

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

		const userMessage: Message = { role: "user", text: userText };
		sessionState.history.push(userMessage);

		const reply = buildHeuristicReply(userText);
		const assistantMessage: Message = { role: "assistant", text: reply };
		sessionState.history.push(assistantMessage);

		sessionState.history = sessionState.history.slice(-MAX_HISTORY_MESSAGES);

		await this.state.storage.put(storageKey, sessionState);
		const response: ChatResponse = {
			response: reply,
			sessionId: sessionState.sessionId,
		};
		return Response.json(response);
	}
}
