# Research (Week 8 – Identity Platform)

## Decision: Identity & BFF Pattern
- Use Firebase Web SDK for client sign-in; BFF route handlers verify tokens.
- Rationale: Meets workbook; avoids direct browser→API writes; simpler ops.
- Alternatives: Direct browser→API with CORS (rejected: violates BFF); custom JWT (rejected: complexity).

## Decision: Roles & Ownership
- Roles: owner, admin; ownership check `authorId === userId`.
- Rationale: Minimal, matches workbook; easy to test.
- Alternatives: RBAC matrix (rejected: out of scope).

## Decision: Validation & Limits
- Zod schemas; 1MB body limit; 10s handler timeout.
- Rationale: Explicit validation; DOS protection.
- Alternatives: Joi (acceptable), no limit (rejected).

## Decision: Rate Limiting
- Fixed window 60s, capacity 10; key=userId (IP fallback); headers on all responses where feasible.
- Rationale: Simple, demonstrable; extensible adapter later.
- Alternatives: Token bucket/sliding window (consider later with Redis).

## Decision: CSRF Model
- Double-submit cookie + `X-CSRF-Token` for writes; bind to session/user.
- Rationale: Standard for cookie-auth flows; BFF-friendly.
- Alternatives: SameSite lax-only (insufficient), origin-only (insufficient).

## Decision: Observability
- `x-request-id` + W3C `traceparent`/`tracestate`; structured logs; audit logs for writes.
- Rationale: Traceability across tiers; aligns with acceptance criteria.
- Alternatives: Ad-hoc IDs (rejected).

## Decision: Contracts & Evidence
- OpenAPI Bearer scheme; protected ops; 401/403/422/429/413/503; Spectral pinned 6.11.0.
- Rationale: CI enforceable; reproducible reports.
- Alternatives: Unpinned spectral (rejected).
