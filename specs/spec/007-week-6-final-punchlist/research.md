# Research: Week 6 – Finish-to-Green

**Created**: 2025-10-12  
**Feature**: ../spec.md  

## Decisions

### Cloud Run environment configuration
- Decision: Set `API_BASE_URL` as a standard environment variable directly on the `maximus-training-frontend` Cloud Run service in Google Cloud Console.
- Rationale: Simplest, most direct configuration path; avoids extra indirection and matches production practice.
- Alternatives considered: Build-time substitution (risk of stale value); runtime config endpoint (adds infra and latency).

### Contract linting policy
- Decision: Use Spectral with the default `spectral:oas` recommended ruleset to lint OpenAPI.
- Rationale: Widely adopted, easy to integrate, strong default coverage for hygiene.
- Alternatives considered: Custom ruleset only (delays); manual review (non-deterministic).

## Open Questions (none)

All Phase 0 clarifications are resolved by the decisions above.

## References
- Spectral rules: `https://github.com/stoplightio/spectral`  
- Google Cloud Run env vars: `https://cloud.google.com/run/docs/configuring/environment-variables`
