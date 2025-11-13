# Phase 3 Implementation Plan – Frontend SSR Hardening (Week 10)

**Branch**: `feat/phase3-implementation`  
**Status**: Ready for Implementation  
**Date**: 2025-11-13  
**Scope**: Frontend Foundations – SSR with secure token access, observability, design system v1, search & filter UX, health transparency, and release hardening.

---

## Executive Summary

This phase delivers a production-shaped frontend milestone featuring:

1. **Secure SSR** (User Story 1): Contentful server-rendered posts list using server-only ID token authentication
2. **Smart Filtering** (User Story 2): Query/author/sort parameters with URL synchronization and accessible state announcements
3. **Health Transparency** (User Story 3): `/status` endpoint with observability, trace propagation, and evidence artifacts
4. **Design System v1**: Reusable accessible primitives (Button, Input, Select, Badge, Table, FormFieldGroup, Toast)
5. **Quality Gates**: Coverage (≥70%), accessibility (0 serious+), contract validation, performance (p95 ≤150ms), release governance

**Total Tasks**: 78 (38 parallelizable)  
**Estimated Duration**: 2–3 weeks with full-time team  
**MVP Scope**: Phases 1–3 (Setup + Foundational + US1)

---

## Project Structure

```
frontend-next/
├── app/
│   ├── posts/
│   │   ├── page.tsx              # SSR posts page (T033)
│   │   ├── routeLogger.ts         # Trace logging integration (T035)
│   │   └── page.test.tsx          # Dynamic route tests (T068)
│   ├── status/
│   │   ├── route.ts              # /status endpoint (T049, T050)
│   │   ├── route.test.ts         # Health contract tests (T068)
│   │   └── ...
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── PostsTable.tsx            # Posts table component (T031)
│   ├── PostsTable.test.tsx        # Component unit tests (T065)
│   ├── PostsTable.stories.tsx     # Storybook stories (T055)
│   ├── PostsStates.tsx            # Empty/error states (T032)
│   ├── PostsFilters.tsx           # Filter controls (T040)
│   ├── LiveRegion.tsx             # Accessibility announcements (T036, T044)
│   ├── Button.tsx                 # DS primitive (T064)
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Badge.tsx
│   ├── Table.tsx
│   ├── FormFieldGroup.tsx
│   ├── Toast.tsx
│   └── __tests__/
│       └── {Primitive}.test.tsx   # DS component tests (T065)
├── design/
│   ├── tokens.json               # Design tokens (T005)
│   └── tokens.css                # Generated CSS variables
├── server/
│   ├── fetchApi.ts               # Server-only ID token fetcher (T009)
│   ├── fetchApi.test.ts
│   ├── fetchApi.memo.test.ts     # Memoization & timeout tests (T073)
│   └── ...
├── lib/
│   ├── urlKey.ts                 # Canonical cache key builder (T012)
│   ├── urlKey.test.ts
│   ├── urlKey.test.integration.ts # Canonicalization + parity (T066, T067)
│   └── sortUtils.ts              # Sort utilities (T043)
├── hooks/
│   ├── usePosts.ts               # SWR hook with canonical keys (T041, T042)
│   └── usePosts.test.ts
├── middleware/
│   ├── traceLogger.ts            # Trace middleware (T011)
│   ├── traceLogger.test.ts
│   └── __tests__/
│       ├── redaction.test.ts     # Log redaction guards (T070)
│       └── ...
└── __tests__/
    ├── swrParity.test.ts         # SSR vs SWR hash comparison (T018)
    ├── swrSSRParity.test.ts      # US2 parity tests (T039)
    ├── loggingShape.test.ts      # Log field assertions (T019)
    ├── queryErrorMapping.test.ts # Zod failure mapping (T022)
    ├── iamEnv.test.ts            # IAM/env validation (T023)
    ├── statusSensitive.test.ts   # Sensitive field exclusion (T024)
    ├── logSampling.test.ts       # 100% sampling for ok:false (T025)
    ├── serverOnlyToken.test.ts   # US1 token guard (T034)
    ├── securityHeaders.test.ts   # CSP baseline (T075)
    └── ...

packages/
└── contract/
    ├── src/
    │   ├── query.ts              # Shared Zod schemas (T013)
    │   ├── status.ts
    │   └── index.ts
    └── tsconfig.json

tests/
├── contract/
│   ├── posts.contract.test.ts    # Posts listing contract (T028)
│   ├── filterState.schema.test.ts # Filter schema tests (T037)
│   ├── status.contract.test.ts   # Status contract (T045)
│   ├── status.auth-parity.test.ts # Auth parity (T074)
│   └── ...
├── e2e/
│   ├── posts.ssr-content.spec.ts        # JS-disabled SSR proof (T029)
│   ├── posts.failure.spec.ts            # Graceful failure (T030)
│   ├── posts.ssr.spec.ts                # SSR foundational test (T021)
│   ├── posts.accessibility.spec.ts      # Axe accessibility scan (T020)
│   ├── posts.url-sync.spec.ts           # URL sync & history (T038)
│   ├── status.trace.spec.ts             # Trace propagation (T046)
│   └── ...
└── unit/
    └── ...

docs/
├── week-10/
│   ├── coverage/
│   │   └── index.html            # Jest coverage report (generated)
│   ├── a11y/
│   │   └── index.html            # Axe scan results (generated)
│   ├── playwright/
│   │   └── index.html            # E2E screenshots (generated)
│   ├── status-probe.json         # p95 latency data (generated)
│   ├── evidence-summary.md       # Aggregate summary (T060)
│   └── performance.md            # Perf audit notes (T063)

scripts/
├── quality-gate/
│   ├── probe-status.ts           # Rolling p95 probe (T017)
│   ├── p95-check.ts              # CI gate integration (T052)
│   ├── token-parity.ts           # Design token drift (T026)
│   ├── verify-invoker.ts         # IAM binding check (T071)
│   ├── verify-cloudrun-config.ts # Cloud Run config check (T072)
│   └── ds-usage.ts               # DS primitive usage metric (T076)
├── a11y/
│   └── storybook-scan.ts         # Storybook a11y scan (T056)
├── artifacts/
│   └── generate-week10.js        # Artifact generation (T051)
├── release/
│   └── tag-week10.ts             # Release tagging (T061)
└── figma-token-verify.ts         # Token parity script (T006)

frontend-next/
├── .storybook/
│   ├── main.ts                   # Storybook config with a11y addon (T008)
│   └── ...
└── design/
    └── tokens.json               # Design token file (T005)

.spectral.yaml                    # API contract linting (T004)
.github/
└── workflows/
    ├── ci.yml                    # Updated with Spectral, probe job (T027)
    └── release-week10.yml        # Release automation (T077)

README.md                          # Updated with artifact links (T007, T053)
RELEASE-NOTES.md                  # Release notes with evidence (T054)
```

