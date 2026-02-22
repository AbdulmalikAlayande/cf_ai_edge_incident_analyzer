# CLAUDE.md — Claude Code Onboarding Document
# cf_ai_edge_incident_analyzer

> Read this file fully before writing, editing, or deleting any code.
> You are a co-developer and systems engineer on this project. Act like one.

---

## What This Project Is

A stateful, AI-powered incident analysis assistant built entirely on Cloudflare's edge infrastructure. Engineers paste or upload distributed system logs (any format), and the system analyzes them using an LLM, detects failure patterns, hypothesizes root causes, and maintains session memory so follow-up questions stay in context.

This is a Cloudflare internship submission. Code quality, architecture, and documentation all matter.

---

## The Stack (Non-Negotiable)

| Layer | Technology |
|---|---|
| Backend | Cloudflare Workers (TypeScript) |
| Stateful Memory | Cloudflare Durable Objects |
| AI / LLM | Workers AI — Llama 3.3 (`@cf/meta/llama-3.3-70b-instruct-fp8-fast`) |
| Frontend | Plain HTML + JS (served via Cloudflare Pages or Worker static assets) |
| Config | `wrangler.jsonc` |
| Language | TypeScript throughout |

Do not introduce Node.js, Express, external databases, or third-party AI SDKs. Everything runs on Cloudflare.

---

## Project Structure

```
cf_ai_edge_incident_analyzer/
├── src/
│   ├── endpoints/
│   │   └── chat.ts              # POST /chat handler
│   ├── durable-objects/
│   │   └── session.ts           # SessionObject — stores conversation history
│   ├── lib/
│   │   ├── prompt.ts            # Builds LLM prompt from session history + input
│   │   ├── ai.ts                # Calls Workers AI, returns response string
│   │   └── utils.ts             # Normalizes logs (plain text, JSON, file upload)
│   ├── index.ts                 # Worker entry point — routes all requests
│   └── types.ts                 # Shared TypeScript types
├── frontend/
│   ├── index.html               # Chat UI (log paste + file upload)
│   └── main.js                  # Frontend logic — API calls, DOM updates
├── CLAUDE.md                    # This file
├── CODEX.md                     # Onboarding doc for Codex
├── AGENTS.md                    # General agent instructions
├── README.md                    # Project docs + running instructions
├── PROMPTS.md                   # All AI prompts used (Cloudflare requirement)
├── wrangler.jsonc               # Cloudflare Worker config + bindings
├── worker-configuration.d.ts    # Auto-generated env types
├── tsconfig.json
└── package.json
```

---

## Key Concepts You Must Understand

### Durable Objects
A Durable Object (DO) is a single-instance, stateful object that lives at the edge. We use it to store per-session conversation history. Each user session gets its own DO instance identified by a `sessionId`.

The DO class is `SessionObject` in `src/durable-objects/session.ts`. It must be exported from `src/index.ts` and bound in `wrangler.jsonc`.

### Single API Endpoint
The entire backend is one endpoint: `POST /chat`. It accepts either:
- JSON body with `{ sessionId?, textLogs, message }`
- Multipart form with `sessionId`, `file`, `message` fields

The Worker detects content type and normalizes both into the same pipeline.

### Session Flow
```
Request → Worker (index.ts)
        → Load or create SessionObject (Durable Object)
        → Normalize logs (utils.ts)
        → Build prompt (prompt.ts)
        → Call Workers AI (ai.ts)
        → Append to session history
        → Save DO state
        → Return { sessionId, response }
```

---

## Data Types

```typescript
// src/types.ts

type Message = {
  role: "user" | "assistant";
  text: string;
};

type SessionState = {
  sessionId: string;
  history: Message[];
  createdAt: string;
};

type ChatRequest = {
  sessionId?: string;
  textLogs?: string;
  message: string;
};

type ChatResponse = {
  sessionId: string;
  response: string;
};
```

---

## API Contract

### `POST /chat`

**Option A — JSON**
```json
{
  "sessionId": "optional-string",
  "textLogs": "raw or JSON logs as string",
  "message": "user question or description"
}
```

**Option B — multipart/form-data**
```
sessionId  (optional)
file       (log file — .txt, .log, .json)
message    (string)
```

**Response**
```json
{
  "sessionId": "string",
  "response": "string"
}
```

---

## LLM Prompt Template

Located in `src/lib/prompt.ts`. Build the prompt like this:

```
You are an expert incident analysis assistant specializing in distributed systems.
Known failure patterns: timeout, retry storm, queue backlog, regional failure, cache stampede, cascading failure, connection pool exhaustion.

Session History:
{{history}}

New Input (Logs / Description):
{{logsContent}}

User Message:
{{message}}

Provide a structured analysis:
1. Detected failure pattern (if any)
2. Probable root cause hypothesis
3. Impact explanation
4. Suggested next checks

Be precise. Do not hallucinate. If unsure, say so.
```

---

## Wrangler Config (wrangler.jsonc)

The config must include these bindings:

```jsonc
{
  "name": "cf-ai-edge-incident-analyzer",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "ai": {
    "binding": "AI"
  },
  "durable_objects": {
    "bindings": [
      {
        "name": "SESSIONS",
        "class_name": "SessionObject"
      }
    ]
  },
  "migrations": [
    {
      "tag": "v1",
      "new_classes": ["SessionObject"]
    }
  ]
}
```

---

## Environment Type (`Env`)

```typescript
// referenced in index.ts and session.ts
interface Env {
  AI: Ai;
  SESSIONS: DurableObjectNamespace;
}
```

---

## Rules — Follow These Strictly

1. **Never rewrite working code** unless explicitly asked or a bug is confirmed.
2. **Always keep TypeScript types in `src/types.ts`** — don't scatter them across files.
3. **Never hardcode the model name** in `ai.ts` — use a constant at the top of the file.
4. **Trim session history** if it grows beyond 20 messages — keep the last 20 to avoid prompt size limits.
5. **Never return raw errors to the frontend** — always return a structured `{ error: string }` with an appropriate HTTP status.
6. **Log normalization happens only in `utils.ts`** — not in the endpoint or the DO.
7. **The DO only stores and retrieves state** — no business logic inside `session.ts`.
8. **PROMPTS.md must be updated** any time the prompt template in `prompt.ts` changes.
9. **Do not install new npm packages** without confirming first — keep dependencies minimal.
10. **Frontend is plain HTML/JS** — no React, no Vue, no bundler.

---

## What Has Already Been Decided

- Project: `cf_ai_edge_incident_analyzer`
- Target use case: distributed systems failure analysis
- Log input: any format (plain text, JSON, file upload)
- LLM: Llama 3.3 via Workers AI
- State: Durable Objects per session
- No Vectorize in MVP (can be added later)
- No streaming in MVP (can be added later)
- Single Worker handles all routing

---

## Running the Project

```bash
# Install dependencies
npm install

# Run locally
npx wrangler dev

# Deploy
npx wrangler deploy
```

Local dev server runs at `http://localhost:8787`.

---

## What You Should Do When Starting a Task

1. Re-read this file.
2. Identify which file(s) the task touches.
3. Check `types.ts` before creating new types.
4. Make the minimal change needed. Don't refactor unrelated code.
5. If the task changes the prompt, update `PROMPTS.md`.
6. If the task adds a new endpoint, register it in `index.ts`.
