import { describe, expect, it } from "vitest";

import { SessionObject } from "../src/durable-objects/session";
import type { SessionState } from "../src/types";

class MockStorage {
	private readonly data = new Map<string, unknown>();

	async get<T>(key: string): Promise<T | undefined> {
		return this.data.get(key) as T | undefined;
	}

	async put<T>(key: string, value: T): Promise<void> {
		this.data.set(key, value);
	}
}

function createState(storage: MockStorage): DurableObjectState {
	return { storage } as unknown as DurableObjectState;
}

function createEnv(runImpl: () => Promise<unknown>): Env {
	return {
		AI: {
			run: async () => runImpl(),
		} as Ai,
		SESSIONS: {} as DurableObjectNamespace,
		OPENAI_API_KEY: "",
	} as Env;
}

function createRequest(sessionId: string, userText: string): Request {
	return new Request("https://example.com/chat", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ sessionId, userText }),
	});
}

describe("SessionObject", () => {
	it("persists history across repeated calls", async () => {
		const storage = new MockStorage();
		const env = createEnv(async () => ({ response: "analysis" }));
		const session = new SessionObject(createState(storage), env);

		const first = await session.fetch(createRequest("s-1", "message one"));
		expect(first.status).toBe(200);

		const second = await session.fetch(createRequest("s-1", "message two"));
		expect(second.status).toBe(200);

		const saved = await storage.get<SessionState>("session");
		expect(saved?.sessionId).toBe("s-1");
		expect(saved?.history.length).toBe(4);
		expect(saved?.history[0].role).toBe("user");
		expect(saved?.history[3].role).toBe("assistant");
	});

	it("returns 429 when session request rate exceeds guardrail", async () => {
		const storage = new MockStorage();
		const env = createEnv(async () => ({ response: "analysis" }));
		const session = new SessionObject(createState(storage), env);

		for (let i = 0; i < 20; i += 1) {
			const response = await session.fetch(createRequest("s-2", `m-${i}`));
			expect(response.status).toBe(200);
		}

		const blocked = await session.fetch(createRequest("s-2", "m-21"));
		expect(blocked.status).toBe(429);
	});

	it("maps upstream AI rate limit failures to 429", async () => {
		const storage = new MockStorage();
		const env = createEnv(async () => {
			throw { status: 429, message: "rate limit exceeded" };
		});
		const session = new SessionObject(createState(storage), env);

		const response = await session.fetch(createRequest("s-3", "message"));
		expect(response.status).toBe(429);

		const body = (await response.json()) as { error: string };
		expect(body.error).toContain("rate-limited");
	});
});
