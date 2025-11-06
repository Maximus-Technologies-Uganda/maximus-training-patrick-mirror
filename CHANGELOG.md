## 2025-11-07

- fix(frontend-next): dedupe React modules in Vitest to restore hook dispatching during component and integration tests.

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
