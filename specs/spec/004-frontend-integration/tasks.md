---
description: Generate an actionable, dependency-ordered tasks.md for the feature based on available design artifacts.
---

# Tasks: Week-6: Frontend Consumes Posts API

**Input**: Plan, research, data model, contracts, and quickstart from `C:\Users\LENOVO\Training\specs\spec\004-frontend-integration\`

**Feature Directory**: `C:\Users\LENOVO\Training\specs\spec\004-frontend-integration`

**Frontend App Root (per plan.md)**: `C:\Users\LENOVO\Training\frontend-next\`

## Execution Flow (main)
```
1. Setup project with Next.js App Router and TypeScript
2. Write tests first (contract + integration/a11y)
3. Implement models/types, utilities, and SWR data layer
4. Implement UI components and pages (read-only list with SWR)
5. Implement create form with success/error logic and SWR mutate
6. Polish and docs; prepare static export for GH Pages
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact absolute file paths in descriptions

## Phase 3.1: Setup
- [ ] T001 Initialize Next.js App Router TS project in `C:\Users\LENOVO\Training\frontend-next` (npx create-next-app@latest with App Router, TypeScript, ESLint) and add deps: `swr`, `zod`. Configure `package.json` scripts for `build`, `dev`, `lint`, `test`.
- [ ] T002 [P] Create `.env.example` in `C:\Users\LENOVO\Training\frontend-next\.env.example` with `NEXT_PUBLIC_API_URL=http://localhost:3000` and brief notes; add `.env.local` to `.gitignore`.
- [ ] T003 [P] Configure ESLint/Prettier for Next.js TS in `C:\Users\LENOVO\Training\frontend-next\` and ensure CI-friendly `npm run lint`.
- [ ] T004 [P] Add Vitest + React Testing Library setup in `C:\Users\LENOVO\Training\frontend-next\vitest.config.ts` and `src/test/setup.ts`; add `jsdom` environment.
- [ ] T005 [P] Add Playwright config in `C:\Users\LENOVO\Training\frontend-next\playwright.config.ts` with a11y axe check helper (smoke-level for `/posts`).

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
Reference contracts: `C:\Users\LENOVO\Training\api\openapi.json`, `C:\Users\LENOVO\Training\specs\002-posts-api\contracts\openapi.yml`

- [ ] T006 [P] Contract test for `GET /posts` shape using MSW in `C:\Users\LENOVO\Training\frontend-next\src\tests\contracts\posts.get.contract.test.ts` validating `PostList` schema fields and pagination params.
- [ ] T007 [P] Contract test for `POST /posts` shape using MSW in `C:\Users\LENOVO\Training\frontend-next\src\tests\contracts\posts.post.contract.test.ts` validating `201` with `Post` and `Location` header surfaced via fetch/mutate.
- [ ] T008 [P] Integration test: list initial load, loading → success/empty/error states in `C:\Users\LENOVO\Training\frontend-next\src\tests\integration\posts.list.int.test.ts` per spec scenarios 1–3.
- [ ] T009 [P] Integration test: pagination and URL sync (`page`, `pageSize`) in `C:\Users\LENOVO\Training\frontend-next\src\tests\integration\posts.pagination.int.test.ts` per scenarios 6–7.
- [ ] T010 [P] Integration test: client-side search filter on current page in `C:\Users\LENOVO\Training\frontend-next\src\tests\integration\posts.search.int.test.ts` per scenario 8.
- [ ] T011 [P] Integration test: create happy path + cache mutate and focus to success alert in `C:\Users\LENOVO\Training\frontend-next\src\tests\integration\posts.create.int.test.ts` per scenarios 4–5.
- [ ] T012 [P] A11y tests: axe checks for `/posts` page states (loading, empty, error, success) in `C:\Users\LENOVO\Training\frontend-next\src\tests\a11y\posts.a11y.test.ts` ensuring labels, roles, focus management, and live regions.

## Phase 3.3: Core Types and Data Layer (ONLY after tests are failing)
- [ ] T013 [P] Define types with zod for `Post`, `PostList`, `PostCreate` in `C:\Users\LENOVO\Training\frontend-next\src\lib\schemas.ts` and export TypeScript types.
- [ ] T014 [P] Implement API util `getBaseUrl()` reading `NEXT_PUBLIC_API_URL` with validation in `C:\Users\LENOVO\Training\frontend-next\src\lib\config.ts`.
- [ ] T015 [P] Implement SWR fetcher and keys in `C:\Users\LENOVO\Training\frontend-next\src\lib\swr.ts` (`usePostsList({page,pageSize})`, `mutatePostsPage1`).

## Phase 3.4: UI Components and Pages (Read-only list with SWR)
- [ ] T016 Create App Router route file `C:\Users\LENOVO\Training\frontend-next\app\posts\page.tsx` (server shell) that reads `searchParams` and renders client component with props.
- [ ] T017 [P] Create client component `C:\Users\LENOVO\Training\frontend-next\components\PostsPageClient.tsx` using SWR read-only list with loading/empty/error/success and live region announcements.
- [ ] T018 [P] Create `C:\Users\LENOVO\Training\frontend-next\components\PostsList.tsx` that renders list items with truncated content (~200 chars) and accessible structure.
- [ ] T019 [P] Create `C:\Users\LENOVO\Training\frontend-next\components\PaginationControls.tsx` wiring URL updates and disabling per `hasNextPage` and page=1.
- [ ] T020 [P] Create `C:\Users\LENOVO\Training\frontend-next\components\PageSizeSelect.tsx` that updates pageSize and resets to page=1 with URL sync.
- [ ] T021 [P] Create `C:\Users\LENOVO\Training\frontend-next\components\SearchInput.tsx` with debounced (~300ms) filter and URL `q` sync.
- [ ] T022 [P] Create `C:\Users\LENOVO\Training\frontend-next\components\LiveRegion.tsx` to announce loading/errors/success.

## Phase 3.5: Create Form and SWR mutate
- [ ] T023 Implement `C:\Users\LENOVO\Training\frontend-next\components\NewPostForm.tsx` with zod client validation (title/content required), POST to API, on 201 clear form, focus success alert, and `mutate` list for page 1; handle 400+ errors with inline alert preserving input.
- [ ] T024 Wire `NewPostForm` into `/posts` page, ensure success path keeps page on 1 and triggers list refresh.

## Phase 3.6: Polish, Static Export, and Docs
- [ ] T025 [P] Add README section in `C:\Users\LENOVO\Training\frontend-next\README.md` documenting deployment decision (GH Pages), env var, and run scripts; link contracts.
- [ ] T026 [P] Configure Next static export: add `next.config.mjs` with `output: 'export'`; add `npm run export` in `C:\Users\LENOVO\Training\frontend-next\package.json`.
- [ ] T027 [P] Add minimal 404 and root redirect to `/posts` if needed in `C:\Users\LENOVO\Training\frontend-next\app\page.tsx`.
- [ ] T028 Run and fix lint: `npm run lint` in `C:\Users\LENOVO\Training\frontend-next` and address issues.
- [ ] T029 Run unit/integration tests and ensure a11y checks pass locally: `npm test`.
- [ ] T030 Build and export static site: `npm run build && npm run export`.

## Dependencies
- Setup (T001–T005) before Tests (T006–T012).
- Tests (T006–T012) before Core/Components (T013–T022).
- Types/util/SWR (T013–T015) before UI components consuming them (T016–T021).
- List UI (T016–T022) before Create form wiring (T023–T024).
- All implementation before Polish/Export (T025–T030).

## Parallel Execution Guidance
Tasks that can be parallelized are marked [P]. Examples of safe parallel batches:

```
# Batch A (after T001):
T002 [P], T003 [P], T004 [P], T005 [P]

