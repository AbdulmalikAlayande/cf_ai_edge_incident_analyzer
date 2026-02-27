import { describe, expect, it } from "vitest";

import { buildIncidentAnalysisPrompt } from "../src/lib/prompt";
import type { Message } from "../src/types";

describe("buildIncidentAnalysisPrompt", () => {
	it("includes no-history marker when history is empty", () => {
		const prompt = buildIncidentAnalysisPrompt("timeouts after deploy", []);
		expect(prompt).toContain("[No conversation history]");
		expect(prompt).toContain("New Input (Logs / Description):");
	});

	it("serializes prior conversation into prompt context", () => {
		const history: Message[] = [
			{ role: "user", text: "eu-west errors" },
			{ role: "assistant", text: "possible regional failure" },
		];

		const prompt = buildIncidentAnalysisPrompt("retry spikes", history);
		expect(prompt).toContain("[USER]: eu-west errors");
		expect(prompt).toContain("[ASSISTANT]: possible regional failure");
		expect(prompt).toContain("User Message:\nretry spikes");
	});
});
