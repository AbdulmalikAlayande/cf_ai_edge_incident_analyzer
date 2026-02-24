# cf_ai_edge_incident_analyzer

A stateful AI-powered investigation assistant that analyzes distributed system logs and incident descriptions, detects known failure patterns, and guides engineers through iterative root cause analysis using structured reasoning.

## Example Usage

1. Step 1 – Initial Incident

   User pastes:
   - Logs from multiple services
   - Error traces
   - Some metrics
   - Description of what users are experiencing

   System responds with:
   - Detected failure pattern (e.g., cascading failure)
   - Probable root cause hypothesis
   - Impact explanation
   - Suggested next checks

2. Step 2 – Follow-Up

   User says:
   - “This only affects eu-west region.”

   System:
   - Updates hypothesis
   - Reasons about regional failure
   - Adjusts explanation

3. Step 3 – Deeper Probing

   User says:
   - “Retries are set to 5 with exponential backoff.”

   System:
   - Recognizes retry storm risk
   - Refines analysis
   - Suggests circuit breaker misconfiguration possibility

## Frontend TypeScript Workflow

The frontend source file is `frontend/scripts/main.ts`.

- Edit TypeScript: `frontend/scripts/main.ts`
- Generated runtime file for browser: `frontend/scripts/main.js`

Commands:

```bash
npm run build:frontend
npm run dev:frontend
npm run dev
```

Recommended local setup (2 terminals):

1. `npm run dev:frontend` (keeps `main.js` in sync from TS)
2. `npm run dev` (runs Wrangler worker)

Frontend entry page: `frontend/views/index.html`
