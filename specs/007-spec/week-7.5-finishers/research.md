# Research: Week 7.5 Finish‑to‑Green

## Decision 1: Test coverage enablement for frontend application
- Decision: Use Vitest for unit/component tests and Playwright for E2E. Ensure Vitest coverage includes `src/app/**` (server components and route handlers) with `json-summary`, `lcov`, and `html` outputs.
- Rationale: Aligns with existing stack and provides reliable coverage signals across server and client surfaces.
- Alternatives considered: Client‑only coverage (rejected: misses server surfaces); manual coverage parsing (rejected: brittle).

## Decision 2: SSR first‑paint for Posts
- Decision: Implement with Next.js Server Components. Convert `src/app/posts/page.tsx` to an async Server Component, fetch via `API_BASE_URL`, and pass `initialData` to `<PostsPageClient>` to skip initial client fetch/loading.
- Rationale: Meets first‑paint requirement while preserving existing client component logic for subsequent navigations.
- Alternatives considered: Client‑side fetch on mount (rejected), static placeholder (rejected).

## Decision 3: Review Packet artifacts
- Decision: Produce a browsable accessibility HTML report and lint the API contract, uploading both as CI artifacts with prescribed names.
- Rationale: Enables human and machine review of quality.
- Alternatives considered: Text‑only a11y logs (rejected: poor reviewer experience); skipping contract lint (rejected: quality risk).

## Decision 4: Deploy trail and README
- Decision: Ensure deploy job runs on default‑branch pushes, annotate summary with pipeline and live URLs, and update README with working links.
- Rationale: Improves traceability and reviewer trust.
- Alternatives considered: Manual posting of links (rejected: unreliable).

## Decision 5: Release
- Decision: Publish v7.0.x release with evidence links to Quality Gate, Review Packet, live demo, and spec.
- Rationale: Provides an auditable close‑out of the milestone.
- Alternatives considered: Tag only without notes (rejected: insufficient evidence).
