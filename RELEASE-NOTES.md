# Week 6 Release Notes

Date: 2025-10-07
Branch: `docs/finalize-week6-finishers`

## Highlights

- Unified Quality Gate across the monorepo including `frontend-next` with coverage baselines and type-check gating.
- Review Packet artifacts produced (manifest, coverage summary, a11y, contract, governance, security summaries).
- Live demo deploy path validated via Cloud Build and Cloud Run (frontend + API).
- Governance documentation completed: CONTRIBUTING, security exception policy, and a basic governance report script.

## What Shipped

- Documentation
  - `CONTRIBUTING.md`: Monorepo overview and full local validation workflow mirroring CI (`lint`, `typecheck`, tests + coverage, contract validation, a11y/e2e, Review Packet build).
  - `SECURITY_EXCEPTIONS.md`: Policy and auditable template for time-bound waivers with mentor approval and remediation plans.
  - `RELEASE-NOTES.md`: This document.
- Governance Utilities
  - `scripts/generate-governance-report.js`: Outputs production dependencies from the root `package-lock.json` as a basic governance report.

## CI/CD Improvements

- Quality Gate (see `.github/workflows/main.yml`)
  - Lint, unit/integration tests, coverage extraction, build, Playwright a11y/e2e.
  - PR summary generation and artifact upload for Review Packet (manifest + coverage + Playwright report).
- Aggregation & Reporting
  - Gate decision logic: `scripts/quality-gate/aggregate-results.js` enforces thresholds and consolidates results.
  - Review Packet builder: `scripts/quality-gate/build-review-packet.js` compiles artifacts and manifest referencing the OpenAPI source of truth `api/openapi.json`.

## Acceptance Alignment

- A11y: Zero critical/serious violations on posts list and create post form (via Playwright + axe).
- Contract: Frontend HTTP usage validated against `api/openapi.json` (no breaking mismatches expected).
- Type-check: `frontend-next` and `api` type-check gate enforced (`npm run typecheck`).
- Coverage: Baselines enforced for `frontend-next` (statements ≥ 60%, branches ≥ 50%, functions ≥ 55%).
- Governance: README/CHANGELOG present; security exception policy documented; basic dependency report available.

## References

- Spec: `specs/005-week-6-finishers/spec.md`
- Plan: `specs/005-week-6-finishers/plan.md`
- Tasks: `specs/005-week-6-finishers/tasks.md`
- Contract (source of truth): `api/openapi.json`
- CI Workflow: `.github/workflows/main.yml`

## Next Steps

- Automate governance JSON emission to integrate exceptions directly with the Quality Gate aggregator.
- Add unit tests for Review Packet builders (`scripts/quality-gate/__tests__`).
- Finalize CHANGELOG entry referencing this release.
