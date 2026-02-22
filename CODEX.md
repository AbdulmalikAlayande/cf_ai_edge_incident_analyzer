# CODEX.md — Codex Onboarding Document

# cf_ai_edge_incident_analyzer

> Read this entire file before touching any code.
> You are operating as a co-developer on a Cloudflare-native TypeScript project.
> Follow every rule here exactly.

---

## Project Summary

**cf_ai_edge_incident_analyzer** is a stateful AI debugging assistant that runs at Cloudflare's edge. Engineers submit distributed system logs (any format — plain text, JSON, or uploaded files) and receive structured incident analysis powered by an LLM. The system remembers the conversation session so follow-up questions stay in context.

This is a Cloudflare internship assignment. Every decision — architecture, naming, code style — must be intentional and clean.

---

## Technology Stack

| Concern         | Tool                       |
| --------------- | -------------------------- |
| Runtime         | Cloudflare Workers         |
| Language        | TypeScript                 |
| State / Memory  | Cloudflare Durable Objects |
| LLM             | Workers AI — Llama 3.3     |
| Frontend        | Plain HTML + Vanilla JS    |
| Config          | wrangler.jsonc             |
| Package Manager | npm                        |

**Hard constraints:**

- No Node.js/Express backend
- No external AI APIs (no OpenAI, no Anthropic)
- No React, Vue, or frontend frameworks
- No external databases (no Postgres, no MongoDB)
- Everything runs on Cloudflare platform only

---

## Directory Structure

```
cf_ai_edge_incident_analyzer/
├── src/
│   ├── endpoints/
│   │   └── chat.ts              # Handles POST /chat — entry for all chat requests
│   ├── durable-objects/
│   │   └── session.ts           # SessionObject class — persists conversation history
│   ├── lib/
│   │   ├── prompt.ts            # Assembles LLM prompt from history + current input
│   │   ├── ai.ts                # Calls Workers AI (Llama 3.3), returns response text
│   │   └── utils.ts             # Normalizes any log format into plain string
│   ├── index.ts                 # Worker entry — request routing only
│   └── types.ts                 # All shared TypeScript types live here only
├── frontend/
│   ├── index.html               # Single-page chat UI
│   └── main.js                  # Handles UI interactions and fetch calls
├── .env                         # environment variables
├── CLAUDE.md                    # Onboarding doc for Claude Code agent
├── CODEX.md                     # This file
├── AGENTS.md                    # General agent guidance
├── README.md                    # Human-readable project docs
├── PROMPTS.md                   # Record of all LLM prompts used (required by Cloudflare)
├── wrangler.jsonc               # Cloudflare config — bindings, compatibility, routes
├── worker-configuration.d.ts    # Auto-generated — do not edit manually
├── tsconfig.json
└── package.json
```

---

## How the System Works (Read This Carefully)

### Request Lifecycle

```
POST /chat
  ↓
index.ts  →  routes to chat.ts
  ↓
chat.ts   →  detects content type (JSON or multipart)
            →  extracts sessionId, logs, message
  ↓
utils.ts  →  normalizes logs to plain string
  ↓
session.ts (Durable Object)
            →  load existing session OR create new one
            →  append user message to history
  ↓
prompt.ts →  builds full LLM prompt (history + logs + message)
  ↓
ai.ts     →  calls Workers AI → gets response string
  ↓
session.ts →  append assistant response to history → save state
  ↓
chat.ts   →  return { sessionId, response }
```

### Durable Objects (Critical Concept)

A Durable Object is a single-instance stateful object in Cloudflare's edge network. We use one DO instance per user session to store conversation history. The DO is identified by `sessionId` (a UUID string). Each session's history is stored under the key `"session"` in Durable Object storage.

The class is `SessionObject`. It must be:

- Defined and exported from `src/durable-objects/session.ts`
- Re-exported from `src/index.ts`
- Bound in `wrangler.jsonc` under `durable_objects.bindings`

---

## TypeScript Types

All types live in `src/types.ts`. Do not define types elsewhere.

