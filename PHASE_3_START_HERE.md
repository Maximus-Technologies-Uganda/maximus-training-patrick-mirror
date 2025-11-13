# Phase 3 Implementation Ready – START HERE

**Branch**: `feat/phase3-implementation`  
**Status**: ✅ READY FOR DEVELOPMENT  
**Date**: 2025-11-13

---

## What's Been Done (Phase 1 & 2 Complete)

✅ **Phase 1 Setup** (T001–T008):

- Node 20.x LTS pinned
- pnpm 9.x via Corepack
- Artifact directories created (`docs/week-10/`)
- `.spectral.yaml` API contract linting config
- `frontend-next/design/tokens.json` design tokens
- Storybook with a11y addon

✅ **Phase 2 Foundational** (T009–T027, T064–T075):

- Server-only fetch utility (`fetchApi.ts`) with ID token & tracing
- Retry/backoff helper with full-jitter (≤800ms per-attempt, <3s total)
- Trace middleware (x-trace-id injection & logging)
- Canonical URL cache key builder (`urlKey.ts`) for SSR/SWR parity
- Zod schemas in `packages/contract` for query params & status
- 7 Design System primitives (Button, Input, Select, Badge, Table, FormFieldGroup, Toast)
- All foundational tests passing:
  - SSR parity tests
  - Logging shape assertions
  - A11y baseline (axe)
  - Zod validation
  - IAM/environment checks
  - Log sampling & redaction
  - Security headers
- CI infrastructure:
  - Jest coverage scoping
  - Spectral lint integration
  - Probe scripts for p95 latency
  - Token parity detection

---

## What You Need to Do (Phase 3: MVP)

### Phase 3: User Story 1 – Instant Secure Posts List (9 Tasks, 3–5 Days)

This is the **MVP**. Complete this phase to have a production-shaped SSR posts feature.

**Quick Overview**:

- Deliver secure SSR posts page with server-only ID token authentication
- Show graceful error & empty states with a11y announcements
- Integrate trace logging and live regions
- Pass all acceptance criteria without client token exposure

**Complete Implementation Code & Execution Plan**:
👉 **See `PHASE_3_FOCUSED_EXECUTION.md`** (full code examples + 5-day breakdown)

**9 Tasks to Complete**:

1. **T028**: Contract tests (validates query params)
2. **T029**: SSR content proof (≥1 row without JS)
3. **T030**: Failure messaging (accessible error handling)
4. **T031**: PostsTable component (renders post rows)
5. **T032**: PostsStates component (empty/error/loading states)
6. **T033**: SSR page (`/posts` page.tsx)
7. **T034**: Server-only token guard test
8. **T035**: Trace logging integration
9. **T036**: LiveRegion a11y component

**Start Point**:

```bash
# 1. Read the execution guide
cat PHASE_3_FOCUSED_EXECUTION.md

# 2. Create test files (Day 1)
mkdir -p tests/contract tests/e2e
# Copy T028, T029, T030 test code from guide

# 3. Run tests (expect failures – TDD)
pnpm run test:contract -- posts.contract.test.ts
pnpm run test:e2e -- posts

# 4. Implement components & page (Days 2–3)
# Copy T031–T036 code from guide

# 5. Run full validation
pnpm run test:types
pnpm run lint
pnpm run test:unit
pnpm run test:e2e
```

---

## After Phase 3 (Phase 4–6 – Optional for Now)

Once Phase 3 is complete, you can proceed to:

**Phase 4** (3–5 days): Search & filter functionality with URL sync

- Filter controls, SWR hook, sort utilities
- URL state synchronization & browser history

**Phase 5** (2–4 days): Health `/status` endpoint & evidence

- Health endpoint, trace correlation
- Artifact generation (coverage, a11y, E2E)
- p95 latency gate

**Phase 6** (2–3 days): Polish & hardening

- Storybook stories & a11y scanning
- Performance optimization
- Security review
- Release tag v10.0.0

**Timeline for Full Release**: 2–3 weeks (Phases 3–6)

---

## Key Resources

