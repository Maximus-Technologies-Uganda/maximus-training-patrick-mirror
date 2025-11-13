# Phase 3 Task Execution Tracker

**Branch**: `feat/phase3-implementation`  
**Date**: 2025-11-13  
**Status**: Ready to Begin  
**Total Tasks**: 78

---

## Phase 1: Setup (T001–T008)

| ID   | Task                                                            | Status | Start | End | Notes                         |
| ---- | --------------------------------------------------------------- | ------ | ----- | --- | ----------------------------- |
| T001 | Verify Node & pnpm prerequisites                                | ⏳     | —     | —   | Via `check-prerequisites.ps1` |
| T002 | Pin Node version (>=20 <21) in package.json & .nvmrc            | ⏳     | —     | —   | Update both files             |
| T003 | Create artifact dirs `docs/week-10/{coverage,a11y,playwright}`  | ⏳     | —     | —   | Create subdirectories         |
| T004 | Add `.spectral.yaml` config (operationId, error-schema, no-any) | ⏳     | —     | —   | At repo root                  |
| T005 | Create `frontend-next/design/tokens.json` (minimal token set)   | ⏳     | —     | —   | Initial minimal set           |
| T006 | Add token parity script `scripts/figma-token-verify.ts`         | ⏳     | —     | —   | Warn-only gate                |
| T007 | Add README artifact links section (placeholders)                | ⏳     | —     | —   | Update README.md §Evidence    |
| T008 | Initialize Storybook config with a11y addon                     | ⏳     | —     | —   | Add @storybook/addon-a11y     |

---

## Phase 2: Foundational (T009–T027, T064–T075)

### Utilities & Infrastructure

| ID   | Task                                             | Status | Start | End | Notes                       |
| ---- | ------------------------------------------------ | ------ | ----- | --- | --------------------------- |
| T009 | Server-only fetch utility (fetchApi.ts)          | ⏳     | —     | —   | ID token + tracing          |
| T010 | Retry/backoff helper (retry.ts)                  | ⏳     | —     | —   | Full-jitter, <3s total      |
| T011 | Trace middleware (traceLogger.ts)                | ⏳     | —     | —   | x-trace-id injection        |
| T012 | Canonical cache key builder (urlKey.ts)          | ⏳     | —     | —   | Deterministic encoding      |
| T013 | Consolidate Zod schemas (packages/contract)      | ⏳     | —     | —   | Query + Status models       |
| T014 | Enhance OpenAPI spec (openapi.yaml)              | ⏳     | —     | —   | Error schema conformity     |
| T015 | Add npm scripts (spectral, test:contracts, etc.) | ⏳     | —     | —   | Update package.json         |
| T016 | Configure Jest coverage scoping                  | ⏳     | —     | —   | frontend-next/src/\*\* only |
| T017 | Status probe script (probe-status.ts)            | ⏳     | —     | —   | Rolling p95 calculation     |

### Tests (Foundational)

| ID   | Task                            | Status | Start | End | Notes                      |
| ---- | ------------------------------- | ------ | ----- | --- | -------------------------- |
| T018 | SWR parity test harness         | ⏳     | —     | —   | Hash comparison SSR vs SWR |
| T019 | Logging shape unit test         | ⏳     | —     | —   | Assert required fields     |
| T020 | A11y Playwright base test       | ⏳     | —     | —   | Axe scan setup             |
| T021 | SSR JS-disabled Playwright test | ⏳     | —     | —   | Content proof              |
| T022 | Zod parse failure mapping test  | ⏳     | —     | —   | User-facing errors         |
| T023 | IAM/env unit test               | ⏳     | —     | —   | Audience + invoker check   |
| T024 | Sensitive field exclusion test  | ⏳     | —     | —   | Status payload security    |
| T025 | Log sampling test               | ⏳     | —     | —   | 100% for ok:false          |
| T026 | Token parity CI integration     | ⏳     | —     | —   | Token drift detection      |
| T027 | Spectral lint CI integration    | ⏳     | —     | —   | Add to ci.yml              |

