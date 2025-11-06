# Tasks: Week 9 Frontend Foundations & Design System Seed

**Branch**: `feat/frontend-foundations` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

**Total Tasks**: 47 | **Timeline**: 5 days | **MVP Scope**: Design System Seed + User Story 1 (SSR)

---

## Phase 1: Setup & Initialization (Day 1)

- [ ] T001 Initialize project dependencies and verify builds
- [ ] T002 Create directory structure for Week 9 artifacts
- [ ] T003 Prepare spec PR and Linear issue (already done ✅)

---

## Phase 2: Design System Seed - Foundational

**Blockers**: Phase 1 complete | **Parallel**: T007-T017 after T004-T006

### Tokens (Blocking for all components)

- [ ] T004 Create `frontend-next/tailwind.config.ts` with token theme
- [ ] T005 Create `frontend-next/src/styles/tokens.css` with CSS variables
- [ ] T006 Import tokens.css in `frontend-next/src/app/layout.tsx`

### Button Component (Parallelizable)

- [ ] T007 [P] Implement Button component in `frontend-next/src/components/Button.tsx`
- [ ] T008 [P] Create Button unit tests in `frontend-next/tests/unit/Button.spec.ts`
- [ ] T009 [P] Create Button snapshot tests (18 combinations: 3 variants × 6 states)

### Input Component (Parallelizable)

- [ ] T010 [P] Implement Input component in `frontend-next/src/components/Input.tsx`
- [ ] T011 [P] Create Input unit tests in `frontend-next/tests/unit/Input.spec.ts`

### Card Component (Parallelizable)

- [ ] T012 [P] Implement Card component in `frontend-next/src/components/Card.tsx`
- [ ] T013 [P] Create Card unit tests in `frontend-next/tests/unit/Card.spec.ts`

### Composite Components (Parallelizable)

- [ ] T014 [P] Create LoadingState component in `frontend-next/src/components/LoadingState.tsx`
- [ ] T015 [P] Create EmptyState component in `frontend-next/src/components/EmptyState.tsx`
- [ ] T016 [P] Create ErrorState component in `frontend-next/src/components/ErrorState.tsx`
- [ ] T017 [P] Create PaginationControls component in `frontend-next/src/components/PaginationControls.tsx`

### Design System Validation

- [ ] T018 Run Playwright a11y smoke test on components in `frontend-next/tests/playwright/a11y-components.spec.ts`

---

## Phase 3: User Story 1 - View Posts with Server-Side Rendering (Day 3)

**Blockers**: Phase 2 complete | **Goal**: SSR server render time <2s (measured in CI, excluding network latency), posts in server HTML

### SSR Page Setup

- [ ] T019 [US1] Enhance `/posts` page to support combined sort parameter (`sort=date-desc|date-asc|title-asc|title-desc`) in `frontend-next/src/app/posts/page.tsx`
- [ ] T020 [US1] Update Zod schemas in `frontend-next/src/lib/schemas.ts` (PostListSchema, ErrorEnvelopeSchema), and assess if backward compatibility or migration is required for existing data
- [ ] T021 [US1] Enhance PostsPageClient in `frontend-next/src/components/PostsPageClient.tsx` using token colors and spacing from `frontend-next/src/styles/tokens.css` for consistent design system alignment

### SSR Testing

- [ ] T022 [US1] Create SSR snapshot test in `frontend-next/tests/integration/posts-ssr.spec.ts` (cover: empty posts, single post, multiple posts, error state, loading state, all sort/order param combinations)
- [ ] T023 [US1] Create Playwright E2E test for /posts initial load in `frontend-next/tests/playwright/core-flows.spec.ts` (assert: posts visible, correct sort order, no loading spinner)

---

## Phase 4: User Story 2 - Pagination & Sorting (Day 3)

**Blockers**: Phase 3 complete | **Goal**: URL params update, posts reorder, pagination works

### Pagination UI (Parallelizable)

- [ ] T024 [P] [US2] Create PaginationControls component in `frontend-next/src/components/PaginationControls.tsx`
- [ ] T025 [P] [US2] Create unit tests for PaginationControls in `frontend-next/tests/unit/PaginationControls.spec.ts`

### Pagination Integration

- [ ] T026 [US2] Wire pagination controls to PostsPageClient in `frontend-next/src/components/PostsPageClient.tsx`
- [ ] T027 [US2] Update SWR hook in `frontend-next/src/lib/swr.ts` to include pagination params in key
- [ ] T028 [US2] Verify route handler supports sort in `frontend-next/src/app/api/posts/route.ts`

### Pagination Testing

- [ ] T029 [US2] Create integration test in `frontend-next/tests/integration/posts-pagination.spec.ts`
- [ ] T030 [US2] Create Playwright E2E test for pagination in `frontend-next/tests/playwright/core-flows.spec.ts` (extend)

---

## Phase 5: User Story 3 - State Management (Day 4)

**Blockers**: Phase 2 + Phase 3 complete | **Goal**: Loading/Empty/Error states render with ARIA live

### State UI Integration

- [ ] T031 [US3] Wire LoadingState to PostsPageClient in `frontend-next/src/components/PostsPageClient.tsx`
- [ ] T032 [US3] Wire EmptyState to PostsPageClient in `frontend-next/src/components/PostsPageClient.tsx`
- [ ] T033 [US3] Wire ErrorState to PostsPageClient in `frontend-next/src/components/PostsPageClient.tsx`
- [ ] T034 [US3] Add aria-live regions for state announcements in `frontend-next/src/components/PostsPageClient.tsx`

### State Testing

