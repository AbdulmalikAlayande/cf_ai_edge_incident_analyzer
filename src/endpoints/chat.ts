import type {
	ChatParseResult,
	ChatRequest,
	ErrorResponse,
	ParsedChatRequest,
} from "../types";
import {
	isRecord,
	normalizeLineEndings,
	readContentLength,
	readOptionalString,
} from "../lib/utils";

const MAX_MESSAGE_CHARS = 8_000;
const MAX_LOG_CHARS = 200_000;
const MAX_SESSION_ID_CHARS = 128;
const MAX_REQUEST_BYTES = 300_000;

function badRequest(message: string): ChatParseResult {
	const body: ErrorResponse = { error: message };
	return { ok: false, response: Response.json(body, { status: 400 }) };
}

function unsupportedMediaType(message: string): ChatParseResult {
	const body: ErrorResponse = { error: message };
	return { ok: false, response: Response.json(body, { status: 415 }) };
}

function payloadTooLarge(message: string): ChatParseResult {
	const body: ErrorResponse = { error: message };
	return { ok: false, response: Response.json(body, { status: 413 }) };
}

async function parseJsonBody(request: Request): Promise<ChatRequest | null> {
	const rawJson = await request.json<unknown>();
	if (!isRecord(rawJson)) return null;

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
	const contentType = request.headers.get("Content-Type")?.toLowerCase() ?? "";
	const contentLength = readContentLength(request.headers);
	if (typeof contentLength === "number" && contentLength > MAX_REQUEST_BYTES) {
		return payloadTooLarge(
			`Request exceeds maximum payload size of ${MAX_REQUEST_BYTES} bytes`,
		);
	}

	try {
		if (contentType.includes("application/json")) {
			const jsonBody = await parseJsonBody(request);
			if (!jsonBody) return badRequest("Invalid JSON body shape");
			return validateAndNormalize(jsonBody);
		}

		if (contentType.includes("multipart/form-data")) {
			const multipartBody = await parseMultipartBody(request);
			if (!multipartBody) {
				return badRequest("Invalid multipart form-data payload");
			}
			return validateAndNormalize(multipartBody);
		}

		return unsupportedMediaType(
			"Unsupported Content-Type. Use application/json or multipart/form-data",
		);
	} catch {
		return badRequest("Invalid request payload");
	}
}
