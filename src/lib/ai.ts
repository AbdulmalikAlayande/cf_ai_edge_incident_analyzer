const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

type AiRunResponse =
	| string
	| { response?: string; result?: { response?: string } };
