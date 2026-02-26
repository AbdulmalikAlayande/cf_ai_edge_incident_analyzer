const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

type AiRunResponse =
	| string
	| { response?: string; result?: { response?: string } };

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

export async function runIncidentAnalysis(
	env: Env,
	prompt: string,
): Promise<string> {
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

	const rawResponse = (await env.AI.run(MODEL, {
		messages,
		maxTokens: 1000,
		temperature: 0.2,
	})) as AiRunResponse;

	const text = extractResponseText(rawResponse);
	if (!text) {
		throw new Error("Workers AI returned an empty response");
	}

	return text;
}
