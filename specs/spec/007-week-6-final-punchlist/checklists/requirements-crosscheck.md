# Requirements Cross-Check Checklist: Week 6 – Finish-to-Green Final Punch-List

**Purpose**: Unit tests for requirement quality, cross-checked against the current spec
**Created**: 2025-10-12
**Feature**: ../spec.md

## Requirement Completeness

- [ ] CHK001 Are first-paint data requirements explicitly specified for initial HTML content at `/posts`? [Completeness, Spec §FR-001]
- [ ] CHK002 Is live environment configuration for API base URL fully specified, including scope and where it applies? [Completeness, Spec §FR-002]
- [ ] CHK003 Does the README requirement enumerate all URLs that must be updated (frontend, API, demo), avoiding placeholders? [Completeness, Spec §FR-003]
- [ ] CHK004 Are CI evidence deliverables enumerated (coverage block label, two HTML reports) with required presence in the Review Packet? [Completeness, Spec §FR-005–FR-006]
- [ ] CHK005 Are API contract hygiene elements required for all operations (operationId, description, tags, 4xx error schemas) explicitly comprehensive? [Completeness, Spec §FR-007]
- [ ] CHK006 Are workflow cleanup and release activities defined to the extent needed to guarantee an all‑green dashboard and a `v6.0.0` release with evidence links? [Completeness, Spec §FR-009–FR-010]

## Requirement Clarity

- [ ] CHK007 Is "initial HTML contains post items" defined without ambiguity (no reliance on client-side fetch for first paint)? [Clarity, Spec §FR-001]
- [ ] CHK008 Is `API_BASE_URL` described precisely (format, protocol, trailing slash policy, scope) to avoid misconfiguration? [Clarity, Spec §FR-002]
- [ ] CHK009 Are README instructions unambiguous about where to set `API_BASE_URL` and how to verify success locally and in demo? [Clarity, Spec §FR-004]
- [ ] CHK010 Is the coverage block title exact and stable (e.g., "frontend-next Coverage") to prevent reviewer confusion? [Clarity, Spec §FR-005]
- [ ] CHK011 Are error schemas defined with field-level expectations (code, message, details) and referenced consistently? [Clarity, Spec §FR-007]
- [ ] CHK012 Do release notes specify the exact evidence links required and their accessibility expectations? [Clarity, Spec §FR-010–FR-011]

## Requirement Consistency

- [ ] CHK013 Do success criteria align with functional requirements for first paint, CI evidence, and contract hygiene without contradiction? [Consistency, Spec §SC-001–SC-005 vs §FR]
- [ ] CHK014 Are README requirements consistent with success criteria timing for onboarding (under 10 minutes)? [Consistency, Spec §SC-002 vs §FR-004]
- [ ] CHK015 Is CI evidence scope consistent between job summary and Review Packet requirements? [Consistency, Spec §FR-005–FR-006]

## Acceptance Criteria Quality (Measurability)

- [ ] CHK016 Is the "brief transitional flash (< 200 ms)" threshold appropriate and measurable from a requirements perspective? [Measurability, Spec §SC-001]
- [ ] CHK017 Is the "under 10 minutes" onboarding target for README sufficiently justified and testable? [Measurability, Spec §SC-002]
- [ ] CHK018 Are "0 errors and 0 critical warnings" criteria for contract linting defined and traceable to the linter policy? [Measurability, Spec §SC-004]
- [ ] CHK019 Is "all-green required jobs" clearly scoped to exclude non-essential jobs, preventing false negatives? [Measurability, Spec §SC-005]

## Scenario Coverage

- [ ] CHK020 Do user stories cover primary reviewer, contributor, consumer, and maintainer perspectives adequately? [Coverage, Spec §User Stories]
- [ ] CHK021 Are alternate scenarios (empty posts, intermittent API failures) addressed in requirements or edge cases? [Coverage, Spec §Edge Cases]
- [ ] CHK022 Are documentation drift scenarios (URL changes) addressed via maintenance or link checking policy? [Coverage, Spec §Edge Cases]

## Edge Case Coverage

- [ ] CHK023 Are fallback/empty-state behaviors for SSR explicitly required, not implied? [Edge Case, Spec §Edge Cases]
- [ ] CHK024 Are CI artifact size/retention constraints reflected in requirements to avoid missing evidence? [Edge Case, Spec §Edge Cases]
- [ ] CHK025 Are legacy endpoint warnings dispositioned (suppress vs. fix) before release in the requirements? [Edge Case, Spec §Edge Cases]

## Non-Functional Requirements

- [ ] CHK026 Are accessibility considerations for SSR content and reports referenced or explicitly out of scope? [Non‑Functional, Spec §Success Criteria/Requirements]
- [ ] CHK027 Are security/privacy considerations for published artifacts and links documented or excluded? [Non‑Functional, Spec §FR-011]

## Dependencies & Assumptions

- [ ] CHK028 Are environment dependency assumptions (Cloud Run availability, API health) captured and bounded? [Assumption, Spec §User Stories/Edge Cases]
- [ ] CHK029 Is the dependency on a contract linter and its ruleset specified as a gating dependency? [Dependency, Spec §FR-008]

## Ambiguities & Conflicts

- [ ] CHK030 Are any ambiguous terms (e.g., "brief", "non-essential") resolved with definitions or examples in the spec? [Ambiguity, Spec §SC-001/§FR-009]
- [ ] CHK031 Are there conflicts between workflow cleanup and evidence retention (e.g., disabling jobs that build artifacts)? [Conflict, Spec §FR-006/§FR-009]

## Notes

- This checklist tests requirement quality only; it does not validate implementation.


