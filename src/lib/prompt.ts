import { Message } from "../types";

function formatHistory(history: Message[]): string {
	if (history.length === 0) {
		return "[No conversation history]";
	}

	return history
		.map((entry) => `[${entry.role.toUpperCase()}]: ${entry.text}`)
		.join("\n");
}

export function buildIncidentAnalysisPrompt(
	userText: string,
	history: Message[],
): string {
	const formattedHistory = formatHistory(history);
	const currentInput = userText.trim();

	return [
		"You are an expert incident analysis assistant specializing in distributed systems.",
		"Known failure patterns: timeout, retry storm, queue backlog, regional failure, cache stampede, cascading failure, connection pool exhaustion.",
		"",
		"Session History:",
		formattedHistory,
		"",
		"New Input (Logs / Description):",
		currentInput,
		"",
		"User Message:",
		currentInput,
		"",
		"Provide a structured analysis:",
		"1. Detected failure pattern (if any)",
		"2. Probable root cause hypothesis",
		"3. Impact explanation",
		"4. Suggested next checks",
		"",
		"Be precise. Do not hallucinate. If unsure, say so.",
	].join("\n");
}
