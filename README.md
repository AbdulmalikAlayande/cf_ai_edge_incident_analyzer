# cf_ai_edge_incident_analyzer

Stateful Cloudflare Worker for distributed-systems incident investigation.

## Server Architecture

- `src/index.ts`: `/chat` HTTP entrypoint and Durable Object routing.
- `src/endpoints/chat.ts`: payload parsing and normalization for JSON/multipart input.
- `src/durable-objects/session.ts`: session lifecycle, history persistence, abuse guardrails, AI orchestration.
- `src/lib/prompt.ts`: pure prompt builder from history + latest user input.
- `src/lib/ai.ts`: Workers AI call with timeout/retry and explicit failure mapping.
- `src/lib/utils.ts`: shared normalization helpers and structured logging utilities.

## API

`POST /chat`

Accepts:
- `application/json`: `{ "message": string, "sessionId"?: string, "textLogs"?: string }`
- `multipart/form-data`: fields `message`, optional `sessionId`, optional `textLogs`, optional `file`

Returns:
```json
{
  "sessionId": "...",
  "response": "..."
}
```

## Local Commands

```bash
npm install
npm run cf-typegen
npm run typecheck
npm test
npm run dev
```

## Verification (2026-02-27)

Automated checks run successfully:

```bash
npm run typecheck
# Result: pass

npm test
# Result: pass (4 files, 11 tests)
```

Test coverage includes:
- request parser behavior (`tests/chat.test.ts`)
- prompt composition (`tests/prompt.test.ts`)
- session persistence/rate-limits/AI error mapping (`tests/session.test.ts`)
- `/chat` route-to-DO forwarding behavior (`tests/index.integration.test.ts`)

Manual runtime check (PowerShell):

```powershell
$first = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8787/chat" -ContentType "application/json" -Body (@{ message = "timeouts in eu-west after deploy" } | ConvertTo-Json)
$second = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8787/chat" -ContentType "application/json" -Body (@{ sessionId = $first.sessionId; message = "retry count is 5 with exponential backoff" } | ConvertTo-Json)

$first
$second
```

Expected:
- first response includes generated `sessionId`
- second response keeps the same `sessionId`
- both responses return structured assistant text in `response`
