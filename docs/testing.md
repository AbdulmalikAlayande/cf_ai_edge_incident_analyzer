# Testing

## Objective
Verify that the incident assistant works end-to-end for:
- session lifecycle
- JSON + multipart ingestion
- structured analysis output
- deployment reproducibility

## Automated Checks
Run from repo root:

```bash
npm run typecheck
npm test
```

Expected result:
- TypeScript passes with no errors.
- Vitest suites pass (`chat`, `session`, `prompt`, `index integration`).

## Manual Local API Checks
### JSON message path
```bash
curl -X POST http://127.0.0.1:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"timeouts in eu-west after deploy"}'
```

Expected:
- HTTP 200
- JSON response with `sessionId` and `response`

### Follow-up continuity path
Reuse `sessionId` from first response:

```bash
curl -X POST http://127.0.0.1:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<id>","message":"retry count is 5 with exponential backoff"}'
```

Expected:
- Same `sessionId`
- Response reflects context continuity

### Multipart upload path
```bash
curl -X POST http://127.0.0.1:8787/chat \
  -F "message=Analyze uploaded incident logs" \
  -F "file=@sample-logs/incident-eu-west-checkout-timeout-retrystorm.log"
```

Expected:
- HTTP 200
- Structured analysis response

## Production Validation Scenario
Use:
- Log file: `sample-logs/incident-eu-west-checkout-timeout-retrystorm.log`
- Prompt set: `sample-logs/incident-eu-west-test-prompts.md`

Validation goals:
1. Primary cause vs contributing factors are separated.
2. Mitigation ordering is actionable.
3. Stakeholder update format is concise and accurate.
4. Monitoring metric recommendation is specific.

## Output Quality Checklist
- Contains likely failure pattern.
- Includes evidence-based reasoning.
- Provides 3 hypotheses with confidence framing.
- Gives ordered next checks and mitigations.
- States what evidence would change conclusion.

## Regression Triggers
Re-run full test set after changes to:
- `src/endpoints/chat.ts`
- `src/durable-objects/session.ts`
- `src/lib/prompt.ts`
- `src/lib/ai.ts`
- `frontend/src/lib/api.ts`

## Pass Criteria
A build is acceptable when:
1. automated checks pass,
2. local smoke scenario passes,
3. production sample-log scenario returns structured actionable output.
