---
description: Generate an actionable, dependency-ordered tasks.md for the Week 6 Finishers feature based on finalized spec and plan.
---

# Tasks: Week 6 Finishers (Quality Gate, Demo, A11y & Contract, Governance, Security)

**Feature Dir**: `C:/Users/LENOVO/Training/specs/005-week-6-finishers/`
**Spec**: `C:/Users/LENOVO/Training/specs/005-week-6-finishers/spec.md`
**Plan**: `C:/Users/LENOVO/Training/specs/005-week-6-finishers/plan.md`
**Contract (source of truth)**: `C:/Users/LENOVO/Training/api/openapi.json`

## Execution Flow (main)
```
1. Setup shared tooling and repo-wide Quality Gate scaffolding
   → Prepare linting/formatting, test runners, coverage output normalization
2. Write failing tests first (TDD)
   → Contract tests, a11y tests, key integration/e2e flows aligned to the spec
3. Implement core integrations and reporting
   → Quality Gate aggregator, Review Packet manifest/reports, contract validation wiring
4. Add demo deployment, README updates, governance and release steps
5. Add security audit in CI and exception policy artifacts
6. Polish: unit tests, performance, docs hardening
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Phase 1: Setup
- [ ] T000 Preflight: enforce branching and PR policy compliance
  - File: `C:/Users/LENOVO/Training/scripts/ci/preflight-branch-check.js`
  - Verify work occurs on `spec/005-week-6-finishers` and merges via PR after gate pass.

- [ ] T001 Configure monorepo linting and formatting
  - Files: `C:/Users/LENOVO/Training/frontend/eslint.config.js`, `C:/Users/LENOVO/Training/frontend-next/eslint.config.mjs`, `C:/Users/LENOVO/Training/api/eslint.config.mjs`
  - Ensure consistent rules and add repo-level npm scripts to run all lint tasks.

- [ ] T002 [P] Normalize test and coverage outputs
  - Files: `C:/Users/LENOVO/Training/frontend-next/vitest.config.ts`, `C:/Users/LENOVO/Training/scripts/run-tests.js`
  - Ensure coverage reporters include text+html; output path captured for gate.

- [ ] T003 [P] Add repo-level Quality Gate scripts scaffold
  - New Files: `C:/Users/LENOVO/Training/scripts/quality-gate/aggregate-results.js`, `C:/Users/LENOVO/Training/scripts/quality-gate/build-review-packet.js`, `C:/Users/LENOVO/Training/scripts/quality-gate/manifest.json.template`
  - Purpose: Aggregate results from `frontend-next` and existing packages; prepare Review Packet.

- [ ] T004 [P] Type-check gating across workspaces
  - Files: `C:/Users/LENOVO/Training/frontend-next/tsconfig.json`, `C:/Users/LENOVO/Training/api/tsconfig.json`, `C:/Users/LENOVO/Training/scripts/quality-gate/check-types.js`
  - Run `tsc --noEmit` for `frontend-next` and `api`; gate on failures and capture results for Review Packet.

## Phase 2: Tests First (TDD) — MUST fail before implementation
### Contract tests derived from `api/openapi.json`
- [ ] T010 [P] Contract test GET /health
  - File: `C:/Users/LENOVO/Training/api/tests/contract.test.js`
  - Validate 200 schema `{ status: "ok" }`.

- [ ] T011 [P] Contract test GET /posts
  - File: `C:/Users/LENOVO/Training/api/tests/contract.test.js`
  - Validate 200 `PostList` schema; 400 error schema when invalid query.

- [ ] T012 [P] Contract test POST /posts
  - File: `C:/Users/LENOVO/Training/api/tests/contract.test.js`
  - Validate 201 schema `Post`, `Location` header; 400 on invalid body.

- [ ] T013 [P] Contract test GET /posts/{id}
  - File: `C:/Users/LENOVO/Training/api/tests/contract.test.js`
  - Validate 200 `Post`; 404 error schema when not found.

- [ ] T014 [P] Contract test PUT /posts/{id}
  - File: `C:/Users/LENOVO/Training/api/tests/contract.test.js`
  - Validate 200 `Post`; 400 invalid body; 404 not found.

- [ ] T015 [P] Contract test PATCH /posts/{id}
  - File: `C:/Users/LENOVO/Training/api/tests/contract.test.js`
  - Validate 200 `Post`; 400 invalid body; 404 not found.

- [ ] T016 [P] Contract test DELETE /posts/{id}
  - File: `C:/Users/LENOVO/Training/api/tests/contract.test.js`
  - Validate 204; 404 not found.

### Frontend a11y and integration/e2e per spec
- [ ] T020 [P] A11y scan for /posts list
  - File: `C:/Users/LENOVO/Training/frontend-next/tests/playwright/posts.a11y.spec.ts`
  - Ensure zero critical/serious violations using axe with `wcag2a` and `wcag2aa` tags.

- [ ] T021 [P] A11y scan for create post form
  - File: `C:/Users/LENOVO/Training/frontend-next/tests/playwright/create-post.a11y.spec.ts`
  - Navigate to create form route; assert zero critical/serious violations.

- [ ] T022 [P] E2E: demo primary flows load
  - File: `C:/Users/LENOVO/Training/frontend-next/tests/playwright/demo.flows.spec.ts`
  - Validate home, posts list, and create post (load + submit) render without errors.

## Phase 3: Core Implementation
- [ ] T030 Implement Quality Gate aggregator and decision logic
  - File: `C:/Users/LENOVO/Training/scripts/quality-gate/aggregate-results.js`
  - Aggregate unit/integration tests and coverage including `frontend-next`; enforce coverage thresholds (statements ≥ 60%, branches ≥ 50%, functions ≥ 55%); include type-check results; FAIL the gate on a11y or contract violations; compute a single PASS/FAIL across tests, coverage, a11y, contract, security audit, and governance.

- [ ] T031 Build Review Packet with manifest
  - File: `C:/Users/LENOVO/Training/scripts/quality-gate/build-review-packet.js`
  - Include a11y report, contract report, security audit summary, governance report; write `docs/ReviewPacket/*`.

- [ ] T032 [P] CI contract validation wiring for frontend-next
  - File: `C:/Users/LENOVO/Training/frontend-next/tests/openapi.validation.test.ts`
  - Validate frontend HTTP client requests/responses against `api/openapi.json`.

- [ ] T033 [P] CI a11y wiring and reporting
  - File: `C:/Users/LENOVO/Training/frontend-next/playwright.config.ts`
  - Ensure HTML reporter artifacts are persisted into Review Packet.

- [ ] T034 Publish PR checks for gate and dimensions
  - File: `C:/Users/LENOVO/Training/scripts/quality-gate/publish-checks.js`
  - Publish individual check runs (tests, coverage, a11y, contract, security, governance) and an overall Gate status to PR checks.

- [ ] T035 Post PR summary with key metrics
  - File: `C:/Users/LENOVO/Training/scripts/quality-gate/post-pr-summary.js`
  - Post a PR comment summarizing pass/fail and key metrics; reference `C:/Users/LENOVO/Training/api/openapi.json` and the live demo URL.

## Phase 4: Demo, README, Governance, Release
- [ ] T040 Deploy live demo from default branch
  - Files: `C:/Users/LENOVO/Training/frontend-next/next.config.ts`, CI workflow (paths only referenced here)
  - Produce public URL; surface in Review Packet manifest.

- [ ] T044 Finalize Review Packet manifest with demo URL
  - File: `C:/Users/LENOVO/Training/scripts/quality-gate/build-review-packet.js`
  - Patch the manifest/index to include the live demo URL after deployment (depends on T031 and T040).

- [ ] T041 Update README with Run & Try section
  - File: `C:/Users/LENOVO/Training/README.md`
  - Include local run steps, required configuration (e.g., `NEXT_PUBLIC_APP_URL`), and demo link.

- [ ] T042 Governance report generation
  - Files: `C:/Users/LENOVO/Training/CHANGELOG.md`, `C:/Users/LENOVO/Training/README.md`, branch protection checklist reference
  - Verify README "Run & Try" present, CHANGELOG entry exists, and `main` protections enabled; emit governance report into Review Packet with evidence.

- [ ] T043 Publish final Week-6 release notes
  - Files: `C:/Users/LENOVO/Training/CHANGELOG.md`, release notes generator script
  - Publish tag and notes linking to artifacts.

## Phase 5: Security Audit & Exceptions
- [ ] T050 Wire dependency audit in CI for all workspaces
  - Files: workspace `package.json` scripts; CI workflow references
  - Fail on high/critical; capture summary into Review Packet.

- [ ] T051 Create `SECURITY_EXCEPTIONS.md` and exception template
  - File: `C:/Users/LENOVO/Training/SECURITY_EXCEPTIONS.md`
  - Include owner, mitigation plan, mentor approval evidence, 90-day review cadence.

## Phase 6: Polish
- [ ] T060 [P] Unit tests for Review Packet builders
  - Files: `C:/Users/LENOVO/Training/scripts/quality-gate/__tests__/*.test.js`

- [ ] T061 [P] Performance checks for gate build (<10 minutes end-to-end)
  - Files: CI workflow timers and threshold assertions

- [ ] T062 [P] Documentation: Update `CONTRIBUTING.md` with gate/demo guidance
  - File: `C:/Users/LENOVO/Training/CONTRIBUTING.md`

## Dependencies
- Preflight (T000) before Setup (T001–T003, T004)
- Setup (T001–T003, T004) before Tests (T010–T022)
- Tests before Core Implementation (T030–T033, T034, T035)
- Core before Demo/Governance/Release (T040–T044)
- Everything before Polish (T060–T062)
- Contract tests (T010–T016) independent → [P]
- A11y and E2E per page independent → [P]
- T030 depends on T004, T010–T016, T020–T022
- T031 depends on T030
- T034 depends on T030
- T040 depends on T031
- T044 depends on T031 and T040
- T035 depends on T031 and T044
- T041 depends on T044
- T042 depends on T044

## Parallel Execution Examples
```
# Group 1 — Contract tests (run in parallel):
Task.run T010; Task.run T011; Task.run T012; Task.run T013; Task.run T014; Task.run T015; Task.run T016

# Group 2 — Frontend checks (run in parallel after setup):
Task.run T020; Task.run T021; Task.run T022

# Group 3 — Core parallelizable:
Task.run T032; Task.run T033

# Group 4 — Setup parallelizable:
Task.run T002; Task.run T003; Task.run T004
```

## Validation Checklist
- [ ] All contracts have tests (health, posts list/create/get/put/patch/delete)
- [ ] A11y checks for posts list and create form assert zero critical/serious violations
- [ ] Frontend contract validation wired against `api/openapi.json`
- [ ] Review Packet includes test/coverage summaries, a11y, contract, security, governance, and manifest referencing demo URL and contract source-of-truth
- [ ] README updated with Run & Try and demo link
- [ ] Final release published with links to artifacts
- [ ] Type-check gating enforced for `frontend-next` and `api`
- [ ] Coverage thresholds enforced (statements ≥ 60%, branches ≥ 50%, functions ≥ 55%)
- [ ] PR checks published for each gate dimension and overall gate
- [ ] PR summary comment posted with key metrics and required references


