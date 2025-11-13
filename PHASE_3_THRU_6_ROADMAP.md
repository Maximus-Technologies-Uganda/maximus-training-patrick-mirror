# Phases 3–6 Roadmap – Complete Implementation

**Branch**: `feat/phase3-implementation`  
**Status**: Phase 1 & 2 Complete ✅ | Phase 3 Ready to Start  
**Total Remaining Tasks**: 37 (Phase 3–6)

---

## Quick Summary by Phase

### Phase 3: User Story 1 – Instant Secure Posts List (9 tasks, 3–5 days)

**MVP Deliverable**: SSR posts page with secure token auth, graceful errors, trace logging.

| Task | Description                              | Status         |
| ---- | ---------------------------------------- | -------------- |
| T028 | Contract test for posts listing          | ⏳ Not Started |
| T029 | SSR content test (JS-disabled)           | ⏳ Not Started |
| T030 | Upstream failure graceful messaging test | ⏳ Not Started |
| T031 | Posts table component                    | ⏳ Not Started |
| T032 | Empty & error states component           | ⏳ Not Started |
| T033 | SSR posts page                           | ⏳ Not Started |
| T034 | Server-only token guard test             | ⏳ Not Started |
| T035 | Integrate trace logging                  | ⏳ Not Started |
| T036 | Accessibility live region                | ⏳ Not Started |

**Acceptance Criteria**:

- ✅ SSR renders ≥1 real post row (JS disabled)
- ✅ Upstream failure → accessible error (role="status")
- ✅ No client token exposure
- ✅ Trace ID propagation end-to-end

**Reference**: See `PHASE_3_FOCUSED_EXECUTION.md` for complete code examples and 5-day execution plan.

---

### Phase 4: User Story 2 – Search & Filter Refinement (8 tasks, 3–5 days)

**Goal**: Query/author/sort filtering with URL sync & accessible state announcements.

| Task | Description                                 | Status         |
| ---- | ------------------------------------------- | -------------- |
| T037 | Filter schema unit tests                    | ⏳ Not Started |
| T038 | URL sync & history navigation test          | ⏳ Not Started |
| T039 | SWR vs SSR parity test                      | ⏳ Not Started |
| T040 | Filter controls component                   | ⏳ Not Started |
| T041 | SWR hook (usePosts.ts)                      | ⏳ Not Started |
| T042 | Integrate canonical key in SWR hook         | ⏳ Not Started |
| T043 | Sort utilities                              | ⏳ Not Started |
| T044 | Live region update wiring to filter changes | ⏳ Not Started |

**Acceptance Criteria**:

- ✅ Direct navigation to `/posts?q=design&author=alice` SSR correctly
- ✅ Client-side filter changes update URL synchronously
- ✅ Live region announces state changes
- ✅ SWR parity: identical results for identical canonical URLs

**Key Dependencies**: Phase 3 (US1) must be complete first.

---

### Phase 5: User Story 3 – Health & Evidence Transparency (10 tasks, 2–4 days)

**Goal**: `/status` endpoint with health indicators, trace propagation, evidence artifacts & release readiness.

| Task | Description                             | Status         |
| ---- | --------------------------------------- | -------------- |
| T045 | Status contract test                    | ⏳ Not Started |
| T046 | Trace propagation test                  | ⏳ Not Started |
| T047 | Sensitive field exclusion test (reuse)  | ⏳ Not Started |
| T048 | Status headers test (no-store, noindex) | ⏳ Not Started |
| T074 | Status auth parity test                 | ⏳ Not Started |
| T076 | DS usage coverage script                | ⏳ Not Started |
| T049 | Implement `/status` route               | ⏳ Not Started |
| T050 | Status latency logging & reason mapping | ⏳ Not Started |
| T051 | Artifact generation script              | ⏳ Not Started |
| T052 | Integrate probe p95 gate in CI          | ⏳ Not Started |
| T053 | Update README with artifact links       | ⏳ Not Started |
| T054 | Update release notes v10.0.0            | ⏳ Not Started |

**Acceptance Criteria**:

- ✅ `/status` returns JSON: `{ ok, traceId, upstream, ts, reason? }`
- ✅ Always HTTP 200
- ✅ Trace ID correlates with upstream logs
- ✅ Artifacts (coverage, a11y, Playwright) linked in README
- ✅ p95 latency ≤150ms (10-min rolling)

**Key Dependencies**: Phase 3 & 4 preferred (but can start independently for testing).

---

### Phase 6: Polish & Cross-Cutting Concerns (10 tasks, 2–3 days)

**Goal**: Final refinements, performance optimization, documentation, release hardening.

| Task | Description                             | Status         |
| ---- | --------------------------------------- | -------------- |
| T055 | Storybook stories for DS primitives     | ⏳ Not Started |
| T056 | Storybook a11y scan script              | ⏳ Not Started |
| T057 | Refactor fetchApi for memoized ID token | ⏳ Not Started |
| T058 | Optimize filter component re-renders    | ⏳ Not Started |
| T059 | Final token parity run & adjust         | ⏳ Not Started |
| T060 | Aggregate evidence summary              | ⏳ Not Started |
| T061 | Final release tag automation            | ⏳ Not Started |
| T062 | Security review & remove temp logs      | ⏳ Not Started |
| T063 | Performance audit & notes               | ⏳ Not Started |
| T077 | Release automation workflow             | ⏳ Not Started |

**Key Activities**:

