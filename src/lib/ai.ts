import { isRecord, safeErrorMessage } from "./utils";

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const AI_TIMEOUT_MS = 20_000;
const MAX_AI_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;

type AiRunResponse =
	| string
	| { response?: string; result?: { response?: string } };

type ClassifiedError = {
	code: string;
	status: number;
	retryable: boolean;
	message: string;
};

export class IncidentAiError extends Error {
	readonly code: string;
	readonly status: number;
	readonly retryable: boolean;

	constructor(classified: ClassifiedError) {
		super(classified.message);
		this.code = classified.code;
		this.status = classified.status;
		this.retryable = classified.retryable;
	}
}

function extractResponseText(raw: AiRunResponse): string | null {
	if (typeof raw === "string" && raw.trim().length > 0) {
		return raw.trim();
	}

	if (raw && typeof raw === "object") {
		if (typeof raw.response === "string" && raw.response.trim().length > 0) {
			return raw.response.trim();
		}

		if (
			raw.result &&
			typeof raw.result === "object" &&
			typeof raw.result.response === "string" &&
			raw.result.response.trim().length > 0
		) {
			return raw.result.response.trim();
		}
	}

	return null;
}

function classifyAiError(error: unknown): ClassifiedError {
	const message = safeErrorMessage(error);
	const normalized = message.toLowerCase();

	if (normalized.includes("timeout")) {
		return {
			code: "ai_timeout",
			status: 504,
			retryable: true,
			message: "AI request timed out",
		};
	}

	let status: number | undefined;
	if (isRecord(error) && typeof error.status === "number") {
		status = error.status;
	}

	if (status === 429 || normalized.includes("rate limit")) {
		return {
			code: "ai_rate_limited",
			status: 429,
			retryable: true,
			message: "AI rate limit reached",
		};
	}

	if (typeof status === "number" && status >= 500) {
		return {
			code: "ai_upstream_unavailable",
			status: 502,
			retryable: true,
			message: "AI upstream service unavailable",
		};
	}

	if (normalized.includes("invalid") || normalized.includes("bad request")) {
		return {
			code: "ai_invalid_request",
			status: 400,
			retryable: false,
			message: "AI request was rejected",
		};
	}

	return {
		code: "ai_unknown_failure",
		status: 502,
		retryable: true,
		message,
	};
}

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

async function runWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout> | undefined;
	try {
		const timeoutPromise = new Promise<never>((_, reject) => {
			timeoutId = setTimeout(() => {
				reject(new Error("AI timeout"));
			}, timeoutMs);
		});
		return await Promise.race([promise, timeoutPromise]);
	} finally {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}
	}
}

async function callAiOnce(env: Env, prompt: string): Promise<string> {
	const messages = [
		{
			role: "system",
			content:
				"You are a precise distributed-systems incident analysis assistant.",
		},
		{
			role: "user",
			content: prompt,
		},
	];

	const rawResponse = (await runWithTimeout(
		env.AI.run(MODEL, {
			messages,
			max_tokens: 1000,
			temperature: 0.2,
		}),
		AI_TIMEOUT_MS,
	)) as AiRunResponse;

	const text = extractResponseText(rawResponse);
	if (!text) {
		throw new IncidentAiError({
			code: "ai_empty_response",
			status: 502,
			retryable: true,
			message: "Workers AI returned an empty response",
		});
	}

	return text;
}

export async function runIncidentAnalysis(
	env: Env,
	prompt: string,
): Promise<string> {
	let lastError: IncidentAiError | undefined;

	for (let attempt = 1; attempt <= MAX_AI_ATTEMPTS; attempt += 1) {
		try {
			return await callAiOnce(env, prompt);
		} catch (error) {
			const classified =
				error instanceof IncidentAiError
					? error
					: new IncidentAiError(classifyAiError(error));
			lastError = classified;

			if (!classified.retryable || attempt === MAX_AI_ATTEMPTS) {
				throw classified;
			}

			const backoffMs = RETRY_BASE_DELAY_MS * attempt;
			await wait(backoffMs);
		}
	}

	throw (
		lastError ??
		new IncidentAiError({
			code: "ai_unreachable_state",
			status: 502,
			retryable: false,
			message: "AI call failed",
		})
	);
}
