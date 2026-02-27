**Day 1: Foundation + Contracts**

1. Read `CODEX.md`, then update `wrangler.jsonc` with `AI` + `SESSIONS` + `SessionObject` migration.
2. Run `npx wrangler types`.
3. Finalize all shared types in `src/types.ts`.
4. Implement `src/durable-objects/session.ts` (load/create/append/save/trim-20).
5. Add/initialize `PROMPTS.md` file if missing.

Exit criteria:

1. `wrangler dev` starts without binding/migration errors.
2. `SessionObject` compiles and is bindable.
3. `types.ts` is the only shared-type source.

---

**Day 2: Backend Core Flow (No Fancy UI Yet)**

1. Implement `src/lib/utils.ts` for log normalization.
2. Implement `src/lib/prompt.ts` with required template.
3. Implement `src/lib/ai.ts` with model constant + `env.AI.run`.
4. Implement `src/endpoints/chat.ts` orchestration (JSON + multipart).
5. Replace template routing in `src/index.ts` with `POST /chat`, export `SessionObject`.

Exit criteria:

1. `POST /chat` works for JSON and multipart.
2. Session history persists across requests by `sessionId`.
3. Errors are sanitized (`400`/`500`, no raw stack).

---

**Day 3: React Frontend + E2E**

1. Build `frontend/src/components/chat/*` and `frontend/src/hooks/useChat.ts` for chat UX.
2. Implement `frontend/src/lib/api.ts` (JSON + multipart payload handling, same-origin `/chat` default).
3. Render response and error states in chat feed.
4. Manually test first message + follow-up + file upload.

Exit criteria:

1. First send creates session, next sends reuse it.
2. Responses and errors render clearly.
3. Mobile/desktop usability is acceptable.

---

**Day 4: Hardening + Cleanup**

1. Rotate leaked key and move secrets to Wrangler secret store.
2. Re-check `PROMPTS.md` matches final `prompt.ts`.
3. Validate all required behaviors with a fixed test checklist.
4. Clean docs (`README.md` and onboarding docs) to match actual implementation.

Exit criteria:

1. No live plaintext credentials in repo files.
2. Prompt documentation is up to date.
3. README reflects actual implemented flow.

---

**Day 5: Buffer / Submission Prep**

1. Bug fixes from manual testing.
2. Tighten edge-case handling (empty message, huge logs, invalid file).
3. Final smoke test with `wrangler dev` and one deploy dry run flow.

Exit criteria:

1. Stable local demo path from fresh session to follow-up response.
2. No known critical issues left.
3. Repo is presentation-ready.
