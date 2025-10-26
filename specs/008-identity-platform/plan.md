# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION]  
**Primary Dependencies**: [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]  
**Storage**: [if applicable, e.g., PostgreSQL, CoreData, files or N/A]  
**Testing**: [e.g., pytest, XCTest, cargo test or NEEDS CLARIFICATION]  
**Target Platform**: [e.g., Linux server, iOS 15+, WASM or NEEDS CLARIFICATION]
**Project Type**: [single/web/mobile - determines source structure]  
**Performance Goals**: [domain-specific, e.g., 1000 req/s, 10k lines/sec, 60 fps or NEEDS CLARIFICATION]  
**Constraints**: [domain-specific, e.g., <200ms p95, <100MB memory, offline-capable or NEEDS CLARIFICATION]  
**Scale/Scope**: [domain-specific, e.g., 10k users, 1M LOC, 50 screens or NEEDS CLARIFICATION]

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

[Gates determined based on constitution file]

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── app/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

---

# Implementation Plan (Filled): Week 8 – Identity Platform, Roles & Production Hardening

**Branch**: `008-identity-roles-hardening` | **Date**: 2025-10-21 | **Spec**: specs/008-identity-platform/spec.md

## Summary

Integrate Identity Platform with role-based authorization and production hardening, preserving the BFF pattern. Enforce CSRF on writes, validate inputs (≤1MB), rate-limit writes (10/min/user), standardize error envelopes, emit audit logs, propagate request-id/traceparent, add `/health`, and update OpenAPI. Evidence per PR aligns to Week-8 workbook.

### Environment & Flags

| Key | Scope | Required | Notes |
|-----|------|----------|-------|
| NEXT_PUBLIC_API_URL | FE | ✅ | CORS allowlist target |
| FIREBASE_API_KEY, AUTH_DOMAIN, PROJECT_ID, etc. | FE | ✅ | Client SDK config |
| FIREBASE_ADMIN_* (from Secret Manager) | BFF/API | ✅ | Verification keys; not in repo |
| READ_ONLY | API | ⛔/✅ | `true` forces 503 on writes (rollback) |
| IDENTITY_ENABLED | FE/BFF | ⛔/✅ | `false` hides mutation UI, disables cookie issuing |

## Technical Context

Language: TypeScript (strict), Node 20.x. Projects: `frontend-next` (Next.js) and `api` (Node). Client auth via Firebase Web SDK; server verification via Firebase Admin. Validation via Zod. Contracts validated with Spectral. A11y via Playwright+axe/pa11y. Latency micro-bench via k6.

## Project Structure

```
specs/008-identity-platform/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/

frontend-next/
├── src/app/api/           # BFF route handlers
├── src/lib/auth/          # client auth module
└── tests/                 # a11y smokes

api/
├── src/middleware/        # auth, csrf, ratelimit, request-id, audit
├── src/core/posts/        # protected handlers
└── tests/                 # contract/integration
```

## Pull Request Plan (Week-8 mapped)

### PR 1: Client Integration & BFF Handlers (Day 2)
Goal: Allow users to sign in/out, with BFF verifying identity tokens; UI is auth-aware.

Scope:
- Add Firebase Client SDK; implement `lib/auth` exposing `signIn(email,pw)`, `signOut()`, `getIdToken(forceRefresh?)`.
- Implement `/api/login`, `/api/logout`, `/api/posts/*` route handlers: verify ID tokens, forward `x-user-id`/`x-user-role`, set CSRF token; optional HttpOnly cookie (15–30m) with rotation.
- Update UI: login form (labels, focus, aria-live); show/hide mutate controls by auth state; SSR reads public.
- CORS restricted to NEXT_PUBLIC_API_URL; allow Authorization, X-CSRF-Token, X-Request-Id, Content-Type; methods GET/POST/PUT/DELETE; credentials true if cookie mode.

Evidence:
- Upload `a11y-frontend-next/<commit-sha>/index.html` for login flow; screenshots as needed.

### PR 2: API Hardening & Authorization (Day 3)
Goal: API enforces auth, roles, and hardening rules.

