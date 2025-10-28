## Changelog

### 2025-10-31 (Masked token normalization)

### Fixed
- Normalize already-masked secret values such as `***` to the canonical `[redacted]` marker so tests and downstream log processors receive consistent output (`api/src/logging/redaction.ts`).

### 2025-10-31 (CORS log redaction coverage)

### Fixed
- Wrapped CORS wildcard violation logs with the shared sanitize helper so console output cannot leak email addresses and added targeted Jest coverage to guard the behavior (`api/src/middleware/cors.ts`, `api/tests/middleware/cors.redaction.spec.ts`).

### 2025-10-30 (Retention enforcement & correlation coverage)

### Added/Changed
- Enforced 30-day application log and 90-day audit log retention directly in code with helper utilities and request logger/audit coverage (`api/src/logging/retention.ts`, `api/src/middleware/logger.ts`, `api/src/logging/audit.ts`, `api/tests/logging/retention.spec.ts`, `api/tests/middleware/logger.retention.spec.ts`, `api/tests/logging/audit.schema.spec.ts`).
- Added a BFF integration test to confirm correlation headers flow from the Next.js route handler to the API and back (`frontend-next/tests/request-context.test.ts`).

### 2025-10-29 (Health endpoint safeguards)

### Changed
- `/health` now supports optional Firebase Admin connectivity pings and dependency timeouts to keep responses predictable (`api/src/routes/health.ts`, `api/tests/health/health.route.spec.ts`).
- Documented the new health check controls and environment variables (`README.md`).

### 2025-10-28 (Observability & request correlation - T024-T027, T039-T040 / DEV-677 to DEV-682)

### Added
- **T024 (DEV-677)**: W3C traceparent RFC 9110 parsing, generation, and propagation utilities (`api/src/lib/tracing.ts`).
- **T025 (DEV-678)**: Comprehensive `/health` endpoint with dependency probes and structured JSON responses (`api/src/routes/health.ts`).
- **T026 (DEV-679)**: Authentication documentation with sign-in flow, roles matrix, and troubleshooting (`README.md`).
- **T027 (DEV-680)**: CI latency micro-benchmark with p50/p95/p99 percentiles (`scripts/quality-gate/run-latency-bench.ts`).
- **T039 (DEV-681)**: Request correlation across FE→BFF→API tiers (`api/src/middleware/requestId.ts`, `frontend-next/src/middleware/requestId.ts`).
- **T040 (DEV-682)**: PII redaction engine for logs with retention policies (`api/src/logging/redaction.ts`).

### 2025-10-27 (Error envelope guard)

### Fixed
- API: Guarded access to `traceparent` in the error envelope helper to avoid calling `req.get` when unavailable in test doubles, preventing crashes on unauthorized paths and allowing 401 to be set (`api/src/lib/errors.ts`).

### 2025-10-28 (Admin moderation & revocation - DEV-672 to DEV-676)

### Added/Changed
- T020/T021: Enabled admins to moderate any post and enforced Firebase token revocation checks for admin-sensitive mutations. Session cookies now retain role/authTime claims; admin revocation guard audits denials with reasons (`api/src/core/auth/auth.routes.ts`, `api/src/core/posts/posts.routes.ts`, `api/src/middleware/auth.ts`, `api/src/middleware/firebaseAuth.ts`, `api/src/core/auth/auth.middleware.ts`).
- T022: Surfaced admin edit/delete controls in the Posts UI when the session role is `admin`, including SSR role parsing (`frontend-next/src/app/posts/page.tsx`, `frontend-next/components/PostsPageClient.tsx`, `frontend-next/components/PostsList.tsx`).
- T023: Documented US3 independent test criteria covering admin moderation, UI, and revocation evidence (`specs/008-identity-platform/plan.md`).
- Follow-up: Standardized posts controller unauthorized/forbidden handling via the shared error-envelope helper and added audit denial reasons for permission failures (`api/src/core/posts/posts.controller.ts`).
- Follow-up: Restored compatibility for the legacy CommonJS posts router by invoking the renamed `controller.delete` handler for DELETE requests (`api/src/routes/posts-routes.js`).

