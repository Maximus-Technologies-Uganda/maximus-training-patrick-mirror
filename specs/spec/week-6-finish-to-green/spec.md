# Feature Specification: Finish-to-Green for frontend-next (Week 6)

**Feature Branch**: `spec/week-6-finish-to-green`  
**Created**: 2025-10-10  
**Status**: Draft  
**Input**: User description: "Finish-to-Green action plan for the frontend-next application to address all outstanding Week 6 review items: 1) Fix data fetching by routing client calls to a server-handled relative path, 2) Update README with working Cloud Run URLs and a Run & Try section with env tables, 3) Audit and surface CI evidence (coverage to job summary, artifacts, deployment summary includes live URL), 4) Surface a11y and contract test artifacts with concise summaries, 5) Tag v6.0.0 release with links to spec, Linear issue, green CI run, and live demo."

## Execution Flow (main)
```
1. Resolve data fetching:
   → Provide a server-handled endpoint for posts; client uses a relative path
   → Verify live deployment renders posts (no infinite loading)
2. Update documentation:
   → Replace placeholder links with live Cloud Run URLs (frontend and API)
   → Add Run & Try with environment variable tables for local and production
3. Surface CI evidence:
   → Quality Gate prints a distinct frontend-next coverage block to job summary
   → Ensure Review Packet artifacts include coverage-frontend-next and Playwright
   → Deployment job summary includes live Cloud Run URL
4. Surface a11y and contract artifacts:
   → Upload a11y and contract summaries as artifacts
   → Print concise a11y and contract summaries to the Quality Gate job summary
5. Tag the final release:
   → Create and push v6.0.0
   → Release notes link to this spec, Linear issue, a green CI run, and live demo
```

---

## ⚡ Quick Guidelines
- ✅ Prioritize reviewer success: live demo renders posts; evidence is easy to find
- ✅ Keep instructions runnable by a new reviewer within minutes
- ✅ Evidence must be visible in CI job summaries and downloadable as artifacts
- ❌ Non-goals: redesign UI, change API schema, or introduce new infra beyond scope
- ❌ Do not require client-side public API base URLs for data fetching

---

## Clarifications

### Session 2025-10-10
- Frontend Cloud Run URL: `https://maximus-training-frontend-673209018655.africa-south1.run.app`
- API Cloud Run URL: `https://maximus-training-api-673209018655.africa-south1.run.app`
- Open: Linear issue ID/URL for v6.0.0 release notes (to be provided).

---

## User Scenarios & Testing (mandatory)

### Primary User Story
As a reviewer, I can open the live frontend deployment and immediately see the list of posts. I can also find links and artifacts in CI to validate coverage, a11y, contract test results, and the live demo, enabling approval of release v6.0.0.

### Acceptance Scenarios
1. Data fetching works on live deployment:
   - Given the live Cloud Run deployment URL is accessible,
   - When I load the homepage,
   - Then the posts list renders (no infinite loader), and the network shows a successful request to a relative application path returning 200 with posts.

2. Documentation is accurate and runnable:
   - Given I open `frontend-next` README,
   - When I follow the Run & Try steps for local and production,
   - Then all links open working Cloud Run URLs for frontend and API, and the env var table clearly lists variables and example values.

3. CI evidence is clearly surfaced:
   - Given a CI run on `main`,
   - When I open job summaries,
   - Then I see a distinct coverage block for `frontend-next` in the Quality Gate summary, artifacts for `coverage-frontend-next` and the Playwright report, and the deployment job summary includes the live Cloud Run URL.

4. A11y and contract evidence is available:
   - Given the same CI run,
   - When I review artifacts and the Quality Gate summary,
   - Then I can download a11y and contract summaries and see a concise pass/fail overview printed in the summary.

5. Final release is tagged with evidence:
   - Given the work is complete,
   - When I visit the repository releases,
   - Then a `v6.0.0` release exists with notes linking to this spec, the Linear issue, a green CI run, and the live Cloud Run demo URL.

