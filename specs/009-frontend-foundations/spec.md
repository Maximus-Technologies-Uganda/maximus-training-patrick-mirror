# Feature Specification: Week 9 Frontend Foundations & Design System Seed

**Feature Branch**: `feat/frontend-foundations`
**Created**: 2025-11-03
**Status**: Draft
**Week**: 9
**Input**: User description: "Week 9 Workbook – Frontend Foundations, Design System Seed & GCP Deploy (Spec‑Driven)"

---

## Overview

This week establishes core frontend fundamentals using Next.js App Router, creates a production-shaped design system seed (tokens + 3 base components), and ships a fully-tested UI slice consuming the existing Posts API to Google Cloud Run. All work follows spec-driven practices with complete traceability to Linear issues and auditable CI artifacts.

---

## User Scenarios & Testing

### User Story 1 - View Posts with Server-Side Rendering (Priority: P1)

Users visiting `/posts` see a contentful first paint with the complete post list rendered on the server, avoiding spinners and improving perceived performance and SEO.

**Why this priority**: Foundational UX—SSR first paint is the core outcome of the week. Enables all downstream UX (pagination, sorting, state management).

**Independent Test**: Can be fully tested by loading `/posts` and verifying posts exist in HTML source before JavaScript hydrates. Delivers immediate user value and indexes well in search engines.

**Acceptance Scenarios**:

1. **Given** the app loads `/posts` for the first time, **When** the page renders, **Then** users see at least one post in the initial HTML (before hydration)
2. **Given** the API returns a list of posts, **When** the server renders the page, **Then** post titles, authors, and creation dates are visible
3. **Given** the page has hydrated, **When** the user inspects the page, **Then** the rendered list matches what was in the server HTML (no flicker or duplicate content)

---

### User Story 2 - Navigate Posts with Pagination & Sorting (Priority: P2)

Users can navigate through large post lists by moving between pages and optionally sort posts by creation date or title, all reflected in the URL for shareability and bookmark-ability.

**Why this priority**: Core interactivity that complements SSR delivery. Demonstrates Next.js route handlers and URL-param driven state.

**Independent Test**: Can be fully tested by clicking pagination controls and verifying URL updates, new posts load, and sort order changes. Delivers independent value to users managing large lists.

**Acceptance Scenarios**:

1. **Given** a list with 20 posts and pageSize=10, **When** the user clicks "Next," **Then** posts 11–20 display and URL updates to `?page=2`
2. **Given** the user is on page 2, **When** they click "Previous," **Then** the original posts 1–10 display and URL reflects `?page=1`
3. **Given** posts are displayed, **When** the user selects a sort order (e.g., "newest first"), **Then** posts reorder and the URL includes `?sort=date-desc`
4. **Given** a user shares a paginated/sorted URL, **When** another user opens it, **Then** they see the same posts in the same order without needing to navigate

---

### User Story 3 - Handle Empty, Error, and Loading States (Priority: P2)

Users see clear, styled feedback when no posts exist, when an error occurs, or while data is fetching, preventing confusion and guiding them toward recovery actions.

**Why this priority**: Completes the UX contract for all outcome paths. Critical for accessibility (aria-live) and user confidence.

**Independent Test**: Can be tested by simulating empty API responses, network errors, and slow loads. Each state renders a distinct, visually styled message with appropriate controls.

**Acceptance Scenarios**:

1. **Given** the API returns an empty list, **When** the page renders, **Then** a styled "No posts yet" message displays with a call-to-action (e.g., "Create your first post")
2. **Given** the API returns a 500 error, **When** the page renders, **Then** an error card appears with a "Retry" button and clear messaging
3. **Given** data is loading, **When** the user navigates to the page, **Then** a loading state (skeleton or spinner) displays with aria-live announcements
4. **Given** an error state has been shown, **When** the user clicks "Retry," **Then** the request is re-attempted and the result (success/error) updates the page

---

### User Story 4 - Style UI with Design System Tokens (Priority: P3)

Developers and designers use a unified set of color, spacing, and typography tokens defined in code and mirrored in Figma, ensuring visual consistency across all components and future extensibility.

**Why this priority**: Establishes scalable design practices. P3 because tokens are internal infrastructure that enables future weeks but users don't directly interact with them this week.

**Independent Test**: Can be tested by verifying Button, Input, and Card components use token values for colors, spacing, and font sizes; extracting token definitions from code and comparing with Figma file.

**Acceptance Scenarios**:

1. **Given** a Button component is rendered, **When** inspected, **Then** its background color matches `--color-primary` token value
2. **Given** the design system tokens are defined, **When** all Button/Input/Card instances render, **Then** no hardcoded color or spacing values appear in component styles
3. **Given** the Figma file is opened, **When** the Week 9 Tokens & Primitives page is reviewed, **Then** documented tokens match code definitions (colors, spacing scale, radius)

---

### Edge Cases

