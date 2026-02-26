import type {
	ChatParseResult,
	ChatRequest,
	ErrorResponse,
	ParsedChatRequest,
} from "../types";

const MAX_MESSAGE_CHARS = 8_000;
const MAX_LOG_CHARS = 200_000;
const MAX_SESSION_ID_CHARS = 128;

function badRequest(message: string): ChatParseResult {
	const body: ErrorResponse = { error: message };
	return { ok: false, response: Response.json(body, { status: 400 }) };
}

function unsupportedMediaType(message: string): ChatParseResult {
	const body: ErrorResponse = { error: message };
	return { ok: false, response: Response.json(body, { status: 415 }) };
}

function normalizeLineEndings(text: string): string {
	return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function readOptionalString(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parseJsonBody(request: Request): Promise<ChatRequest | null> {
	const rawJson = await request.json<unknown>();
	if (!isObject(rawJson)) return null;

	const sessionId = readOptionalString(rawJson.sessionId);
	const message = typeof rawJson.message === "string" ? rawJson.message : "";
	const textLogs =
		typeof rawJson.textLogs === "string" ? rawJson.textLogs : undefined;

	return { sessionId, message, textLogs };
}

async function parseMultipartBody(
	request: Request,
): Promise<ChatRequest | null> {
	const formData = await request.formData();

	const messageEntry = formData.get("message");
	if (typeof messageEntry !== "string") return null;

	const sessionIdEntry = formData.get("sessionId");
	const sessionId =
		typeof sessionIdEntry === "string"
			? readOptionalString(sessionIdEntry)
			: undefined;

	const inlineLogsEntry = formData.get("textLogs");
	const inlineLogs =
		typeof inlineLogsEntry === "string"
			? normalizeLineEndings(inlineLogsEntry)
			: "";

	const fileEntry = formData.get("file");
	const fileLogs =
		fileEntry && typeof fileEntry !== "string"
			? normalizeLineEndings(await fileEntry.text())
			: "";

	const combinedLogs = [inlineLogs, fileLogs]
		.map((part) => part.trim())
		.filter((part) => part.length > 0)
		.join("\n\n");

	return {
		sessionId,
		message: messageEntry,
		textLogs: combinedLogs || undefined,
	};
}

function validateAndNormalize(input: ChatRequest): ChatParseResult {
	const sessionId = input.sessionId?.trim();
	const message = normalizeLineEndings(input.message ?? "").trim();
	const textLogs = normalizeLineEndings(input.textLogs ?? "").trim();

	if (!message) {
		return badRequest("Message is required");
	}

	if (message.length > MAX_MESSAGE_CHARS) {
		return badRequest(
			`Message exceeds maximum length of ${MAX_MESSAGE_CHARS} characters`,
		);
	}

	if (textLogs.length > MAX_LOG_CHARS) {
		return badRequest(
			`Text logs exceed maximum length of ${MAX_LOG_CHARS} characters`,
		);
	}

	if (sessionId && sessionId.length > MAX_SESSION_ID_CHARS) {
		return badRequest(
			`Session ID exceeds maximum length of ${MAX_SESSION_ID_CHARS} characters`,
		);
	}

	const userText = textLogs ? `${message}\n\n### Logs:\n${textLogs}` : message;
	const parsed: ParsedChatRequest = {
		sessionId,
		message,
		textLogs,
		userText,
	};

	return { ok: true, value: parsed };
}

export async function parseChatRequest(
	request: Request,
): Promise<ChatParseResult> {
	const contentType =
		request.headers.get("Content-Type")?.toLocaleLowerCase() ?? "";

	try {
		if (contentType.includes("application/json")) {
			const jsonBody = await parseJsonBody(request);
			if (!jsonBody) return badRequest("Invalid JSON body shape");
			return validateAndNormalize(jsonBody);
		}
		if (contentType.includes("multipart/form-data")) {
			const multipartBody = await parseMultipartBody(request);
			if (!multipartBody)
				return badRequest("Invalid multipart form-data payload");
			return validateAndNormalize(multipartBody);
		}
		return unsupportedMediaType(
			"Unsuppprted Content-Type. use application/json or multipart/formdata",
		);
	} catch (error) {
		return badRequest("Invalid request payload");
	}
}