### Design System

| ID   | Task                                        | Status | Start | End | Notes                   |
| ---- | ------------------------------------------- | ------ | ----- | --- | ----------------------- |
| T064 | DS primitives (Button, Input, Select, etc.) | ⏳     | —     | —   | 7 components            |
| T065 | Unit tests per DS primitive                 | ⏳     | —     | —   | a11y semantics          |
| T066 | URL key canonicalization tests              | ⏳     | —     | —   | Encoding + Unicode      |
| T067 | SSR/SWR key equality test                   | ⏳     | —     | —   | Parity enforcement      |
| T068 | Dynamic route assertions                    | ⏳     | —     | —   | force-dynamic tests     |
| T070 | Log redaction guard tests                   | ⏳     | —     | —   | Strip secrets           |
| T071 | IAM invoker CI check                        | ⏳     | —     | —   | roles/run.invoker       |
| T072 | Cloud Run config CI check                   | ⏳     | —     | —   | min-instances, env vars |
| T073 | ID token memoization tests                  | ⏳     | —     | —   | Perf + timeout          |
| T075 | Security headers baseline tests             | ⏳     | —     | —   | CSP, Referrer-Policy    |

---

## Phase 3: User Story 1 – Instant Secure Posts List (T028–T036)

### Tests

| ID   | Task                                     | Status | Start | End | Notes            |
| ---- | ---------------------------------------- | ------ | ----- | --- | ---------------- |
| T028 | Contract test for posts listing          | ⏳     | —     | —   | Supertest + Zod  |
| T029 | SSR content test (JS-disabled snapshot)  | ⏳     | —     | —   | HTML proof       |
| T030 | Upstream failure graceful messaging test | ⏳     | —     | —   | Error state a11y |

### Implementation

| ID   | Task                                       | Status | Start | End | Notes                      |
| ---- | ------------------------------------------ | ------ | ----- | --- | -------------------------- |
| T031 | Posts table component (PostsTable.tsx)     | ⏳     | —     | —   | Renders post rows          |
| T032 | Empty & error states (PostsStates.tsx)     | ⏳     | —     | —   | Accessible states          |
| T033 | SSR posts page (page.tsx)                  | ⏳     | —     | —   | Server-side fetch + render |
| T034 | Server-only token guard test               | ⏳     | —     | —   | No client token leak       |
| T035 | Integrate trace logging (routeLogger.ts)   | ⏳     | —     | —   | Per-route tracing          |
| T036 | Accessibility live region (LiveRegion.tsx) | ⏳     | —     | —   | aria-live + role=status    |

---

## Phase 4: User Story 2 – Search & Filter Refinement (T037–T044)

### Tests

| ID   | Task                               | Status | Start | End | Notes                      |
| ---- | ---------------------------------- | ------ | ----- | --- | -------------------------- |
| T037 | Filter schema unit tests           | ⏳     | —     | —   | Query validation           |
| T038 | URL sync & history navigation test | ⏳     | —     | —   | Browser back/forward       |
| T039 | SWR vs SSR parity test             | ⏳     | —     | —   | Identical filtered results |

### Implementation

| ID   | Task                                         | Status | Start | End | Notes                     |
| ---- | -------------------------------------------- | ------ | ----- | --- | ------------------------- |
| T040 | Filter controls component (PostsFilters.tsx) | ⏳     | —     | —   | Form + inputs             |
| T041 | SWR hook (usePosts.ts)                       | ⏳     | —     | —   | Client-side data fetching |
| T042 | Integrate canonical key in SWR hook          | ⏳     | —     | —   | urlKey usage              |
| T043 | Sort utilities (sortUtils.ts)                | ⏳     | —     | —   | Sort logic                |
| T044 | Live region update wiring (LiveRegion.tsx)   | ⏳     | —     | —   | Announce filter changes   |