### Tests
- T020/T064: Added integration coverage for admin ownership overrides and revocation denials, plus updated audit schema assertions (`api/tests/posts-ownership.int.test.ts`, `api/tests/revocation.int.spec.ts`, `api/tests/logging/audit.schema.spec.ts`).
- T022: Extended frontend unit tests to assert admin controls render for non-owned posts (`frontend-next/src/tests/unit/PostsList.test.tsx`, `frontend-next/src/tests/unit/PostsPageClient.test.tsx`).
- Follow-up: Integration coverage now asserts security cache headers on admin-denied mutations to prevent accidental caching of 401/403 responses (`api/tests/posts-ownership.int.test.ts`, `api/tests/revocation.int.spec.ts`).

### 2025-10-27 (Posts service test harness fixes)

### Fixed
- Provided the in-memory posts repository when constructing the legacy `PostsService` in unit tests so recent constructor changes no longer throw at runtime (`api/src/core/posts/posts.service.test.ts`).

### 2025-10-27 (Owner mischief guards)

### Fixed
- T099: Reject client-supplied `ownerId` via schema-style validation at middleware layer. Requests with `ownerId` in body now return `422 { code: "VALIDATION_ERROR", message: "Request validation failed" }` and include `requestId`; error responses set `Cache-Control: no-store` (`api/src/middleware/stripIdentity.ts`).
- T068 nuance: Do not require `Accept` header for `DELETE` when it is missing (common 204 No Content). Prevents unintended `406` on admin deletes while preserving `406` when an explicit `Accept` excludes JSON (`api/src/middleware/contentType.ts`).

### 2025-10-27 (API coverage guard maintenance)

### Fixed
- Raised API branch coverage above the 80/70 gate by stubbing `better-sqlite3` in repository tests and exercising Firebase auth helper branches (`api/tests/sqlite-repository.test.js`, `api/tests/firebaseAuth.helpers.spec.ts`, `api/src/middleware/firebaseAuth.ts`).

### 2025-10-25 (US2 guards, validation, rate limit, audit, contracts - DEV-651 to DEV-657)

### Added/Changed
- T013 (DEV-651): Enforced owner-only guards in posts API; create sets `ownerId`, updates/deletes check `ownerId === userId` (`api/src/core/posts/posts.controller.ts`).
- T014 (DEV-652): Raised JSON body limit to 1MB and standardized `413` error envelope mapping (`api/src/config.ts`, `api/src/middleware/errorHandler.ts`).
- T015 (DEV-653): Default rate limit set to 10/min per key (user/IP); headers preserved on 2xx/429 (`api/src/config.ts`, existing `api/src/middleware/rateLimit.ts`).
- T016 (DEV-654): Added structured audit logs for create/update/delete with `requestId`/`traceId` capture (`api/src/logging/audit.ts`, wired in posts controller).
- T017 (DEV-655): Ensured OpenAPI per-operation security and standardized responses `401/403/422/429/413/503` (`specs/008-identity-platform/contracts/openapi.yaml`).
- T018 (DEV-656): Aligned contract tests with envelope codes and added coverage for error cases (`api/tests/contracts/posts.spec.ts`).
- T019 (DEV-657): Recorded independent test criteria in plan (`specs/008-identity-platform/plan.md`).

### 2025-10-25 (US2 Read-only mode)

### Added
- T036: Added read-only guard middleware that returns `503 { code: "SERVICE_UNAVAILABLE" }` on mutating requests when `READ_ONLY=true`, wired globally in the API pipeline. Re-enabled 503 contract tests for POST/PUT/DELETE (`api/src/middleware/readOnly.ts`, `api/src/app.ts`, `api/tests/contracts/posts.spec.ts`).

### 2025-10-27 (US2 CSRF follow-up - DEV-645 – DEV-650)

