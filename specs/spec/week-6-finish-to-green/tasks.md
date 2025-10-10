fix/phase-1-data-fetching
# Tasks: Finish-to-Green for frontend-next (Week 6)

**Input**: Design documents from `C:\Users\LENOVO\Training\specs\spec\week-6-finish-to-green\`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 1 — Fix Data Fetching (Blocking)

 - [X] T001 Create error/empty UI states in `frontend-next/src/components/PostsPageClient.tsx` (no indefinite loader)
 - [X] T002 [P] Add server route handler `frontend-next/src/app/api/posts/route.ts` GET proxy to API_BASE_URL (reuse existing handler; ensure timeout/retry(1))
 - [X] T003 Update client list page to fetch from `"/api/posts"` via SWR in `frontend-next/src/components/PostsPageClient.tsx`
 - [X] T004 Add SSR-safe server-only config usage in `frontend-next/src/app/api/posts/route.ts` for `API_BASE_URL` and optional `API_SERVICE_TOKEN`
- [X] T005 Add Playwright E2E assertion: posts list renders and loader clears in `frontend-next/src/tests/integration/posts.list.int.test.tsx`
- [ ] T006 Verify live deployment shows posts at Cloud Run URL; record evidence link in PR description

Dependencies: T002 before T003; tests (T005) should be in PR but run after implementation to validate.

---

## Phase 2 — Update README and Documentation

- [ ] T007 Update `frontend-next/README.md` Live Demos with frontend URL: `https://maximus-training-frontend-673209018655.africa-south1.run.app`
- [ ] T008 Update environment table with API URL: `https://maximus-training-api-673209018655.africa-south1.run.app`
- [ ] T009 Add "Run & Try" steps and env examples for local and production; link to spec and plan
- [ ] T010 Add Troubleshooting section for loader stuck scenarios and env misconfig

[P] T007–T010 can be completed in parallel (single file, but batched in one PR; keep commits small).

---

## Phase 3 — Audit and Surface CI Evidence

- [ ] T011 Update Quality Gate workflow to print `frontend-next` coverage block to `$GITHUB_STEP_SUMMARY` (include % and thresholds)
- [ ] T012 Upload `frontend-next` coverage artifact as `coverage-frontend-next` in the workflow
- [ ] T013 Upload Playwright HTML report artifact in the same workflow
- [ ] T014 Add live Cloud Run frontend URL to deployment job summary (post-deploy step)
- [ ] T015 Ensure Review Packet collects `coverage-frontend-next` and Playwright report

Dependencies: none between T011–T015 other than workflow file edits; sequence commits to keep diffs reviewable.

---

## Phase 4 — Surface A11y and Contract Test Artifacts

- [ ] T016 Upload Playwright a11y JSON/HTML artifacts from `frontend-next/src/tests/a11y` as `a11y-frontend-next`
- [ ] T017 Add concise a11y pass/fail summary to Quality Gate `$GITHUB_STEP_SUMMARY` with link to artifact
- [ ] T018 Upload contract test summaries from `frontend-next/src/tests/contracts` as `contract-frontend-next`
- [ ] T019 Add concise contract pass/fail summary to Quality Gate `$GITHUB_STEP_SUMMARY` with link to artifact

[P] T016–T019 can be prepared in parallel and committed together.

---

## Phase 5 — Tag the Final Release

- [ ] T020 Create and push git tag `v6.0.0`
- [ ] T021 Draft release notes with links: spec, Linear issue, green CI run, live demo URL
- [ ] T022 Publish release and verify links

Dependencies: T020 before T021–T022.

---

## Parallel Execution Examples

```
# Example group 1 (docs updates):
Task: "Update README Live Demos with frontend URL"
Task: "Update README env table with API URL"

# Example group 2 (CI evidence):
Task: "Print frontend-next coverage to step summary"
Task: "Upload coverage-frontend-next artifact"
Task: "Upload Playwright report"
```

## Notes
- Use `npm --workspace frontend-next run test:ci` and `npm --workspace frontend-next run test:e2e` in CI.
- Server handler must not expose secrets; use `API_BASE_URL` and optional `API_SERVICE_TOKEN`.
- Keep PRs focused: one phase per PR per plan.
=======
# Tasks: Finish-to-Green for frontend-next (Week 6)

