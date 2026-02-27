import type { LogLevel } from "../types";

export function normalizeLineEndings(text: string): string {
	return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

export function readOptionalString(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readContentLength(headers: Headers): number | undefined {
	const raw = headers.get("content-length");
	if (!raw) return undefined;
	const parsed = Number.parseInt(raw, 10);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

export function safeErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim().length > 0) {
		return error.message;
	}
	if (typeof error === "string" && error.trim().length > 0) {
		return error;
	}
	return "Unknown error";
}

export function logEvent(
	level: LogLevel,
	event: string,
	context: Record<string, unknown>,
): void {
	const payload = {
		level,
		event,
		timestamp: new Date().toISOString(),
		...context,
	};
	const serialized = JSON.stringify(payload);

	if (level === "error") {
		console.error(serialized);
		return;
	}
	if (level === "warn") {
		console.warn(serialized);
		return;
	}
	console.log(serialized);
}