# Batch B (tests-first):
T006 [P], T007 [P], T008 [P], T009 [P], T010 [P], T011 [P], T012 [P]

# Batch C (core types & utilities):
T013 [P], T014 [P], T015 [P]

# Batch D (UI controls):
T018 [P], T019 [P], T020 [P], T021 [P], T022 [P]
```

## Task Agent Commands (examples)
```
# Initialize project
cd C:\Users\LENOVO\Training\frontend-next && npx create-next-app@latest --ts --eslint --app --src-dir --no-tailwind --no-import-alias .

# Install libs
cd C:\Users\LENOVO\Training\frontend-next && npm i swr zod && npm i -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw @playwright/test axe-core @axe-core/playwright

# Run tests
cd C:\Users\LENOVO\Training\frontend-next && npm test

# Lint
cd C:\Users\LENOVO\Training\frontend-next && npm run lint

# Build/export
cd C:\Users\LENOVO\Training\frontend-next && npm run build && npm run export
```

## Validation Checklist
- [ ] All contract files have corresponding tests (GET/POST covered)
- [ ] All entities have model/type definitions
- [ ] Tests come before implementation steps
- [ ] Parallel tasks do not touch the same files
- [ ] Each task includes an absolute path
- [ ] A11y requirements (labels, focus, live regions) covered by tests


