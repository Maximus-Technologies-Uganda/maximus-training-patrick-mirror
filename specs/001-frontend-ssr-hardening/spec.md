# Feature Specification: Frontend Foundations Week 10 – SSR & Hardening

**Feature Branch**: `001-frontend-ssr-hardening`  
**Created**: 2025-11-11  
**Status**: Draft  
**Input**: Week 10 Workbook — Frontend Foundations++, SSR & GCP Hardening (secure contentful server rendering, design system v1, search & filter UX, health observability, evidence & release gates)

## User Scenarios & Testing _(mandatory)_

### User Story 1 – Reader sees instant, secure posts list (Priority: P1)

An anonymous reader (no prior session) visits the Posts page and immediately sees a contentful list of recent posts without waiting for client-side loading spinners.

**Why this priority**: Core consumption flow; proves secure server rendering and token-based upstream access are working and delivers perceived performance & trust.

**Independent Test**: Disable client scripting and load `/posts`; verify table rows are present and represent real posts data; simulate upstream failure to confirm graceful status messaging.

**Acceptance Scenarios**:

1. **Given** the reader loads `/posts` with no query params, **When** the page renders, **Then** the initial HTML contains ≥1 post row and no loading placeholder.
2. **Given** the reader loads `/posts` with JavaScript disabled, **When** the response is received, **Then** the rendered HTML contains post data (title & created date visible).
3. **Given** the upstream posts source is temporarily unavailable, **When** the reader loads `/posts`, **Then** a clear, accessible error status message is announced (role="status") and retry guidance is visible.

---

### User Story 2 – User refines posts with search & filters (Priority: P2)

The reader can refine the list by text query, author filter, and sort order; the URL reflects state so pages are shareable and server rendering honors parameters.

**Why this priority**: Enables focused content discovery and validates contract-driven query parsing & accessibility of dynamic states.

**Independent Test**: Directly navigate to `/posts?q=design&author=alice&sort=old`; confirm filtered results server-render correctly; change filters client-side and observe URL + state synchronization and live region announcements.

**Acceptance Scenarios**:

1. **Given** a user enters a query and author then submits, **When** the page updates, **Then** the URL includes `q` and `author` parameters and results reflect filters.
2. **Given** a user changes sort from default to `old`, **When** filters apply, **Then** results reorder and URL includes `sort=old`.
3. **Given** no results match provided criteria, **When** the page renders, **Then** an accessible empty-state message is announced (role="status") and focusable retry guidance is present.

---

### User Story 3 – Stakeholder validates health & evidence (Priority: P3)

Mentor/reviewer can visit a public status endpoint and repository evidence artifacts to confirm health, coverage, accessibility, and release readiness without internal API exposure.

**Why this priority**: Provides transparency & governance; ensures quality gates are met and observable externally.

**Independent Test**: Load `/status` and verify JSON includes `ok` plus upstream indicators; open docs/week-10 artifacts (coverage, a11y, Playwright) and confirm linked in README & release notes.

**Acceptance Scenarios**:

1. **Given** the reviewer visits `/status`, **When** upstream is healthy, **Then** response body shows `ok: true` and a latency or timestamp field.
2. **Given** coverage & accessibility reports are generated, **When** reviewer opens README links, **Then** artifacts display metrics meeting thresholds (≥70% lines, 0 serious+ a11y).
3. **Given** release tag v10.0.0 exists, **When** reviewer inspects notes, **Then** links to spec, CI run, artifacts, and live URLs are present.

### Edge Cases