**Input**: Design documents from `C:\Users\LENOVO\Training\specs\spec\week-6-finish-to-green\`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

---

## Phase 1 — Fix Data Fetching (Blocking)

- [ ] T001 Create error/empty UI states in `frontend-next/src/components/PostsPageClient.tsx` (no indefinite loader)
- [ ] T002 [P] Add server route handler `frontend-next/src/app/api/posts/route.ts` GET proxy to API_BASE_URL (reuse existing handler; ensure timeout/retry(1))
- [ ] T003 Update client list page to fetch from `"/api/posts"` via SWR in `frontend-next/src/components/PostsPageClient.tsx`
- [ ] T004 Add SSR-safe server-only config usage in `frontend-next/src/app/api/posts/route.ts` for `API_BASE_URL` and optional `API_SERVICE_TOKEN`
- [ ] T005 Add Playwright E2E assertion: posts list renders and loader clears in `frontend-next/src/tests/integration/posts.list.int.test.tsx`
- [ ] T006 Verify live deployment shows posts at Cloud Run URL; record evidence link in PR description

Dependencies: T002 before T003; tests (T005) should be in PR but run after implementation to validate.

---

## Phase 2 — Update README and Documentation

- [ ] T007 Update `frontend-next/README.md` Live Demos with frontend URL: `https://maximus-training-frontend-673209018655.africa-south1.run.app`
- [ ] T008 Update environment table with API URL: `https://maximus-training-api-673209018655.africa-south1.run.app`
- [ ] T009 Add "Run & Try" steps and env examples for local and production; link to spec and plan
- [ ] T010 Add Troubleshooting section for loader stuck scenarios and env misconfig

[P] T007–T010 can be completed in parallel (single file, but batched in one PR; keep commits small).

---

## Phase 3 — Audit and Surface CI Evidence

- [ ] T011 Update Quality Gate workflow to print `frontend-next` coverage block to `$GITHUB_STEP_SUMMARY` (include % and thresholds)
- [ ] T012 Upload `frontend-next` coverage artifact as `coverage-frontend-next` in the workflow
- [ ] T013 Upload Playwright HTML report artifact in the same workflow
- [ ] T014 Add live Cloud Run frontend URL to deployment job summary (post-deploy step)
- [ ] T015 Ensure Review Packet collects `coverage-frontend-next` and Playwright report

Dependencies: none between T011–T015 other than workflow file edits; sequence commits to keep diffs reviewable.

---

## Phase 4 — Surface A11y and Contract Test Artifacts

- [ ] T016 Upload Playwright a11y JSON/HTML artifacts from `frontend-next/src/tests/a11y` as `a11y-frontend-next`
- [ ] T017 Add concise a11y pass/fail summary to Quality Gate `$GITHUB_STEP_SUMMARY` with link to artifact
- [ ] T018 Upload contract test summaries from `frontend-next/src/tests/contracts` as `contract-frontend-next`
- [ ] T019 Add concise contract pass/fail summary to Quality Gate `$GITHUB_STEP_SUMMARY` with link to artifact

[P] T016–T019 can be prepared in parallel and committed together.

---

## Phase 5 — Tag the Final Release

- [ ] T020 Create and push git tag `v6.0.0`
- [ ] T021 Draft release notes with links: spec, Linear issue, green CI run, live demo URL
- [ ] T022 Publish release and verify links

Dependencies: T020 before T021–T022.

---

## Parallel Execution Examples

```
# Example group 1 (docs updates):
Task: "Update README Live Demos with frontend URL"
Task: "Update README env table with API URL"

# Example group 2 (CI evidence):
Task: "Print frontend-next coverage to step summary"
Task: "Upload coverage-frontend-next artifact"
Task: "Upload Playwright report"
```

## Notes
- Use `npm --workspace frontend-next run test:ci` and `npm --workspace frontend-next run test:e2e` in CI.
- Server handler must not expose secrets; use `API_BASE_URL` and optional `API_SERVICE_TOKEN`.
- Keep PRs focused: one phase per PR per plan.
main
