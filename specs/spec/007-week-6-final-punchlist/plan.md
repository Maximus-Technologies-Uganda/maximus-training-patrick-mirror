# Implementation Plan: Week 6 – Finish-to-Green Final Punch-List

**Branch**: `007-week-6-final-punchlist` | **Date**: 2025-10-12 | **Spec**: ../spec.md
**Input**: Feature specification from `/specs/spec/007-week-6-final-punchlist/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver Week 6 to green by closing five gaps: A) first paint shows posts (SSR contains data); B) README is accurate with working URLs and env table; C) CI evidence visibility with labeled coverage block and HTML artifacts in the Review Packet; D) OpenAPI contract hygiene with lint gate; E) workflows all‑green and a `v6.0.0` release with evidence links. Plan is split into five PRs mapped to A–E.

## Technical Context

**Language/Version**: JavaScript/TypeScript  
**Primary Dependencies**: Next.js app (frontend‑next), Playwright (e2e), Vitest (unit), OpenAPI document for API  
**Storage**: N/A  
**Testing**: Vitest, Playwright; CI Quality Gate summarizes coverage  
**Target Platform**: Web (Cloud Run demo environments for frontend and API)
**Project Type**: web  
**Performance Goals**: First paint includes posts; coverage surfaced; CI artifacts downloadable  
**Constraints**: Evidence must be visible in CI summary and Review Packet; contracts lint clean  
**Scale/Scope**: Single repo multi‑apps (frontend‑next, api)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```
specs/spec/007-week-6-final-punchlist/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
frontend-next/           # Next.js app with /posts
api/                     # Backend API with OpenAPI contract
scripts/quality-gate/    # CI scripts surface coverage and artifacts
specs/spec/007-week-6-final-punchlist/  # Feature docs
```

**Structure Decision**: Use existing repo layout; add contracts and quickstart under the feature folder.

## Checklist Gate

All work must satisfy the requirements quality checklist at `specs/spec/007-week-6-final-punchlist/checklists/requirements-crosscheck.md`.

- Gate: Before closing each PR (A–E), confirm relevant CHK items pass
- Final Gate: All CHK001–CHK031 pass with no unresolved gaps

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

## Five PRs (Sequential Execution)

### PR 1/5 – A: First Paint Shows Data

Title: Ensure SSR for /posts includes data in initial HTML

Checklist:
- [ ] Add or verify server-side route handler uses configured base URL for posts
- [ ] Configure live environment variable `API_BASE_URL` for the frontend demo service
- [ ] Add safeguards for empty-state SSR (renders deterministic copy, no hang)
- [ ] Log SSR fetch failures with clear message, do not block HTML render
- [ ] Validate initial HTML contains post items in preview and live

Acceptance linkage: Spec §FR-001, §FR-002; SC-001

### PR 2/5 – B: README is Truthful and Accurate

Title: Update README with working Cloud Run URLs and env table

Checklist:
- [ ] Replace placeholder URLs with working Cloud Run links for frontend and API
- [ ] Add environment variable table with `API_BASE_URL` and description
- [ ] Add "Run & Try" instructions for local run and verification steps
- [ ] Add link-check step to CI or a script to detect drift

Acceptance linkage: Spec §FR-003, §FR-004; SC-002

### PR 3/5 – C: CI Visibility and Artifacts

Title: Surface frontend-next coverage and publish HTML artifacts

Checklist:
- [ ] Update Quality Gate job summary to include a titled block "frontend-next Coverage"
- [ ] Ensure coverage HTML is generated and uploaded as `coverage-frontend-next`
- [ ] Ensure Playwright HTML report is generated and uploaded
- [ ] Update Review Packet build to include both HTML artifacts

Acceptance linkage: Spec §FR-005, §FR-006; SC-003

### PR 4/5 – D: Contract Hygiene

Title: Clean OpenAPI and add contract linting gate

Checklist:
- [ ] Add `operationId`, description, and tags for all operations
- [ ] Define and reference 4xx error schemas consistently across operations
- [ ] Introduce contract linting in CI; fail on policy violations
- [ ] Record contract changes in feature `contracts/` and ensure README links

Acceptance linkage: Spec §FR-007, §FR-008; SC-004

### PR 5/5 – E: Workflows and Release

Title: All‑green workflows and publish v6.0.0 with evidence links

Checklist:
- [ ] Disable or fix noisy/non-essential CI jobs on `main`
- [ ] Verify required jobs are green on a full run
- [ ] Tag and publish `v6.0.0` release with links: spec, Quality Gate, Review Packet, live demo
- [ ] Sanity check link accessibility for reviewers

Acceptance linkage: Spec §FR-009–§FR-012; SC-005

## Phase 0: Outline & Research

Unknowns to resolve:
- NEEDS CLARIFICATION: Exact Cloud Run URL formats and env injection method for the frontend demo
- NEEDS CLARIFICATION: Contract lint policy and rule set to use

Research tasks:
- Document env configuration approach for SSR base URL in live service
- Select and document OpenAPI lint rules/policy and integration approach

Output: `research.md` with decisions and rationale

## Phase 1: Design & Contracts

Artifacts to produce:
- `data-model.md`: Entities: Post, OpenAPI Operation, CI Evidence Artifact, Release
- `contracts/`: Cleaned OpenAPI with error schemas
- `quickstart.md`: How to run locally and verify `/posts` SSR

Agent update:
- Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType cursor-agent`

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | — | — |
