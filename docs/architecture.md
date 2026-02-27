# Architecture

## Scope
This document describes the MVP runtime architecture used for internship delivery.

## Runtime Topology
- Single Cloudflare Worker deployment.
- Worker serves static frontend assets from `frontend/dist`.
- Worker API endpoint: `POST /chat`.
- Durable Objects store per-session conversation state.
- Workers AI performs incident analysis generation.

## Key Modules
- `src/index.ts`
- Responsibilities: route `/chat`, forward to Durable Object, return response.
- `src/endpoints/chat.ts`
- Responsibilities: parse JSON/multipart, normalize input, validate limits.
- `src/durable-objects/session.ts`
- Responsibilities: load/save session state, apply rate/size guardrails, invoke AI flow.
- `src/lib/prompt.ts`
- Responsibilities: build structured prompt from history + current user input.
- `src/lib/ai.ts`
- Responsibilities: call Workers AI, apply timeout/retry/error mapping.
- `src/lib/utils.ts`
- Responsibilities: shared normalization and structured logging helpers.

## Request Flow
```text
React UI -> /chat -> index.ts -> parseChatRequest() -> SessionObject
         -> buildIncidentAnalysisPrompt() -> runIncidentAnalysis()
         -> SessionObject persists history -> response JSON -> React UI
```

## Session Model
- Session key: generated UUID when absent on first call.
- State store: Durable Object storage.
- History retention: bounded window (latest messages only).
- Response contract: `{ sessionId, response }`.

## Data Boundaries
- Browser sends message + optional logs/file.
- Parser normalizes/validates payload.
- Durable Object receives canonical `SessionRequest` shape.
- AI layer only receives prompt text (no direct HTTP parsing).

## Guardrails
- Input length limits enforced by parser and DO layers.
- Request-size rejection with `413` for oversized payloads.
- Session-level rate limiting with `429`.
- AI timeout/retry and mapped upstream failures with `502` or `429` as appropriate.

## Current Non-goals (MVP)
- No D1 schema for tenant/billing metadata.
- No R2 object retention for uploaded files.
- No stream-response protocol.
- No multi-service deployment split.
