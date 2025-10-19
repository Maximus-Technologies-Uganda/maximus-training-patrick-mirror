# Tasks: Week 7.5 Finish‑to‑Green Punch List

Feature: specs/007-spec/week-7.5-finishers/plan.md
Branch: 007-spec/week-7.5-finishers
Date: 2025-10-17

## Phase 1: Setup (Shared Infrastructure)

- [frontend-next] T001 [P] Ensure `frontend-next/vitest.config.ts` emits coverage: `json-summary`, `lcov`, `html`; enable V8 coverage
- [frontend-next] T002 [P] Verify `coverage.include` targets `src/app/**` including server components and `api/**/route.ts`
- [ci] T003 [P] Add CI step to compute and print a distinct "Coverage Totals" block (statements, lines)
- [ci] T004 [P] Add CI artifact upload steps for a11y HTML (`a11y-frontend-next`) and contract (`contract-api`)
- [ci] T005 Add CI guard: fail if coverage totals are 0% (statements or lines)
- [ci] T006 Add CI guard: fail if required artifacts missing
- [docs][root] T007 Update root `README.md` section placeholders to a tokenized format pending live URLs

Checkpoint: CI baseline supports coverage and artifacts.

## Phase 2: Foundational (Prerequisites)

- [frontend-next] T008 Audit `frontend-next` routing for `src/app/posts/page.tsx` presence; create if missing
- [frontend-next] T009 Create `src/app/api/health/route.ts` (or use existing) as a simple route handler for coverage
- [frontend-next][docs] T010 Add environment access for `API_BASE_URL` server‑side; document in `quickstart.md`
- [frontend-next] T011 [P] Add minimal Post entity typings where used (title, summary, publishedDate)
- [docs] T012 [P] Prepare `docs/release-evidence/` note on artifact names and retrieval

Checkpoint: Ready to implement story‑specific work.

## Phase 3: User Story 1 (P1) — SSR First Paint for Posts

Goal: First visit to Posts renders content in initial HTML; no loading indicator before content.

Independent Test: Initial response HTML contains at least one post title; no "Loading" before content.

- [frontend-next] T013 Convert `frontend-next/src/app/posts/page.tsx` to async Server Component (SSR)
- [frontend-next] T014 Fetch posts on server via `API_BASE_URL` inside Server Component
- [frontend-next] T015 Pass `initialData` to `<PostsPageClient>` and remove/guard client‑side initial fetch
- [frontend-next] T016 Ensure client loader shows only during client‑side navigations
- [frontend-next] T017 Add unit test for server rendering of posts (HTML includes a post title)
- [frontend-next] T018 Add error/empty state handling for SSR‑friendly message and no spinner
- [docs] T019 Update `frontend-next/README.md` (or root `README.md`) to document SSR first‑paint behavior

Checkpoint: US1 passes acceptance scenarios.

## Phase 4: User Story 2 (P2) — Frontend‑Next Coverage Enablement

Goal: Non‑zero coverage with totals surfaced in Quality Gate.

Independent Test: CI summary includes Coverage Totals block; statements and lines > 0%.

- [frontend-next] T020 Ensure Vitest includes server components in coverage (`src/app/**`)
- [frontend-next] T021 Add unit test for `src/app/posts/page.tsx` rendering with provided data [P]
- [frontend-next] T022 Add unit test for one `src/app/api/**/route.ts` handler [P]
- [frontend-next] T023 Generate coverage locally; verify summaries and artifacts
- [ci] T024 CI: upload coverage artifacts; render totals block in summary
- [ci] T025 Enforce >0% threshold in CI (fail on zero totals)

Checkpoint: US2 coverage signal visible and >0%.

## Phase 5: User Story 3 (P2) — Review Packet Artifacts

Goal: Review Packet contains a browsable a11y HTML and linted API contract.

Independent Test: Artifacts downloadable from CI; a11y HTML opens, contract passes lint threshold.

- [frontend-next] T026 Integrate a11y scanning to produce HTML report; write to artifact path
- [api] T027 Lint API contract with Spectral; fail above threshold
- [ci] T028 Upload a11y report as `a11y-frontend-next` and contract as `contract-api`
- [docs] T029 Document retrieval in `docs/release-evidence` and `quickstart.md`

Checkpoint: US3 artifacts present and valid.

## Phase 6: User Story 4 (P2) — CI Deploy Trail & README URLs

Goal: Deploy job always runs on default‑branch push; summary includes links; README URLs are real.

Independent Test: Push to default branch triggers deploy; job summary shows pipeline and live URLs; README URLs resolve.

- [ci] T030 Review CI filters/conditions; ensure deploy job runs on default branch
- [ci] T031 Add job summary annotations for pipeline run link and live service URL
- [docs] T032 Replace README placeholders with actual Cloud Run URLs
- [ci] T033 Add CI guard to fail if README contains placeholder patterns
- [ci] T034 Add post‑deploy smoke check (curl live URL and print status)

Checkpoint: US4 deploy trail and documentation verified.

## Phase 7: User Story 5 (P3) — Final Release v7.0.x

Goal: Published release with direct evidence links.

Independent Test: Release page shows v7.0.x with links to Quality Gate, Review Packet, live demo, and spec.

- [root] T035 Create and push tag `v7.0.x` (next patch)
- [docs] T036 Publish GitHub release with links to evidence and spec
- [docs] T037 Verify links resolve; add to `RELEASE-NOTES.md` and `README.md`

Checkpoint: US5 release finalized.

## Phase 8: Polish & Cross‑Cutting

- [frontend-next] T038 [P] Add log/metric for first‑paint SSR path for debugging
- [docs] T039 [P] Add minimal runbook in `docs/release-evidence` for auditors
- [ci] T040 Tidy CI outputs and artifact retention settings

## Dependencies (Story Order)

- US1 (P1) → US2 (P2) can proceed in parallel after Setup/Foundational
- US3 (P2) independent of US1/US2 once CI scaffolding exists
- US4 (P2) independent; depends on CI scaffolding
- US5 (P3) depends on US1–US4 completion (evidence links)

## Parallelization Examples

- Within US2: T021 [P] and T022 [P] in parallel (different files)
- Setup Phase: T001–T004 [P] can run in parallel
- Polish Phase: T038–T040 [P] in parallel

## Implementation Strategy

- MVP: Complete US1 (SSR first‑paint) to unlock visible user value
- Iterate: Land US2–US4 to establish CI quality signal and deploy traceability
- Finalize: Publish US5 release with evidence links