### Fixed
- Follow-up: BFF post mutation routes now require a client-supplied `X-CSRF-Token` header instead of minting it from cookies, restoring the double-submit guard (`frontend-next/src/app/api/posts/route.ts`, `frontend-next/src/app/api/posts/[id]/route.ts`).
- Follow-up: Local login fallback now issues a CSRF cookie alongside the session token so BFF mutations succeed offline (`frontend-next/src/app/api/auth/login/route.ts`).
- Follow-up: Firebase auth middleware now continues verifying Firebase ID tokens even when `X-Service-Authorization` is present so BFF proxied mutations stay authorized while preserving service token support (`api/src/middleware/firebaseAuth.ts`, `api/tests/auth.firebase.spec.ts`).
- Follow-up: Firebase auth middleware now falls back to cookie/session auth when Firebase Admin is unavailable, preserving local and CI flows (`api/src/middleware/firebaseAuth.ts`).
- Follow-up: Firebase auth middleware now clamps verification time within the ±5 minute tolerance window before calling `verifyIdToken`, ensuring the advertised clock-skew grace period actually applies (`api/src/middleware/firebaseAuth.ts`).

### 2025-10-26 (Env + HTTP hardening - DEV-622, DEV-623, DEV-624, DEV-625, DEV-626)

### Added/Changed
- T076: Enforced production env validation for API and frontend boot paths with unit coverage (`api/src/config.ts`, `api/src/config/env.ts`, `api/tests/env.validation.spec.ts`, `frontend-next/src/config/env.ts`).
- T084: Locked COOP/CORP/Permissions-Policy headers with deterministic contract test (`api/src/middleware/securityHeaders.ts`, `api/tests/security.headers.spec.ts`).
- T085: Normal responses now guarantee `Vary: Origin` with resilient header handling (`api/src/middleware/cors.ts`, `api/tests/contracts/cors.vary-normal.spec.ts`).
- T086: Expanded Accept negotiation guard across read/write routes and synced OpenAPI + contracts (`api/src/middleware/contentType.ts`, `api/tests/contracts/http.406.spec.ts`, `specs/008-identity-platform/contracts/openapi.yaml`).
- T087: Centralized `Cache-Control: no-store` enforcement for security-sensitive errors with comprehensive contracts (`api/src/lib/errors.js`, `api/src/middleware/errorHandler.ts`, `api/tests/contracts/errors.cache-control.spec.ts`).
- Follow-up: Frontend root layout now invokes env validation at module load, and `api/src/config.js` mirrors the production guard for CommonJS consumers.
- Follow-up: Regenerated `api/openapi.json` from the canonical spec to keep CI `contracts:check` passing.

### 2025-10-24 (US1 Anonymous Reader - DEV-641, DEV-642, DEV-643, DEV-644)
### 2025-10-24 (US1 Anonymous Reader - DEV-641, DEV-642, DEV-643, DEV-644)

### Added/Changed
- T007: Documented public GET endpoints as unauthenticated in spec and OpenAPI (`specs/008-identity-platform/spec.md`, `specs/008-identity-platform/contracts/openapi.yaml`).
- T008: Auth-aware UI hides mutation controls when signed out (`frontend-next/components/PostsPageClient.tsx`, `frontend-next/components/PostsList.tsx`).
- T009: Recorded independent test criteria in plan (`specs/008-identity-platform/plan.md`).
- T043: Implemented a11y specifics: polite vs assertive live regions, focus-to-first-invalid in forms, global visible focus ring, and Escape-close hook for modals (`frontend-next/components/NewPostForm.tsx`, `frontend-next/src/app/globals.css`, `frontend-next/components/useEscapeKey.ts`).

### 2025-10-23 (Phase 2 docs + guards - DEV-636, DEV-637, DEV-638, DEV-639, DEV-640)

