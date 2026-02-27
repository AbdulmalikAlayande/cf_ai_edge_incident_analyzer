# Roadmap

## Near-term (Post-Internship)
1. Split deployment topology:
- Pages for frontend
- Worker for API
- optional `/api/chat` gateway

2. Add persistent product metadata with D1:
- organizations
- users
- projects
- usage events

3. Add optional raw file retention in R2:
- upload object storage
- retention controls
- compliance export path

## Productization
1. Pricing model:
- base org subscription
- seat-based tiers
- usage overage for heavy analysis workloads

2. Operational improvements:
- analytics dashboards
- alerting for API failure rates and AI timeouts
- SLO-based incident response metrics

3. AI quality improvements:
- output schema enforcement
- better confidence calibration
- automated prompt regression tests

## Security and Governance
1. Add authn/authz layer for multi-tenant access.
2. Add audit logs for investigation access and prompt usage.
3. Add per-org quotas and policy controls.

## Reliability Upgrades
1. Background queue for heavy file preprocessing.
2. Optional streaming responses for long analyses.
3. Graceful degradation strategy when AI service is unavailable.

## Decision Gate
Proceed with split topology and new data services only after:
- internship delivery acceptance,
- stable MVP usage pattern,
- clear requirement for tenant billing/compliance retention.
