# Implementation Plan: Auth, Ownership, Observability

**Branch**: `spec-auth-ownership-observability` | **Date**: 2025-10-13 | **Spec**: ../spec.md
**Input**: Feature specification from `/specs/spec-auth-ownership-observability/spec.md`

## Summary

Implement foundational authentication (username/password session cookie), enforce post ownership on all write operations, document protected endpoints in OpenAPI, and add observability (structured JSON logs, `X-Request-Id` propagation, `/health`). Deliver via four PRs.

## Technical Context

**Language/Version**: Node.js 20.x; TypeScript 5.x  
**Primary Dependencies**: jsonwebtoken (session signing/verification), cookie (parse/serialize cookies); existing API framework; Next.js 14.x (App Router)  
**Storage**: N/A (migrations out of scope; ownerId attribute required at API boundary)  
**Testing**: API → Vitest (unit/integration); UI → Playwright (E2E login/logout and ownership UI)  
**Target Platform**: Google Cloud Run for API and Next.js UI; deployed via Cloud Build  
**Project Type**: Web application (API + Next.js UI)  
**Performance Goals**: Sign-in completes <3s p95; logs include `request-id` 100%  
**Constraints**: Cookie `HttpOnly` + `Secure` + appropriate SameSite  
**Scale/Scope**: Baseline feature across API and UI

## Constitution Check

- Gates to respect (derived from constitution):
  - Test-first and measurable acceptance criteria
  - Structured logging required
  - Simplicity: minimize scope and tech choices
- Status: No violations identified; unknowns tracked as NEEDS CLARIFICATION

## Project Structure

```
specs/spec-auth-ownership-observability/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── openapi-skeleton.yaml
└── checklists/
    ├── requirements.md
    └── requirements-quality.md
```

**Structure Decision**: Single feature directory with design artifacts and contracts.

## Phases and Tasks

### Phase 1 (PR 1): API — Auth Enforcement & Ownership

- [ ] Add login endpoint (username + password) issuing signed `HttpOnly` cookie [Spec §FR-001, §FR-005]
- [ ] Add logout endpoint invalidating/clearing cookie (idempotent) [Spec §FR-002]
- [ ] Implement session validation middleware for protected routes [Spec §FR-003, §FR-011]
- [ ] Enforce `ownerId` on create (server-assigned) [Spec §FR-010, §FR-013]
- [ ] Enforce ownership check (`session.userId === post.ownerId`) on update/delete [Spec §FR-012]
- [ ] Keep read endpoints public [Spec §FR-014]
- [ ] Update OpenAPI: cookie security scheme; mark CUD as protected; add 401/403 error schemas [Spec §FR-020/021/022]
- [ ] Unit/integration tests for 200/201, 401, 403, 404 paths [Spec §Acceptance]

### Phase 2 (PR 2): Next.js UI — Login/Logout & UX

- [ ] Add login form (username/password), submit to API, handle 401 errors
- [ ] Store session via `HttpOnly` cookie only (no client-side access) UX states
- [ ] Add logout action; ensure idempotency and UX feedback
- [ ] Gate create/edit/delete UI by authentication and ownership signals
- [ ] Public read remains accessible (lists/details)
- [ ] Wire `X-Request-Id` header from edge to API on all requests

### Phase 3 (PR 3): Observability — Logging, Health, and Latency

- [ ] Structured JSON logging in web and API including: timestamp, severity, route, method, `request-id`, `userId` (if auth) [Spec §FR-030]
- [ ] Generate/forward `X-Request-Id` at edge; include in all downstream calls and logs [Spec §FR-031]
- [ ] Add `/health` readiness endpoint [Spec §FR-032]
- [ ] Add basic latency measurement for auth flows (sign-in) aligned to SC-001
- [ ] Documentation on log fields and correlation usage

### Phase 4 (PR 4): Evidence & Release — Documentation and Tagging

- [ ] Update `quickstart.md` with end-to-end steps
- [ ] Finalize OpenAPI and publish contracts artifact
- [ ] Capture evidence: screenshots/log samples demonstrating `request-id`, auth flows, 401/403, 404
- [ ] Update checklists status and close gaps (requirements-quality)
- [ ] Draft release notes summarizing scope and non-goals
- [ ] Tag release and link PRs

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
