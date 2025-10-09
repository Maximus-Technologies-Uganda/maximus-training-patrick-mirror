# v6.0.0 – Week 6: Finish-to-Green for frontend-next

This release makes `frontend-next` first-class in CI with evidence, deploys the SSR demo to Cloud Run, adds a11y smokes and client-side contract checks, and completes governance cleanup.

## Highlights

- Quality Gate prints `frontend-next` coverage totals in the job summary.
- Review Packet artifacts include coverage, Playwright a11y, contract summaries, and screenshots.
- Cloud Run SSR demo uses Next.js standalone output and binds to `PORT`.
- Governance tightened: Linear-only in private repo, mirror is publish-only; legacy/noisy workflows disabled.

## Links

- Spec: `specs/006-spec/week-6-full-plan/spec.md`
- Plan: `specs/006-spec/week-6-full-plan/plan.md`
- Tasks: `specs/006-spec/week-6-full-plan/tasks.md`
- Quality Gate workflow: `.github/workflows/quality-gate.yml`
- Review Packet workflow: `.github/workflows/review-packet.yml`
- Latest Quality Gate runs: https://github.com/${REPO}/actions/workflows/quality-gate.yml?query=branch%3Amain
- Review Packet runs: https://github.com/${REPO}/actions/workflows/review-packet.yml?query=branch%3Amain
- Cloud Run demo URL: {{CLOUD_RUN_URL}}
- Linear issue: {{LINEAR_ISSUE_URL}}

## Notes

- Replace placeholders above via the release workflow if repository variables/secrets are configured:
  - CLOUD_RUN_URL (secret or repo variable)
  - LINEAR_ISSUE_URL (secret)

