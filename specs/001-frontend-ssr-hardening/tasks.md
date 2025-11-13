---
description: 'Task list for Frontend Foundations Week 10 – SSR & Hardening'
---

# Tasks: Frontend Foundations Week 10 – SSR & Hardening

**Input**: Design documents from `specs/001-frontend-ssr-hardening/`
**Prerequisites**: plan.md, spec.md (user stories), research.md, data-model.md, contracts/

**Tests**: Included because spec mandates coverage, contract validation, a11y, parity, latency.
**Organization**: Tasks grouped by phases; user story phases have independent test criteria.

## Format Reminder: `- [ ] T### [P?] [US#?] Description (with file path)`

- `[P]` parallelizable (different files, no dependency ordering)
- `[US#]` only for user story phases (US1, US2, US3)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Ensure environment, tooling, directories, baseline configs.

- [x] T001 Verify Node & pnpm prerequisites via `.specify/scripts/powershell/check-prerequisites.ps1` (add validation output capture script)
- [x] T002 [P] Pin Node version (engines + .nvmrc) in `package.json` and `.nvmrc` (>=20 <21) per spec
- [x] T003 [P] Create evidence artifact directories `docs/week-10/{coverage,a11y,playwright}`
- [x] T004 [P] Add Spectral config `.spectral.yaml` at repo root enforcing operationId,error-schema,no-any
- [x] T005 [P] Create design tokens file `frontend-next/design/tokens.json` (initial minimal token set)
- [x] T006 [P] Add token parity script `scripts/figma-token-verify.ts` (warn-only gate)
- [x] T007 Add README placeholder artifact links section `README.md` (week-10 artifacts pending)
- [x] T008 Initialize Storybook config `frontend-next/.storybook/main.ts` with a11y addon

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infra required before any user story implementation.
**CRITICAL**: All tasks here must complete before US phases.

- [x] T009 Implement server-only fetch utility with ID token & tracing in `frontend-next/src/server/fetchApi.ts` (import 'server-only')
- [x] T010 [P] Implement retry/backoff helper `frontend-next/src/server/retry.ts` (full-jitter, per-attempt timeout ≤800ms, total budget <3s)
- [x] T011 [P] Implement trace middleware `frontend-next/src/middleware/traceLogger.ts` (adds trace, measures latency, logs required fields)
- [x] T012 [P] Implement canonical cache key builder `frontend-next/src/lib/urlKey.ts` (lexicographic params, drop empty, encode)
- [x] T013 [P] Consolidate Zod schemas into contract package `packages/contract/src/query.ts` (migrate from `specs/.../contracts/query.zod.ts`)
- [x] T014 [P] Enhance OpenAPI spec `specs/001-frontend-ssr-hardening/contracts/openapi.yaml` (ensure error schema conformity)
- [x] T015 Add npm scripts: `spectral:lint`, `test:contracts`, `probe:status`, `tokens:parity` in `package.json`
- [x] T016 Configure Jest coverage scoping (collect only `frontend-next/src/**/*.{ts,tsx}`) in `jest.config.js`
- [x] T017 Implement status probe script `scripts/quality-gate/probe-status.ts` (rolling 10-min samples, exclude warmup, compute p95)
- [x] T018 Add SWR parity test harness `frontend-next/src/__tests__/swrParity.test.ts` (SSR vs SWR hash comparison)
- [x] T019 Add logging shape unit test `frontend-next/src/__tests__/loggingShape.test.ts` (assert trace,route,latency_ms,status,upstream_status)
- [x] T020 Add a11y Playwright base test `tests/e2e/posts.accessibility.spec.ts` (axe scan; fail on serious+)
- [x] T021 Add SSR JS-disabled Playwright test `tests/e2e/posts.ssr.spec.ts` (≥1 <tr> row, no placeholder text)
- [x] T022 Implement Zod parse failure mapping test `frontend-next/src/__tests__/queryErrorMapping.test.ts` (single user-facing message)
- [x] T023 Implement IAM/env unit test `frontend-next/src/__tests__/iamEnv.test.ts` (audience equality + mock invoker role)
- [x] T024 Implement sensitive field exclusion test `frontend-next/src/__tests__/statusSensitive.test.ts` (no secret/token/key field names)
- [x] T025 Implement log sampling test `frontend-next/src/__tests__/logSampling.test.ts` (100% sampling when ok:false)
- [x] T026 Implement token parity CI integration `scripts/quality-gate/token-parity.ts`
- [x] T027 Implement spectral lint CI integration config `.github/workflows/ci.yml` (add job or step)
- [x] T064 [P] Implement DS primitives (Button, Input, Select, Badge, Table, FormFieldGroup, Toast) with a11y semantics and stories `frontend-next/components/{Primitive}.tsx|.stories.tsx`
- [x] T065 [P] Unit tests per DS primitive (roles, focus, keyboard, aria) `frontend-next/components/__tests__/{Primitive}.test.tsx`
- [x] T066 [P] URL key canonicalization tests incl. reordering, empty params, percent-encoding, Unicode NFC/NFD `frontend-next/src/lib/urlKey.test.ts`
- [x] T067 [P] Enforce SSR/SWR key equality for identical canonical URL `frontend-next/src/__tests__/keyParity.test.ts`
- [x] T068 Set `dynamic='force-dynamic'` or `revalidate=0` for `/posts` and `/status`; add assertion tests `frontend-next/app/posts/page.test.tsx`, `frontend-next/app/status/route.test.ts`
- [x] T070 [P] Log redaction guard: strip auth headers, tokens, cookies; test with seeded headers `frontend-next/src/middleware/__tests__/redaction.test.ts`
- [x] T071 CI IAM check for `roles/run.invoker` on API from frontend SA `scripts/quality-gate/verify-invoker.ts` + workflow (fail if missing)
- [x] T072 CI Cloud Run config check for `min-instances >= 1` and env equality via `gcloud run services describe` parser `scripts/quality-gate/verify-cloudrun-config.ts`
- [x] T073 [P] Memoized ID token client perf/unit test proves reuse & per-attempt timeout enforcement `frontend-next/src/server/fetchApi.memo.test.ts`
- [x] T075 Security headers baseline tests (CSP, Referrer-Policy, X-Content-Type-Options) `frontend-next/src/__tests__/securityHeaders.test.ts`