- ✅ Maximize Storybook coverage & a11y validation
- ✅ Performance optimization (memoization, re-renders)
- ✅ Token parity verification
- ✅ Security hardening (log redaction, CSP, headers)
- ✅ Evidence artifact aggregation
- ✅ Release tag v10.0.0 automation

**Dependencies**: Phases 3–5 should be mostly complete before starting.

---

## Execution Timeline

| Phase | Tasks          | Duration | Parallel with              |
| ----- | -------------- | -------- | -------------------------- |
| **3** | T028–T036 (9)  | 3–5 days | Start immediately          |
| **4** | T037–T044 (8)  | 3–5 days | Can overlap Phase 3 day 3+ |
| **5** | T045–T054 (10) | 2–4 days | Can overlap Phase 4 day 2+ |
| **6** | T055–T077 (10) | 2–3 days | Can start Phase 5 day 2+   |

**Total**: ~2–3 weeks with full-time focus

---

## Critical Path & Dependencies

```
Phase 3 (US1) → Phase 4 (US2)
     ↓               ↓
  Phase 5 (US3)  [Can run in parallel]
     ↓
  Phase 6 (Polish) → Release v10.0.0
```

**Must Complete Before Each Phase**:

- Phase 3: Phase 1 & 2 ✅
- Phase 4: Phase 3 ✅
- Phase 5: Phase 1 & 2 ✅ (independent)
- Phase 6: Phase 3–5 preferred

---

## Quality Gates (Applied Continuously)

| Gate                    | Target                    | Tool                 | Enforcement         |
| ----------------------- | ------------------------- | -------------------- | ------------------- |
| **Coverage**            | ≥70% lines, ≥60% branches | Jest                 | Fail CI             |
| **A11y**                | 0 serious+ violations     | Axe                  | Fail CI             |
| **Type Safety**         | 100% strict               | TypeScript           | Fail CI             |
| **Linting**             | 0 errors                  | ESLint               | Fail CI             |
| **SSR Content**         | ≥1 post row (JS off)      | Playwright           | Fail CI             |
| **p95 Latency**         | ≤150ms (/status)          | Probe script         | Fail CI             |
| **Contract Validation** | 100% pass                 | Spectral + Supertest | Fail CI             |
| **Token Parity**        | Drift detected            | Token script         | Warn (non-blocking) |

---

## Next Immediate Actions

1. **Now** (Start Phase 3):

   ```bash
   # Read execution guide
   cat PHASE_3_FOCUSED_EXECUTION.md

   # Create test files and implement T028–T030
   mkdir -p tests/contract tests/e2e
   # ... copy test code from guide
   ```

2. **By End of Day 1**:
   - All 3 Phase 3 tests passing (T028–T030)
   - Components sketched (T031–T032)

3. **By End of Day 3**:
   - All Phase 3 tasks complete (T028–T036)
   - SSR page working end-to-end
   - All acceptance criteria met

4. **Option**: Start Phase 4 (T037–T044) on Day 2 parallel with Phase 3 implementation

---

## Success Criteria (Full Release)

✅ All 78 Phase 1–6 tasks completed (or explicitly skipped)  
✅ Coverage ≥70% (lines), ≥60% (branches)  
✅ A11y violations = 0 (serious+)  
✅ `/status` p95 ≤150ms  
✅ SSR posts renders ≥1 real post (JS disabled)  
✅ SWR parity tests passing  
✅ All artifacts generated & linked in README  
✅ Release notes v10.0.0 with evidence  
✅ Git tag `v10.0.0` created  
✅ CI: GitHub Actions all green  
✅ Ready for merge to `main`

---

## File Structure Reference

```
frontend-next/
├── app/
│   ├── posts/
│   │   ├── page.tsx          # T033
│   │   ├── layout.tsx        # T035
│   │   └── page.test.tsx
│   └── status/
│       ├── route.ts          # T049
│       └── route.test.ts
├── components/
│   ├── PostsTable.tsx        # T031
│   ├── PostsStates.tsx       # T032
│   ├── PostsFilters.tsx      # T040
│   ├── LiveRegion.tsx        # T036
│   └── __tests__/
├── hooks/
│   └── usePosts.ts           # T041
└── lib/
    └── sortUtils.ts          # T043

tests/
├── contract/
│   ├── posts.contract.test.ts        # T028
│   ├── filterState.schema.test.ts    # T037
│   └── status.contract.test.ts       # T045
└── e2e/
    ├── posts.ssr-content.spec.ts     # T029
    ├── posts.failure.spec.ts         # T030
    ├── posts.url-sync.spec.ts        # T038
    └── status.trace.spec.ts          # T046

docs/week-10/
├── coverage/index.html       # T051 (generated)
├── a11y/index.html          # T051 (generated)
├── playwright/              # T051 (generated)
├── status-probe.json        # T051 (generated)
├── evidence-summary.md      # T060
└── performance.md           # T063
```

---

## Document Index

- **PHASE_3_FOCUSED_EXECUTION.md** ← START HERE (complete code + 5-day plan)
- PHASE_3_IMPLEMENTATION_PLAN.md (full 78-task breakdown)
- PHASE_3_TASK_TRACKER.md (status tracking)
- This file: PHASE_3_THRU_6_ROADMAP.md (high-level phases 4–6)

---

**Status**: ✅ Ready for Phase 3 execution  
**Next**: Begin Phase 3 tests (T028–T030) today
