# Tasks: Finalize Week 5 API

**Input (available docs)**
- FEATURE_DIR: `C:\Users\LENOVO\Training\specs\003-finalize-the-week`
- AVAILABLE_DOCS:
  - `C:\Users\LENOVO\Training\specs\003-finalize-the-week\plan.md`
  - `C:\Users\LENOVO\Training\specs\003-finalize-the-week\spec.md`
- Optional docs not present: `data-model.md`, `research.md`, `quickstart.md`, `contracts/` (to be created)

**Tech stack (from plan.md)**
- Node.js 18+, Express 5, helmet, cors, morgan, express-rate-limit@8, zod@4
- Testing: jest@29, supertest@7, jest-openapi@0.14
- OpenAPI source: `C:\Users\LENOVO\Training\specs\002-posts-api\contracts\openapi.yml`

## Format: `[ID] [P?] Description`
- **[P]** = can run in parallel (different files, no dependencies)
- Include exact file paths and concrete commands

## Phase 3.1: Setup
- [ ] T001 Create feature directories for artifacts and contracts
  - Paths:
    - `C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts`
    - `C:\Users\LENOVO\Training\specs\003-finalize-the-week\contracts`
  - PowerShell:
```powershell
New-Item -ItemType Directory -Force -Path "C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts" | Out-Null
New-Item -ItemType Directory -Force -Path "C:\Users\LENOVO\Training\specs\003-finalize-the-week\contracts" | Out-Null
```
- [ ] T002 [P] Create JSON→Markdown converter script for Jest results
  - File: `C:\Users\LENOVO\Training\scripts\convert-jest-json-to-md.js`
  - Behavior: Read Jest `--json --outputFile` results, output a Markdown summary with overall status and pass/fail counts
  - Acceptance:
    - Input arg 1 = path to JSON results
    - Writes Markdown to stdout (pipe to file)

- [ ] T003 [P] Verify required dev deps are installed in API
  - Path: `C:\Users\LENOVO\Training\api\package.json`
  - Must have: `jest`, `supertest`, `jest-openapi`
  - Command:
```powershell
cd C:\Users\LENOVO\Training\api; npm ls jest jest-openapi supertest || npm i -D jest@29 jest-openapi@0.14 supertest@7
```

## Phase 3.2: Tests First (TDD) — MUST COMPLETE BEFORE 3.3
- [ ] T004 [P] Contract tests against OpenAPI (expand as needed)
  - Keep/extend: `C:\Users\LENOVO\Training\api\tests\contract.test.js`
  - Ensure coverage for: `/health`, `/posts` CRUD, 400s, 404s, headers where applicable
  - Spec path used in tests: `C:\Users\LENOVO\Training\specs\002-posts-api\contracts\openapi.yml`

- [ ] T005 [P] Add rate‑limit window reset integration test
  - New file: `C:\Users\LENOVO\Training\api\tests\rate-limit-window.int.test.js`
  - Scenario:
    - Configure small window: `rateLimitWindowMs=200`, `rateLimitMax=3`
    - Perform 3 requests (allowed), 4th returns 429 with standard headers
    - Wait `windowMs + ε` then next request succeeds (200)

## Phase 3.3: Core Implementation
- No endpoint or model changes required for this feature (validation and routes already implemented). Focus on surfacing test results and final boundary test.

## Phase 3.4: Integration & Surfacing
- [ ] T006 Generate contract test JSON results
  - Output file: `C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-tests.json`
  - Command:
```powershell
cd C:\Users\LENOVO\Training\api; npm test -- --runInBand --testPathPattern=contract.test.js --json --outputFile "C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-tests.json"
```

- [ ] T007 Convert JSON results to human summary (Markdown)
  - Input: `C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-tests.json`
  - Output: `C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-test-report.md`
  - Command:
```powershell
node C:\Users\LENOVO\Training\scripts\convert-jest-json-to-md.js "C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-tests.json" > "C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-test-report.md"
```

- [ ] T008 [P] Add README "Quality Signals" section linking test summary
  - File: `C:\Users\LENOVO\Training\README.md`
  - Link target: `C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-test-report.md`
  - Include note that failures are visible in the summary and point to Jest details

## Phase 3.5: Polish & Documentation
- [ ] T009 [P] Add "Run & Try" section to README
  - File: `C:\Users\LENOVO\Training\README.md`
  - Include: prerequisites, install/start commands, config envs (from `api/src/config.js`), example curl for `/health` and `/posts`

- [ ] T010 [P] Create Postman collection covering `/health` and `/posts` CRUD
  - File: `C:\Users\LENOVO\Training\specs\003-finalize-the-week\contracts\postman_collection.json`
  - Keep in sync with OpenAPI and tests; include meaningful names and examples

- [ ] T011 [P] Document expected rate‑limiting behavior
  - File: `C:\Users\LENOVO\Training\README.md` (or `C:\Users\LENOVO\Training\api\README.md`)
  - Describe default `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX`, standard headers, and error envelope

---

## Dependencies
- Setup (T001–T003) before tests and integration
- Tests (T004–T005) before integration surfacing (T006–T007)
- T006 before T007
- Docs (T008–T011) after T006–T007 so links/values are accurate
- [P] tasks can run together if they do not touch the same file

## Parallel Execution Examples (Windows PowerShell)
```powershell
# Example 1: Author tests in parallel (different files)
# T004 (contract tests) and T005 (rate-limit window reset)
# (Open two terminals or use background jobs if preferred)

# Terminal A – edit/extend contract tests
code "C:\Users\LENOVO\Training\api\tests\contract.test.js"

# Terminal B – create rate-limit window reset test file
code "C:\Users\LENOVO\Training\api\tests\rate-limit-window.int.test.js"
```

```powershell
# Example 2: Generate and surface contract test summary
# Sequential due to data dependency (T006 -> T007), but docs updates can be parallel

# T006: Produce JSON results for contract tests
cd C:\Users\LENOVO\Training\api; npm test -- --runInBand --testPathPattern=contract.test.js --json --outputFile "C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-tests.json"

# T007: Convert to Markdown summary
node C:\Users\LENOVO\Training\scripts\convert-jest-json-to-md.js "C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-tests.json" > "C:\Users\LENOVO\Training\specs\003-finalize-the-week\artifacts\contract-test-report.md"

# In parallel [P]: Update README sections (T008, T009, T011) and create Postman collection (T010)
code "C:\Users\LENOVO\Training\README.md"
code "C:\Users\LENOVO\Training\specs\003-finalize-the-week\contracts\postman_collection.json"
```

## Validation Checklist
- [ ] All contract tests execute against `openapi.yml` and produce JSON results
- [ ] Markdown summary exists and is linked from README
- [ ] Final rate‑limit boundary test passes (429 then success after window reset)
- [ ] Postman collection imports and exercises endpoints
- [ ] "Run & Try" instructions enable local run and example requests

## Notes
- Use `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` from `api/src/config.js` to tune tests
- `express-rate-limit` is configured with `standardHeaders: true` (assert headers in tests)
- SQLite repository remains optional; default tests use in‑memory repository