- Empty data set (0 posts) → Show accessible empty state; no blank table.
- Invalid query param values (unsupported sort or malformed author) → Reject with user-friendly error state; do not render partial/inconsistent results.
- Upstream timeout or auth token failure → Show retryable error message; no raw stack traces.
- Rapid filter changes (race conditions) → Final applied state matches last user action; stale results not announced.
- Large result set pagination boundary (last page) → Disables next navigation while preserving filters.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST server-render the Posts list with real data (no loading placeholder) for initial requests.
- **FR-002**: System MUST securely request upstream posts using `google-auth-library` ID token client on the server only; the token mechanism MUST NOT be exposed client-side; no public unauthenticated posts API.
- **FR-003**: System MUST provide a public status endpoint returning overall health and upstream health indicators without exposing privileged data.
- **FR-004**: System MUST support query parameters `q`, `author`, and `sort` with validation and reject invalid combinations gracefully.
- **FR-005**: System MUST announce loading, empty, and error states via accessible status regions.
- **FR-006**: System MUST synchronize filter state with the URL so direct navigation reproduces server-rendered filtered results.
- **FR-007**: System MUST supply a Design System v1 set of primitives (Button, Input, Select, Badge, Table, FormFieldGroup, Toast) each with unit tests and Storybook/MDX stories including accessibility semantics (roles, labels, focus states).
- **FR-008**: System MUST generate and publish coverage, accessibility, and end-to-end interaction evidence under a week-specific documentation path and link them in public docs.
- **FR-009**: System MUST enforce coverage (≥70% lines, ≥60% branches for frontend path) and fail if thresholds not met.
- **FR-010**: System MUST enforce 0 serious+ accessibility violations on key navigation paths (`/`, `/posts`, filtered variants) before release sign-off.
- **FR-011**: System MUST provide contract definitions for query parameters and shared request/response types to ensure consistent parsing & validation.
- **FR-012**: System MUST allow sorting by at least `new` (default) and `old` orderings; unspecified sort defaults predictably.
- **FR-013**: System MUST generate a `x-trace-id` per inbound frontend request, propagate it upstream, log it in both services, and surface the last processed trace id in `/status` output.
- **FR-014**: System MUST publish release notes for version 10.0.0 containing links to spec PR, CI run, artifacts, and live service URLs.
- **FR-015**: System MUST handle upstream failure with bounded retries (max 3 attempts) using full-jitter backoff (e.g., 100–600 ms, 300–1200 ms, 600–2400 ms), honor `Retry-After` header, and enforce per-attempt timeout ≤800 ms with total response budget <3s.
- **FR-016**: System MUST configure Cloud Run with `min-instances >= 1` and environment variables `API_BASE_URL` and `ID_TOKEN_AUDIENCE` set for both frontend and API services; `ID_TOKEN_AUDIENCE` value MUST equal `API_BASE_URL`; the frontend Cloud Run service account MUST have `roles/run.invoker` on the API service (IAM binding validated in CI).
- **FR-017**: System MUST ensure SWR client revalidation parity with SSR: identical results for same URL/query; URL is the single source of truth for state.
- **FR-018**: System MUST run `scripts/figma-token-verify.ts` in CI and WARN (non-blocking) when design tokens drift (unused or missing usage) is detected.
- **FR-019**: System MUST pass Spectral API contract lint rules (custom config) enforcing: no `any` types, required `operationId`, and standardized error schema presence.
- **FR-020**: System MUST expose consistent log fields (`trace`, `route`, `latency_ms`, `status`, `upstream_status`) for observability correlation.
- **FR-021**: System MUST have `/status` always return HTTP 200 with body `{ ok:boolean, traceId:string, upstream:{ ... }, ts:string, reason?:string }`; upstream failures set `ok:false` and include a human-readable `reason`; CI asserts this contract. `/status` MUST call the upstream API via the same server-side ID token flow defined in **FR-002** (no client-side token exposure).
- **FR-022**: System MUST provide Supertest/Vitest contract test cases covering accepted and rejected query combinations (`q`, `author`, `sort`) using the shared `@contract` Zod schemas to ensure parsing and validation consistency (tests fail on drift or inconsistent error messaging).
- **FR-023**: System MUST define the SWR cache key exactly as the canonical full request URL string produced by: (1) remove empty/undefined query params, (2) stable sort remaining param keys lexicographically, (3) encode keys & values with standard URL encoding, (4) assemble `path?key=value&key2=value2`. Unit tests MUST assert different original orderings yield identical canonical key and SSR/SWR parity.
- **FR-024**: System MUST limit `/status` payload to non-sensitive fields only (no secrets, tokens, internal IDs); secrets must never be echoed in logs or status output.
- **FR-025**: System MUST include a unit test asserting `ID_TOKEN_AUDIENCE === API_BASE_URL` and that the frontend service account has `roles/run.invoker` on the API service (IAM check mocked if necessary).
- **FR-026**: System MUST send `Cache-Control: no-store` on `/status` responses to prevent caching and preserve latency integrity.
- **FR-027**: System MUST map Zod parse failures for query parameters to a single consistent user-facing message and structured log entry with HTTP 400 status (in logs, not public API error details); UI presents an accessible error state.
- **FR-028**: System MUST sample logs for `ok:false` `/status` events at 100% (no sampling drop) this week to aid debugging while keeping normal successful requests at standard sampling rate (if any).

### Key Entities _(include if feature involves data)_