### Added/Changed
- T107: Added explicit 401 vs 403 semantics to `specs/008-identity-platform/spec.md` (Edge Cases) and `specs/008-identity-platform/plan.md` (Production Hardening policies).
- T108: Implemented rate-limit key precedence (`userId || ip`) via `api/src/middleware/rateLimit.ts`; wired in `api/src/app.ts`. Added tests `api/tests/middleware.rate-limit.key.spec.ts`.
- T109: CSP nonce rotation test present (`api/tests/security.csp-nonce.spec.ts`).
- T110: OpenAPI servers prod guard in `scripts/validate-openapi.ts` (fails if a server URL contains `localhost` when `NODE_ENV=production`).
- T111: Error envelope now includes `requestId` and optional `traceId` on 4xx/5xx; updated `api/src/middleware/errorHandler.ts` and `api/src/core/auth/auth.middleware.ts`. Added contract test `api/tests/contracts/errors.traceid.spec.ts`.

### 2025-10-23 (Week 8 Day 2 spectral lint unblocking - DEV-617, DEV-620)

### Fixed
- **Contracts**:
  - Updated the `ErrorEnvelope.details` schema to use explicit null/object/array unions so Spectral 6.11.0 accepts all error examples without nullable/type conflicts, restoring passing contract lint and drift checks for the Week 8 hardening PR.

### 2025-10-25 (Frontend dev CORS parity - DEV-EXEMPT)

### Fixed
- **Frontend**:
  - Added `PATCH` to development CORS allow-methods for BFF routes so local updates match server capabilities. (DEV-EXEMPT)
- **API**:
  - Ensured CORS preflight responses advertise `PATCH` to unblock cross-origin updates against posts endpoints. (DEV-EXEMPT)

### 2025-10-23 (Week 8 Day 2 hardening CI fix - DEV-EXEMPT)

### Fixed
- **Contracts**:
  - Synced `api/openapi.json` from canonical `specs/008-identity-platform/contracts/openapi.yaml` to resolve CI contract drift failure for PR #685 (T054/T058). Includes Err406 responses, requestId in error envelope, and updated servers list.

### 2025-10-24 (Posts offline fallback parity - DEV-EXEMPT)

### Fixed
- **Frontend**:
  - Added local fallback handling for `/api/posts/[id]` PATCH/DELETE routes so edit and delete flows remain functional when the upstream API is unavailable in local or CI environments. (DEV-EXEMPT)

### 2025-10-24 (Identity rate limiter hardening - DEV-636 follow-up)

### Fixed
- **API**:
  - Rate limiter now evaluates Express trust proxy functions per request and ignores unauthenticated `X-User-Id` headers so spoofed values cannot bypass throttling. Added regression tests. (DEV-636)

### 2025-10-22 (Identity Platform groundwork nits - DEV-EXEMPT)

### Changed
- **CI**:
  - Switched OpenAPI drift check to `pnpm run contracts:check` for consistency with pnpm-based toolchain.
  - Added `gate:secrets` step to validate example env files for secret hygiene in CI.
- **Docs**:
  - Cleaned encoding artifacts in `specs/008-identity-platform/quickstart.md` and clarified `SESSION_SECRET` requirement (>= 32 chars) and console navigation arrows.
- **Contracts**:
  - Aligned OpenAPI `servers` URL to `http://localhost:3000` to match dev defaults.
- **Repo**:
  - Declared `packageManager: pnpm@9.x` in root `package.json` to align with Corepack usage.

### 2025-10-20 (Release v7.0.0: Finish-to-Green - DEV-590, DEV-591, DEV-592, DEV-593, DEV-594, DEV-595)

### Added
- **Frontend**:
  - SSR instrumentation logging for initial post render timing (DEV-593)
- **Documentation**:
  - Application Health Runbook for auditors/operators at `docs/runbook.md` (DEV-594)
  - Release notes documentation in RELEASE-NOTES.md (DEV-592)
- **CI/CD**:
  - 21-day retention policy for all CI artifacts (coverage, a11y, contract) (DEV-595)

### Changed
- **Release Management**:
  - Tagged v7.0.0 with comprehensive release notes (DEV-590)
  - Published GitHub Release with evidence links (DEV-591)

### 2025-10-23 (Posts adapter pagination fix - DEV-EXEMPT)