**Checkpoint**: Foundation ready – begin user story phases.

---

## Phase 3: User Story 1 – Instant Secure Posts List (Priority: P1) 🎯 MVP

**Goal**: Contentful SSR posts page with secure server-side upstream access; graceful error states.
**Independent Test**: Disable JS, load `/posts`; verify ≥1 post row; simulate upstream failure & observe accessible error message.

### Tests (write first)

- [x] T028 [P] [US1] Contract test for posts listing `tests/contract/posts.contract.test.ts`
- [x] T029 [P] [US1] SSR content test (JS disabled snapshot) `tests/e2e/posts.ssr-content.spec.ts`
- [x] T030 [P] [US1] Upstream failure graceful messaging test `tests/e2e/posts.failure.spec.ts`

### Implementation

- [x] T031 [P] [US1] Implement posts table component `frontend-next/components/PostsTable.tsx`
- [x] T032 [P] [US1] Implement empty & error states component `frontend-next/components/PostsStates.tsx`
- [x] T033 [US1] Implement SSR posts page `frontend-next/app/posts/page.tsx` (uses fetchApi + canonical key)
- [x] T034 [US1] Add server-only token guard test `frontend-next/src/__tests__/serverOnlyToken.test.ts`
- [x] T035 [US1] Integrate trace logging for posts route `frontend-next/app/posts/routeLogger.ts`
- [x] T036 [US1] Accessibility live region for error/empty `frontend-next/components/LiveRegion.tsx`

**Checkpoint**: US1 independently testable (MVP deliverable).

---

## Phase 4: User Story 2 – Search & Filter Refinement (Priority: P2)

**Goal**: Query/author/sort filtering with URL synchronization & accessible state announcements.
**Independent Test**: Navigate directly to filtered URL & confirm SSR results; change filters client-side, verify URL + live region updates.

### Tests

- [ ] T037 [P] [US2] Filter schema unit tests `tests/contract/filterState.schema.test.ts`
- [ ] T038 [P] [US2] URL sync & history navigation test `tests/e2e/posts.url-sync.spec.ts`
- [ ] T039 [P] [US2] SWR vs SSR parity test `frontend-next/src/__tests__/swrSSRParity.test.ts`

### Implementation

- [ ] T040 [P] [US2] Implement filter controls component `frontend-next/components/PostsFilters.tsx`
- [ ] T041 [P] [US2] Implement SWR hook `frontend-next/src/hooks/usePosts.ts`
- [ ] T042 [US2] Integrate canonical key usage in SWR hook (urlKey) `frontend-next/src/hooks/usePosts.ts`
- [ ] T043 [US2] Implement sort utilities `frontend-next/src/lib/sortUtils.ts`
- [ ] T044 [US2] Add live region update wiring to filter changes `frontend-next/components/LiveRegion.tsx`

**Checkpoint**: US2 independently testable (search/filter functional & accessible).

---

## Phase 5: User Story 3 – Health & Evidence Transparency (Priority: P3)

**Goal**: `/status` endpoint with health indicators, trace propagation, evidence artifacts & release readiness.
**Independent Test**: Load `/status` (ok:true), simulate upstream failure (ok:false + reason), verify artifacts linked in README & release notes.

### Tests