---

## Task Breakdown by Phase

### Phase 1: Setup (T001–T008) – Duration: 2–4 hours

**Purpose**: Environment, tooling, baseline configs, artifact directories.

| ID   | Task                                                            | Status | Dependencies |
| ---- | --------------------------------------------------------------- | ------ | ------------ |
| T001 | Verify Node & pnpm prerequisites                                | ✓      | None         |
| T002 | Pin Node version (>=20 <21)                                     | ✓      | T001         |
| T003 | Create artifact dirs `docs/week-10/{coverage,a11y,playwright}`  | ✓      | None         |
| T004 | Add `.spectral.yaml` config (operationId, error-schema, no-any) | ✓      | None         |
| T005 | Create `frontend-next/design/tokens.json` (minimal token set)   | ✓      | None         |
| T006 | Add token parity script `scripts/figma-token-verify.ts`         | ✓      | T005         |
| T007 | Add README artifact links section (placeholders)                | ✓      | T003, T005   |
| T008 | Initialize Storybook config with a11y addon                     | ✓      | None         |

**Checkpoint**: All setup infrastructure ready.

---

### Phase 2: Foundational (T009–T027, T064–T075) – Duration: 1–2 weeks

**Purpose**: Core utilities, contracts, DS primitives, quality gates. **CRITICAL**: Must complete before user stories.

