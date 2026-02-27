# Deployment

## Environments
Use three environments with the same topology:
- `dev`
- `staging`
- `prod`

Each environment needs:
- Worker service
- Durable Object binding (`SESSIONS`)
- AI binding (`AI`)
- static assets from `frontend/dist`

## Pre-deploy Checklist
1. Ensure dependencies are installed.
2. Ensure `wrangler.jsonc` bindings/migrations are valid.
3. Ensure frontend builds cleanly.
4. Ensure tests pass.
5. Ensure Cloudflare auth is active.

## Local Verification Commands
```bash
npm run cf-typegen
npm run typecheck
npm test
npm run build:frontend
```

Expected result: all commands succeed before deployment.

## Deploy Command
```bash
npm run deploy
```

What this does:
1. Builds React frontend into `frontend/dist`.
2. Deploys Worker.
3. Uploads static assets.
4. Publishes live Worker URL.

## Static Asset Routing Contract
Configured in `wrangler.jsonc`:
- `assets.directory = ./frontend/dist`
- `assets.not_found_handling = single-page-application`
- `assets.run_worker_first = ["/chat", "/chat/*"]`

Effect:
- API traffic hits Worker logic first.
- Non-API routes resolve to React SPA assets.

## Post-deploy Smoke Checks
1. Open deployed URL and confirm UI loads.
2. Send first `/chat` message and verify session ID is returned.
3. Send follow-up with same session context.
4. Upload sample log file and verify response quality.

## Rollback Guidance
If deploy introduces regression:
1. Re-deploy last known good commit from git history.
2. Re-run smoke checks.
3. If issue is frontend-only, verify `frontend/dist` contents and rebuild.
4. If issue is API-only, inspect Worker logs and recent DO/AI changes.

## Future Split Topology (Deferred)
When needed, split to:
- Pages (frontend)
- Worker (backend API)
- Gateway route `/api/chat`

This is deferred until post-internship requirements justify added complexity.
