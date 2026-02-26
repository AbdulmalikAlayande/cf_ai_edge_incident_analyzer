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