#### Utilities & Infrastructure

| ID   | Task                                                                         | Status | Dependencies | Parallelizable |
| ---- | ---------------------------------------------------------------------------- | ------ | ------------ | -------------- |
| T009 | Server-only fetch utility with ID token & tracing                            | ✓      | T004         | No             |
| T010 | Retry/backoff helper (full-jitter, ≤800ms per-attempt, <3s total)            | ✓      | T009         | Yes            |
| T011 | Trace middleware (inject x-trace-id, measure latency, log fields)            | ✓      | T009         | Yes            |
| T012 | Canonical cache key builder (lexicographic, drop empty, encode)              | ✓      | None         | Yes            |
| T013 | Consolidate Zod schemas into `packages/contract`                             | ✓      | T012         | Yes            |
| T014 | Enhance OpenAPI spec (error schema conformity)                               | ✓      | T004, T013   | Yes            |
| T015 | Add npm scripts (spectral:lint, test:contracts, probe:status, tokens:parity) | ✓      | T004, T014   | No             |
| T016 | Configure Jest coverage scoping (frontend-next/src/\*_/_.{ts,tsx})           | ✓      | None         | No             |
| T017 | Status probe script (rolling 10-min samples, exclude warmup, p95)            | ✓      | T015         | Yes            |

#### Tests (Foundational)

| ID   | Task                                                                    | Status | Dependencies | Parallelizable |
| ---- | ----------------------------------------------------------------------- | ------ | ------------ | -------------- |
| T018 | SWR parity test harness (SSR vs SWR hash comparison)                    | ✓      | T012, T013   | Yes            |
| T019 | Logging shape unit test (assert trace, route, latency_ms, status)       | ✓      | T011         | Yes            |
| T020 | A11y Playwright base test (axe scan; fail on serious+)                  | ✓      | None         | Yes            |
| T021 | SSR JS-disabled Playwright test (≥1 <tr> row, no placeholder)           | ✓      | None         | Yes            |
| T022 | Zod parse failure mapping test (single user-facing message)             | ✓      | T013         | Yes            |
| T023 | IAM/env unit test (audience equality + invoker role mock)               | ✓      | T009         | Yes            |
| T024 | Sensitive field exclusion test (no secret/token/key fields)             | ✓      | None         | Yes            |
| T025 | Log sampling test (100% sampling when ok:false)                         | ✓      | T011         | Yes            |
| T026 | Token parity CI integration                                             | ✓      | T006         | Yes            |
| T027 | Spectral lint CI integration (add job/step to .github/workflows/ci.yml) | ✓      | T004, T015   | No             |

#### Design System

| ID   | Task                                                                           | Status | Dependencies | Parallelizable             |
| ---- | ------------------------------------------------------------------------------ | ------ | ------------ | -------------------------- |
| T064 | DS primitives (Button, Input, Select, Badge, Table, FormFieldGroup, Toast)     | ✓      | T008         | Yes (different components) |
| T065 | Unit tests per DS primitive (roles, focus, keyboard, aria)                     | ✓      | T064         | Yes (per-component)        |
| T066 | URL key canonicalization tests (reordering, empty params, encoding, Unicode)   | ✓      | T012         | Yes                        |
| T067 | Enforce SSR/SWR key equality for identical canonical URLs                      | ✓      | T012, T018   | Yes                        |
| T068 | Set `dynamic='force-dynamic'` or `revalidate=0`; add assertion tests           | ✓      | T009         | Yes                        |
| T070 | Log redaction guard: strip auth headers, tokens, cookies                       | ✓      | T011         | Yes                        |
| T071 | CI IAM check for `roles/run.invoker` on API from frontend SA                   | ✓      | T023         | Yes                        |
| T072 | CI Cloud Run config check (min-instances ≥1, env equality)                     | ✓      | T023         | Yes                        |
| T073 | Memoized ID token client perf/unit test                                        | ✓      | T009         | Yes                        |
| T075 | Security headers baseline tests (CSP, Referrer-Policy, X-Content-Type-Options) | ✓      | T009         | Yes                        |

