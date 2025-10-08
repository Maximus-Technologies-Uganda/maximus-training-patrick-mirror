# Feature Specification: Week 6 – Finish-to-Green for frontend-next (Cloud Run • Next.js • CI Evidence)

**Feature Branch**: `[006-spec/week-6-full-plan]`  
**Created**: 2025-10-08  
**Status**: Draft  
**Input**: Week 6 Finish-to-Green for `frontend-next`: CI Gate + Review Packet integration; Cloud Run SSR demo; a11y smokes and client-side contract checks; governance cleanup and v6.0.0 release with evidence.

## Execution Flow (main)
```
1. Parse user description from Input
   → If empty: ERROR "No feature description provided"
2. Extract key concepts from description
   → Identify: actors, actions, data, constraints
3. For each unclear aspect:
   → Mark with [NEEDS CLARIFICATION: specific question]
4. Fill User Scenarios & Testing section
   → If no clear user flow: ERROR "Cannot determine user scenarios"
5. Generate Functional Requirements
   → Each requirement must be testable
   → Mark ambiguous requirements
6. Identify Key Entities (if data involved)
7. Run Review Checklist
   → If any [NEEDS CLARIFICATION]: WARN "Spec has uncertainties"
   → If implementation details found: ERROR "Remove tech details"
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As a mentor/reviewer and as the developer (Patrick), I need the `frontend-next` app to be first-class in CI (Quality Gate + Review Packet), deployed live on Cloud Run with SSR, with basic a11y and client contract evidence, and with governance clean and release tagged, so Week 6 can be confidently signed off.

### Acceptance Scenarios
1. Gate & Packet visibility
   - **Given** a push to `main` triggers the Review Packet and Gate workflows, **When** the run completes, **Then** the job summary shows a distinct `frontend-next` block with coverage totals parsed from its coverage summary, **And** the Packet lists an artifact named `coverage-frontend-next` plus Playwright/JSDOM outputs for `frontend-next`.
2. Cloud Run demo works end-to-end
   - **Given** the Next.js app is built in standalone mode and deployed to Cloud Run, **When** I visit the Cloud Run URL at `/posts`, **Then** real data renders (not stuck on "Loading"), **And** the README contains the working URL and a "Run & Try (Next.js)" section with an env table including `NEXT_PUBLIC_API_URL` for local and prod.
3. A11y smokes
   - **Given** Playwright runs a11y smokes per page, **Then** at least one visible control is labeled, keyboard-only navigation can trigger the primary action, and status messages are announced via `aria-live` or `role="status"`, **And** the HTML report is uploaded to the Packet.
4. Client contract checks
   - **Given** contract checks run against the shared client types, **When** responses include fields actually used by the UI (`id`, `title`, `body`, `timestamps`), **Then** checks pass, **And** when the API returns an error (400/404) in the agreed envelope, **Then** the error-path check passes; short summaries appear in the job summary and are bundled in the Packet.
5. Governance & release
   - **Given** enforcement runs in the private repo and the mirror is publish-only, **When** workflows execute, **Then** the Actions dashboard shows no failing/legacy jobs, **And** a tag `v6.0.0` exists with release notes linking this spec, the Linear issue, the Gate run, the Packet, and the Cloud Run URL.

### Edge Cases
- Misconfigured `NEXT_PUBLIC_API_URL` yields failed fetches or mixed-content errors; prefer server Route Handlers for service-to-service calls.
- Cloud Run cold starts slow the demo; set `min-instances` to avoid demo latency.
- Coverage file path/name drift causes missing totals; the Gate should fail with a clear message.
- Mirror accidentally runs checks; ensure workflow filters/permissions so mirror is publish-only.
- Headless Playwright paths differ in CI; ensure artifact globs capture reports and screenshots.

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001 (Gate/Packet job)**: Add a dedicated Review Packet job for `frontend-next` that runs tests and coverage; upload a coverage artifact named exactly `coverage-frontend-next`.
- **FR-002 (Gate summary)**: Add a Quality Gate entry for `frontend-next` that reads its coverage summary and prints total Statements/Branches/Functions/Lines to the job summary as a distinct block.
- **FR-003 (Test artifacts)**: Ensure Playwright/JSDOM outputs for `frontend-next` (reports and screenshots) are uploaded with the Packet.
- **FR-004 (Main verification)**: Trigger a run on `main` and confirm the Packet contains `coverage-frontend-next` and the Gate summary shows the `frontend-next` block; run must be green.
- **FR-005 (SSR mode)**: Choose SSR on Cloud Run using Next.js standalone output; container must read `PORT` and serve the app and assets.
- **FR-006 (Runtime config)**: Production runtime must set `NEXT_PUBLIC_API_URL` correctly for the client, or use server Route Handlers for service-to-service calls (avoid browser → IAP/API directly).
- **FR-007 (Cloud Build → Cloud Run)**: Build via Cloud Build and deploy to Cloud Run in a region close to the API; configure `min-instances` ≥ 1 for demo responsiveness.
- **FR-008 (README updates)**: Update README with the working Cloud Run URL; add "Run & Try (Next.js)" and an environment table covering local and prod, including `NEXT_PUBLIC_API_URL`.
- **FR-009 (UI screenshots)**: Capture screenshots showing Loading → Data and include them in the Review Packet.
- **FR-010 (A11y smokes)**: Per page, verify labeled controls, keyboard-only path to primary action, and status announcements via `aria-live` or `role="status"`; upload Playwright report(s).
- **FR-011 (Client contract success)**: Validate only the fields consumed by the UI (`id`, `title`, `body`, `timestamps`) against the shared contract/types; fail CI on drift.
- **FR-012 (Client contract error)**: Include one error-path validation (e.g., 400/404 envelope) matching the client contract; fail CI on drift.
- **FR-013 (Job summaries)**: Surface short a11y and contract summaries in the job summary; ensure these artifacts land in the Packet.
- **FR-014 (Governance placement)**: Linear checks (and Spec→Linear, if used) run in the private repo; the mirror accepts publish-only pushes and does not run PR checks.
- **FR-015 (Noise cleanup)**: Remove/disable legacy or failing workflows so the Actions dashboard is all-green on `main`.
- **FR-016 (Release tagging)**: Publish `v6.0.0` with notes linking this spec, the Linear issue, the Gate run, the Packet, and the Cloud Run demo URL.
- **FR-017 (Traceability & PR hygiene)**: Merging [SPEC] creates a Linear issue; every code PR references the Linear issue and links any spec changes; PRs remain small and auditable and include links to Gate, Packet, and the live demo.

### Key Entities *(include if feature involves data)*
- **Frontend-Next Application**: The Next.js UI whose CI, coverage, a11y, and contract evidence are required.
- **Quality Gate**: The CI step that aggregates coverage and emits per-app totals in the job summary.
- **Review Packet**: CI artifact bundle per run containing per-app coverage, Playwright reports/screenshots, contract summaries, and UI screenshots.
- **Cloud Run Service**: Deployed SSR instance of `frontend-next` built with standalone output; serves `/posts` consuming the API.
- **Runtime Configuration**: Environment variables and/or server route handlers enabling correct API access (`NEXT_PUBLIC_API_URL`).
- **A11y Report(s)**: Playwright-generated accessibility smokes evidence.
- **Client Contract Summary**: Evidence of field-level validation for UI-used fields and one error path.
- **Governance & Release Artifacts**: Linear issue, release `v6.0.0`, and evidence links (spec, Gate, Packet, Cloud Run URL).

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---
