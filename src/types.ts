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
};

export type ChatResponse = {
	response: string;
	sessionId: string;
};
