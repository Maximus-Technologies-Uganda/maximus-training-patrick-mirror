# Implementation Plan: Frontend Foundations Week 10 – SSR & Hardening

**Branch**: `001-frontend-ssr-hardening` | **Date**: 2025-11-11 | **Spec**: `specs/001-frontend-ssr-hardening/spec.md`
**Input**: Feature specification for secure SSR posts rendering, health observability, design system v1, search & filter UX, evidence gates, and release hardening.

## Summary

Deliver a production-shaped frontend milestone with: token-authenticated SSR (contentful first paint), `/status` observability (always 200 JSON), design system primitives (tested + documented), search & filter with contract validation, parity between SSR and SWR, quality artifacts (coverage, a11y, E2E), trace propagation, retries/backoff, and release tagging. Approach uses server-only ID token fetcher, canonical query normalization, shared Zod schemas, OpenAPI contracts + Spectral lint, and Cloud Run environment hardening (min instances, IAM invoker binding).

## Technical Context

**Language/Version**: TypeScript (Node.js 20.x LTS; Next.js React 18+)  
**Primary Dependencies**: Next.js, React, SWR, Zod, google-auth-library, Playwright + axe-core, Spectral, Jest (locked), Tailwind (assumed; clarify)  
**Storage**: Upstream API (PostgreSQL via Neon) – frontend read-only  
**Testing**: Jest (unit/component + coverage instrumentation scoped to `frontend-next`), Playwright, Supertest, Spectral  
**Target Platform**: Cloud Run (frontend + API)  
**Project Type**: Web application (frontend consuming backend)  
**Performance Goals**: `/status` p95 ≤150ms (10‑min rolling), filtered posts SSR ≤1.5s p95, SSR first paint contentful ≥95% success  
**Constraints**: No client token exposure; secure logs; coverage & a11y gates; bounded retry <3s total  
**Scale/Scope**: Single week milestone; no create/edit flows

Confirmed Decisions:

1. Styling system: Tailwind final (no alternative evaluation this week; configure purge/content paths for `frontend-next/src/**/*`).
2. Next.js directory mode: `app/` confirmed as default.
3. Test runner: Jest locked (Vitest removed).

## Constitution Check

Skeleton constitution; inferred principles: test-first, observability, versioning. Design adds shared contract package & token parity script—justified for drift prevention and a11y consistency. Result: PASS.

## Project Structure

```text
frontend/
├── app/
│   ├── posts/
│   ├── status/
│   └── api/ (minimal)
├── components/        # DS primitives
├── styles/            # tokens.css / tailwind config
├── server/            # fetchApi.ts, trace utilities
├── contracts/         # local import or re-export from packages/contract
├── tests/             # unit/component/accessibility helpers

packages/
└── contract/          # Zod schemas + types (FilterState, HealthStatus)

tests/
├── e2e/               # Playwright (SSR proof, a11y)
├── contract/          # Supertest + Spectral
└── unit/              # Unit + component tests
```

**Structure Decision**: Web app with shared contract package to ensure SSR/SWR & API alignment. Avoid extra packages until token complexity increases.

## Complexity Tracking

| Violation           | Why Needed                         | Simpler Alternative Rejected Because                 |
| ------------------- | ---------------------------------- | ---------------------------------------------------- |
| `packages/contract` | Centralize schemas & types         | Duplication leads to drift & inconsistent validation |
| Token parity script | Early design token drift detection | Manual review is unreliable                          |

## Phase 0 Research Summary

See `research.md` for decisions (ID token, retry, cache key, status semantics, contracts). Outstanding clarifications listed above.

## Phase 1 Design Outputs

- Data model: `data-model.md` (entities & validation rules)
- Contracts: `contracts/openapi.yaml`, `contracts/query.zod.ts`
- Quickstart: `quickstart.md` (developer onboarding)

## Implementation Outline (High-Level)

1. Server fetch utility (`frontend-next/src/server/fetchApi.ts`) with ID token client + trace propagation header injection.
2. Canonical SWR/SSR key function in `frontend-next/src/lib/urlKey.ts` (single exported `buildPostsKey(filterState)` used by SSR loader + SWR hook tests).
3. SSR `posts` page: parse & validate query (Zod) → use canonical key; render table with initial data.
4. SWR client hook ensuring parity (hash compare test using JSON.stringify response bodies against SSR prop).
5. Retry/backoff wrapper (full-jitter) used by fetchApi; unit test simulates 3 timeouts verifying total wall-clock < 3000ms (jest fake timers + real timer fallback).
6. `/status` route: health fetch, always 200, `Cache-Control: no-store`, sensitive field filtering; shares fetchApi + key builder where relevant.
7. Logging middleware capturing `trace`, `route`, `latency_ms`, `status`, `upstream_status`; jest unit test asserts all fields present.
8. Token parity script integration (warn-only gate) referencing exported `design/tokens.json` file; CI step runs every PR and surfaces diff.
9. Spectral lint: add root `.spectral.yaml` with rules (operationId-required, no-any-schemas, error-schema-standard); add `npm run spectral` to PR checks.
10. Contract tests (Supertest) exercising accepted/rejected query combos via shared Zod schemas.
11. Playwright tests: SSR proof (JS disabled), a11y scan (axe), filtered states, screenshot artifact.
12. Coverage instrumentation: Jest config collects only `frontend-next/src/**/*.{ts,tsx}`; generate report to `docs/week-10/coverage/index.html`.
13. Storybook headless build with a11y addon: produce static output (fail build if any accessibility rule severity >= serious in DS stories log).
14. Artifact publishing: copy coverage,a11y,playwright outputs into `docs/week-10/{coverage,a11y,playwright}/index.html`; update README links; upload CI artifacts.
15. Release artifact generation & tag v10.0.0.

