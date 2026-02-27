import { describe, expect, it } from "vitest";

import worker from "../src/index";

function createEnv(
	onFetch: (request: Request, name: string) => Promise<Response>,
): Env {
	const namespace = {
		getByName(name: string) {
			return {
				fetch: (request: Request) => onFetch(request, name),
			} as DurableObjectStub;
		},
	} as DurableObjectNamespace;

	return {
		SESSIONS: namespace,
		AI: {} as Ai,
		OPENAI_API_KEY: "",
	} as Env;
}

describe("/chat integration", () => {
	it("generates sessionId and forwards normalized payload to DO", async () => {
		let seenName = "";
		let seenPayload: { sessionId: string; userText: string } | null = null;

		const env = createEnv(async (request, name) => {
			seenName = name;
			seenPayload = (await request.json()) as {
				sessionId: string;
				userText: string;
			};
			return Response.json({
				sessionId: seenPayload.sessionId,
				response: "ok",
			});
		});

		const response = await worker.fetch(
			new Request("https://example.com/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ message: "timeouts after deploy" }),
			}),
			env,
		);

		expect(response.status).toBe(200);
		expect(seenPayload?.sessionId.length).toBeGreaterThan(0);
		expect(seenPayload?.userText).toBe("timeouts after deploy");
		expect(seenName).toBe(seenPayload?.sessionId);
	});

	it("uses provided sessionId for follow-up requests", async () => {
		const expectedSessionId = "session-123";
		let seenName = "";

		const env = createEnv(async (request, name) => {
			seenName = name;
			const body = (await request.json()) as {
				sessionId: string;
				userText: string;
			};
			return Response.json({ sessionId: body.sessionId, response: "ok" });
		});

		const response = await worker.fetch(
			new Request("https://example.com/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					sessionId: expectedSessionId,
					message: "retry storm observed",
				}),
			}),
			env,
		);

		expect(response.status).toBe(200);
		expect(seenName).toBe(expectedSessionId);
	});
});
