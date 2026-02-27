export type Message = {
	role: "user" | "assistant";
	text: string;
};

export type SessionState = {
	sessionId: string;
	history: Message[];
	createdAt: string;
};

export type ChatRequest = {
	message: string;
	sessionId?: string;
	textLogs?: string;
};

export type ParsedChatRequest = {
	message: string;
	sessionId?: string;
	textLogs: string;
	userText: string;
};

export type SessionRequest = {
	sessionId: string;
	userText: string;
};

export type ChatResponse = {
	response: string;
	sessionId: string;
};

export type ErrorResponse = {
	error: string;
};

export type ChatParseResult =
	| { ok: true; value: ParsedChatRequest }
	| { ok: false; response: Response };

export type LogLevel = "info" | "warn" | "error";
