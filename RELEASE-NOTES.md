# v6.0.1 – Week 6: Finish-to-Green follow-up

This maintenance tag rolls forward the Week 6 Finish-to-Green release with finalized CI evidence links and artifact names. It does not change runtime code, only CI evidence surfacing and release metadata.

## Evidence Links

- Spec: `specs/spec/week-6-finish-to-green/spec.md`
- Quality Gate runs (main): https://github.com/Maximus-Technologies-Uganda/Training/actions/workflows/quality-gate.yml?query=branch%3Amain
- Review Packet runs (main): https://github.com/Maximus-Technologies-Uganda/Training/actions/workflows/review-packet.yml?query=branch%3Amain
- Cloud Run demo URL: https://maximus-training-frontend-673209018655.africa-south1.run.app
- Linear issue: https://linear.app/maximusglobal/issue/DEV-460/finish-to-green-for-frontend-next-week-6

## Scope

- CI: Upload Playwright a11y JSON+HTML as `a11y-frontend-next`.
- CI: Upload frontend-next contract summary as `contract-frontend-next`.
- Quality Gate: Append concise a11y and contract PASS/FAIL summaries with links to artifacts.

---

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

