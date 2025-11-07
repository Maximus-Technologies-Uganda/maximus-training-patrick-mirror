## 2025-11-07

- fix: add `resolve.alias` to `frontend-next/vitest.config.ts` to correctly resolve `@/` path aliases during test execution. This fixes module resolution errors in Vitest for imports like `@/components/PostsPageClient` that were failing in unit, integration, and a11y tests.
- fix: add coverage directory validation before artifact upload in GitHub Actions `quality-gate.yml` workflow to prevent "No files found" errors when coverage generation fails, improving error visibility and preventing silent CI failures across frontend-next, api, and monorepo workspaces.

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
