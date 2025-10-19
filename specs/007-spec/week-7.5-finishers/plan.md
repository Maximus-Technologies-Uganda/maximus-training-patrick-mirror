# Implementation Plan: Week 7.5 Finish‑to‑Green Punch List

**Branch**: `007-spec/week-7.5-finishers` | **Date**: 2025-10-17 | **Spec**: specs/007-spec/week-7.5-finishers/spec.md
**Input**: Feature specification from `specs/007-spec/week-7.5-finishers/spec.md`

## Summary

Deliver five PRs to close the Week 7.5 milestone: SSR first paint for Posts, non‑zero coverage and visible totals in CI, a11y HTML and API contract artifacts in the Review Packet, reliable deploy trail with accurate README URLs, and a published evidence‑linked v7.0.x release.

## Technical Context

**Language/Version**: TypeScript, React 18, Next.js (App Router)  
**Primary Dependencies**: Next.js, Vitest, Playwright  
**Storage**: N/A  
**Testing**: Vitest (unit/component with V8 coverage), Playwright (E2E)  
**Target Platform**: Web application  
**Project Type**: Web (frontend + CI workflows)  
**Performance Goals**: First paint shows content; CI artifacts visible and downloadable  
**Constraints**: Deploy runs on default‑branch pushes; release version format v7.0.x  
**Scale/Scope**: Repository‑wide CI changes; single page SSR behavior

## Constitution Check

Gates inferred from constitution are currently placeholders; no explicit violations detected. Proceed with Phase 0 to resolve technology unknowns (testing stack, SSR surface) and update this section post‑design.

## Project Structure

```
specs/007-spec/week-7.5-finishers/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

**Structure Decision**: Use existing monorepo: `frontend-next` for SSR and coverage, `.github/workflows` or equivalent CI for artifacts and deploy trail, root `README.md` updates.

---

## Execution Plan (Five PRs)

### PR 1: SSR First Paint for Posts

Checklist:
- [ ] Convert `frontend-next/src/app/posts/page.tsx` to an async Server Component using Next.js App Router
- [ ] Fetch posts on the server using `API_BASE_URL`; render initial HTML with post content
- [ ] Pass `initialData` prop to `<PostsPageClient>` and skip its initial client fetch/loading state
- [ ] Ensure client loader only appears during client‑side navigations
- [ ] Add regression test: initial HTML contains at least one post title; no "Loading" prior to content
- [ ] Update documentation snippet in `frontend-next/README.md` (or root `README.md`) describing SSR behavior

Acceptance alignment: User Story 1, FR‑001 to FR‑003

### PR 2: Frontend‑Next Coverage Enablement

Checklist:
- [ ] Verify `frontend-next/vitest.config.ts` coverage options: enable V8, outputs `json-summary`, `lcov`, `html`
- [ ] Ensure `coverage.include` targets `src/app/**` and includes server components and route handlers
- [ ] Add unit test for a Server Component (e.g., `src/app/posts/page.tsx` rendering with provided data)
- [ ] Add unit test for a route handler in `src/app/api/**/route.ts`
- [ ] Confirm CI collects and uploads coverage artifacts; compute totals (Quality Gate step)
- [ ] Emit a distinct "Coverage Totals" block (statements and lines) in the Quality Gate summary
- [ ] Add >0% threshold to fail zero‑coverage misconfiguration

Acceptance alignment: User Story 2, FR‑004 to FR‑006

Files likely touched:
- `frontend-next/vitest.config.ts`
- `scripts/quality-gate/*` (totals emission)
- Root `cloudbuild.yaml` (or `.github/workflows/*` if GitHub Actions is used)

### PR 3: Review Packet Artifacts (A11y HTML + API Contract)

Checklist:
- [ ] Integrate accessibility scanning to produce a browsable HTML report
- [ ] Upload a11y HTML report artifact named `a11y-frontend-next` (from `docs/ReviewPacket/a11y/html/`)
- [ ] Lint OpenAPI specification with Spectral (or equivalent)
- [ ] Upload API contract artifact named `contract-api` (e.g., `contract/report.json` or `api/openapi.json`)
- [ ] Ensure CI marks workflow unsuccessful if artifacts missing or lint fails above threshold
- [ ] Add brief verification steps to `docs/release-evidence` or `README.md`

Acceptance alignment: User Story 3, FR‑007 to FR‑008

### PR 4: CI Deploy Trail Reliability & README URLs

Checklist:
- [ ] Ensure deploy job is not skipped on default‑branch pushes (evaluate conditions/filters)
- [ ] Annotate deploy job summary with pipeline run link and live service URL
- [ ] Update `README.md` to replace placeholders with working Cloud Run demo URLs
- [ ] Add CI check to prevent placeholder URLs from reappearing (simple assertion/grep)
- [ ] Add a smoke check step that curls the live URL post‑deploy and prints status

Acceptance alignment: User Story 4, FR‑009 to FR‑011

Files likely touched:
- Root `cloudbuild.yaml` (deploy job conditions, summary annotations)
- `README.md` (replace placeholders with live URLs)

### PR 5: Final Release v7.0.x

Checklist:
- [ ] Create and push tag `v7.0.x` (x = next patch)
- [ ] Publish GitHub release with links to green Quality Gate run, Review Packet, live demo, and this spec
- [ ] Verify release appears publicly and links resolve
- [ ] Add release link to `RELEASE-NOTES.md` and `README.md`

Acceptance alignment: User Story 5, FR‑012 to FR‑013

Files likely touched:
- `RELEASE-NOTES.md`
- `README.md`

---

## Phase 0: Outline & Research

Unknowns extracted from Technical Context:
- None. Decisions recorded in research.md (Vitest/Playwright coverage scope; Next.js Server Components for SSR).

Research tasks:
- Research enabling coverage for server components and route handlers in the chosen test runner
- Research SSR data‑fetching pattern for Posts and initial HTML verification strategies

Outputs: `specs/007-spec/week-7.5-finishers/research.md`

## Phase 1: Design & Contracts

Artifacts to generate:
- Data model abstraction for Posts list surface: `data-model.md`
- Contracts directory for evidence artifacts notes: `contracts/README.md`
- Quickstart with how to run tests, generate coverage, and produce artifacts: `quickstart.md`

## Constitution Check (Post‑Design)

Re‑evaluate after Phase 0/1; if gates exist in the constitution, ensure compliance or document justified exceptions in Complexity Tracking.
