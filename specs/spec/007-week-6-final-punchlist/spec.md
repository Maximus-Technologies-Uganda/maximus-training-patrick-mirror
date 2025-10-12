# Feature Specification: Week 6 – Finish-to-Green Final Punch-List

**Feature Branch**: `007-week-6-final-punchlist`  
**Created**: 2025-10-12  
**Status**: Draft  
**Input**: User description: "Assume the role of a Tech Lead writing a final, evidence-based punch-list to close out a project milestone. The specification must cover the five blocking gaps required to complete Week 6 'Finish-to-Green'. A: First Paint Shows Data; B: README is Truthful and Accurate; C: CI Visibility and Artifacts; D: Contract Hygiene; E: Workflows and Release. Definition of Done provided."

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Reviewer sees posts on first paint (Priority: P1)

A reviewer opens the live demo at `/posts` and immediately sees real posts rendered in the initial HTML without a persistent "Loading..." placeholder.

**Why this priority**: Confirms the product delivers user-visible value and verifies live environment configuration is correct.

**Independent Test**: Load the live `/posts` URL in a fresh session and inspect the initial HTML response; verify post items are present in the server-rendered markup.

**Acceptance Scenarios**:

1. **Given** a healthy live environment, **When** a user loads `/posts`, **Then** the initial HTML contains at least one post item and the page does not remain on "Loading...".
2. **Given** network latency, **When** the page is loaded, **Then** SSR content is still present in the first response and no client-side fetch is required to show the first list of posts.

---

### User Story 2 - New contributor follows an accurate README (Priority: P2)

A new contributor or reviewer opens `README.md` and follows the "Run & Try" instructions with accurate URLs and an environment variable table to get running without guesswork.

**Why this priority**: Reduces onboarding friction and ensures reviewers can verify the demo quickly.

**Independent Test**: Click all documented URLs and execute the documented run steps using the environment variable table; all links work and the app runs end-to-end.

**Acceptance Scenarios**:

1. **Given** the documented Cloud Run URLs, **When** a reviewer clicks them, **Then** each URL resolves and renders the expected application.
2. **Given** the environment variable table in the README, **When** a user sets `API_BASE_URL` as instructed, **Then** the app runs locally and can fetch posts.

---

### User Story 3 - CI evidence is clear and discoverable (Priority: P3)

A reviewer opens the CI job summary and a Review Packet to find a distinct coverage block for `frontend-next` and downloadable HTML artifacts (coverage and Playwright reports).

**Why this priority**: Speeds up review and raises confidence by making evidence explicit.

**Independent Test**: Inspect the CI job summary for a labeled coverage section; download the Review Packet and open the coverage HTML and Playwright HTML reports.

**Acceptance Scenarios**:

1. **Given** a completed CI run, **When** viewing the job summary, **Then** a section titled "frontend-next Coverage" is visible with the coverage summary.
2. **Given** the Review Packet, **When** opening artifacts, **Then** the `coverage-frontend-next` HTML and the Playwright HTML report are present and viewable.

---

### User Story 4 - API contract is clean and usable (Priority: P3)

An API consumer opens the OpenAPI contract and finds each operation documented with `operationId`, description, tags, and consistent error schemas.

**Why this priority**: Increases integration velocity and reduces consumer questions.

**Independent Test**: Lint the contract and manually spot-check a sample of operations for the required fields and error models.

**Acceptance Scenarios**:

1. **Given** the OpenAPI document, **When** linted, **Then** it passes with zero errors and required fields present for all operations.
2. **Given** a 4xx scenario in the API, **When** referenced in the contract, **Then** the error schema is defined and referenced by those operations.

---

### User Story 5 - All-green workflows and a final release (Priority: P3)

A maintainer views the Actions dashboard for `main` and sees only passing jobs; a `v6.0.0` release is published with links to all evidence and the live demo.

**Why this priority**: Signals project readiness and provides a single reference point for stakeholders.

**Independent Test**: Open the Actions dashboard for the default branch and verify no failing/skipped non-essential jobs; verify the `v6.0.0` release exists with linked evidence.

