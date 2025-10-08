# Tasks: Week 6 – Finish-to-Green for frontend-next

**Input**: Design documents from `C:\Users\LENOVO\Training\specs\006-spec\week-6-full-plan\`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Phase 1 (PR 1): CI Gate & Review Packet Integration

- [X] T001 Update Review Packet workflow to add frontend-next job in `C:\Users\LENOVO\Training\.github\workflows\review-packet.yml` (job: `packet-frontend-next`).
- [X] T002 Configure job steps to run in `C:\Users\LENOVO\Training\frontend-next`: `npm ci`, `npm run test:ci`.
- [X] T003 Ensure coverage output path `C:\Users\LENOVO\Training\frontend-next\coverage\coverage-summary.json` and `lcov.info` are generated.
- [X] T004 Upload artifact named `coverage-frontend-next` with files: `coverage-summary.json`, `lcov.info`.
- [X] T005 Add Playwright report/screenshot upload steps: glob `C:\Users\LENOVO\Training\docs\ReviewPacket\a11y\html\**` and `C:\Users\LENOVO\Training\frontend-next\test-results\**`.
- [X] T006 Extend `C:\Users\LENOVO\Training\.github\workflows\quality-gate.yml` to parse `frontend-next` coverage from `C:\Users\LENOVO\Training\frontend-next\coverage\coverage-summary.json` and print totals in `$GITHUB_STEP_SUMMARY` under a distinct heading.
- [X] T007 [P] Add helper script if needed at `C:\Users\LENOVO\Training\frontend-next\scripts\print-coverage-summary.mjs` and call from Gate job.
- [X] T008 Ensure PR references Linear issue and this spec in PR body using `C:\Users\LENOVO\Training\PR_BODY.md` template.
- [ ] T009 Merge and trigger `main` run; verify Packet shows `coverage-frontend-next` and Gate summary includes `frontend-next` block.

## Phase 2 (PR 2): Cloud Run SSR Demo + README

 - [X] T010 Verify `C:\Users\LENOVO\Training\frontend-next\Dockerfile` uses Next.js standalone output and `PORT` env; adjust as needed.
- [X] T011 Implement server Route Handler at `C:\Users\LENOVO\Training\frontend-next\src\app\api\posts\route.ts` that calls backend API with service identity; client fetches `/api/posts`.
- [X] T012 [P] Update any client components to use relative `/api/posts` instead of direct `NEXT_PUBLIC_API_URL`.
- [X] T013 Configure `C:\Users\LENOVO\Training\.github\workflows\deploy-cloud-run.yml` (or `cloudbuild.yaml`) for build → deploy:
  - region `africa-south1`, service `maximus-training-frontend`, min-instances `1`, registry `gcr.io`.
- [X] T014 Add job summary step to echo Cloud Run URL upon deploy completion.
- [X] T015 Update `C:\Users\LENOVO\Training\frontend-next\README.md` with sections: `## Live Demos` (actual URL) and `## Run & Try (Next.js)` (env table; note server handlers).
- [X] T016 Capture screenshots of Loading → Data on `/posts` and store under `C:\Users\LENOVO\Training\docs\ReviewPacket\screenshots\frontend-next\`.
- [X] T017 Ensure Review Packet workflow uploads screenshots directory.

## Phase 3 (PR 3): A11y Smokes + Client Contract Checks

- [ ] T018 Add shared types file at `C:\Users\LENOVO\Training\frontend-next\src\lib\types\api.ts` with UI-used fields and error envelope shape.
- [ ] T019 Create Playwright a11y tests for `/` and `/posts` in `C:\Users\LENOVO\Training\frontend-next\tests\a11y.home.spec.ts` and `...\tests\a11y.posts.spec.ts` using `@axe-core/playwright`.
- [ ] T020 Ensure Playwright HTML reporter output persists to `C:\Users\LENOVO\Training\docs\ReviewPacket\a11y\html` (already configured); add screenshot capture on failure.
- [ ] T021 [P] Create contract test success path `C:\Users\LENOVO\Training\frontend-next\tests\contract.success.spec.ts` validating `id`, `title`, `body`, `timestamps` with Zod.
- [ ] T022 [P] Create contract test error path `C:\Users\LENOVO\Training\frontend-next\tests\contract.error.spec.ts` asserting `{ error: { code: number, message: string } }` for 400/404.
- [ ] T023 Update Review Packet workflow to include Playwright reports and contract summaries in artifacts.
- [ ] T024 Add Gate job steps to summarize a11y and contract results into `$GITHUB_STEP_SUMMARY` under `frontend-next` block.

## Phase 4 (PR 4): Governance Cleanup & Release

- [ ] T025 Update private repo enforcement: keep `C:\Users\LENOVO\Training\.github\workflows\pr-require-linear.yml` and `spec-sync-to-linear.yml` enabled; ensure mirror repo only has `mirror.yml` publish.
- [ ] T026 Disable failing/legacy workflows: e.g., `pages-deploy.yml`, unused `main.yml`, or others not `quality-gate.yml`/`review-packet.yml` (comment out or add `if: false` with note).
- [ ] T027 Confirm Actions dashboard green on `main` by running core workflows and removing red noise.
- [ ] T028 Tag release `v6.0.0` with notes linking: spec, Linear issue, Gate run, Packet, Cloud Run URL; update `C:\Users\LENOVO\Training\RELEASE-NOTES.md`.
- [ ] T029 Verify mirror receives publish-only pushes and does not run PR checks (review `C:\Users\LENOVO\Training\.github\workflows\mirror.yml`).

## Parallel Execution Guidance

- After T002 completes, the following can run in parallel:
  - [P] T003 coverage generation (implicit via test:ci)
  - [P] T004 artifact upload config
  - [P] T005 report/screenshot upload config
  - [P] T007 helper script creation
- In Phase 2, T011 and T012 touch different files → can run in parallel after confirming API contract.
- In Phase 3, T021 and T022 are independent test files → run in parallel.

## Dependency Notes

- Phase 1 must merge before Phase 2 (Gate/Packet evidence first). 
- Phase 2 deploy URL required before README and screenshot tasks finalize.
- A11y/contract artifacts (Phase 3) depend on app routes and types from Phases 1-2.
- Governance and release (Phase 4) require all prior phases to be green on `main`.


