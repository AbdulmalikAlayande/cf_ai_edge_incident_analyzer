import { describe, expect, it } from "vitest";

import { parseChatRequest } from "../src/endpoints/chat";

async function readError(response: Response): Promise<string> {
	const json = (await response.json()) as { error?: string };
	return json.error ?? "";
}

describe("parseChatRequest", () => {
	it("parses JSON body and normalizes text", async () => {
		const request = new Request("https://example.com/chat", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ message: "  timeout in eu-west  " }),
		});

		const result = await parseChatRequest(request);
		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("Expected parse success");
		}
		expect(result.value.message).toBe("timeout in eu-west");
		expect(result.value.userText).toBe("timeout in eu-west");
	});

	it("combines inline logs and file logs from multipart payload", async () => {
		const form = new FormData();
		form.set("message", "incident summary");
		form.set("textLogs", "line-a");
		form.set("file", new File(["line-b"], "logs.txt", { type: "text/plain" }));

		const request = new Request("https://example.com/chat", {
			method: "POST",
			body: form,
		});

		const result = await parseChatRequest(request);
		expect(result.ok).toBe(true);
		if (!result.ok) {
			throw new Error("Expected multipart parse success");
		}
		expect(result.value.textLogs).toBe("line-a\n\nline-b");
		expect(result.value.userText).toContain("### Logs:");
	});

	it("rejects unsupported content type", async () => {
		const request = new Request("https://example.com/chat", {
			method: "POST",
			headers: { "Content-Type": "text/plain" },
			body: "hello",
		});

		const result = await parseChatRequest(request);
		expect(result.ok).toBe(false);
		if (result.ok) {
			throw new Error("Expected parse failure");
		}
		expect(result.response.status).toBe(415);
		expect(await readError(result.response)).toContain("Unsupported Content-Type");
	});

	it("rejects payloads over maximum size", async () => {
		const request = new Request("https://example.com/chat", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Content-Length": "400001",
			},
			body: JSON.stringify({ message: "ok" }),
		});

		const result = await parseChatRequest(request);
		expect(result.ok).toBe(false);
		if (result.ok) {
			throw new Error("Expected parse failure");
		}
		expect(result.response.status).toBe(413);
	});
});