- What happens when the API is slow (>5s)? Show a skeleton loader with aria-live announcement and allow the user to navigate away without blocking.
- How does the system handle an API returning 401 (unauthorized) or 403 (forbidden)? Show an error state and redirect to login flow (placeholder for now).
- What if the browser has JavaScript disabled? The post list should still be visible from SSR; controls requiring JS (pagination buttons) degrade gracefully.
- What if a user has a very old device or slow network? SSR ensures they see content quickly; CSS is minimal and tokens ensure predictable rendering.

---

## Requirements

### Functional Requirements

#### Frontend Fundamentals (SSR & Data Flow)

- **FR-001**: The `/posts` route MUST use Next.js App Router Server Components to fetch posts from the API at `API_BASE_URL/posts` and render the list on the server
- **FR-002**: The page MUST hydrate with SWR (or equivalent) to enable client-side interactions (pagination, sorting) without full page reloads
- **FR-003**: Route handlers at `/api/posts/*` MUST proxy mutating requests (POST, PUT, DELETE) to the backend API and map errors to a standard UI error envelope
- **FR-004**: The `/posts` page MUST support URL parameters for pagination (`?page=N`) and sorting (`?sort=date-asc|date-desc|title`) with defaults (page=1, sort=date-desc)
- **FR-005**: Each request MUST include visible pagination controls with "Previous," "Next," and current page indicator (e.g., "Page 2 of 5")
- **FR-006**: Page load time to first contentful paint MUST not exceed 2 seconds on a 4G network (SSR ensures content before JS)

#### Design System Seed

- **FR-007**: A tokens file MUST define at least the following tokens: `--color-primary`, `--color-surface`, `--color-text`, `--color-text-muted`, `--space-1`, `--space-2`, `--space-3`, `--space-4`, `--radius-sm`, `--radius-md`, `--radius-lg`
- **FR-008**: A Button component MUST support variants: `primary`, `secondary`, `ghost` and states: `default`, `hover`, `focus`, `active`, `disabled`, `loading`
- **FR-009**: An Input component MUST support: `label` prop, `description` prop, `error` prop with distinct styling, `aria-describedby` linking to help/error text
- **FR-010**: A Card component MUST support structure: `header`, `body`, `footer` sections with optional subcomponents and proper spacing via tokens
- **FR-011**: All components MUST use token values for colors, spacing, and border radius; no hardcoded hex/px values in component styles
- **FR-012**: Components MUST be keyboard-accessible: focusable controls have visible focus styles (via tokens), Tab order is logical

#### Accessibility & Testing

- **FR-013**: All form controls MUST have associated labels via `<label>` elements or `aria-label`; input errors MUST use `aria-describedby` to link to error text
- **FR-014**: The page MUST use `aria-live="polite"` regions to announce async state changes (loading, success, error) to screen reader users
- **FR-015**: Empty, error, and loading states MUST be explicitly rendered as distinct UI sections (not inline text) with role="status" or role="alert" as appropriate
- **FR-016**: All component and route handler code MUST have unit/integration test coverage ≥80% (Vitest for frontend, Jest for route handlers)
- **FR-017**: SSR behavior MUST be validated via snapshot tests asserting expected HTML structure (e.g., post rows exist server-side)
- **FR-018**: Playwright a11y tests MUST scan the `/posts` page and report 0 critical violations (uses axe-core); HTML report MUST be uploaded as CI artifact

#### Contracts & CI Evidence

- **FR-019**: OpenAPI Spectral validation MUST return 0 errors when linting `api/openapi.json`
- **FR-020**: Contract tests MUST validate route handler request/response shapes match API schema; breaking changes MUST fail the test
- **FR-021**: Frontend and API coverage totals MUST be printed in the CI job summary (e.g., "FE Coverage: 84%, API Coverage: 91%")
- **FR-022**: The review packet MUST contain: coverage JSON bundles, a11y HTML report, contract validation results, Spectral summary, deployment screenshots

#### GCP Deployment

- **FR-023**: The app MUST build and deploy via Cloud Build → Cloud Run with Workload Identity Federation (WIF) authentication
- **FR-024**: Secrets (e.g., API_BASE_URL) MUST be injected via Google Cloud Secret Manager; no hardcoded values in code or Docker images
- **FR-025**: The deployment summary MUST link to Cloud Build logs, Cloud Run service URL, and commit SHA for full traceability
- **FR-026**: Post-deployment smoke tests MUST verify the frontend loads and the `/posts` page renders (basic health check)

#### Figma Touchpoint

- **FR-027**: A Figma page titled "Week 9 Tokens & Primitives" MUST document all tokens (colors, spacing, radius) and Button/Input/Card variants with visual examples
- **FR-028**: The README MUST include a "Design System" section linking to the Figma page and noting that Week 10 will expand to a full component library
- **FR-029**: Figma tokens MUST match code tokens (visual and nomenclature); exported token reference file MUST be available for future week's parity checks

### Key Entities