**Checkpoint**: Foundational infrastructure complete – ready for user story implementations.

---

### Phase 3: User Story 1 – Instant Secure Posts List (T028–T036) – Duration: 3–5 days

**Goal**: Contentful SSR posts page with secure server-side upstream access and graceful error states.  
**MVP Deliverable**: Provide this story complete as minimum viable product.

#### Tests (Write First)

| ID   | Task                                     | Status | Dependencies | Parallelizable |
| ---- | ---------------------------------------- | ------ | ------------ | -------------- |
| T028 | Contract test for posts listing          | ⏳     | T013         | Yes            |
| T029 | SSR content test (JS-disabled snapshot)  | ⏳     | T021         | Yes            |
| T030 | Upstream failure graceful messaging test | ⏳     | T021         | Yes            |

#### Implementation

| ID   | Task                                           | Status | Dependencies           | Parallelizable |
| ---- | ---------------------------------------------- | ------ | ---------------------- | -------------- |
| T031 | Posts table component                          | ⏳     | T064                   | Yes            |
| T032 | Empty & error states component                 | ⏳     | T064                   | Yes            |
| T033 | SSR posts page (uses fetchApi + canonical key) | ⏳     | T031, T032, T009, T012 | No             |
| T034 | Server-only token guard test                   | ⏳     | T009                   | Yes            |
| T035 | Integrate trace logging for posts route        | ⏳     | T011, T033             | No             |
| T036 | Accessibility live region for error/empty      | ⏳     | T032                   | Yes            |

**Acceptance Criteria**:

- SSR posts page renders ≥1 real post row without placeholder (JS disabled)
- Upstream failure shows accessible error message (role="status")
- No client token exposure
- Trace propagation working end-to-end

**Checkpoint**: US1 independently testable (MVP deliverable).

---

### Phase 4: User Story 2 – Search & Filter Refinement (T037–T044) – Duration: 3–5 days

**Goal**: Query/author/sort filtering with URL synchronization & accessible state announcements.

#### Tests

| ID   | Task                               | Status | Dependencies | Parallelizable |
| ---- | ---------------------------------- | ------ | ------------ | -------------- |
| T037 | Filter schema unit tests           | ⏳     | T013         | Yes            |
| T038 | URL sync & history navigation test | ⏳     | T021         | Yes            |
| T039 | SWR vs SSR parity test             | ⏳     | T018         | Yes            |

#### Implementation

| ID   | Task                                        | Status | Dependencies | Parallelizable |
| ---- | ------------------------------------------- | ------ | ------------ | -------------- |
| T040 | Filter controls component                   | ⏳     | T064, T036   | Yes            |
| T041 | SWR hook (`usePosts.ts`)                    | ⏳     | T012, T010   | Yes            |
| T042 | Integrate canonical key usage in SWR hook   | ⏳     | T012, T041   | No             |
| T043 | Sort utilities                              | ⏳     | T013         | Yes            |
| T044 | Live region update wiring to filter changes | ⏳     | T036, T040   | No             |

**Acceptance Criteria**:

- Direct navigation to filtered URL (e.g., `/posts?q=design&author=alice`) SSR correctly
- Client-side filter changes update URL synchronously
- Live region announcements for state changes
- SWR parity: identical results for identical canonical URLs

**Checkpoint**: US2 independently testable (search/filter functional & accessible).

---

### Phase 5: User Story 3 – Health & Evidence Transparency (T045–T054) – Duration: 2–4 days

