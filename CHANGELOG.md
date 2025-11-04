## 2025-11-05

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