- **Post**: Represents a single blog post with `id`, `title`, `author`, `content`, `createdAt`, `updatedAt`
- **Token**: Design system primitive defining a visual property (color, spacing, radius, font) shared between code and Figma
- **Component** (Button, Input, Card): Reusable UI primitives built from tokens with variants and states
- **Route Handler**: Server-side proxy endpoint mapping frontend requests to backend API calls with error normalization
- **Deployment Artifact**: Cloud Build job, Cloud Run service, and associated logs/screenshots providing deployment evidence

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: SSR first contentful paint ≤2 seconds on 4G network (verified by Lighthouse or Cloud Run performance metrics)
- **SC-002**: Users can navigate to page 2 of posts and return to page 1 using pagination controls without page reload (verified by Playwright)
- **SC-003**: Empty, error, and loading states are visually distinct and exist in 3 separate UI regions (verified by component snapshots and Playwright)
- **SC-004**: All Button, Input, Card components render using token values for colors and spacing with 0 hardcoded color/px values (verified by code review + token integration tests)
- **SC-005**: Frontend test coverage ≥80% (unit + integration) and API route handler coverage ≥80% (verified by Jest/Vitest coverage reports)
- **SC-006**: Playwright a11y report shows 0 critical violations on `/posts` page; all form inputs have labels (verified by axe-core scan HTML report)
- **SC-007**: OpenAPI Spectral validation returns 0 errors on `api/openapi.json` (verified by CI gate)
- **SC-008**: Figma file contains Week 9 Tokens & Primitives page with token definitions and Button/Input/Card variants matching code (verified by design review)
- **SC-009**: Cloud Build deploy job completes successfully with WIF auth; Cloud Run service responds to requests within 1 second (verified by deploy logs and smoke tests)
- **SC-010**: Review packet contains coverage JSON, a11y HTML report, contract results, Spectral output, and deployment links (verified by artifact upload to CI)
- **SC-011**: All design system files (tokens, components) are tagged `v9.0.0` with release notes linking to spec PR, Linear issue, Gate run, Packet, and Cloud Run demo

---

## Assumptions

1. **Design System Framework**: Tokens will be implemented using CSS variables or Tailwind config (choice will be finalized during planning); either approach is acceptable as long as tokens are defined once and reused consistently.

2. **API Contract**: The backend `/posts` endpoint already exists and returns paginated results; pagination will use standard `page` and `pageSize` URL parameters (or `limit` and `offset` if already defined in API spec).

3. **Authentication**: Week 9 includes a placeholder for auth (login page exists but not fully integrated); route handlers will pass through requests without auth checks. Full OAuth/IAM integration is deferred to future weeks.

4. **Figma Access**: All developers and designers have read/write access to the team Figma workspace; a shared file named "Training — Design System" or similar exists for token documentation.

5. **Performance Baseline**: Existing API is assumed to respond in <500ms on average; if slower, SSR skeleton loaders and SWR revalidation will still provide acceptable UX.

6. **Testing Environment**: Vitest/Jest are configured and passing for existing tests; Playwright infrastructure is in place. No major tooling changes needed.

7. **Deployment**: Cloud Build and Cloud Run are already configured in this project (GCP setup from prior weeks); Week 9 only requires ensuring secrets and WIF auth are applied.

---

## Out of Scope (Explicitly Deferred)

- Full OAuth2 provider integration or multi-factor authentication
- Complex charting or data visualization components
- Dark mode theme system (noted for Week 10)
- Internationalization (i18n) / multi-language support
- Advanced form validation or field grouping components (Form Field groups deferred to Week 10)
- Server-side search or filtering (pagination/sorting via URL params only)
- Real-time data updates or WebSocket integration

---

## Constraints & Dependencies

- **Dependency**: Existing API (Posts endpoint) must be available and stable during development
- **Dependency**: Figma file must be shared and accessible to the team
- **Constraint**: All code must pass existing CI/CD pipeline (lint, typecheck, tests, coverage thresholds)
- **Constraint**: No breaking changes to API contract; if needed, open a spec-update PR first
- **Constraint**: SSR must not add >500ms latency to page load (API fetch + rendering)
- **Dependency**: Google Cloud Secret Manager must be configured for production environment variables

---

## Deliverables by Day

| Day | Primary Deliverable                                                                            | Status  |
| --- | ---------------------------------------------------------------------------------------------- | ------- |
| 1   | [SPEC] PR merged; Linear issue linked; spec artifacts in `specs/009-frontend-foundations/`     | Pending |
| 2   | Green PR with Button, Input, Card components; tests and a11y checks passing; coverage surfaced | Pending |
| 3   | Green PR with SSR `/posts` page; route handlers; pagination; state UX; Playwright a11y HTML    | Pending |
| 4   | README updated with Design System section and Figma link; Figma page created                   | Pending |
| 5   | v9.0.0 release; Review Packet with all artifacts; Gate green; journal retro                    | Pending |

---

## Next Steps

1. **Validate & Clarify** (if needed): Run `/speckit.clarify` to identify any ambiguous requirements and lock in final decisions
2. **Create Plan**: Run `/speckit.plan` to generate detailed implementation design (architecture, file structure, testing strategy)
3. **Generate Tasks**: Run `/speckit.tasks` to produce actionable, dependency-ordered task list for development
4. **Execute**: Follow tasks.md through the 5-day sprint, updating spec as needed for behavior changes (via spec-update PRs)