- **Post**: Represents published content with id, title, author, created timestamp, and sort-relevant metadata.
- **FilterState**: Represents validated query parameters (text query, author, sort) forming a shareable URL state.
- **HealthReport**: Aggregated health snapshot with overall ok flag, upstream status indicators, and timestamp.
- **DesignComponent**: Catalog entry for a UI primitive with name, purpose statement, accessibility notes.
- **EvidenceArtifact**: Represents a published quality document (coverage summary, a11y report, e2e report) with path and metric summary.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Initial HTML for `/posts` contains ≥1 post row for ≥95% of successful requests (JavaScript disabled measurement).
- **SC-002**: `/status` endpoint p95 response time ≤150 ms (from frontend) calculated over the rolling last 10 minutes of probe requests; availability ≥99% in the same 10‑minute window during evaluation.
- **SC-003**: Reader can apply search & filter and receive updated server-rendered results (including empty & error states) in ≤1.5s p95.
- **SC-004**: Design System primitives used for ≥80% of interactive UI elements on `/posts` (buttons, inputs, selects, toasts) and each primitive has unit tests and Storybook/MDX stories with accessibility notes.
- **SC-005**: Quality gates: frontend line coverage ≥70%, branch coverage ≥60%, and 0 serious+ accessibility violations on key pages at release tag.
- **SC-006**: Release v10.0.0 notes contain links to spec PR, CI run, coverage report, a11y report, Playwright report, and live service URLs; mentor checklist passes with no remedial actions.
- **SC-007**: Invalid query parameter inputs yield clear accessible error messaging within first paint (<1.5s) and no partial/stale data displayed.
- **SC-008**: SWR revalidated data matches SSR initial payload for identical URL/query parameter sets (hash comparison for test harness).

### Evidence & Deliverables

Publish and link in README & release notes:

1. `docs/week-10/coverage/index.html` (+ coverage-summary.json)
2. `docs/week-10/a11y/index.html`
3. `docs/week-10/playwright/index.html` (SSR proof + E2E)
4. Release tag `v10.0.0` with artifact links & live URLs.
5. Playwright SSR test (JavaScript disabled) asserting `<tr>` rows present and HTML does NOT contain placeholder text (e.g., "Loading posts").

### Contracts & Validation

- Shared `@contract` package defines Zod query schemas and response types; imported by both frontend and API; CI typecheck ensures no drift.
- Spectral ruleset validates OpenAPI (operationId required, standardized error schema, no generic/any types).

### Observability

- Log fields: `trace`, `route`, `latency_ms`, `status`, `upstream_status` for each request.
- `/status` response shape: `{ ok, traceId, upstream: { ... }, ts, reason? }` always 200; on upstream failure `ok:false` and `reason` populated; latest propagated `x-trace-id` returned.

### Week 10 CI Checklist (Minimum Passing Criteria)

1. Typecheck + unit tests enforce coverage thresholds (fail if <70% lines or <60% branches).
2. Playwright E2E: SSR proof + accessibility (axe) fail on any serious+ violations.
3. Spectral contract lint passes (no rule violations).
4. Figma token parity script runs; drift produces WARN (non-blocking) but must output list of mismatches.
5. Cloud Run deployment sets required env vars and `min-instances >= 1` for both services.
6. Post-deploy probe: `/status` p95 ≤150 ms, includes `x-trace-id` correlation, and returns HTTP 200 with `ok:false` + `reason` when upstream failure simulated.
7. Contract test suite (Supertest/Vitest) passes for accepted and rejected query combos (`q`, `author`, `sort`) per **FR-022** (CI fails on any missing or drifting contract behavior).
8. SWR cache key parity enforced (test ensures key equals full URL; mismatch fails) per **FR-023**.
9. `/status` payload inspected to confirm absence of sensitive fields (test fixture) per **FR-024**.
10. Env/SA unit test passes (audience equality + invoker role) per **FR-025**.
11. `/status` response headers include `Cache-Control: no-store` per **FR-026**.
12. Zod parse failure mapping test cases pass (consistent message & 400 log) per **FR-027**.
13. Log sampling rule verified: all `ok:false` status events captured (no misses in simulated failures) per **FR-028**.

### Assumptions

- Upstream posts data source is stable and returns at least one post during normal operation.
- Only anonymous reading & basic filtering are in scope (no author authentication flows).
- Error messaging language uses concise neutral tone; localization not in scope.
- Sorting limited to provided options (`new`, `old`) this week; relevance or popularity deferred.
- Token-based upstream access uses secure server-side mechanism; exact method abstracted in this spec.

### Out of Scope

- Post creation/editing interfaces.
- Advanced analytics or personalization.
- Multi-language localization.
- Client-side only offline caching.

No [NEEDS CLARIFICATION] markers remain; defaults applied per industry norms for performance and accessibility.