- [ ] T045 [P] [US3] Status contract test `tests/contract/status.contract.test.ts`
- [ ] T046 [P] [US3] Trace propagation test `/status` vs upstream logs `tests/e2e/status.trace.spec.ts`
- [ ] T047 [P] [US3] Sensitive field exclusion test (already in foundational) reuse `frontend-next/src/__tests__/statusSensitive.test.ts`
- [ ] T048 [P] [US3] `/status` headers test asserts `Cache-Control: no-store` and `X-Robots-Tag: noindex` `frontend-next/src/__tests__/statusHeaders.test.ts`
- [ ] T074 `/status` uses same server-side ID-token flow as SSR; test stubs audience and base URL equality `tests/contract/status.auth-parity.test.ts`
- [ ] T076 [P] DS usage coverage script: ensure ≥80% interactive elements on `/posts` use DS primitives; emit metric `scripts/quality-gate/ds-usage.ts`

### Implementation

- [ ] T049 [P] [US3] Implement `/status` route `frontend-next/app/status/route.ts`
- [ ] T050 [P] [US3] Implement status latency logging & reason mapping `frontend-next/app/status/route.ts`
- [ ] T051 [US3] Implement artifact generation script `scripts/artifacts/generate-week10.js`
- [ ] T052 [US3] Integrate probe p95 gate in CI `scripts/quality-gate/p95-check.ts`
- [ ] T053 [US3] Update README with final artifact links `README.md`
- [ ] T054 [US3] Update release notes with spec PR & CI evidence `RELEASE-NOTES.md`

**Checkpoint**: US3 independently testable (health transparency + artifacts published).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, performance, documentation, and hardening.

- [ ] T055 [P] Add Storybook stories for all DS primitives `frontend-next/components/**/*.stories.tsx`
- [ ] T056 [P] Implement Storybook a11y scan script `scripts/a11y/storybook-scan.ts`
- [ ] T057 Refactor fetchApi for memoized ID token client & explicit timeout tests `frontend-next/src/server/fetchApi.ts`
- [ ] T058 Optimize filter component to prevent unnecessary re-renders `frontend-next/components/PostsFilters.tsx`
- [ ] T059 [P] Final token parity run & adjust tokens `frontend-next/design/tokens.json`
- [ ] T060 [P] Aggregate evidence summary `docs/week-10/evidence-summary.md`
- [ ] T061 Final release tag automation script `scripts/release/tag-week10.ts`
- [ ] T062 Security review & remove any temporary logs `frontend-next/src/middleware/traceLogger.ts`
- [ ] T063 Performance audit & add notes to `docs/week-10/performance.md`
- [ ] T077 Workflow to run `scripts/release/tag-week10.ts` on green main, attach artifact links `.github/workflows/release-week10.yml`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1) → Foundational (Phase 2) → US1 (Phase 3) → US2 (Phase 4) → US3 (Phase 5) → Polish (Phase 6)
- User stories depend on completion of Foundational.

### User Story Dependencies

- US1 (P1) no dependencies beyond Foundational.
- US2 (P2) depends on Foundational; logically independent of US1 (shares infra only).
- US3 (P3) depends on Foundational; can start after US1 for trace patterns but testable independently.

### Within Story Ordering

1. Tests (ensure fail first)
2. Components/utilities
3. Pages/routes
4. Integration & logging
5. Artifact & CI hooks

### Parallel Opportunities

- All tasks marked [P] in Setup & Foundational can run concurrently.
- Within each story, multiple test tasks and component tasks marked [P] can proceed in parallel.
- Different user stories can be staffed simultaneously post-Foundational.

---

## Parallel Execution Examples

### Example: US1 Parallel Start

```
Run T028, T029, T030 tests in parallel
Develop T031, T032 components concurrently
```

### Example: Foundational Parallel

```
T010 retry helper, T011 trace middleware, T012 urlKey builder, T013 contract migration all parallel
```

### Example: US3 Parallel

```
T045 status contract test, T046 trace test, T048 header test in parallel while implementing T049 route
```

---

## Independent Test Criteria Per Story

- US1: JS-disabled SSR shows ≥1 real post row; upstream failure yields accessible error (role=status) + no placeholder.
- US2: Filtered URL direct navigation SSR matches expected filtered dataset; client-side filter change updates URL & announces state; parity hash matches SSR.
- US3: `/status` returns structured payload (always 200); failure case shows `ok:false` + `reason`; traceId correlates with upstream log; artifacts accessible via README links.

---

## Suggested MVP Scope

Deliver through completion of US1 (Phase 3) after Setup + Foundational (Phases 1–2). This provides secure, contentful SSR + resilience baseline.

---

## Implementation Strategy

1. Complete Setup & Foundational ensuring all infra scripts & tests present.
2. Execute US1 (SSR posts) as MVP and validate acceptance criteria.
3. Add US2 (filters & parity) without breaking US1; assert isolation via tests.
4. Add US3 (status & evidence) focusing on observability & governance.
5. Polish phase to raise quality (performance, documentation, a11y breadth, token parity).

---

## Task Counts

- Total Tasks: 78
- Setup: 8
- Foundational: 29
- US1: 9
- US2: 9
- US3: 13
- Polish: 10

Parallelizable ([P]) Count: 38

---

## Format Validation

All tasks use required format: `- [ ] T### [P?] [US#?] Description (file path)` with sequential IDs and story labels present only on user story tasks.

---
