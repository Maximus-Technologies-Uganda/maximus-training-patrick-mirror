---
title: 'Week 10 – Performance Notes'
---

## Targets

- `/status` p95 latency ≤ 150ms over a rolling 10-minute window.
- Filtered `/posts` SSR p95 ≤ 1.5s.

## Observations

- Probe script `scripts/quality-gate/p95-check.ts` supplies the
  `/status` latency measurements used in CI.
- Retry/backoff configuration in `frontend-next/src/server/retry.ts`
  and `fetchApi.ts` keeps total budget under 3s with per-attempt
  timeout ≤ 800ms.
