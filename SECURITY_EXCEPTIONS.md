# Security Exceptions Log (Week 6 Policy)

This document tracks any approved temporary exceptions to security, accessibility, contract, coverage, or type-check gates that would otherwise fail CI. It aligns with the requirements in:

- Spec: `specs/005-week-6-finishers/spec.md` (see FR-011, FR-012)
- Plan: `specs/005-week-6-finishers/plan.md`
- Tasks: `specs/005-week-6-finishers/tasks.md`

All exceptions must be time-bound, include an owner and mitigation plan, and have mentor approval evidenced in the PR (approval review or an explicit "Exception Approved" comment referencing the entry).

## Policy

- Scope: Exceptions can apply to the dimensions checked by the Quality Gate (`security`, `a11y`, `contract`, `coverage`, `typecheck`, and missing artifacts in governance`).
- Duration: Maximum 90 days. An expiry date is mandatory.
- Approval: One Mentor approval is required in the PR; the PR must link to the exception entry here.
- Tracking: Each entry must include a remediation plan and an owner. Reevaluate on or before the expiry date.
- Gate Behavior: Exceptions may allow CI to pass while the issue is mitigated. The governance report should mirror active exceptions so gate aggregation can record/audit waivers (see `scripts/quality-gate/aggregate-results.js`).

## Exception Entry Template

Copy the template below and fill all fields. Keep the entry concise and auditable.

```yaml
id: EX-YYYYMMDD-###          # unique id (date + sequence)
createdAt: 2025-10-07        # ISO date
expiresAt: 2026-01-05        # <= 90 days recommended
owner: Full Name (@github)   # accountable owner
component: security|a11y|contract|coverage|typecheck|governance
scope:
  dimension: security        # gate dimension
  packages:
    - api
    - frontend-next
issue:
  summary: >
    Short description of the violation or risk (e.g., transitive vulnerability without upstream fix).
  details: >
    Any relevant CVEs, dependency names, versions, and links.
impact: high|critical|serious|moderate|low
approval:
  mentor: Full Name (@github)
  pr: https://github.com/<org>/<repo>/pull/<id>  # PR with approval or comment
  evidence: >
    Paste the approval comment permalink or indicate "Review Approved".
mitigation:
  plan: >
    Clear steps to remediate (upgrade dependency, replace library, refactor API usage, etc.).
  targetDate: 2025-11-15
waiver:
  allowLevels: [high]        # for security; or allowImpacts for a11y
  allowBreaking: false       # for contract
  allowCoverageBelowThreshold: false
  waiveAllCurrentFindings: false
notes: >
  Additional context if needed.
```

## Active Exceptions

None.

## Closed Exceptions

<!-- Append closed exceptions here with closure date and outcome -->
