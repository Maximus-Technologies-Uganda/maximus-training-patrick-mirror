## Implementation Plan — Finalize Week 5 API

**Branch**: 003-finalize-the-week  
**Spec**: C:\Users\LENOVO\Training\specs\003-finalize-the-week\spec.md  
**Plan file**: C:\Users\LENOVO\Training\specs\003-finalize-the-week\plan.md

### Scope
- Add and surface contract test results for the API.
- Implement a final rate‑limiting validation test.
- Update documentation with a "Run & Try" section and provide a Postman collection.

## Tech Stack Confirmation
- Runtime: Node.js (>=18), CommonJS modules
- Web: Express 5 (`express`), security (`helmet`, `cors`), logging (`morgan`)
- Rate limiting: `express-rate-limit@8` (standard headers enabled)
- Validation: `zod@4`
- Testing: `jest@29`, `supertest@7`, `jest-openapi@0.14`
- Spec source: OpenAPI at C:\Users\LENOVO\Training\specs\002-posts-api\contracts\openapi.yml
- Data: In-memory repository by default; optional SQLite via `better-sqlite3` when `POSTS_REPOSITORY=sqlite`

## Testing Strategy
### 1) Contract Tests (API ↔ OpenAPI)
- Keep/expand `api/tests/contract.test.js` verifying all core endpoints against the OpenAPI spec via `jest-openapi`.
- Ensure negative/edge scenarios are covered (invalid query, 404s, validation errors) — already present; add cases as spec evolves.
- Surface results:
  - Add a JSON summary output from Jest and convert to a readable Markdown summary.
  - Proposed outputs:
    - Raw JSON: C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-tests.json
    - Human summary: C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-test-report.md
  - Link the Markdown summary from project docs (see Documentation section).

### 2) Rate‑Limiting Final Test
- Add a boundary test verifying window reset behavior in addition to exceeding behavior:
  - Configure small window (e.g., `rateLimitWindowMs=200`, `rateLimitMax=3`).
  - Perform 3 allowed requests; 4th returns 429 with standard headers.
  - Wait for `windowMs + ε`; next request should succeed (200).
- File: C:\Users\LENOVO\Training\api\tests\rate-limit-window.int.test.js

### 3) Integration/Health Checks
- Maintain `api/tests/health.int.test.js` and posts integration tests to guard core flows.
- Gate: CI fails if any contract or rate‑limit tests fail.

## Documentation and Developer Experience
### Run & Try Section
- Location: C:\Users\LENOVO\Training\README.md (top-level) with anchors to API section, or C:\Users\LENOVO\Training\api\README.md if preferred.
- Content:
  - Prereqs: Node 18+, npm
  - Run:
    - Install: `npm install` (in C:\Users\LENOVO\Training\api)
    - Start: `npm start` → http://localhost:3000
  - Config (defaults in `api/src/config.js`): `PORT`, `JSON_LIMIT`, `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`, `POSTS_REPOSITORY`, `DB_FILE`
  - Example requests (curl): `/health`, `/posts` create/list/get/update/delete

### Postman Collection
- Provide collection covering `/health` and `/posts` CRUD with examples.
- Path: C:\Users\LENOVO\Training\specs\003-finalize-the-week\contracts\postman_collection.json
- Keep it aligned with the OpenAPI spec and tests.

### Surface Contract Test Summary
- Add a "Quality Signals" section in README linking to:
  - C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-test-report.md
  - Note: If tests fail, the summary should clearly show failures and point to detailed Jest results.

## Acceptance Criteria Mapping
- Contract test summary is generated and linked from docs; easy to find and read.
- Final rate‑limiting boundary test passes (429 on exceed, success after window reset, headers present).
- "Run & Try" instructions enable running the API locally and exercising endpoints.
- Postman collection imports and works without extra steps beyond documented ones.

## Risks & Assumptions
- Rate‑limit values are not mandated by spec; defaults from `config.js` are acceptable and documented.
- Summary surfacing location selected as README; can be moved to docs site if needed.
- SQLite backend remains optional; default tests use in‑memory repository.

## Deliverables (absolute paths)
- C:\Users\LENOVO\Training\specs\003-finalize-the-week\plan.md
- C:\Users\LENOVO\Training\specs\003-finalize-the-week\contracts\postman_collection.json
- C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-tests.json
- C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-test-report.md
- C:\Users\LENOVO\Training\api\tests\rate-limit-window.int.test.js


