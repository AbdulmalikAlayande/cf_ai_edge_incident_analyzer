import { Message } from "../types";

function formatHistory(history: Message[]): string {
	if (history.length === 0) {
		return "[No conversation history]";
	}

	return history
		.map((entry) => `[${entry.role.toUpperCase()}]: ${entry.text}`)
		.join("\n");
}