**Goal**: `/status` endpoint with health indicators, trace propagation, evidence artifacts & release readiness.

#### Tests

| ID   | Task                                                        | Status | Dependencies | Parallelizable |
| ---- | ----------------------------------------------------------- | ------ | ------------ | -------------- |
| T045 | Status contract test                                        | ⏳     | T013         | Yes            |
| T046 | Trace propagation test (`/status` vs upstream logs)         | ⏳     | T011, T021   | Yes            |
| T047 | Sensitive field exclusion test (reuse from foundational)    | ⏳     | T024         | Yes            |
| T048 | `/status` headers test (no-store, noindex)                  | ⏳     | None         | Yes            |
| T074 | `/status` auth parity test (audience equality, base URL)    | ⏳     | T009, T023   | Yes            |
| T076 | DS usage coverage script (≥80% interactive elements use DS) | ⏳     | T064         | Yes            |

#### Implementation

| ID   | Task                                            | Status | Dependencies     | Parallelizable |
| ---- | ----------------------------------------------- | ------ | ---------------- | -------------- |
| T049 | Implement `/status` route                       | ⏳     | T013, T011, T009 | No             |
| T050 | Status latency logging & reason mapping         | ⏳     | T049, T011       | No             |
| T051 | Artifact generation script                      | ⏳     | T017, T020, T016 | Yes            |
| T052 | Integrate probe p95 gate in CI                  | ⏳     | T017, T027       | No             |
| T053 | Update README with artifact links               | ⏳     | T051, T007       | Yes            |
| T054 | Update release notes with spec PR & CI evidence | ⏳     | T051, T053       | Yes            |

**Acceptance Criteria**:

- `/status` returns JSON with `ok`, `traceId`, `upstream`, `ts`, `reason?`
- Always returns HTTP 200
- Trace ID correlates with upstream logs
- Artifacts (coverage, a11y, Playwright) linked in README & release notes
- p95 latency ≤150ms (10-min rolling average)

**Checkpoint**: US3 independently testable (health transparency + artifacts published).

---

### Phase 6: Polish & Cross-Cutting Concerns (T055–T077) – Duration: 2–3 days

**Purpose**: Final refinements, performance, documentation, hardening.

| ID   | Task                                                        | Status | Dependencies | Parallelizable |
| ---- | ----------------------------------------------------------- | ------ | ------------ | -------------- |
| T055 | Storybook stories for all DS primitives                     | ⏳     | T064, T008   | Yes            |
| T056 | Storybook a11y scan script                                  | ⏳     | T055, T020   | Yes            |
| T057 | Refactor fetchApi for memoized ID token client              | ⏳     | T009, T073   | No             |
| T058 | Optimize filter component to prevent unnecessary re-renders | ⏳     | T040         | No             |
| T059 | Final token parity run & adjust tokens                      | ⏳     | T006, T026   | Yes            |
| T060 | Aggregate evidence summary                                  | ⏳     | T045–T054    | Yes            |
| T061 | Final release tag automation script                         | ⏳     | T054         | Yes            |
| T062 | Security review & remove temporary logs                     | ⏳     | T011         | No             |
| T063 | Performance audit & add notes to perf doc                   | ⏳     | T050, T057   | Yes            |
| T077 | Release automation workflow                                 | ⏳     | T061, T051   | No             |

**Checkpoint**: All tasks complete, quality gates passing, release ready.

---

## Parallel Execution Opportunities

### Phase 1 Setup (All can start immediately)

- T003, T004, T005, T006, T008 can run in parallel
- T002, T007 have minimal dependencies

### Phase 2 Foundational (After T001–T002)

**Parallel Batch 1** (Infrastructure):

- T010, T012, T013, T014, T017 (all independent)

**Parallel Batch 2** (Tests):

- T018–T025, T026 (all independent, after T013)

**Parallel Batch 3** (Design System):

- T064, T065, T066, T067, T068, T070, T071, T072, T073, T075 (mostly independent)

