export interface AppState {
	sessionId: string | null;
	inputMode: "logs" | "describe";
	sending: boolean;
}

export interface AssistantSection {
	title: string;
	content: string;
}

export interface MessageOptions {
	attachment?: string;
	pending?: boolean;
	error?: boolean;
}

export interface ChatResponseSuccess {
	sessionId?: string;
	response: string;
}

export interface ChatResponseError {
	error?: string;
}

export interface JsonChatPayload {
	message: string;
	textLogs?: string;
	sessionId?: string;
}