```typescript
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

interface Env {
	AI: Ai;
	SESSIONS: DurableObjectNamespace;
}
```

---

## API Specification

### Endpoint: `POST /chat`

Accepts two formats:

**JSON body:**

```json
{
	"sessionId": "optional — omit on first request",
	"textLogs": "any log content as string",
	"message": "user question or context"
}
```

**multipart/form-data:**

```
sessionId  → optional string
file       → log file (.txt, .log, .json)
message    → string
```

**Success response:**

```json
{
	"sessionId": "uuid string",
	"response": "AI analysis text"
}
```

**Error response:**

```json
{
	"error": "description of what went wrong"
}
```

HTTP status: 400 for bad input, 500 for internal errors.

---

## LLM Prompt Structure

Defined in `src/lib/prompt.ts`. The prompt must follow this structure:

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

Format history as:

```
[user]: <text>
[assistant]: <text>
```

---

## Wrangler Config

`wrangler.jsonc` must include:

```jsonc
{
	"name": "cf-ai-edge-incident-analyzer",
	"main": "src/index.ts",
	"compatibility_date": "2024-01-01",
	"ai": {
		"binding": "AI",
	},
	"durable_objects": {
		"bindings": [
			{
				"name": "SESSIONS",
				"class_name": "SessionObject",
			},
		],
	},
	"migrations": [
		{
			"tag": "v1",
			"new_classes": ["SessionObject"],
		},
	],
}
```

---

## Coding Rules — Mandatory

1. **One responsibility per file.** `chat.ts` routes and parses. `utils.ts` normalizes. `prompt.ts` builds prompts. `ai.ts` calls the model. `session.ts` manages state. Never mix these concerns.
2. **All types go in `types.ts`.** No inline type definitions in other files.
3. **Model name is a constant** at the top of `ai.ts`. Do not hardcode it inline.
   ```typescript
   const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
   ```
4. **Trim history to last 20 messages** in `session.ts` before saving. Prevents prompt overflow.
5. **Never expose raw errors** to the client. Catch all errors, return `{ error: "..." }`.
6. **`index.ts` only routes.** No business logic. It reads the URL path and delegates.
7. **`session.ts` only manages state.** No AI calls, no prompt building inside the DO.
8. **Update `PROMPTS.md`** every time `prompt.ts` is changed.
9. **Do not add npm packages** without explicit instruction.
10. **Do not modify `worker-configuration.d.ts`** — it is auto-generated by wrangler.

---

## File Responsibilities (Quick Reference)

| File         | Does                                            | Does NOT                          |
| ------------ | ----------------------------------------------- | --------------------------------- |
| `index.ts`   | Route requests                                  | Business logic                    |
| `chat.ts`    | Parse request, coordinate flow, return response | Call AI directly                  |
| `session.ts` | Load/save session state                         | Build prompts or call AI          |
| `prompt.ts`  | Build prompt string                             | Store state or call AI            |
| `ai.ts`      | Call Workers AI                                 | Parse requests or manage sessions |
| `utils.ts`   | Normalize logs to string                        | Anything else                     |
| `types.ts`   | Define all shared types                         | Contain logic                     |

---

## Development Commands

```bash
# Install
npm install

# Local dev (runs at http://localhost:8787)
npx wrangler dev

# Deploy to Cloudflare
npx wrangler deploy
```

---

## What Is Already Decided (Do Not Revisit)

- Repo name: `cf_ai_edge_incident_analyzer`
- Use case: distributed systems incident analysis
- Log formats supported: plain text, JSON, file upload
- LLM: Llama 3.3 via Workers AI only
- Session storage: Durable Objects (one per sessionId)
- No streaming in MVP
- No Vectorize in MVP
- Single Worker, single endpoint
- Frontend: plain HTML/JS, no framework

---

## Before You Write Any Code

1. Read this file fully.
2. Identify the exact file(s) your task touches.
3. Check `types.ts` before creating new types.
4. Make the smallest change that completes the task.
5. Do not refactor code outside the scope of your task.
6. If the task changes the prompt, update `PROMPTS.md`.