### Phase 3 US1

- T028, T029, T030 (tests in parallel)
- T031, T032, T034, T036 (components in parallel, after T064)
- T033, T035 (sequential, depend on T031/T032)

### Phase 4 US2

- T037, T038, T039 (tests in parallel, after T013)
- T040, T041, T043 (components in parallel, after T064)
- T042, T044 (integration, after T040/T041)

### Phase 5 US3

- T045, T046, T047, T048, T074, T076 (tests in parallel, after T013)
- T049, T050 (route implementation, sequential)
- T051, T053, T054 (artifacts/documentation in parallel, after T049)
- T052 (after T017)

### Phase 6 Polish

- T055, T056, T059, T060, T063 (can run in parallel with Phase 5)
- T057, T058, T062, T077 (sequential or late-phase)
- T061 (last)

---

## Critical Dependencies & Blockers

1. **Phase 2 must complete before user stories**: All infrastructure (T009–T027) unblocks all stories
2. **T013 (Zod schemas) critical**: Blocks contract tests, filter/query validation, `/status` contract
3. **T012 (cache key builder) critical**: Required for SSR/SWR parity tests and implementations
4. **T064 (DS primitives) critical**: Required for all UI components (PostsTable, PostsFilters, etc.)
5. **T009 (fetchApi) critical**: Required for all data-fetching features (posts, status)

---

## Quality Metrics & Gates

| Metric                     | Target      | Tool         | Gate                    |
| -------------------------- | ----------- | ------------ | ----------------------- |
| Coverage (lines)           | ≥70%        | Jest         | Fail CI if not met      |
| Coverage (branches)        | ≥60%        | Jest         | Fail CI if not met      |
| A11y (serious+ violations) | 0           | Axe          | Fail CI if any found    |
| `/status` p95 latency      | ≤150ms      | Probe script | Fail CI if exceeded     |
| Contract validation        | 100% pass   | Spectral     | Fail CI on violations   |
| SSR content (js-disabled)  | ≥1 post row | Playwright   | Fail CI if not rendered |
| Token parity               | Warn-only   | Token script | Warn in CI logs         |

---

## Environment Setup Checklist

- [x] Git branch `feat/phase3-implementation` created and checked out
- [x] Node 20.x LTS installed
- [x] pnpm 9.x via Corepack
- [x] Prerequisites verified (check-prerequisites.ps1)
- [x] `.gitignore`, `.dockerignore`, `.eslintignore`, `.prettierignore` present and configured
- [x] Artifact directories created (`docs/week-10/`)
- [x] `.spectral.yaml` configured
- [x] `frontend-next/design/tokens.json` created
- [x] Storybook `.storybook/main.ts` configured with a11y addon
- [x] All npm scripts added to `package.json`
- [ ] Initial Phase 1 commit (setup infrastructure)
- [ ] Phase 1 tasks verification checklist passed

---

## Next Immediate Steps (Phase 1 & 2)

1. **Begin Phase 1 Setup** (start all T001–T008):
   - Verify Node/pnpm versions
   - Create artifact directories
   - Add/verify Spectral config
   - Create design tokens file
   - Configure Storybook

2. **Begin Phase 2 Foundational** (prioritize in order):
   - **Must complete first**: T009 (fetchApi), T013 (Zod schemas)
   - **Then parallel**: T010–T012, T014–T027, T064–T075

3. **Validation**:
   - Run `pnpm run lint` & `pnpm run test:types` after each phase
   - Verify artifact directories exist and contain expected files
   - Run contract tests (`pnpm run test:contracts`) after T013
   - Run E2E tests (`pnpm run test:e2e`) after T020, T021

---

## Success Criteria (Completion)