| Document                            | Purpose                                            |
| ----------------------------------- | -------------------------------------------------- |
| `PHASE_3_FOCUSED_EXECUTION.md`      | ⭐ **START HERE** – Complete code + execution plan |
| `PHASE_3_THRU_6_ROADMAP.md`         | High-level overview of Phases 3–6                  |
| `PHASE_3_IMPLEMENTATION_PLAN.md`    | Full 78-task breakdown with all details            |
| `PHASE_3_TASK_TRACKER.md`           | Status tracking for all tasks                      |
| `specs/001-frontend-ssr-hardening/` | Original spec documents                            |

---

## Quality Checklist (Phase 3)

Before committing Phase 3 work, verify:

- [ ] `pnpm run test:types` – 0 errors
- [ ] `pnpm run lint` – 0 errors
- [ ] `pnpm run test:unit` – All tests pass
- [ ] `pnpm run test:contract -- posts.contract.test.ts` – All pass
- [ ] `pnpm run test:e2e -- posts` – All pass
- [ ] Coverage ≥70% for new code
- [ ] No console warnings/errors
- [ ] Accessibility: role="status", aria-live, focus management
- [ ] No client token exposure (verify via import trace)
- [ ] Trace logging working (x-trace-id in logs)

---

## Success Criteria (Phase 3 Complete)

✅ SSR posts page renders ≥1 real post row without JS  
✅ Upstream failure shows accessible error (role="alert")  
✅ No client token exposure (server-only ID token)  
✅ Trace ID propagates end-to-end  
✅ All 9 Phase 3 tests passing  
✅ Type check & linting passing  
✅ Coverage ≥70%

Once these are met, you have a **production-ready MVP** for Week 10.

---

## Getting Started Right Now

1. **Read** `PHASE_3_FOCUSED_EXECUTION.md` (20 min)
2. **Create** test files (T028–T030) and copy code (30 min)
3. **Run** tests to confirm they fail (TDD approach) (5 min)
4. **Implement** components & page (Days 2–3)
5. **Validate** against checklist above (30 min)
6. **Commit** with clear message explaining what's done

---

## Terminal Commands Quick Reference

```bash
# Type check
pnpm run test:types

# Lint
pnpm run lint

# Unit tests
pnpm run test:unit -- PostsTable

# Contract tests
pnpm run test:contract -- posts.contract.test.ts

# E2E tests
pnpm run test:e2e -- posts

# Coverage report
pnpm run test:coverage

# Full CI suite (what GitHub Actions runs)
pnpm run test:ci
```

---

## Need Help?

- **Spec Questions**: See `specs/001-frontend-ssr-hardening/spec.md`
- **Code Examples**: `PHASE_3_FOCUSED_EXECUTION.md` has all implementations
- **Architecture**: `specs/001-frontend-ssr-hardening/plan.md`
- **Data Model**: `specs/001-frontend-ssr-hardening/data-model.md`
- **Contracts**: `specs/001-frontend-ssr-hardening/contracts/`

---

## Branch Info

**Current Branch**: `feat/phase3-implementation`  
**Created From**: `feat/phase2-foundational-infrastructure` (Phase 1 & 2 complete)  
**Ready for**: Phase 3 implementation (9 tasks, 3–5 days)  
**Will Merge To**: `main` after Phase 3–6 complete + CI passing

---

## Estimated Timeline

**Phase 3 (MVP) Only**: 3–5 days ← **Start here**

- Day 1: Tests (T028–T030)
- Day 2–3: Components & page (T031–T032)
- Day 4–5: Integration & validation (T033–T036)

**Phase 3–6 (Full Release)**: 2–3 weeks

- Phase 3: 3–5 days (US1 – MVP)
- Phase 4: 3–5 days (US2 – filters)
- Phase 5: 2–4 days (US3 – health)
- Phase 6: 2–3 days (Polish & release)

---

**Status**: ✅ Ready to Start  
**Next Action**: Read `PHASE_3_FOCUSED_EXECUTION.md` and begin Day 1 test implementation

Good luck! 🚀
