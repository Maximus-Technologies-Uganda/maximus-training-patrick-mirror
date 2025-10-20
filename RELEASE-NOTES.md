# Release v7.0.0 - Finish-to-Green

**Date:** 2025-10-20

This release marks the successful completion of the "Week 7.5 Finishers Workbook." The application has been stabilized, and a professional-grade engineering system has been implemented to ensure all code is shippable, verifiable, and maintainable.

### Major Achievements:
* **SSR First-Paint:** The `/posts` page now renders content on the server, eliminating the initial "Loading..." spinner for a professional user experience.
* **CI/CD Hardening:** A comprehensive, automated CI/CD pipeline has been built to enforce quality gates, including test coverage, accessibility, API contract linting, and security checks.
* **Evidence-Based PRs:** A new, mandatory PR template and workflow ensures every change is documented and linked to its evidence (CI runs, artifacts, demo URLs).
* **Monorepo Tooling:** The repository now uses `pnpm` workspaces and has a full suite of automated local checks (linting, type-checking, testing) managed by Husky hooks.
* **Full Documentation:** The project's `README.md` is now truthy with live URLs, and new guides have been created for understanding release artifacts and verifying application health.

### Infrastructure & Observability:
* **SSR Instrumentation:** Server-side rendering now includes logging for initial render timing (DEV-593)
* **Auditor Runbook:** New operational runbook for verifying application health (DEV-594)
* **CI Artifact Retention:** 21-day retention policy for all CI artifacts (coverage, a11y, contract) (DEV-595)

### Documentation:
* **Release Evidence Guide:** Comprehensive guide for interpreting CI/CD artifacts (DEV-587, DEV-574)
* **SSR Documentation:** Detailed explanation of server-side rendering implementation (DEV-567)
* **Environment Variables:** Complete environment variables table covering all services (DEV-584)

### Linear Issues Addressed:
DEV-590, DEV-591, DEV-592, DEV-593, DEV-594, DEV-595, DEV-587, DEV-574, DEV-567, DEV-584

---

# v7.0.0 – Week 7: Auth, Ownership, and Observability

This release delivers foundational authentication (session cookie), ownership enforcement for all write operations, structured logging with request-id propagation, a readiness health endpoint, and a published API contract.

## Highlights

- API
  - Username/password login issues HttpOnly session cookie; logout is idempotent
  - Authorization middleware protects CUD; ownership enforced on update/delete (403 for non-owner)
  - Read endpoints remain public
  - `/health` readiness endpoint
- Observability
  - Structured JSON logs include `request-id` and `userId` (when authenticated)
  - `X-Request-Id` propagation through web → API
- Contracts
  - Finalized OpenAPI (openapi-skeleton.yaml) and published as CI artifact `openapi-contract`
- UI (Next.js)
  - Login/Logout flows; ownership-aware controls (Edit/Delete hidden for non-owners)

## Evidence Links

- Spec PR: https://github.com/Maximus-Technologies-Uganda/Training/pull/474
- Parent Linear issue: https://linear.app/maximusglobal/issue/DEV-516/auth-ownership-observability-feature
- Quality Gate (latest on main): https://github.com/Maximus-Technologies-Uganda/Training/actions/workflows/quality-gate.yml?query=branch%3Amain
- Review Packet (latest on main): https://github.com/Maximus-Technologies-Uganda/Training/actions/workflows/review-packet.yml?query=branch%3Amain
- Live Cloud Run demo: https://maximus-training-frontend-673209018655.africa-south1.run.app
- Release evidence: `docs/release-evidence/week-7/`

## Scope

- Phase 1: API authN/authZ, ownership, OpenAPI updates, tests
- Phase 2: Next.js login/logout and ownership UI
- Phase 3: Structured logging, request-id propagation, `/health`

---

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