### Fixed
- **API**:
  - Updated the legacy posts service adapter to delegate pagination to the repository so existing records appear in list responses after restarts. (DEV-EXEMPT)

### 2025-10-22 (Posts SSR auth fix - DEV-EXEMPT)

### Fixed
- **Frontend**:
  - Updated the `/posts` server component to fetch via the authenticated `/api/posts` proxy so Cloud Run SSR requests include IAP credentials and scoped cookies.

### 2025-10-21 (Posts controller 404 fixes - DEV-EXEMPT)

### Fixed
- **API**:
  - Hardened posts controller handlers against `null` responses from legacy service adapters so missing posts correctly return 404 and avoid null dereferences during write operations. (DEV-EXEMPT)

### 2025-10-20 (Posts API bugfixes - DEV-EXEMPT)

### Changed
- **API**:
  - Ensured `PostsService.replace` coerces repository timestamps to `Date` instances before returning domain objects.
- **Frontend**:
  - Limited PATCH/DELETE post proxy routes to forward only the `session` cookie to the upstream API.

### 2025-09-04 (Week 2 Wrap-up - DEV-81, DEV-82, DEV-83, DEV-84)

### Added
- **Expense App**:
  - Enhanced help text with examples for `list`, `total`, `report`, and `clear` commands. (DEV-82)
- **To-Do App**:
  - Priority ordering in `list` output (high > medium > low). (DEV-82)
- **Stopwatch App**:
  - Path validation for `--out` flag, including directory existence and write permissions. (DEV-82)
- **Quote App**:
  - Deterministic random selection with seed support for predictable tests. (DEV-82)
- **Docs**:
  - Updated root README.md to emphasize Coverage Index artifact access. (DEV-83)
- **CHANGELOG**:
  - Added entries for all Week 2 PRs and improvements. (DEV-84)

### Changed
- **Expense App**:
  - Improved error messages and usage examples in help output. (DEV-82)
- **To-Do App**:
  - List command now sorts tasks by priority descending. (DEV-82)
- **Stopwatch App**:
  - Added user-friendly error messages for invalid export paths. (DEV-82)
- **Quote App**:
  - `selectRandom` function supports seeded randomness for test determinism. (DEV-82)

### Fixed
- **Testing**:
  - Added 1-2 tests per app for the new micro-improvements. (DEV-82)

### Notes
- These capstone improvements enhance usability, reliability, and testability across all apps. (DEV-81, DEV-82)
- Documentation updates ensure users can easily access coverage reports and understand CLI behavior. (DEV-83, DEV-84)

### 2025-09-04 (Exit Codes & Helpers - DEV-73, DEV-74)

### Added
- **Shared Helpers**:
  - Created `helpers/args.js` with common argument parsing, flag handling, and exit code utilities. (DEV-74)
- **Exit Code Standardization**:
  - Standardized all apps to use 0 for success and 1 for errors consistently. (DEV-73)
- **Expense App**:
  - Integrated shared helpers for parsing and error handling. (DEV-73, DEV-74)
- **To-Do App**:
  - Used shared helpers and consistent exit codes. (DEV-73, DEV-74)
- **Stopwatch App**:
  - Replaced process.exitCode with standardized exit functions. (DEV-73, DEV-74)
- **Quote App**:
  - Updated to use shared exit helpers and consistent codes. (DEV-73, DEV-74)

### Changed
- **All Apps**:
  - Refactored to use `helpers/args.js` for argument parsing and error handling. (DEV-74)
  - Ensured all error paths exit with code 1, success with code 0. (DEV-73)

### Notes
- This refactoring reduces code duplication and ensures consistent behavior across all CLI applications. (DEV-73, DEV-74)

### 2025-09-04 (.gitattributes - DEV-72)

### Added
- **Repo Hygiene**:
  - Added `.gitattributes` with `* text=auto` for EOL normalization across operating systems. (DEV-72)

### Notes
- Ensures golden-file tests and other text files remain stable across Windows, Linux, and macOS. (DEV-72)

### 2025-09-04 (Expense Error-Paths - DEV-64)

