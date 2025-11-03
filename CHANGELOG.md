## 2025-11-03

- fix: align middleware exports with new rate limiter, health router, and logging retention expectations.

## 2025-10-30

- chore: add Playwright MCP server (`@playwright/mcp`) as devDependency at workspace root and script `mcp:playwright` to start the server via `--stdio`.
- note: pnpm configured with `node-linker=hoisted` to avoid Windows symlink issues.
- chore: resync `api/openapi.json` with canonical identity platform OpenAPI spec.