Scope:
- Middleware: identity verification (cookie or bearer) → attach `userId`, `role`.
- Guards: owner mutates own posts; admin mutates any.
- Validation: Zod schemas; body limit 1MB; return `422` envelope.
- Rate-limit: 10 writes/min/user; headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`; admin not exempt.
- Audit logging for create/update/delete.
- OpenAPI: add Bearer scheme; mark protected ops; include `401/403/422/429/413/503`.

Evidence:
- Update contracts under `specs/008-identity-platform/contracts/`; Spectral 0 errors.
* ✅ Contract tests pass for **200/401/403/404/422/429** and **413/503** with standardized envelopes.

### PR 3: Observability & Documentation (Day 4)
Goal: Make system observable and update docs.

Scope:
- Propagate `x-request-id` and W3C `traceparent`/`tracestate` across tiers.
- Implement `/health` (status, commit, deps, RFC3339 time, optionally `uptime_s`).
- README: Authentication section + troubleshooting (clock skew, revoked tokens, CORS 401/403, 429 backoff).
- CI: add non-gating latency micro-bench (k6) 100 GETs + 20 writes @ c=5; print p50/p95.

Evidence:
- CI job summary shows latency snapshot table; raw CSV archived in Packet.

### PR 4: Final Evidence & Release (Day 5)
Goal: Consolidate evidence and publish v8.0.0.

Scope:
- Ensure artifacts complete (a11y HTML, coverage, Spectral report, contracts, screenshots); Gate summary surfaces all.
- Tag `v8.0.0` and publish GitHub Release linking spec PR, Linear, Gate, Packet, Cloud Run URLs.

Evidence:
- Published GitHub Release `v8.0.0` with links to all evidence.

# Week 8 Implementation Plan - Identity Platform, Roles & Production Hardening

**Source of truth:** `@specs/008-identity-platform/spec.md`
**Branch family:** `008-identity-roles-hardening/*`
**Scope window:** Week 8 (Days 2�5)
**Traceability:** Every PR references Linear `LINEAR-XXXX` and this spec path.

> This plan breaks the work into **four single-purpose PRs**, aligned to the Week 8 workbook daily goals. Each PR includes goal, scope (files & changes), evidence, merge gates, review checklist, risks/rollback, and acceptance tests.

---

## PR 1: Client Integration & BFF Handlers (Day 2)

**Title:** `[Day2][Client+BFF] Firebase Auth, auth-aware UI, and route handlers`

**Goal**
Allow users to sign in/out; BFF (Next.js route handlers) verifies ID tokens; UI reacts to auth state.

**Scope**
Frontend‑next and BFF only.

* **Auth client**: Integrate Firebase Web SDK (Email/Password), add `auth.ts` with `signIn(email,pw)`, `signOut()`, `getIdToken(forceRefresh?)`.
* **Route handlers**: `/api/login`, `/api/logout`, `/api/posts/*` — verify ID token with Firebase Admin SDK; if cookie mode is enabled, set **HttpOnly session cookie** with: `Secure`, `SameSite=Strict`, `Path=/`, `Max-Age=1800`; rotate every 15m.
* **Headers/propagation**: generate/forward `x-request-id` from client to handlers.
* **CSRF client hook**: prepare double‑submit token on writes (header `X-CSRF-Token`), wiring only (server enforcement lands in PR2).
* **UI**: Accessible login/logout form and auth‑aware controls (hide create/edit/delete when signed out). SSR reads remain public.
* **CORS**: Allow only `NEXT_PUBLIC_API_URL` origin; allow headers `Authorization, X-CSRF-Token, X-Request-Id, Content-Type`; methods `GET,POST,PUT,DELETE`; credentials `true` (if cookie mode).

Out of scope:
- Any API middleware/guards/validation/rate-limit/audit changes
- OpenAPI/contract edits (those land in PR 2)

**Files (indicative)**
`apps/frontend-next/`

* `lib/auth/auth.ts`
* `app/login/page.tsx`, `components/LoginForm.tsx`
* `middleware/requestId.ts`
* `app/api/login/route.ts`, `app/api/logout/route.ts`
* `app/api/posts/[...proxy]/route.ts` (BFF proxy + verification)
* `next.config.js` (CORS), `env.example` (Firebase config)
* `tests/a11y/login.spec.ts` (+ axe/pa11y setup)

**Evidence (required to merge)**

* ✅ Upload **`a11y-frontend-next/index.html`** (or `a11y-frontend-next/<commit-sha>/index.html`) showing the login flow passes: labeled inputs, keyboard path, focus management, `aria-live` for status.
* ✅ Screenshots: signed‑out UI (no mutation controls) and signed‑in UI (controls visible per role placeholder).
* ✅ Login form uses `aria-live="polite"` for non-critical auth status; focus moves to the first invalid field on validation error.

**Independent Test Criteria — US1 (DEV-641/DEV-642/DEV-643/DEV-644)**

- Anonymous reader can view posts list and details: navigate to `/posts` while signed out; verify posts render and no Create/Edit/Delete controls exist in the DOM.
- UI hides mutation controls when signed out: verify `NewPostForm` is not rendered and `Edit`/`Delete` buttons are absent in `PostsList` when `currentUserId` is undefined. See `frontend-next/components/PostsPageClient.tsx` and `frontend-next/components/PostsList.tsx`.
- Public endpoints are unauthenticated: confirm OpenAPI marks `GET /posts` and `GET /posts/{id}` with `security: []` (`specs/008-identity-platform/contracts/openapi.yaml`) and spec describes them as public (`specs/008-identity-platform/spec.md`).
- A11y specifics: status updates use `aria-live="polite"`; form errors use `role="alert"` (assertive); focus moves to first invalid field on validation error; all interactive elements show visible focus ring; Escape closes any modal dialogs (pattern provided via `useEscapeKey`). See `frontend-next/components/LiveRegion.tsx` and `frontend-next/components/NewPostForm.tsx`.

**Merge Gates**

* Unit/UI smoke tests green.
* Login/logout manual flow recording attached.
* No secret material committed (Firebase via Secret Manager or env at deploy).
* CORS allowlist present and restricted.

**Reviewer Checklist**

* [ ] Auth module avoids logging PII/tokens.
* [ ] Cookie flags: HttpOnly, Secure, SameSite=Strict, Max‑Age=1800 (if cookie mode).
* [ ] Session cookie rotates at ~15m (or on role change); verify via Set-Cookie headers in test run.
* [ ] Request‑id generated when missing and forwarded.
* [ ] On 401 due to token expiry/clock skew, a single `getIdToken(true)` refresh is attempted; otherwise re-auth is prompted.
* [ ] a11y report attached and free of critical issues.

**Risks / Rollback**

* If verification fails: disable BFF cookie issuing and keep read‑only UI. Feature flag: `IDENTITY_ENABLED=false` hides mutation controls.

**Acceptance Tests**

* Anonymous browse shows no mutation controls.
* Auth user can sign in/out; UI updates; BFF receives/verifies token (assert via handler logs).
* Force expired token → first request 401 → client performs a single `getIdToken(true)` refresh → retry succeeds; otherwise re-auth prompt.
* Keyboard-only path: login → posts → create/delete → logout (no traps; visible focus).

---

## PR 2: API Hardening & Authorization (Day 3)

**Title:** `[Day3][API] AuthZ guards, validation, rate-limit, audit logging`

**Goal**
API enforces verified identity, owner/admin roles, and production hardening rules.

**Scope**
API service only.

* **Middleware**: verify bearer/cookie; attach `userId`, `role` to request context.
* **Ownership & roles**: `owner` can mutate own posts; `admin` can mutate any.
* **Validation**: Zod schemas; return `422 { code, message, details[] }`.
* **Limits**: 1MB body size → `413`; handler timeout 10s → structured error.
* **Rate‑limit**: in‑memory fixed window 60s, capacity 10; key `userId` or IP fallback; respond `429` with headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`.
* **CSRF**: enforce on `POST/PUT/DELETE` (`X-CSRF-Token` double‑submit) → `403` on fail.
* **Audit logs**: `{ ts, userId, role, verb, targetType:"post", targetId, status, traceId }`.

**Files (indicative)**
`apps/api/`

* `middleware/auth.ts`, `middleware/csrf.ts`, `middleware/rateLimit.ts`
* `routes/posts/*.ts` (guards & ownership checks)
* `schemas/post.ts` (Zod)
* `logging/audit.ts`
* `config/security.ts` (size limit, timeouts)
* **Contracts**: `contracts/openapi.yaml` updates (Bearer scheme; protected ops; responses 401/403/422/429/413/503)
* **Tests**: `tests/contracts/*.spec.ts` (200/401/403/404/422/429/413), ownership/role tests
* Canonical: `specs/008-identity-platform/contracts/openapi.yaml` → copied to `apps/api` at build time.
* `scripts/sync-openapi.ts` (CI step): copies canonical contract into `apps/api` at build.

**Evidence (required to merge)**

* ✅ `contracts/openapi.yaml` updated with securitySchemes and per‑op `security`, plus `Err401, Err403, Err422, Err429, Err413, Err503`.
* ✅ Contract tests pass for **200/401/403/404/422/429** **and** **413/503** with standardized envelopes.
* ✅ Spectral report (ruleset pinned: stoplight/spectral:6.11.0) in `specs/008-identity-platform/contracts/` with **errors=0**.
* ✅ CSRF test: missing/invalid `X-CSRF-Token` on POST → 403 with standard envelope; valid token → 2xx.

**Merge Gates**

* Coverage ≥ **API 80% lines / 70% branches** (scope of touched packages).
* Rate‑limit headers present on **429 and non-429** responses for visibility (`X-RateLimit-Limit: 10`, `X-RateLimit-Remaining: <int>`, and on 429 `Retry-After: <seconds>`).
* CSRF enforced on writes; anonymous writes impossible.
* Logging policy enforced: do not log emails, tokens, cookies, request bodies; only `userId` (opaque UID) + `role`.

**Reviewer Checklist**

* [ ] Owner check strictly `authorId === userId`.
* [ ] `admin` path can mutate any post and is audited.
* [ ] All protected ops return standardized envelopes.
* [ ] OpenAPI operationIds unique; tags set; 401/403/422/429/413/503 present.
* [ ] OpenAPI has no global `security` (public reads). Per-operation `security` is present on protected ops only.

**Risks / Rollback**

* If verification/role source unavailable, enable **read‑only mode** (feature flag `READ_ONLY=true`):
  - All writes → `503 { code:"READ_ONLY" }`
  - AuthZ failures (insufficient role) → `403`
  - Unauthenticated → `401`

Out of scope:
- Frontend UI/BFF logic changes (beyond test stubs)
- CORS or cookie wiring in the frontend

**Acceptance Tests**

* Owner cannot edit others’ posts → `403`.
* Admin can edit any post → `200/204`.
* Invalid payload → `422` with details.
* > 10 writes/min/user → `429` with `Retry-After`.
* Expired/near-expiry token with ±5m clock skew → accepted if within tolerance; outside → 401.
* Revoked token (admin) → 401/403 per revocation check; audit shows failed attempt.
* Anonymous writes (if any endpoint exposed) use IP fallback key; sustained writes → 429 with `Retry-After`.

---

## PR 3: Observability & Documentation (Day 4)

**Title:** `[Day4][Obs+Docs] Request-id propagation, /health, README Auth, CI micro-bench`

**Goal**
System is observable end‑to‑end and docs reflect the new Auth behavior.

**Scope**

* **Tracing/IDs**: Propagate W3C `traceparent/tracestate` if present; always include `x-request-id` (generate UUID if missing). Structured logs fields: `{ ts, level, requestId, traceId, userId?, role?, method, path, status, latency_ms, msg }`.
* **Health**: `GET /health` returns `{ service, status, commit, dependencies:{firebase, db}, time }`; deep checks documented; SLO p95 < 300ms in CI smoke.
* **README**: Add **Authentication** section (how sign‑in/out works, owner/admin behaviors, troubleshooting: clock skew, token revoke, 429 backoff, CORS 401 vs 403). Add live URLs and Run & Try table.
* **Micro‑bench**: Non‑gating CI stage (e.g., `k6`) — 100 GET + 20 writes @ c=5; print p50/p95 in Gate summary; attach CSV to Packet.

**Files (indicative)**

* `apps/*/logging/*` (request/trace ids)
* `apps/api/routes/health.ts`
* `.github/workflows/ci.yml` (bench job; Gate summary renderer)
* `README.md` (Auth section + truth table)
* `packet/` (bench artifacts)

**Evidence (required to merge)**

* ✅ **CI job summary** shows a latency mini-table with columns: OP | N | CONCURRENCY | P50(ms) | P95(ms); includes rows for 100×GET and 20×WRITE; raw CSV archived in Packet.
* ✅ `/health` JSON includes `commit` (git SHA) and `dependencies:{ firebase, db }`.
* ✅ `/health` reachable in CI; output includes commit SHA and deps status.
* ✅ README updated with Auth notes, live URLs, env table.

**Merge Gates**

* Log records include `requestId` across tiers in sample flows.
* Health endpoint returns `200` and includes required fields.
* Bench artifacts attached to Packet.

**Reviewer Checklist**

* [ ] No sensitive payload data in logs; redaction filter in place.
* [ ] README “Authentication” is accurate and references spec.
* [ ] Gate summary renders the latency table.

**Risks / Rollback**

* If health/bench destabilizes CI, mark the bench job non‑blocking (already non‑gating) and open follow‑up LINEAR task.

**Acceptance Tests**

* Request traversals show constant `x-request-id`/`traceparent`.
* `/health` JSON schema matches spec and includes commit.
* `/health` matches: `{ service:"api", status:"ok", commit:"<sha>", dependencies:{ firebase:"ok", db:"ok" }, time:"<RFC3339>" }`.

---

## PR 4: Final Evidence & Release (Day 5)

**Title:** `[Day5][Release] Packet complete, Gate green, tag v8.0.0, publish release`

**Goal**
Consolidate all evidence and publish the official `v8.0.0` release.

**Scope**

* Bundle artifacts into Packet: FE+API coverage, a11y HTML, Spectral report (errors=0), latency CSV, screenshots.
* Ensure Gate summary shows: coverage totals, Spectral=0, latency table, live URLs.
* Create and push `v8.0.0` git tag.
* Publish GitHub Release notes with links: `[SPEC]` PR, Linear issue, PR 1–3, Gate run, Packet, Cloud Run URLs.

**Files (indicative)**

* `.github/release.yml` or release script
* `packet/` final bundle
* `CHANGELOG.md` (optional)

**Evidence (required to merge)**

* ✅ **Published GitHub Release `v8.0.0`** (public notes include all links).
* ✅ Packet contains all required artifacts and is linked from the Release.

**Merge Gates**

* Gate **green** (no failing checks) **before tagging**:
  - Spectral = 0 errors
  - Contract tests passing (incl. 413/503)
  - Coverage ≥ API 80% lines / 70% branches; FE 70% lines
* README truth table committed.

**Reviewer Checklist**

* [ ] Release notes contain links to: spec PR, Linear, all code PRs, Gate, Packet, Cloud Run URLs.
* [ ] Tag points to merged main commit with all PRs.

**Risks / Rollback**

* If any artifact missing, do not publish Release; open a blocker and remediate.
* If Release already published with an error, unpublish or publish `v8.0.1` hotfix notes.

**Acceptance Tests**

* GitHub Release visible; links resolve; demo URLs live.

---

## Cross‑PR Conventions

* **PR template** must include: Linear ID, spec path, checkboxes for Evidence, Merge Gates, Review Checklist.
* **Labels**: `week8`, `security`, `contracts`, `a11y`, `observability`, `release` as applicable.
* **DOD (Definition of Done)** applies per PR: tests green, artifacts uploaded, Gate status posted, links added to PR description.
* **Backout**: Revert PR; set `READ_ONLY=true` feature flag to force 503 on writes until restored.

### Commit & PR Conventions
- Branches: `008-identity-roles-hardening/dayN-<slug>`
- Commits: `dayN(scope): short summary`
- PR titles: `[DayN][Area] <summary>`; body links Linear + spec path.

## Production Hardening Policies

### Auth Response Semantics (T107)

- `401 Unauthorized`: identity is missing, invalid, or expired (e.g., bad/expired token).
- `403 Forbidden`: identity is valid but the resource/action is not permitted (e.g., owner attempting to mutate another user’s post).

### Rate-Limit Key Precedence (T108)

Precedence is `userId || ip` — use `userId` when authenticated; fall back to client IP when anonymous.

### Rate-Limit Header Policy (T005)

Rate-limit headers provide visibility into quota consumption and help clients implement adaptive backoff.

**Header Behavior:**
- **Present on 2xx responses**: All successful requests include `X-RateLimit-Limit` and `X-RateLimit-Remaining`
- **Present on 429 responses**: Rate-limited requests include all quota headers plus `Retry-After` (seconds until reset)
- **Absent on OPTIONS (preflight)**: CORS preflight requests do NOT include rate-limit headers to avoid client confusion and caching issues
- **CORS Exposure**: `Access-Control-Expose-Headers` includes `X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After, X-Request-Id` to make headers visible to browser JavaScript

**Example Response Headers:**
```
# Successful request (2xx)
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 7
X-Request-Id: 550e8400-e29b-41d4-a716-446655440000

# Rate-limited request (429)
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
Retry-After: 42
X-Request-Id: 550e8400-e29b-41d4-a716-446655440001
```

**Key Derivation:** `userId` (if authenticated) → IP address (fallback for anonymous)

### Logging Policy & Retention (T006)

Structured logging protects user privacy while maintaining operational observability.

**PII Redaction Rules:**
- **Never log**: Email addresses, passwords, authentication tokens, cookies, raw request bodies
- **Allowed**: Opaque `userId` (Firebase UID), `role` enum (`owner`|`admin`), HTTP method/path, status code
- **Audit logs**: Explicit fields only: `{ timestamp, userId, role, verb, targetType, targetId, status, traceId }`

**Retention Policy:**
- **Application logs**: ≤ 30 days (stdout → Cloud Logging)
- **Audit logs**: 90 days (separate log sink, restricted read access)
- **Trace data**: Follows retention policy of trace backend (e.g., Cloud Trace)

**Log Structure Example:**
```json
{
  "timestamp": "2025-10-22T15:30:45.123Z",
  "level": "info",
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "traceId": "00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01",
  "userId": "firebase-uid-abc123",
  "role": "owner",
  "method": "POST",
  "path": "/posts",
  "status": 201,
  "latency_ms": 42,
  "message": "Post created successfully"
}
```

### Canonical Contracts Path & CI Sync (T049)

**Source of Truth:** `specs/008-identity-platform/contracts/openapi.yaml` (YAML)
**Build Artifact:** `api/openapi.json` (JSON, generated at build time)

**Sync Process:**
1. Canonical YAML is hand-maintained in `specs/008-identity-platform/contracts/`
2. CI runs `scripts/sync-openapi.ts` to convert YAML → JSON
3. JSON is deployed with the API and exposed at `/openapi.json` endpoint
4. CI validates drift with `npm run contracts:check` (fails if JSON doesn't match YAML)

**Developer Workflow:**
```bash
# Edit canonical spec
vim specs/008-identity-platform/contracts/openapi.yaml

# Sync to api directory
npm run contracts:sync

# Validate spec
npm run contracts:validate

# Commit both files
git add specs/008-identity-platform/contracts/openapi.yaml api/openapi.json
git commit -m "feat(contracts): add 415 response for invalid Content-Type"
```

**CI Integration:**
```yaml
- name: Validate OpenAPI
  run: npm run contracts:validate

- name: Check contract drift
  run: npm run contracts:check
```

## Independent Test Criteria (US2)

- POST `/posts`: 201 on valid; 401 no auth; 403 not owner; 422 invalid body; 429 over limit; 413 >1MB; 503 when `READ_ONLY=true`.
- PUT `/posts/{id}`: 200 on valid owner; 401 no auth; 403 not owner; 422 invalid; 429 over limit; 413 >1MB; 503 `READ_ONLY=true`.
- DELETE `/posts/{id}`: 204 on valid owner; 401 no auth; 403 not owner; 429 over limit; 503 `READ_ONLY=true`.
- GET `/posts`: 200 public; no auth required.
- GET `/posts/{id}`: 200 when exists; 404 when not found.
- Error envelopes include `requestId` when available; `429` includes `Retry-After`; 4xx/5xx set `Cache-Control: no-store`.

## Commands & CI snippets

* **Run a11y:** `pnpm test:a11y` → outputs to `a11y-frontend-next/`
* **Contract tests:** `pnpm test:contracts` (expects 200/401/403/404/422/429/413)
* **Validate OpenAPI:** `npm run contracts:validate` → enforces operationId uniqueness, examples, no global security
* **Sync OpenAPI:** `npm run contracts:sync` → YAML → JSON
* **Check OpenAPI drift:** `npm run contracts:check` → fails if JSON doesn't match YAML
* **Bench:** `pnpm bench:week8` → CSV to `packet/bench/week8.csv`; Gate prints p50/p95
* **Tag:** `git tag -a v8.0.0 -m "Week 8 release" && git push origin v8.0.0`

---

### Approval Routing

* PR1: FE lead + Arch sign‑off
* PR2: API lead + Security sign‑off
* PR3: SRE/Observability + Docs
* PR4: Eng Manager + Release Manager
