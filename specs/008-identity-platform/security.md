# Threat Sketch — Identity Platform Hardening

This one-pager summarizes the primary threats to the Week 8 identity platform scope and how planned tasks mitigate them. It follows the STRIDE framework and maps each risk to backlog tasks so reviewers can trace the control to implementation evidence.

## STRIDE quick-reference

| STRIDE | Threat focus | Notable risks | Primary mitigations / tasks |
| --- | --- | --- | --- |
| **Spoofing** | Impersonation of users or services | Compromised bearer tokens; replayed Firebase sessions; forged request IDs | T035 (JWT verification semantics), T034 (token refresh + clock skew guard), T053 (identity propagation checks), T091 (log sampling guard keeps auth warnings visible) |
| **Tampering** | Altering data or requests | Clients overriding `authorId`; mutation payload replay; contract drift for `/health` | T104 (strip client identity fields), T099 (owner mischief test), T101 (health schema drift guard) |
| **Repudiation** | Hiding malicious actions | Missing audit trails; sampled-out warning logs | T016 (audit logs), T108 (rate-limit key documentation), T091 (never sample warn/error/audit logs) |
| **Information Disclosure** | Leaking secrets or PII | Logs capturing emails, tokens, raw bodies; open `/health` revealing internals | T100 (PII redaction e2e), T078 (error envelope examples), T088/T101 (documented `/health` schema to constrain fields) |
| **Denial of Service** | Exhausting capacity or inducing retry storms | Aggressive retry of non-idempotent POST; lacking retry verdicts | T015/T038 (rate limiting), T105 (retry helper refuses POST), T112 (k6 verdict surfaces perf regression) |
| **Elevation of Privilege** | Gaining higher rights | CSRF bypass; owner editing others’ posts; missing admin revocation | T033/T012 (CSRF mint/verify), T013/T037 (owner guards), T021/T064 (admin revocation tests) |

## Mitigation call-outs (new this sprint)

- **T091 Log sampling knob**: Introduces `LOG_SAMPLE_RATE_INFO` so production can downsample noisy info logs while guaranteeing warnings, errors, and audit events always emit. Prevents spoofing/repudiation attempts from disappearing in prod noise.
- **T100 PII redaction e2e**: Contractually asserts our structured logging pipeline never prints credentials, bearer tokens, or raw request bodies. Guards against information disclosure during auth flows.
- **T101 `/health` schema drift guard**: Keeps documentation and runtime aligned so we never expose surprise fields (e.g., secrets or stack traces) via the health endpoint without updating the contract and review checklist.
- **T105 Idempotency retry helper**: Provides a shared client helper that refuses to retry POST requests and enforces consistent idempotency keys for PUT/PATCH retries, blocking accidental write amplification during incidents.
- **T112 k6 verdict printing**: Surfaces latency threshold outcomes directly in CI summaries so operators can quickly spot emerging denial-of-service risks before promotion.

## Review checklist

- [ ] Confirm `LOG_SAMPLE_RATE_INFO` defaults to `1` (no sampling) and is only honored when `NODE_ENV=production`.
- [ ] Capture CI evidence for the PII redaction e2e (`api/tests/logging.redaction.e2e.spec.ts`).
- [ ] Ensure the `/health` OpenAPI example stays in lockstep with runtime responses (failing test proves drift detection).
- [ ] Reference the README idempotency section when integrating new retry logic or background jobs.
- [ ] Include the k6 verdict snippet in release packets so incident responders can trace performance regressions over time.

## Dependency check implementation roadmap (T075 / T088)

1. **Telemetry-visible failures (T075):** Extend the `/health` dependency matrix tests to cover Firebase, database, and third-party identity providers, forcing each check into `down` and `degraded` states. Ensure contract fixtures reflect the matrix and that the endpoint emits `Retry-After` for 503 responses so rollouts surface outage duration expectations.
2. **Operational documentation (T088):** Document dependency owners, alert runbooks, and expected recovery signals in the README troubleshooting appendix. Pair this with the threat sketch to show who triages each failure mode and how to toggle feature flags (e.g., `READ_ONLY`) during an incident.
3. **Progressive rollout hooks:** Wire dependency checks to observability dashboards (log-based metrics + uptime monitors) and require release packets to include the latest `/health` contract artifact, keeping reviewers informed on coverage drift and outstanding gaps before promoting changes.
