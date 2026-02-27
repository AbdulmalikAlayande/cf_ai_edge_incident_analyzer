# Production Test Prompts (Incident Investigation Assistant)

## Prompt 1 (Primary test with file upload)
I uploaded production logs from a checkout outage in eu-west after a deploy.
Please analyze this incident and respond using exactly this structure:

Most likely pattern:
Why I think so:
Top 3 hypotheses:
What to check next (ordered):
Immediate mitigation:
Long-term fix:
What would change my mind:

Constraints:
- Use only evidence from the logs.
- Call out timeline and key turning points.
- Distinguish primary cause vs contributing factors.
- If confidence is low, say it explicitly.

## Prompt 2 (follow-up)
Assume the same session context.
Given the same logs, rank mitigation actions by expected impact in the first 15 minutes.
For each action include: owner role, blast-radius risk, and verification signal.

## Prompt 3 (follow-up)
Generate a short incident commander update for stakeholders:
- What happened
- User impact
- Current status
- Next update ETA
Limit to 6 bullets.

## Prompt 4 (validation)
What single metric would you watch to detect this exact failure pattern earlier next time, and why?