✅ All 78 tasks completed (or marked as skipped with justification)  
✅ All checklists in `specs/001-frontend-ssr-hardening/checklists/` marked complete  
✅ Coverage ≥70% (lines), ≥60% (branches)  
✅ A11y violations = 0 (serious+)  
✅ `/status` p95 ≤150ms  
✅ SSR posts page renders without JS (≥1 real post)  
✅ SWR parity tests passing (hash equality for identical URLs)  
✅ All artifacts generated and linked in README  
✅ Release notes v10.0.0 with spec/CI/artifact links  
✅ Release tag created (`v10.0.0`)  
✅ Branch ready for merge to `main` (with PR)

---

## Risk Mitigation

| Risk                        | Likelihood | Impact   | Mitigation                                                 |
| --------------------------- | ---------- | -------- | ---------------------------------------------------------- |
| ID token misconfiguration   | Medium     | Critical | Early unit test (T023), env-var validation in CI           |
| Cache key parity drift      | Medium     | High     | Single canonical function, comprehensive tests (T066–T067) |
| A11y regressions            | Medium     | High     | Axe scans in CI (T020, T056), baseline tests (T075)        |
| Performance regression      | Medium     | High     | p95 probe in CI (T017, T052), perf audit (T063)            |
| Token drift (design tokens) | Low        | Medium   | Token parity script warn (T006, T026)                      |
| Trace correlation gaps      | Medium     | Medium   | Integration tests (T046), log assertions (T019)            |

---

## Estimated Timeline (Full Team)

| Phase           | Tasks                | Duration      | Start  | End    |
| --------------- | -------------------- | ------------- | ------ | ------ |
| 1. Setup        | T001–T008            | 2–4 hours     | Day 1  | Day 1  |
| 2. Foundational | T009–T027, T064–T075 | 1–2 weeks     | Day 1  | Day 8  |
| 3. US1          | T028–T036            | 3–5 days      | Day 9  | Day 13 |
| 4. US2          | T037–T044            | 3–5 days      | Day 14 | Day 18 |
| 5. US3          | T045–T054            | 2–4 days      | Day 19 | Day 22 |
| 6. Polish       | T055–T077            | 2–3 days      | Day 23 | Day 25 |
| **Total**       | **78 tasks**         | **2–3 weeks** | Day 1  | Day 25 |

**MVP Scope** (Phases 1–3): **8–12 days**

---

## Documentation & Artifacts

All artifacts generated and committed to this branch before merge:

- `docs/week-10/coverage/index.html` – Jest coverage report
- `docs/week-10/a11y/index.html` – Axe scan results
- `docs/week-10/playwright/` – Playwright test screenshots
- `docs/week-10/status-probe.json` – p95 latency data
- `docs/week-10/evidence-summary.md` – Aggregated quality metrics
- `docs/week-10/performance.md` – Performance audit notes
- `README.md` – Updated with artifact links
- `RELEASE-NOTES.md` – v10.0.0 with evidence links
- Git tag `v10.0.0`

---

## Sign-Off Checklist (Before Merge to Main)

- [ ] All 78 tasks completed (or explicitly skipped)
- [ ] All Phase 1 tasks verified
- [ ] All Phase 2 foundational tests passing
- [ ] US1 acceptance criteria met (SSR ≥1 post, secure token, error handling)
- [ ] US2 acceptance criteria met (filters, URL sync, parity)
- [ ] US3 acceptance criteria met (health endpoint, artifacts, trace)
- [ ] Coverage ≥70% lines, ≥60% branches (scoped to frontend-next)
- [ ] A11y violations = 0 (serious+) on key pages
- [ ] `/status` p95 ≤150ms (10-min rolling)
- [ ] Spectral lint 100% pass
- [ ] All artifact links working in README
- [ ] Release notes with spec PR, CI run, artifact links
- [ ] Code review approved
- [ ] CI/GitHub Actions green
- [ ] Manual testing checklist completed (see MANUAL_TESTING.md)
- [ ] Tag `v10.0.0` created
- [ ] PR ready for merge

---

**Status**: Ready for Phase 1 execution.  
**Branch**: `feat/phase3-implementation`  
**Next Action**: Start Phase 1 setup tasks (T001–T008).
