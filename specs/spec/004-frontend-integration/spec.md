# Feature Specification: Week-6: Frontend Consumes Posts API

**Feature Branch**: `spec/004-frontend-integration`  
**Created**: 2025-09-25  
**Status**: Draft  
**Input**: User description: "Act as a Product Manager creating a specification for the 'Week-6: Frontend Consumes Posts API' feature. The spec must be crisp, testable, and directly address the in-scope items from the project brief. Ensure it includes dedicated sections for: 1. User Stories: Cover viewing the post list, creating a new post, and seeing UI states (empty, loading, error). 2. Acceptance Criteria: Detail the functionality for the read-only list, create form, pagination (page/pageSize), and client-side search. 3. Error UX and A11y Notes: Describe how API errors will be displayed and mention requirements for labels, focus order, and live regions. 4. Next.js Constraints: State that the project must use the App Router and TypeScript. Explicitly call out that the deployment choice (GitHub Pages static export vs. Vercel SSR) and its rationale need to be captured. 5. Data/Contract: Reference the need for NEXT_PUBLIC_API_URL and state that the OpenAPI spec will be linked, not pasted. 6. Risks & Non-Goals: Mention the 'API down' risk and list 'Auth' and 'multi-user ownership' as out-of-scope."

## Execution Flow (main)
```
1. Capture user needs as testable requirements and user stories
2. Define acceptance scenarios for list, create, pagination, and search
3. Specify error handling and accessibility behaviors
4. State platform constraints (Next.js App Router + TypeScript) and deployment decision record
5. Reference data contract (OpenAPI) and environment configuration
6. Identify risks and non-goals
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ✅ Requirements must be testable and measurable
- ✅ Link to contracts rather than duplicating them
- ❌ Avoid low-level implementation details beyond explicit constraints requested

---

## User Scenarios & Testing (mandatory)

### Primary User Stories
- As a reader, I can view a paginated list of blog posts fetched from the Posts API so I can browse content.
- As a contributor, I can create a new post using a simple form so I can add content.
- As a user, I can clearly see UI states (empty, loading, error) so I always know what’s happening.

### Acceptance Scenarios
1. List: initial load
   - Given the user navigates to `/posts`
   - When the page loads
   - Then the app requests `GET /posts?page=1&pageSize=10` from `NEXT_PUBLIC_API_URL`
   - And shows a loading indicator until the response resolves
   - And then renders up to 10 posts with title and content preview
   - And shows pagination controls (Previous disabled on first page; Next enabled if `hasNextPage=true`).

2. Empty state (no posts)
   - Given the API returns an empty list (`items=[]`, `totalItems=0` or not provided)
   - When the list renders
   - Then show an "No posts yet" empty state with a prominent "Create Post" call-to-action.

3. Error state (list)
   - Given the API returns a network error or `4xx/5xx`
   - When the list fails to load
   - Then display an inline error message region with an accessible live announcement
   - And provide a "Try again" action that re-attempts the request.

4. Create a new post (happy path)
   - Given the user is on `/posts` and opens the "New Post" form
   - When they enter a valid `title` and `content` and submit
   - Then the app sends `POST /posts` with the form data
   - And on `201 Created`, the form clears, focus moves to a success alert, and the list refreshes to show the new post
   - And the list view remains on page 1 after creation.

5. Create validation (client + server)
   - Given the user submits with missing `title` or `content`
   - Then the form shows field-level errors referencing labels, preventing submit
   - And if the server responds `400` with an error message, that message is shown in a form error alert.

6. Pagination
   - Given the user is viewing page 1
   - When they click Next
   - Then the app requests `GET /posts?page=2&pageSize=10`
   - And updates the URL query to `?page=2&pageSize=10`
   - And focuses the list heading for screen reader context.

7. Page size change
   - Given the user selects a new page size (e.g., 25)
   - When applied
   - Then the app requests `GET /posts?page=1&pageSize=25`
   - And updates the URL accordingly.

8. Client-side search (filtering)
   - Given the list for the current page is loaded
   - When the user types a search term
   - Then the visible items on the current page are filtered by case-insensitive substring match across `title` and `content`
   - And the page resets to 1 for filtered results
   - And clearing the search restores the unfiltered view for the current page.

### Edge Cases
- Slow network: show loading state for up to 60s, then show error with retry.
- API down: show error, do not crash, allow retry without losing form input.
- Large content fields: truncate previews to a reasonable length (e.g., 200 chars) without cutting mid-word.
- Unknown totals: if `totalItems`/`totalPages` are not provided, hide the "X–Y of N" summary and rely on `hasNextPage`.

## Requirements (mandatory)

### Functional Requirements
- **FR-001 List posts**: The app MUST fetch posts from `GET /posts` using `page` and `pageSize` query params. Defaults: `page=1`, `pageSize=10`.
- **FR-002 UI states**: The list MUST display loading, empty, error, and success states; states are mutually exclusive and screen-reader announced.
- **FR-003 Pagination**: The app MUST provide Previous/Next controls; disable Previous on first page; disable Next when `hasNextPage=false`.
- **FR-004 URL sync**: The app MUST keep `page` and `pageSize` in the URL query and restore state on reload/direct link.
- **FR-005 Client-side search**: The app MUST filter only the currently loaded page’s items by `title` and `content` (case-insensitive, debounced ~300ms). No server query for search.
- **FR-006 Create post**: The app MUST submit `POST /posts` with `{ title, content, tags?, published? }`. On `201`, clear form, inform success, and refresh list (remain on page 1).
- **FR-007 Client validation**: Title and content are required; enforce basic min length (≥1) and show field-level errors before submit.
- **FR-008 Server errors**: On `400/4xx/5xx`, show inline error with server-provided message when available; preserve user input.
- **FR-009 Accessibility**: All interactive elements MUST be keyboard accessible; labels associated via `for`/`id`; logical focus order; errors and success use live regions.
- **FR-010 Next.js constraints**: The project MUST use Next.js App Router and TypeScript. The deployment choice (GitHub Pages static export vs. Vercel SSR) MUST be decided and the rationale captured within the spec/README.
- **FR-011 Data contract**: The frontend MUST read base URL from `NEXT_PUBLIC_API_URL`. The OpenAPI specification MUST be referenced by link (not pasted) from `api/openapi.json` and `specs/002-posts-api/contracts/openapi.yml`.
- **FR-012 Telemetry (optional)**: Log client errors to console for debugging; no external analytics in scope.

### Key Entities (include if feature involves data)
- **Post**: `id`, `title`, `content`, `tags[]?`, `published`, `createdAt`, `updatedAt`.
- **PostList**: `page`, `pageSize`, `hasNextPage`, `items[Post]`, and optionally `totalItems`, `totalPages`, `currentPage`.

---

## Review & Acceptance Checklist

### Content Quality
- [ ] Clear user value and business needs
- [ ] Requirements are concise and testable
- [ ] Sections present: User Stories, Acceptance Criteria, Error UX & A11y, Next.js Constraints, Data/Contract, Risks & Non-Goals

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities resolved within constraints provided
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---

## Error UX and A11y Notes
- Display errors inline near the source of failure and in a page-level alert region with `aria-live="polite"`.
- Move focus to the first error on submit failure; restore focus to the success alert on create.
- Ensure all inputs have programmatically associated labels and helpful descriptions; error text references the field label.
- Keyboard-only flows: Tab order follows visual order; pagination and form controls reachable and operable without a mouse.

## Next.js Constraints
- Use Next.js App Router and TypeScript for all UI code and types.
- Record deployment decision and rationale:
  - GitHub Pages (static export) vs. Vercel (SSR). Chosen option MUST be documented with reasoning (SEO, freshness, API origin, build/runtime constraints).
- Navigation path: `/posts` is the primary route. Query params: `page`, `pageSize`, `q` (client filter state) reflected in URL.

### Deployment Rationale
We have chosen GitHub Pages (Static Export). This is the simplest solution that satisfies the current scope because no server is required at this stage—there is no need for server-side rendering or features like user authentication that would necessitate a server runtime. The static site can call the Posts API via `NEXT_PUBLIC_API_URL`.

## Data/Contract
- Base URL MUST come from environment variable `NEXT_PUBLIC_API_URL` at build/runtime.
- API Endpoints used:
  - `GET /posts?page=<number>&pageSize=<number>` → returns `PostList`.
  - `POST /posts` with body `PostCreate` → returns `201` and `Post`.
- Contract references (linked, not pasted):
  - `api/openapi.json`
  - `specs/002-posts-api/contracts/openapi.yml`

## Risks & Non-Goals
- Risks
  - API down or network failures: user sees error state with retry; no app crash.
  - Inconsistent totals: UI degrades gracefully if `totalItems/totalPages` are missing.
- Non-Goals
  - Auth, roles/permissions, and multi-user ownership semantics are out of scope.
  - Editing and deleting posts are out of scope for Week-6.
  - Server-side search and filtering are out of scope; search is client-only.