## Risks & Mitigations

| Risk                      | Mitigation                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------- |
| ID token misconfig        | Env equality unit test (FR-025), early fail                                            |
| Drift in cache key parity | Canonicalization tests & single function                                               |
| A11y regressions          | Axe run on key pages in CI                                                             |
| Performance regression    | Rolling p95 probe script for `/status` (CI job calculates 10-min p95; fails if >150ms) |
| Token drift               | CI parity warn script                                                                  |

## Next Steps (Phase 2 Tasks Preview)

- Implement fetchApi + trace util
- Add canonical key function (`src/lib/urlKey.ts`) + tests
- Build DS primitives iteratively with test-first + Storybook stories
- Integrate query validation & SSR logic
- Add SWR parity tests (SSR vs SWR hash compare)
- Implement `/status` endpoint + headers
- Implement retry logic + logging middleware
- Add `/status` probe job script (schedule + p95 calculation)
- Wire CI gates (coverage, a11y, spectral, token parity, probe)
- Evidence artifact generation & README link update

Execution Details:

- Test Runner Locked: Jest (collectCoverageFrom: ["frontend-next/src/**/*.{ts,tsx}"]).
- Spectral: `.spectral.yaml` rules all severity error: `operation-operationId` (missing operationId triggers error), `no-any-schemas` (empty object / implicit any triggers error), `standard-error-schema` (4xx/5xx without shared Error schema triggers error).
- /status Probe: `scripts/quality-gate/probe-status.ts` runs every 30s, stores last 20 samples (≈10 min). First sample treated as warmup (excluded from p95) to avoid cold-start skew. Computes p95; CI fails if p95 >150ms or availability <99%. Asserts each response `traceId` non-empty and appears exactly once in upstream API log set for correlation (flake guard).
- Retry Budget Test: `fetchApi.retry.test.ts` simulates 3 failing attempts (mock timeouts + jitter), asserts total elapsed <3000ms AND ≥ first attempt timeout (guards against misconfigured fake timers) using real `Date.now()` diff; ensures per-attempt timeout ≤800ms. `/status` health fetch uses same wrapper with ≤800ms per-attempt timeout.
- Deploy Steps (manual or scripted):
  1.  `gcloud run services update frontend-next --region=$GCP_REGION --image=$FRONTEND_IMAGE --set-env-vars API_BASE_URL=$API_BASE_URL,ID_TOKEN_AUDIENCE=$API_BASE_URL --min-instances=1 --concurrency=80 --execution-environment gen2` (add `--max-instances=100` only if load test requires burst capacity; omit `--no-cpu-throttling` unless always-on CPU is required)
  2.  `gcloud run services update api --region=$GCP_REGION --image=$API_IMAGE --set-env-vars API_BASE_URL=$API_BASE_URL --min-instances=1 --concurrency=80 --execution-environment gen2`
  3.  IAM binding structured check: `gcloud run services get-iam-policy api --region=$GCP_REGION --format=json > iam.json && node scripts/quality-gate/verify-invoker.js iam.json $FRONTEND_SERVICE_ACCOUNT` (script exits non-zero if binding absent)
- Storybook A11y Gate: After `build-storybook`, run `npm run a11y:storybook` (included in PR checks) which loads each generated story HTML and runs axe-core; CI fails deterministically on any serious+ violations.
- Trace Correlation CI: Parse API logs (structured JSON lines) ensuring each `/status` probe traceId appears exactly once with matching `trace` field; failure triggers non-zero exit.
- Canonical Key Location: `frontend-next/src/lib/urlKey.ts` single export `buildPostsKey(filterState)` used by SSR loader + SWR hook.
- Evidence Paths: Coverage → `docs/week-10/coverage/index.html`; A11y → `docs/week-10/a11y/index.html`; Playwright → `docs/week-10/playwright/index.html`; Probe JSON → `docs/week-10/status-probe.json`.
- Artifact Upload: CI job `pages:docs` or dedicated step zips `docs/week-10` and uploads; README post-processing script injects new links.
- Storybook: Add `@storybook/addon-a11y`; CI run: `build-storybook --quiet -o storybook-static`; optional a11y snapshot script scans stories DOM for violations.
- Token Parity: `npm run generate:token-parity` outputs diff referencing `design/tokens.json`; warnings surfaced in CI logs.

## Completion Criteria

All FR-001..FR-028 satisfied; SC-001..SC-008 metrics met; artifacts published; release notes tagged.
