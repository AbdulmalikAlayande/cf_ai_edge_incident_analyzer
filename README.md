# cf_ai_edge_incident_analyzer

Stateful Cloudflare incident investigation assistant.

## MVP Architecture (Internship)

Single deployed Cloudflare Worker app:
- Serves React frontend static assets (`frontend/dist`)
- Handles `POST /chat` API
- Uses Durable Objects for session memory
- Uses Workers AI for incident analysis

MVP intentionally does not require Pages, D1, or R2.

## Backend Modules

- `src/index.ts`: routes `POST /chat` to Durable Objects
- `src/endpoints/chat.ts`: JSON/multipart parsing + validation
- `src/durable-objects/session.ts`: session lifecycle + rate/size guardrails
- `src/lib/prompt.ts`: prompt construction
- `src/lib/ai.ts`: Workers AI call with timeout/retry/failure mapping
- `src/lib/utils.ts`: shared normalization/logging helpers

## Frontend Integration Contract

Endpoint: `POST /chat`

Request:
- `application/json`: `{ message, sessionId?, textLogs? }`
- `multipart/form-data`: `message`, `sessionId?`, `textLogs?`, `file?`

Response:
```json
{
  "sessionId": "string",
  "response": "string"
}
```

Frontend API behavior (`frontend/src/lib/api.ts`):
- Defaults to same-origin `/chat`
- Optional override via `VITE_API_BASE_URL` (or legacy `VITE_API_SERVER_URL`)

## Local Development

Install dependencies:
```bash
npm install
npm --prefix frontend install
```

Generate Worker env types:
```bash
npm run cf-typegen
```

Backend checks:
```bash
npm run typecheck
npm test
```

Run Worker API:
```bash
npm run dev
```

Run React UI in Vite (optional separate local frontend server):
```bash
npm run dev:frontend
```

If using Vite dev server, set:
```bash
VITE_API_BASE_URL=http://127.0.0.1:8787
```

## Single-App Deploy (Worker + Static React Assets)

Build React assets:
```bash
npm run build:frontend
```

Deploy Worker (includes static assets from `frontend/dist`):
```bash
npm run deploy
```

`wrangler.jsonc` static assets config:
- `assets.directory = ./frontend/dist`
- `assets.not_found_handling = single-page-application`
- `assets.run_worker_first = ["/chat", "/chat/*"]`

## Smoke Test Checklist

1. Open deployed app URL and confirm React UI loads.
2. Send first chat request without session ID.
3. Confirm response includes generated `sessionId`.
4. Send follow-up using same session and confirm continuity.
5. Upload one log file and confirm successful analysis response.
