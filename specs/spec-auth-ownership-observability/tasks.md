# Tasks: Auth, Ownership, Observability

Feature: spec-auth-ownership-observability  
Spec: ./spec.md  
Plan: ./plan.md  
Contracts: ./contracts/openapi-skeleton.yaml

## Phase 0 — Setup & Foundations (Shared)

- T001 [P] Create feature workspace structure and ensure contracts dir exists (./contracts/)
- T002 [P] Establish logging field schema (timestamp, severity, route, method, request-id, userId)
- T003 Configure request-id propagation standard (`X-Request-Id`) across web and API
- T004 Define cookie policy: `HttpOnly`, `Secure`, SameSite (per Spec §Assumptions)
- T005 Document environment variables and secret injection for Cloud Run/Build (Spec §FR-004)

## Phase 1 — API: Auth Enforcement & Ownership (PR 1)

Story: US1 Sign in/out; US2 Ownership enforcement (Spec §User Stories 1–2)

Tests first (Vitest):
- T006 Write unit tests for login: 204 sets signed HttpOnly cookie; 401 invalid creds (Spec §FR-001, §FR-005)
- T007 Write unit tests for logout: clears/invalidates cookie; idempotent (Spec §FR-002)
- T008 Write middleware tests: rejects on invalid/expired/tampered cookie with 401 (Spec §FR-003)
- T009 Write ownership tests: create sets ownerId from session; update/delete forbidden (403) for non-owner; 404 non-existent (Spec §FR-010–§FR-014)

Implementation:
- T010 Implement POST /login (username/password), issue signed HttpOnly cookie (Spec §FR-001, §FR-005)
- T011 Implement POST /logout, clear session cookie idempotently (Spec §FR-002)
- T012 Add session validation middleware and apply to CUD routes (Spec §FR-003, §FR-011)
- T013 On create, force ownerId = session.userId; ignore/reject client ownerId (Spec §FR-013)
- T014 On update/delete, enforce session.userId === post.ownerId (403 otherwise) (Spec §FR-012)
- T015 Keep GET endpoints public (no auth) (Spec §FR-014)
- T016 Update OpenAPI: cookie security scheme; protect CUD; add 401/403 schemas (Spec §FR-020/§FR-021/§FR-022)

Integration tests (Vitest):
- T017 Happy paths 200/201; negative 401/403/404 across endpoints (Spec §Acceptance)

Observability (API-side for PR1 scope):
- T018 Add structured JSON logging to auth routes and middleware (include request-id, userId if present) (Spec §FR-030/§FR-031)

Checkpoint: API endpoints enforce ownership, pass tests, OpenAPI updated.

## Phase 2 — Next.js UI: Login/Logout & UX (PR 2)

Story: US1 UI; US2 UI ownership gating (Spec §User Stories 1–2)

Tests first (Playwright):
- T019 E2E: login with valid creds → session established; invalid creds → error surfaced
- T020 E2E: logout idempotent; UI reflects signed-out state
- T021 E2E: only owner sees edit/delete controls; non-owner sees none; read is public

Implementation:
- T022 Build login form (username/password), call API /login, handle 401
- T023 Implement logout action calling API /logout; clear UX state
- T024 Gate create/edit/delete buttons based on auth/ownership signals
- T025 Ensure all fetches include/forward `X-Request-Id` header from edge
- T026 Ensure UI avoids accessing session cookie from client code (HttpOnly)

Checkpoint: UI flows for login/logout and ownership visuals complete with E2E passing.

## Phase 3 — Observability: Logging, Health, Latency (PR 3)

Story: US4 tracing; health; latency (Spec §User Story 4)

Tests first (Vitest/Playwright where applicable):
- T027 Unit: request-id generator/forwarder behavior; header validation
- T028 Integration: API logs contain structured fields and `request-id` for key routes
- T029 E2E: request initiated from UI contains same `X-Request-Id` observed in API logs

Implementation:
- T030 Add edge middleware to generate/forward `X-Request-Id`; pass to API and include in logs (Spec §FR-031)
- T031 Implement `/health` readiness endpoint (Spec §FR-032)
- T032 Ensure all logs are structured JSON with required fields (Spec §FR-030)
- T033 Add basic latency measurement for sign-in flow; document thresholds (Spec §SC-001)

Checkpoint: End-to-end traceability with request-id and readiness endpoint in place.

## Phase 4 — Evidence & Release (PR 4)

- T034 Produce screenshots and log samples showing 401/403/404, ownership blocks, request-id
- T035 Finalize `contracts/openapi-skeleton.yaml` and publish artifact
- T036 Update `quickstart.md` with final steps
- T037 Close checklist gaps in `checklists/requirements-quality.md` and `checklists/security.md`
- T038 Draft release notes; tag release; link PRs

## Dependencies

- D001 Phase 1 → Phase 2 → Phase 3 → Phase 4
- D002 Within Phase 1: Tests (T006–T009) precede implementation (T010–T016)
- D003 Within Phase 2: Tests (T019–T021) precede implementation (T022–T026)
- D004 Within Phase 3: Tests (T027–T029) precede implementation (T030–T033)

## Parallelization Examples

- Phase 1 [P]: T006, T007, T008, T009 can be authored in parallel by separate files; T010–T016 mostly sequential by route/middleware files
- Phase 2 [P]: T019–T021 in parallel on separate specs; UI tasks T022–T026 split by component/page
- Phase 3 [P]: T027–T029 in parallel; T030–T033 split by edge/API responsibilities

## Implementation Strategy

- MVP: Complete Phase 1 (PR 1) to secure API and enforce ownership
- Incremental: PR 2 adds UI flows; PR 3 adds observability; PR 4 finalizes evidence and release
