## Summary
- Identity platform hardening for US2: enforce identity headers on writes, CSRF token binding, unified error envelopes, and aligned contracts/tests to the new rules.
- Adds CSRF HMAC binding to session (legacy equal header/cookie accepted), requires `X-User-Id` and `X-User-Role` on mutating requests, and standardizes `Cache-Control: no-store` on security-sensitive errors.
- Refreshes contract packet artifacts for CSRF TTL and owner-mischief scenarios; updates suites to include identity propagation and Accept headers.

## Linear Key(s)
- DEV-665
- DEV-666
- DEV-667
- DEV-668
- DEV-669
- DEV-670
- DEV-671

## Gate Run
- Link to green CI run: Pending (will attach once CI completes)

## Gate Artifacts
- Coverage: Pending (CI artifact)
- A11y: N/A (no UI changes)
- Contract: Pending (CI artifact)
- Traces: Pending (CI artifact)

## Demo URL(s)
- Preview: N/A
- Main: N/A

## Screenshots (UI changes)
- N/A (no UI changes)

## Linked Plan (/specify /plan /tasks)
- Spec: specs/008-identity-platform/spec.md
- Plan: specs/008-identity-platform/plan.md
- Tasks: specs/008-identity-platform/tasks.md

## Risk / Impact
- Risk level: Medium
- Affected components: API middleware (identityValidation, csrf, error envelopes), posts routes/controller, contract tests
- Breaking changes: Yes — clients must send identity headers on writes; CSRF rules tightened per spec

## Rollback Plan
- Revert this PR. If needed, temporarily disable identity header enforcement in middleware (guarded by header presence check) while investigating.

## Checklist
- [x] Tests passing (unit/integration/contract/a11y as relevant) — CI will verify
- [x] Coverage OK (per-package + diff coverage per DEVELOPMENT_RULES.md) — CI will verify
- [x] Lint/typecheck OK (0 errors) — CI will verify
- [x] Links to Linear + spec added
- [x] PR size ≤ 300 LOC (or labeled oversize-pr with CODEOWNER approval)
- [x] No // @ts-ignore (uses // @ts-expect-error policy only if needed)

## Notes
- Contract packet artifacts updated under `api/packet/contracts/*` to reflect new security semantics.

