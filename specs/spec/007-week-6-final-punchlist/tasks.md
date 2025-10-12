# Tasks: Week 6 – Finish-to-Green Final Punch-List

**Input**: Design documents from `/specs/spec/007-week-6-final-punchlist/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested; no test tasks included beyond artifact generation and verification steps.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 [P] [ALL] Create feature docs folder scaffolds verified (already present): `specs/spec/007-week-6-final-punchlist/`
- [ ] T002 [P] [ALL] Add Spectral config: `specs/spec/007-week-6-final-punchlist/contracts/.spectral.yaml` (extends `spectral:oas`)
- [ ] T003 [P] [ALL] Add OpenAPI stub with posts and error schema: `specs/spec/007-week-6-final-punchlist/contracts/openapi.yaml`
- [ ] T004 [P] [ALL] Ensure CI Quality Gate script prints a titled coverage block "frontend-next Coverage" (update `frontend/scripts/coverage-gate.js` or repo `scripts/quality-gate/*` as applicable)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 [ALL] Verify environment configuration loader reads `API_BASE_URL` for SSR context (frontend-next config file or route handler env usage)
- [ ] T006 [P] [ALL] Add link-check job or script used by CI to validate README links (e.g., `scripts/link-check.js` and CI step)
- [ ] T007 [P] [ALL] Add CI step to upload HTML artifacts for coverage and Playwright into Review Packet assembly job
- [ ] T008 [ALL] Integrate Spectral lint step in CI workflow for OpenAPI at `specs/spec/007-week-6-final-punchlist/contracts/openapi.yaml` and fail on violations

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Reviewer sees posts on first paint (Priority: P1) 🎯 MVP

**Goal**: Initial HTML for `/posts` contains post items; no persistent "Loading..."

**Independent Test**: Inspect first HTML response for `/posts` and verify post items are present.

### Implementation for User Story 1

- [ ] T009 [US1] Wire SSR route handler to use `process.env.API_BASE_URL` (or equivalent) to fetch posts; ensure render proceeds on failure with empty-state
- [ ] T010 [P] [US1] Add empty-state SSR copy for zero items (no hang) in `frontend-next/src/app/posts/page.tsx` (or matching path)
- [ ] T011 [P] [US1] Ensure logging of SSR fetch errors without blocking render (server logs)
- [ ] T012 [US1] Document env requirement in `specs/spec/007-week-6-final-punchlist/quickstart.md` and `README.md`
- [ ] T013 [US1] Verify live Cloud Run service `maximus-training-frontend` has `API_BASE_URL` configured (Console step documented)

**Checkpoint**: US1 independently verifiable on live and local

---

## Phase 4: User Story 2 - New contributor follows an accurate README (Priority: P2)

**Goal**: README contains working URLs and an env table; onboarding < 10 minutes

**Independent Test**: Follow README "Run & Try" to run locally and click all URLs successfully.

### Implementation for User Story 2

- [ ] T014 [US2] Replace placeholder URLs with live Cloud Run URLs in `README.md`
- [ ] T015 [P] [US2] Add environment variable table (includes `API_BASE_URL`) to `README.md`
- [ ] T016 [US2] Expand "Run & Try" steps for local run and verification of `/posts` SSR
- [ ] T017 [P] [US2] Add README link-check to CI (reuse from T006)

**Checkpoint**: US2 independently verifiable via README

---

## Phase 5: User Story 3 - CI evidence is clear and discoverable (Priority: P3)

**Goal**: CI job summary shows labeled coverage; Review Packet includes HTML artifacts

**Independent Test**: Open CI summary; download and open artifacts from Review Packet

### Implementation for User Story 3

- [ ] T018 [US3] Add a clearly labeled "frontend-next Coverage" block to Quality Gate summary (update `scripts/quality-gate/*`)
- [ ] T019 [P] [US3] Ensure coverage HTML is generated and uploaded as `coverage-frontend-next`
- [ ] T020 [P] [US3] Ensure Playwright HTML report is generated and uploaded
- [ ] T021 [US3] Include both HTML artifacts in the Review Packet build

**Checkpoint**: US3 independently verifiable from CI UI and Packet

---

## Phase 6: User Story 4 - API contract is clean and usable (Priority: P3)

**Goal**: OpenAPI has operationId, description, tags, and 4xx error schemas for all operations; lint passes

**Independent Test**: Run Spectral lint; manual spot-check required fields on endpoints

### Implementation for User Story 4

- [ ] T022 [US4] Add/verify `operationId`, description, and tags for all operations in `specs/spec/007-week-6-final-punchlist/contracts/openapi.yaml`
- [ ] T023 [P] [US4] Define and reference 4xx error schemas consistently across operations
- [ ] T024 [US4] Integrate Spectral lint into CI (reuse T008) and ensure policy uses `spectral:oas`
- [ ] T025 [US4] Update documentation references from README to point to contract location

**Checkpoint**: US4 independently verifiable via lint and manual inspection

---

## Phase 7: User Story 5 - All-green workflows and a final release (Priority: P3)

**Goal**: All required CI jobs green; `v6.0.0` published with evidence links

**Independent Test**: Actions dashboard all-green; `v6.0.0` release notes link to spec, Quality Gate, Packet, and demo

### Implementation for User Story 5

- [ ] T026 [US5] Identify and disable/fix non-essential/noisy jobs on `main` workflows
- [ ] T027 [P] [US5] Trigger a full CI run and confirm required jobs green
- [ ] T028 [US5] Tag and publish `v6.0.0` release with evidence links
- [ ] T029 [P] [US5] Sanity-check link accessibility in release notes

**Checkpoint**: US5 independently verifiable from Actions and Releases

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T030 [P] [ALL] Documentation updates across `quickstart.md`, `README.md`, `spec.md`
- [ ] T031 [ALL] Code cleanup and refactors discovered during implementation
- [ ] T032 [P] [ALL] Performance/size tuning of CI artifacts if needed

---

## Checklist Validation Phase (Quality Gate)

**Purpose**: Validate requirements quality using the cross-check checklist before pushing/merging PRs

- [ ] T033 [ALL] Validate CHK001–CHK006 (Completeness) from `checklists/requirements-crosscheck.md`
- [ ] T034 [ALL] Validate CHK007–CHK012 (Clarity) from `checklists/requirements-crosscheck.md`
- [ ] T035 [ALL] Validate CHK013–CHK015 (Consistency) from `checklists/requirements-crosscheck.md`
- [ ] T036 [ALL] Validate CHK016–CHK019 (Measurability) from `checklists/requirements-crosscheck.md`
- [ ] T037 [ALL] Validate CHK020–CHK022 (Scenario Coverage) and CHK023–CHK025 (Edge Cases)
- [ ] T038 [ALL] Validate CHK026–CHK027 (Non-Functional) and CHK028–CHK031 (Dependencies/Ambiguities)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can proceed in parallel after Phase 2 (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2; independent of other stories
- **US2 (P2)**: Starts after Phase 2; independent, references README only
- **US3 (P3)**: Starts after Phase 2; independent, uses CI evidence pipeline
- **US4 (P3)**: Starts after Phase 2; independent, uses contracts
- **US5 (P3)**: Starts after Phase 2; independent, relies on CI status and release process

### Parallel Examples

- Within US1: T010 and T011 can run in parallel after T009
- Within US3: T019 and T020 can run in parallel; T018 first
- Across stories: US2, US3, US4 can proceed in parallel once Phase 2 completes

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (blocks all stories)
3. Complete Phase 3: User Story 1
4. Validate US1 independently; ship demo link

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Validate → Demo (MVP)
3. Add US2/US3/US4 in parallel → Validate
4. Finish with US5 (release + all-green CI)