---

## Phase 5: User Story 3 – Health & Evidence Transparency (T045–T054)

### Tests

| ID   | Task                           | Status | Start | End | Notes                     |
| ---- | ------------------------------ | ------ | ----- | --- | ------------------------- |
| T045 | Status contract test           | ⏳     | —     | —   | Health endpoint shape     |
| T046 | Trace propagation test         | ⏳     | —     | —   | Upstream log correlation  |
| T047 | Sensitive field exclusion test | ⏳     | —     | —   | Reuse from foundational   |
| T048 | Status headers test            | ⏳     | —     | —   | no-store, noindex         |
| T074 | Status auth parity test        | ⏳     | —     | —   | Same token flow           |
| T076 | DS usage coverage script       | ⏳     | —     | —   | ≥80% interactive elements |

### Implementation

| ID   | Task                                 | Status | Start | End | Notes               |
| ---- | ------------------------------------ | ------ | ----- | --- | ------------------- |
| T049 | Implement `/status` route (route.ts) | ⏳     | —     | —   | Health endpoint     |
| T050 | Status latency logging (route.ts)    | ⏳     | —     | —   | Reason mapping      |
| T051 | Artifact generation script           | ⏳     | —     | —   | Coverage, a11y, E2E |
| T052 | Integrate probe p95 gate in CI       | ⏳     | —     | —   | ≤150ms enforcement  |
| T053 | Update README with artifact links    | ⏳     | —     | —   | Evidence section    |
| T054 | Update release notes v10.0.0         | ⏳     | —     | —   | Spec, CI, artifacts |

---

## Phase 6: Polish & Cross-Cutting Concerns (T055–T077)

| ID   | Task                                 | Status | Start | End | Notes                 |
| ---- | ------------------------------------ | ------ | ----- | --- | --------------------- |
| T055 | Storybook stories for DS primitives  | ⏳     | —     | —   | All 7 components      |
| T056 | Storybook a11y scan script           | ⏳     | —     | —   | Automated a11y audit  |
| T057 | Refactor fetchApi for memoization    | ⏳     | —     | —   | Perf optimization     |
| T058 | Optimize filter component re-renders | ⏳     | —     | —   | useMemo, useCallback  |
| T059 | Final token parity run & adjust      | ⏳     | —     | —   | Design tokens sync    |
| T060 | Aggregate evidence summary           | ⏳     | —     | —   | Metrics dashboard     |
| T061 | Final release tag automation         | ⏳     | —     | —   | v10.0.0 tag script    |
| T062 | Security review & remove temp logs   | ⏳     | —     | —   | Final cleanup         |
| T063 | Performance audit & notes            | ⏳     | —     | —   | perf.md documentation |
| T077 | Release automation workflow          | ⏳     | —     | —   | release-week10.yml    |

---

## Legend

| Status | Meaning                      |
| ------ | ---------------------------- |
| ⏳     | Not Started                  |
| 🔄     | In Progress                  |
| ✅     | Completed                    |
| ⊘      | Skipped (with justification) |
| ⚠️     | Blocked                      |

---

## Summary Statistics

- **Total Tasks**: 78
- **Started**: 0
- **Completed**: 0
- **Blocked**: 0
- **Parallelizable Tasks**: 38 (49%)

---

## Phase Completion Status

- **Phase 1**: 0/8 (0%)
- **Phase 2**: 0/36 (0%) [T009–T027: 19 tasks; T064–T075: 12 tests + DS]
- **Phase 3**: 0/9 (0%)
- **Phase 4**: 0/8 (0%)
- **Phase 5**: 0/10 (0%)
- **Phase 6**: 0/10 (0%)

**Overall Progress**: 0%

---

## Notes

- **Updated**: 2025-11-13 – Initial tracker created
- **Branch**: `feat/phase3-implementation` (created and checked out)
- **Next**: Begin Phase 1 setup execution