### Edge Cases
- Backend API is temporarily unavailable: the UI surfaces a clear, user-friendly error state instead of an indefinite loader.
- Network timeouts or 5xx responses: retry once and display error; do not loop indefinitely.
- Empty posts response: show empty state text; no console errors.
- Missing live URLs at spec time: [NEEDS CLARIFICATION: Provide final Cloud Run URLs for frontend and API].
- Reference to Linear issue: [NEEDS CLARIFICATION: Provide Linear issue ID/URL].

## Requirements (mandatory)

### Functional Requirements
- **FR-001**: The application MUST serve posts to the client via a server-handled relative path so the client does not rely on a public API base URL.
- **FR-002**: The client MUST request posts using a relative application path; no use of public runtime base URL for this call.
- **FR-003**: The live deployment MUST render the posts list with the loading indicator cleared within a reasonable time under typical conditions (target ≤ 3s after initial paint).
- **FR-004**: The UI MUST display an error state if the posts request fails or times out; loaders MUST not spin indefinitely.
- **FR-005**: Errors from the posts request MUST be captured in logs and surfaced in CI for troubleshooting.
- **FR-006**: The `frontend-next` README MUST replace placeholder links with the actual working Cloud Run URLs for frontend and API.
- **FR-007**: The README MUST include a "Run & Try" section with step-by-step instructions and an environment variable table covering local and production.
- **FR-008**: The Quality Gate job MUST print a distinct, clearly labeled coverage block for `frontend-next` to the job summary (GitHub Step Summary).
- **FR-009**: The Review Packet artifacts MUST include `coverage-frontend-next` and the Playwright report for `frontend-next`.
- **FR-010**: The deployment workflow summary MUST include the live Cloud Run URL of the frontend deployment.
- **FR-011**: Accessibility (a11y) reports for `frontend-next` MUST be uploaded as CI artifacts.
- **FR-012**: Contract test reports/summaries MUST be uploaded as CI artifacts.
- **FR-013**: The Quality Gate job summary MUST include a concise pass/fail summary for a11y and contract tests with links to artifacts.
- **FR-014**: A `v6.0.0` git tag MUST be created and pushed.
- **FR-015**: The `v6.0.0` release notes MUST link to this spec, the Linear issue, a green CI run on `main`, and the live Cloud Run demo URL.
- **FR-016**: The release notes MUST briefly summarize scope (Finish-to-Green for Week 6) and include commit range.
- **FR-017**: All acceptance scenarios MUST pass in a single CI run on `main`.

### Key Entities (include if feature involves data)
- **Posts**: List data rendered on the homepage; required fields include identifier, title, and content preview.
- **Evidence Artifact**: CI-generated bundles (coverage-frontend-next, Playwright report, a11y report, contract summary) that enable reviewer verification.
- **Live Deployment**: The frontend Cloud Run URL used by reviewers to validate behavior and link from CI summaries.
- **Release**: The `v6.0.0` tag and release notes linking to evidence for auditability.

---

## Review & Acceptance Checklist
### Content Quality
- [x] Clear user value: reviewer can validate live demo and evidence quickly
- [x] All mandatory sections completed (Scenarios, Requirements, Entities)
- [x] Scope limited to Finish-to-Green for Week 6

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain (requires final URLs and Linear link)
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable (live demo renders; CI summaries and artifacts present)
- [x] Dependencies and assumptions identified (live URLs, CI pipelines)

### Delivery Sign-off
- [ ] Live demo renders posts at Cloud Run URL
- [ ] README Run & Try enables a new reviewer to run and test
- [ ] CI job summaries show coverage, a11y/contract summaries, and live URL
- [ ] Artifacts available: coverage-frontend-next, Playwright, a11y, contract
- [ ] `v6.0.0` release published with required links

---

## Execution Status
*Updated when the spec is prepared*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [ ] Review checklist passed

---