- [ ] T035 [US3] Create unit tests for LoadingState/EmptyState/ErrorState in `frontend-next/tests/unit/`
- [ ] T036 [US3] Create integration test for state transitions in `frontend-next/tests/integration/posts-states.spec.ts`
- [ ] T037 [US3] Create Playwright E2E test for state UX in `frontend-next/tests/playwright/core-flows.spec.ts` (extend)

---

## Phase 6: Documentation & Design System Alignment (Day 4)

**Blockers**: Phase 2 complete | **Goal**: Figma page created, README updated

### Figma Documentation

- [ ] T038 Create Figma page "Week 9 Tokens & Primitives" with all 11 tokens documented
- [ ] T039 Export Figma token reference (PNG or PDF)
- [ ] T040 Document token parity checklist in `specs/009-frontend-foundations/token-parity.md`

### README Updates

- [ ] T041 Add Design System section to `frontend-next/README.md`
- [ ] T042 Update README with Live URLs and deployment info

---

## Phase 7: Quality Assurance & Release (Day 5)

**Blockers**: All previous phases complete | **Goal**: v9.0.0 released, Gate green

### Final Validation

- [ ] T043 Run comprehensive local validation (4-tier: Prettier, TypeScript, tests, act)
- [ ] T044 Verify coverage ≥80% for components and route handlers
- [ ] T045 Run Playwright a11y validation on all /posts flows in `frontend-next/tests/playwright/a11y-posts.spec.ts`
- [ ] T046 Validate Spectral OpenAPI lint on `api/openapi.json`: 0 errors

### Release & Documentation

- [ ] T047 Create v9.0.0 release with traceability (links to spec PR, Linear issue, Gate run, artifacts, Cloud Run demo)

---

## Task Dependencies

```
Phase 1 (Setup)
  ↓
Phase 2 (Design System Seed) - Foundational
  ├─ T004-T006 (Tokens) → blocking
  ├─ T007-T017 (Components) [P] ← can parallelize after tokens
  └─ T018 (Validation)
  ↓
Phase 3 (US1 - SSR Posts)
  ├─ T019-T021 (SSR Setup)
  └─ T022-T023 (Testing)
  ↓
Phase 4 (US2 - Pagination)
  ├─ T024-T025 (UI) [P]
  └─ T026-T030 (Integration)
  ↓
Phase 5 (US3 - State Management)
  ├─ T031-T034 (Wiring)
  └─ T035-T037 (Testing)
  ↓
Phase 6 (Documentation)
  ├─ T038-T040 (Figma)
  └─ T041-T042 (README)
  ↓
Phase 7 (QA & Release)
  ├─ T043-T046 (Validation)
  └─ T047 (Release)
```

---

## Recommended Day Breakdown

**Day 1** (Setup): T001-T003 (~30 min)

- Initialize dependencies, create directories

**Day 2** (Design System): T004-T018 (~4 hours)

- Implement tokens (T004-T006)
- Parallelize components: T007-T017 after tokens complete
- Run a11y validation (T018)

**Day 3** (SSR + Pagination): T019-T030 (~3 hours)

- SSR page enhancements (T019-T021)
- SSR testing (T022-T023)
- Pagination UI: T024-T025 can overlap with T019-T023
- Pagination integration (T026-T030)

**Day 4** (State Management + Docs): T031-T042 (~2.5 hours)

- State wiring (T031-T034) can overlap with Figma work (T038-T039)
- State testing (T035-T037)
- Figma documentation (T038-T040)
- README updates (T041-T042)

**Day 5** (QA & Release): T043-T047 (~1.5 hours + CI time)

- Local validation (T043)
- Coverage check (T044)
- A11y validation (T045)
- Spectral lint (T046)
- Release v9.0.0 (T047)

---

## Parallel Execution Opportunities

- **Phase 2**: All component tasks (T007-T017) can run in parallel after tokens (T004-T006) complete
- **Phase 4**: UI components (T024-T025) can start while Phase 3 testing runs
- **Phase 5**: State wiring (T031-T034) can overlap with Phase 6 documentation (T038-T039)

---

## MVP Scope (First 2 Days)

**Minimum Viable Product** (end of Day 2):

1. ✅ Design System Seed complete (Phase 2: T004-T018)
2. ✅ Token definitions and 3 primitives (Button, Input, Card)
3. ✅ Unit + integration tests ≥80% coverage
4. ✅ 0 critical a11y violations

**MVP Success**: Design system established, tokens used throughout, components tested

---

## Success Criteria Per Phase

| Phase | Success When                                                             |
| ----- | ------------------------------------------------------------------------ |
| 1     | Dependencies installed, directories created, spec PR merged              |
| 2     | 11 tokens defined, 3 components tested, ≥80% coverage, 0 a11y violations |
| 3     | SSR <2s, posts visible in server HTML, no loading spinner                |
| 4     | Pagination works, URL params update, posts reorder                       |
| 5     | Loading/Empty/Error render, ARIA live works, retry functional            |
| 6     | Figma page created, tokens documented, README updated                    |
| 7     | All 47 tasks complete, coverage ≥80%, Spectral 0 errors, v9.0.0 released |

---

## Resources

- **Spec**: [spec.md](spec.md) - User stories, requirements, acceptance criteria
- **Plan**: [plan.md](plan.md) - Architecture, component design, testing strategy
- **Data Model**: [data-model.md](data-model.md) - Entities, API contracts, schemas
- **Research**: [research.md](research.md) - Design decisions and alternatives
- **Quickstart**: [quickstart.md](quickstart.md) - Developer setup and examples
