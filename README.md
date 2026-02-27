# cf_ai_edge_incident_analyzer

Last verified: 2026-02-27

## Project in one sentence
Cloudflare-native incident investigation assistant that analyzes logs with session-aware reasoning.

## What problem it solves
- Engineers need faster incident triage during active outages.
- Logs plus follow-up questions must remain in one session context.
- AI output must be structured and immediately actionable for on-call teams.

## MVP architecture snapshot
- Worker: serves React static assets and handles `POST /chat`.
- Durable Objects: keeps per-session investigation history.
- Workers AI: generates structured incident analysis.
- React frontend: sends same-origin requests to `/chat`.

```text
Browser (React UI)
   -> POST /chat (JSON or multipart)
      -> Worker (src/index.ts)
         -> Durable Object (SessionObject by sessionId)
            -> Prompt builder (src/lib/prompt.ts)
            -> Workers AI (src/lib/ai.ts)
         <- { sessionId, response }
   <- structured analysis rendered in chat feed
```

## Quickstart (local run in <5 min)

1. Install dependencies.

```bash
npm install
npm --prefix frontend install
```

Expected result: install completes with no missing dependency errors.
Failure hint: if `npm` fails, clear lock mismatch with `npm ci` in root and `frontend` separately.

2. Generate Wrangler runtime types.

```bash
npm run cf-typegen
```

Expected result: `worker-configuration.d.ts` is regenerated successfully.
Failure hint: if bindings are missing, verify `wrangler.jsonc` is valid JSONC and rerun.

3. Run backend checks.

```bash
npm run typecheck
npm test
```

Expected result: TypeScript passes and all tests pass.
Failure hint: if tests fail, inspect parser/session tests first in `tests/*.test.ts`.

4. Run Worker API locally.

```bash
npm run dev
```

Expected result: Worker starts and exposes local URL (typically `127.0.0.1:8787`).
Failure hint: if startup fails, confirm Wrangler auth and Durable Object migration config.

5. Optional: run React dev server with explicit API base.

```bash
VITE_API_BASE_URL=http://127.0.0.1:8787
npm run dev:frontend
```

Expected result: React UI loads and sends requests to local Worker.
Failure hint: if requests fail, check browser network tab for incorrect host or CORS/preflight errors.

Done when:
- UI loads in browser.
- First chat returns `sessionId`.
- Follow-up chat reuses same `sessionId`.

## API contract (`POST /chat`)

Request formats:
- JSON: `{ "message": string, "sessionId"?: string, "textLogs"?: string }`
- Multipart: fields `message`, optional `sessionId`, optional `textLogs`, optional `file`

Response:

```json
{
  "sessionId": "string",
  "response": "string"
}
```

Error statuses currently used:
- `400` invalid payload/body
- `413` payload too large
- `415` unsupported content type
- `429` rate limit exceeded
- `500` internal routing error
- `502` upstream AI failure

Compatibility notes:
- First request may omit `sessionId`; server generates one.
- Follow-up requests should send returned `sessionId` to preserve context.
- `textLogs` is optional for JSON mode.
- Multipart uploads still require a non-empty `message` field.
- Frontend defaults to same-origin `/chat` unless `VITE_API_BASE_URL` is set.

Minimal JSON example:

```bash
curl -X POST http://127.0.0.1:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"timeouts in eu-west after deploy"}'
```

Expected result: JSON response with `sessionId` and non-empty `response`.
Failure hint: if you get `415`, confirm `Content-Type: application/json` is set.

Minimal multipart example:

```bash
curl -X POST http://127.0.0.1:8787/chat \
  -F "message=Analyze these logs" \
  -F "file=@sample-logs/incident-eu-west-checkout-timeout-retrystorm.log"
```

Expected result: file is accepted and response contains investigation analysis text.
Failure hint: if you get `400`, ensure `message` is included in multipart form.

## 5-minute smoke test

1. Open the app URL and confirm the React page renders.
2. Send a first message without `sessionId`.
3. Send a follow-up in the same session and verify continuity.
4. Upload `sample-logs/incident-eu-west-checkout-timeout-retrystorm.log`.
5. Confirm response contains structured sections (pattern, hypotheses, next checks).

Expected result: both message-only and file-upload flows return valid `sessionId` and `response`.
Failure hint: if upload fails, verify multipart parser path and file size constraints.

Fast prompt pack for manual testing:
- `sample-logs/incident-eu-west-test-prompts.md`

Evaluator acceptance signals:
- Response references evidence from uploaded logs.
- Follow-up answer uses prior context in same session.
- Output includes concrete next checks and mitigations.

## Deploy command flow

1. Build frontend assets.

```bash
npm run build:frontend
```

Expected result: Vite builds assets into `frontend/dist`.
Failure hint: if build fails, fix frontend TypeScript errors before deploy.

2. Deploy Worker with static assets.

```bash
npm run deploy
```

Expected result: Wrangler uploads Worker + assets and prints a live URL.
Failure hint: if deploy fails, verify Cloudflare auth, AI/DO bindings, and account permissions.

3. Verify production endpoint.

```bash
curl -X POST https://<worker-name>.<account-subdomain>.workers.dev/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"production smoke test"}'
```

Expected result: `200` response with `sessionId` and `response`.
Failure hint: if `404`, confirm Worker route and deployment target.

Live URL format example:
- `https://<worker-name>.<account-subdomain>.workers.dev`

## Known limitations (MVP scope)
- No D1/R2 billing or retention model in MVP.
- No streaming token output; responses are returned as full text.
- No Pages + Worker split topology in MVP.
- No org-level authz/tenant controls in current submission scope.
- No long-term file retention workflow in MVP.

## Links to deep docs
- Architecture: `docs/architecture.md`
- Deployment: `docs/deployment.md`
- Testing: `docs/testing.md`
- Troubleshooting: `docs/troubleshooting.md`
- Roadmap: `docs/roadmap.md`



