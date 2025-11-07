## 2025-11-07 (Phase 2 - Playwright E2E)

- fix(ci): add frontend workspace coverage generation to quality-gate workflow for comprehensive coverage reporting.
- fix(frontend-next): add pagination status announcements to live region (aria-live="polite") for screen reader users navigating pages.
- test(playwright): fix ErrorState accessibility test selector to exclude Next.js route announcer (use `.flex` class discriminator).
- test(playwright): fix keyboard navigation test to use aria-current selector for unambiguous page indicator matching.
- test(playwright): improve SSR performance budget test resilience when API unavailable (graceful fallback to client-side rendering).

## 2025-11-07

- fix(frontend-next): externalize React dependencies when transpiling the testing-library shim fallback to avoid duplicate bundles.
- fix(frontend-next): preserve react-dom legacy entry when deduplicating nested module requires in Vitest setup.
- fix(frontend-next): invoke auth login API before persisting session to local storage for the new login page.
- fix(frontend-next): mirror search query when server-rendering posts to avoid unfiltered initial content.
- fix(frontend-next): refresh newly created posts using the active sort and search cache key.
- fix(frontend-next): dedupe React modules in Vitest to restore hook dispatching during component and integration tests.
- feat(frontend-next): add aria-live pagination announcements and isolate SWR cache per posts page instance.
- test(frontend-next): cover shared pagination URLs across unit, integration, and Playwright suites.
- test(frontend-next): rework posts pagination integration to use SWR-backed tsx spec with explicit fetch stubbing.
- fix(frontend-next): refine derived total page counts for cursor pagination fallbacks and document inference strategy.
- test(frontend-next): wrap posts pagination integration interactions in React act to suppress async update warnings.
- chore(frontend-next): document SWR cache isolation, aria-live assertive guidance, and local sort timestamp fallbacks.

## 2025-11-06

- fix(frontend): forward session cookies during SSR posts fetch so authenticated users receive initial data.
- feat(frontend): add SSR sort parameter support with validated URL query parsing.
- feat(frontend): apply design token colors (text-text, text-muted, bg-surface, error).
- feat(frontend): add user-facing sort dropdown (Newest/Oldest/Title A-Z/Z-A).
- test(frontend): add comprehensive SSR integration tests.
- test(frontend): add Playwright performance budget enforcement (<2s page load time).
- refactor(frontend): centralize PostSort type in schemas.ts with Zod validation.

## 2025-11-05

- fix: declare esbuild as a devDependency so verify-node-version tests can compile the TypeScript CLI.
- fix: remove unsupported `projects_v2_item` trigger from GitHub Projects automation workflow to restore GitHub validation.
- fix: import ReactElement in design system Header stub to satisfy strict type checking.
- fix: replace `Math.random` id generation in `Input` with deterministic `useId` and improved aria wiring.
- feat: add stubbed `Header` component referenced by the root layout to restore compile-time completeness.

## 2025-11-04

- fix: resync package-lock.json to include `@types/testing-library__jest-dom` for frontend-next workspace.

## 2025-11-03

- fix: ensure pre-push Tier 4 simulation fails when act encounters errors by preserving the original exit code.
- fix: align middleware exports with new rate limiter, health router, and logging retention expectations.

## 2025-10-30

- chore: add Playwright MCP server (`@playwright/mcp`) as devDependency at workspace root and script `mcp:playwright` to start the server via `--stdio`.
- note: pnpm configured with `node-linker=hoisted` to avoid Windows symlink issues.
- fix: skip quality gate artifact enforcement when Playwright a11y tests or OpenAPI spec detection report no outputs.
- chore: resync `api/openapi.json` with canonical identity platform OpenAPI spec.
