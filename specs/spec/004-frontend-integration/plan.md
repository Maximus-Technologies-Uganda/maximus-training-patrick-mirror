
# Implementation Plan: Week-6: Frontend Consumes Posts API

**Branch**: `spec/004-frontend-integration` | **Date**: 2025-09-25 | **Spec**: C:\Users\LENOVO\Training\specs\spec\004-frontend-integration\spec.md
**Input**: Feature specification from `/specs/spec/004-frontend-integration/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path → OK
2. Fill Technical Context → below
3. Constitution Check → below
4. Phase 0: research.md → completed
5. Phase 1: data-model.md, contracts/, quickstart.md → completed
6. Re-check Constitution → PASS
7. Phase 2 planning approach described (no tasks.md created)
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands.

## Summary
Primary requirement: Build a Next.js App Router UI to list and create posts against the existing Posts API with URL-synced pagination and client-side search, meeting A11y and error UX standards. Technical approach: Client-side data fetching with SWR for responsive UI and static export deployment to GitHub Pages; forms post to API and mutate the cache to refresh page 1.

## Technical Context
**Language/Version**: TypeScript 5.x, React 18, Next.js 14 (App Router)  
**Primary Dependencies**: `swr` for data fetching/cache, `zod` for form validation, `next`/`react`/`react-dom`  
**Storage**: N/A (frontend only)  
**Testing**: Vitest/RTL for unit, Playwright for e2e (future)  
**Target Platform**: Static site hosted on GitHub Pages; API at `NEXT_PUBLIC_API_URL`  
**Project Type**: web (frontend + backend API)  
**Performance Goals**: Snappy navigation; first request latency bounded by API; client cache/mutate for instant UI updates  
**Constraints**: A11y (WCAG 2.1 AA), no SSR runtime on GH Pages, client-only search, URL sync of `page`/`pageSize`
**Scale/Scope**: Single route `/posts` with list/create and pagination

## Constitution Check
Complies with engineering constitution:
- Outcomes over output: Acceptance criteria tied to FR-001..FR-011 and scenarios.  
- Simplicity: Client fetch with SWR; no SSR infra.  
- Security/Privacy: No secrets in repo; uses `NEXT_PUBLIC_API_URL`; rely on CORS from API.  
- Reliability: Loading/error states, retry capability; idempotent POST guarded by UI; timeouts handled by fetch defaults.  
- Test-Driven Quality: Contract refs via `api/openapi.json` and `specs/002-posts-api/contracts/openapi.yml`.  
- Trunk-Based Dev: Short-lived branch `spec/004-frontend-integration`.  
- Observability: Console error logging (scope-limited).

Gate: PASS (no violations). Complexity Tracking not required.

## Fetch Strategy Decision (Server Component vs Client-side SWR)
Recommendation: Use Client-side SWR.  
Rationale: 
- FR-002/Acceptance 1 require visible loading and error states; SWR provides `isLoading`/`error` and cache.  
- FR-004 URL sync and FR-005 client-only search need immediate client interactivity and derived filtering on the current page; Server Components would still require client state for search and pagination controls.  
- Deployment constraint (FR-010, static export) precludes dynamic server fetching; client fetch works on GH Pages.  
- SWR `mutate` enables instant list refresh on create (Acceptance 4, FR-006).

## Deployment Decision (GitHub Pages static export vs Vercel SSR)
Decision: GitHub Pages (Static Export).  
Rationale:
- Matches spec’s Deployment Rationale and FR-010.  
- No SSR-only features required (auth, per-request SEO).  
- Simpler, cheaper, aligns with training goals; API is external and reachable via `NEXT_PUBLIC_API_URL`.  
Trade-offs: No server-rendered SEO; list is client-rendered. Acceptable for scope. Future migration path to Vercel SSR remains open if requirements change.

## Component & State Breakdown
Primary route: `/posts` (App Router).

Components:
- `PostsPage` (Server Component shell): reads `searchParams` (page, pageSize, q), renders `PostsPageClient`.
- `PostsPageClient` (Client Component): owns SWR key `{ page, pageSize }`, calls `GET /posts`.
- `PostsList`: renders loading/empty/error/success; truncates previews (~200 chars).
- `PaginationControls`: Prev/Next; disables per FR-003; updates URL query.
- `PageSizeSelect`: updates pageSize, resets to page=1.
- `SearchInput`: debounced (~300ms) client filter for current page items; updates `q` in URL.
- `NewPostForm`: validates (zod) and posts to `POST /posts`; on 201, clears form, focuses success alert, `mutate` list for page 1.
- `LiveRegion`: announces loading, errors, and success (`aria-live="polite"`).

State shape (per page):
```
queryState = { page: number, pageSize: number, q: string }
remoteState = { isLoading: boolean, isError: boolean, errorMessage?: string, data?: PostList }
derivedState = { filteredItems: Post[] } // computed from data.items and q
formState = { title: string, content: string, tags: string[], published: boolean }
formMetaState = { fieldErrors: Record<string,string>, formError?: string, isSubmitting: boolean, success?: string }
```

Accessibility:
- Labels via `htmlFor/id`; keyboard reachable controls; focus management on errors/success; live regions for announcements.

## Project Structure

### Documentation (this feature)
```
specs/spec/004-frontend-integration/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)
```
frontend-next/           # Next.js App Router app (new or migration target)
├── app/posts/page.tsx
├── components/
└── lib/

api/                     # Existing Posts API (already in repo)
```

**Structure Decision**: Web application (frontend + backend). New Next.js app under `frontend-next/` to avoid clashing with existing Vite sample.

## Phase 0: Outline & Research (Completed → research.md)
- Decision: Client-side SWR; Deployment: GH Pages static export.  
- Risks: API down; unknown totals; CORS.  
- Best practices: URL query sync via App Router, debounced client filter, SWR mutate on create.

## Phase 1: Design & Contracts (Completed)
- Entities extracted to `data-model.md`.  
- Contracts referenced in `contracts/README.md` (OpenAPI lives in repo).  
- Quickstart outlines environment and run steps.

## Phase 2: Task Planning Approach (Informational)
- Generate tasks from entities (models), endpoints (contracts), and user stories (integration tests).  
- TDD order; mark parallelizable items with [P].

## Complexity Tracking
N/A

## Progress Tracking
**Phase Status**:
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [x] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved (proceeding under override)
- [ ] Complexity deviations documented

---
Based on Constitution v1.0.0 - See `.specify/memory/constitution.md`
