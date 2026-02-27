# Troubleshooting

## 1) `Invalid request payload` on multipart upload
Symptoms:
- API returns `400` with invalid payload message.

Likely causes:
- malformed multipart form fields
- missing `message` field

Fix:
- send `message` as text field
- include `file` only as file part
- re-test with provided sample curl command

## 2) `413` payload too large
Symptoms:
- API rejects large body uploads.

Likely causes:
- file or inline logs exceed configured request limit

Fix:
- trim log payload
- upload reduced excerpt focused on failure window

## 3) `415` unsupported content type
Symptoms:
- API rejects request type.

Likely causes:
- incorrect `Content-Type`

Fix:
- use `application/json` or `multipart/form-data`

## 4) `429` rate limit exceeded
Symptoms:
- repeated requests in short window return `429`.

Likely causes:
- session-level request burst exceeded guardrail

Fix:
- pause and retry after cooldown
- avoid tight retry loops in frontend client

## 5) `502` AI upstream failure
Symptoms:
- API returns AI service failure/rate-limit/timeout messages.

Likely causes:
- Workers AI transient issue
- model timeout/rate limit

Fix:
- retry with same session
- reduce prompt payload size
- verify AI binding availability in environment

## 6) Frontend cannot reach API in local dev
Symptoms:
- network errors in browser when using Vite dev server.

Likely causes:
- missing `VITE_API_BASE_URL`
- wrong host/port

Fix:
- set `VITE_API_BASE_URL=http://127.0.0.1:8787`
- confirm Worker is running locally

## 7) UI loads in production but `/chat` returns 404
Symptoms:
- static app serves, API path fails.

Likely causes:
- worker route mismatch
- missing worker-first assets config

Fix:
- verify `assets.run_worker_first` includes `/chat` and `/chat/*`
- redeploy Worker

## 8) Deploy succeeds but stale frontend appears
Symptoms:
- app does not reflect latest UI changes.

Likely causes:
- frontend not rebuilt before deploy

Fix:
- run `npm run build:frontend`
- run `npm run deploy` again
- confirm Wrangler uploaded modified assets