**Acceptance Scenarios**:

1. **Given** the `main` branch, **When** viewing recent workflow runs, **Then** all required jobs are green and no noisy red jobs are present.
2. **Given** the release page, **When** opening `v6.0.0`, **Then** the notes link to the Week 6 spec, Quality Gate summary, Review Packet, and live demo URL.

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

- Live environment missing a valid base URL: server-render falls back incorrectly and shows "Loading..." longer than a brief moment.
- API is reachable but returns empty array or intermittent failures; SSR must still render deterministically (empty-state copy) without hanging.
- README links drift after redeploys; link checker should flag broken links.
- CI artifacts exceed size limits; ensure artifacts are zipped and retained as intended.
- Contract linter flags warnings for legacy endpoints; decide suppress vs. fix before release.
- Pre-existing noisy workflows on `main`; ensure they are removed or gated to non-default branches.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The initial server-rendered HTML for `/posts` MUST include post items so that users see content on first paint without waiting for client-side fetching.
- **FR-002**: The live environment configuration MUST provide a valid base URL for the posts API to enable successful server-side data retrieval for `/posts`.
- **FR-003**: `README.md` MUST replace all placeholder URLs with the actual, working Cloud Run URLs for both the frontend and the API.
- **FR-004**: `README.md` MUST include a "Run & Try" section with a complete environment variable table that includes `API_BASE_URL`, with clear instructions to run locally and verify posts render.
- **FR-005**: The CI Quality Gate job summary MUST display a distinct, clearly labeled coverage block for `frontend-next` that reviewers can identify at a glance.
- **FR-006**: The final Review Packet MUST include both the `coverage-frontend-next` HTML report and the Playwright HTML report as downloadable artifacts.
- **FR-007**: The OpenAPI contract MUST specify `operationId`, description, tags, and defined error schemas for client-visible 4xx responses for all operations.
- **FR-008**: CI MUST include a contract linting step that enforces the above contract hygiene and fails on violations.
- **FR-009**: Non-essential or failing workflows on the default branch MUST be fixed, disabled, or removed such that the Actions dashboard is all-green for `main`.
- **FR-010**: A `v6.0.0` release MUST be tagged and published with notes that link to: the Week 6 spec, the Quality Gate summary, the Review Packet, and the live demo URL.
- **FR-011**: Evidence links in the release notes MUST be accessible to reviewers without additional authentication beyond what is expected for public evidence.
- **FR-012**: All acceptance scenarios in this specification MUST be demonstrably satisfied prior to marking Week 6 as complete.

### Key Entities *(include if feature involves data)*

- **Post**: An item displayed on `/posts`; includes title and body fields surfaced to users.
- **OpenAPI Operation**: A documented API action with `operationId`, description, tags, and referenced error schemas.
- **CI Evidence Artifact**: Output files (coverage HTML, Playwright HTML) attached to CI runs and included in the Review Packet.
- **Review Packet**: A curated bundle that aggregates proof of quality (coverage summaries, UI test reports) for stakeholder review.
- **Release**: A versioned milestone (`v6.0.0`) with notes and links to evidence and the live demo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: On the live demo, the initial HTML response for `/posts` contains post content in 100% of test loads; the page does not remain on "Loading..." beyond a brief transitional flash (< 200 ms).
- **SC-002**: `README.md` link check passes with 100% working links; the environment variable table contains `API_BASE_URL` with accurate description, and a new contributor can complete the "Run & Try" flow end-to-end in under 10 minutes.
- **SC-003**: The CI Quality Gate summary visibly includes a block titled "frontend-next Coverage"; the Review Packet includes both the coverage HTML and Playwright HTML reports and they open successfully.
- **SC-004**: The OpenAPI contract passes linting with 0 errors and 0 critical warnings; 100% of operations include `operationId`, description, tags, and defined 4xx error schemas.
- **SC-005**: The Actions dashboard for `main` shows all-green required jobs for the latest run; `v6.0.0` is published and its notes link to the Week 6 spec, Quality Gate summary, Review Packet, and live demo URL.