### Added
- **Expense App**:
  - Added comprehensive tests for invalid months, category-only/month-only/both/no-flags scenarios. (DEV-64)
  - Tests for edge months (30/31 days) and error-path validation. (DEV-64)

### Changed
- **Expense App**:
  - Improved core functions with better error handling for filters and sums. (DEV-64)

### Notes
- Achieved ≥50% coverage for `expense/src/core.js` with systematic test implementation. (DEV-64)

### 2025-09-04 (To-Do Coverage & Tests - DEV-59, DEV-60, DEV-61, DEV-62, DEV-63)

### Added
- **To-Do App**:
  - Created `todo/src/core.js` with pure functions for parsing, validation, and filtering. (DEV-60)
  - Added table-driven tests for `--dueToday` boundaries (yesterday, today, tomorrow). (DEV-62)
  - Implemented `--highPriority` semantics with tests. (DEV-63)
  - Added duplicate rule tests including error exit paths. (DEV-63)
  - Core unit tests replacing child_process-based integration tests. (DEV-61)

### Changed
- **To-Do App**:
  - Refactored CLI to use core functions, improving testability. (DEV-60, DEV-61)
  - Achieved 56.7% statement coverage and 100% for core module. (DEV-59)

### Fixed
- **To-Do App**:
  - Resolved 0% coverage issue with pure functions and deterministic tests. (DEV-59)

### Notes
- Systematic testing approach hit error paths and ensured no randomness in assertions. (DEV-59, DEV-61, DEV-62, DEV-63)

### 2025-09-03

### Added
- **Stopwatch**:
  - Golden-file tests for `export` output (populated and empty states) with newline normalization for cross-OS stability. (DEV-13)
- **Repo Hygiene**:
  - Enforced EOL normalization via `.gitattributes` (`* text=auto eol=lf`). (DEV-14)
  - Ensured each app has Jest coverage reporters (`json`, `lcov`, `text-summary`); updated `stopwatch/jest.config.js`. (DEV-15)
  - Added Quality Gate workflow to post coverage percentage table on PRs. (DEV-16)

### Changed
- **Stopwatch**:
  - Tests refactored to use golden files and stable normalization; added empty-state golden to assert headers-only output. (DEV-13)

### Notes
- These changes improve test determinism across platforms and provide fast feedback on PRs via coverage summary comments. (DEV-14–DEV-16)

### 2025-09-03 (Docs & Hygiene - DEV-12)

### Added
- **Docs**:
  - Updated per-app READMEs to reflect current flags and outputs for `expense`, `todo`, `stopwatch`, and `quote`. (DEV-18)
  - Root README now includes instructions to access the CI coverage artifact and PR coverage table. (DEV-19)
- **CI**:
  - Coverage report HTML is uploaded as an artifact with an index page across apps. (DEV-19)
- **Process**:
  - Added PR template enforcing links to Linear issues and required artifacts/snippets. (DEV-21)

### Changed
- **Docs**:
  - `todo` README uses `complete` instead of `toggle`; removed unsupported `filter` command in favor of list flags. (DEV-18)
  - `quote` README updated to use `quote/src/index.js` entry point. (DEV-18)
  - `expense` README now documents `clear` command and tightened usage notes. (DEV-18)


### 2025-08-30

### Added
- **Expense Tracker**:
  - `report` command with `--month=YYYY-MM` filter.
  - `list` command with filtering support (e.g., by month/category).
  - `total` command with filters (e.g., by month/category).

- **To-Do App**:
  - `add` command supporting `--due=YYYY-MM-DD` and `--priority=low|medium|high` flags.
  - Duplicate guard preventing addition of a task with the same text and due date.

- **Stopwatch**:
  - Core commands: `start`, `stop`, `lap`, and `status`.
  - `export` command with `--out=<filename>` flag and empty-state handling (prints a message and avoids file creation when there are no laps).

- **Testing**:
  - Added comprehensive test suites across Expense Tracker, To-Do App, and Stopwatch to ensure functionality and robustness, including edge cases and CLI error handling.
