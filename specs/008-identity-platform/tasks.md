008-identity-hardening/day2-t054-t069-foundational
# Tasks — 008-identity-platform

Purpose: Actionable, dependency-ordered tasks for Week 8 implementation.
Source of truth: specs/008-identity-platform/spec.md
Plan: specs/008-identity-platform/plan.md

## Phase 1 — Setup
chore/T001-env-flags-setup-DEV-598
- [X] T001 Establish env/flags (.env examples) per plan (NEXT_PUBLIC_API_URL, FIREBASE_*, SESSION_SECRET) — specs/008-identity-platform/quickstart.md
- [X] T002 Create CI spectral step and artifacts path — .github/workflows/ci.yml
- [X] T003 Add `scripts/sync-openapi.ts` to copy canonical contract to app — scripts/sync-openapi.ts
- [X] T045 Document Secret Manager wiring (FIREBASE_ADMIN_*), add .env.example placeholders and secret-pattern checks — specs/008-identity-platform/quickstart.md
=======
- [ ] T001 Establish env/flags (.env examples) per plan (NEXT_PUBLIC_API_URL, FIREBASE_*, SESSION_SECRET) — specs/008-identity-platform/quickstart.md
- [ ] T002 Create CI spectral step and artifacts path — .github/workflows/ci.yml
- [ ] T003 Add `scripts/sync-openapi.ts` to copy canonical contract to app — scripts/sync-openapi.ts
- [ ] T045 Document Secret Manager wiring (FIREBASE_ADMIN_*), add .env.example placeholders and secret-pattern checks — specs/008-identity-platform/quickstart.md
main

## Phase 2 — Foundational
- [X] T004 Add canonical OpenAPI skeleton (bearer + protected ops) — specs/008-identity-platform/contracts/openapi.yaml
- [X] T005 [P] Add rate-limit header policy docs (headers on 2xx, 429; none on preflight) — specs/008-identity-platform/plan.md
- [X] T006 Add logging policy & retention (PII redaction, 30d; audit 90d) — specs/008-identity-platform/plan.md
- [X] T031 CORS & preflight policy (OPTIONS 204 with Access-Control-*; add `Vary: Origin, Access-Control-Request-Method, Access-Control-Request-Headers`; no rate-limit headers on preflight) — api/src/middleware/cors.ts; frontend-next/next.config.js
- [X] T032 Content-Type guard for mutations (require application/json; else 415 envelope) — api/src/middleware/contentType.ts
- [X] T042 OpenAPI CI checks (operationId uniqueness, examples for 401/403/422/429/413/503; fail if global `security` block present; verify `servers` map to local/staging/prod) — scripts/validate-openapi.ts
- [X] T044 Time sync assumption documented (NTP/chrony) to honor ±5m skew — specs/008-identity-platform/spec.md
- [X] T049 Canonical contracts path + CI sync documented — specs/008-identity-platform/plan.md
- [X] T050 Security headers baseline (Referrer-Policy: `strict-origin-when-cross-origin`; X-Content-Type-Options: `nosniff`; X-Frame-Options: `DENY` or CSP `frame-ancestors 'none'`; minimal CSP with nonce `default-src 'self'; script-src 'self' 'nonce-<nonce>'`) — api/src/middleware/securityHeaders.ts
- [X] T051 OPTIONS contract tests (204 + Access-Control-*; no auth; add `Vary: Origin, Access-Control-Request-Method, Access-Control-Request-Headers`; no rate-limit headers; assert `Access-Control-Max-Age: 600` or intentional omission) — api/tests/contracts/cors.preflight.spec.ts
- [X] T054 Spectral ruleset pin & CI gate (stoplight/spectral@6.11.0) — .spectral.yaml; .github/workflows/ci.yml
- [X] T055 Secret scanning (partial - CI job pending) in CI (gitleaks or equivalent; whitelist fixtures) — .github/workflows/ci.yml; .gitleaks.toml
- [X] T056 App Router lint/CI check (no pages/ or pages/api/; only app/api/.../route.ts) — .eslintrc.js; .github/workflows/ci.yml
- [X] T058 Contract drift CI (diff canonical specs/.../contracts/openapi.yaml vs app) — scripts/quality-gate/check-contract-drift.ts
- [X] T061 Expose rate-limit headers to browsers (Access-Control-Expose-Headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After, X-Request-Id); assert presence on GET/POST responses — api/src/middleware/cors.ts; api/tests/contracts/cors.expose-headers.spec.ts
- [X] T065 Ensure OpenAPI error examples include `requestId` in envelope for 401/403/422/429/413/503 — specs/008-identity-platform/contracts/openapi.yaml; scripts/validate-openapi.ts
- [X] T066 Log guard CI to prevent `console.log`/PII logs in app code — .eslintrc.js; .github/workflows/ci.yml
- [X] T067 CSP nonce/strict policy (tighten T050; automated check) — api/src/middleware/securityHeaders.ts; scripts/quality-gate/check-csp.ts
- [X] T068 Content negotiation guard: mutating routes require `Accept: application/json`; extend 415 tests accordingly — api/src/middleware/contentType.ts; api/tests/contracts/http.415.spec.ts
- [X] T069 CORS hardening: reject `Origin: null` (unless explicitly allowed) and assert no wildcard `Access-Control-Allow-Origin` in prod — api/src/middleware/cors.ts; api/tests/contracts/cors.preflight.spec.ts
- [X] T076 Env validation on boot (fail fast; names only, not values) - api/src/config/env.ts; api/tests/env.validation.spec.ts; frontend-next/src/config/env.ts
- [X] T084 Security headers++: add `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, and a minimal `Permissions-Policy`; add tests - api/src/middleware/securityHeaders.ts; api/tests/security.headers.spec.ts
- [X] T085 CORS vary on normal responses: ensure `Vary: Origin` on CORS'd non-preflight responses; add contract test - api/src/middleware/cors.ts; api/tests/contracts/cors.vary-normal.spec.ts
- [X] T086 406 guard (content negotiation): if `Accept` excludes `application/json`, return 406; extend OpenAPI/examples + tests - api/src/middleware/contentType.ts; specs/008-identity-platform/contracts/openapi.yaml; api/tests/contracts/http.406.spec.ts
- [X] T087 Error cache headers: set `Cache-Control: no-store` on 401/403/422/429/413/503 responses; assert in contract tests - api/src/lib/errors.ts; api/tests/contracts/errors.cache-control.spec.ts
- [X] T090 Dependency policy gate (non-gating at first): CI fails on high/critical vulns with allowlist - .github/workflows/ci.yml
- [X] T092 Retry-After semantics: document and assert `Retry-After` present on 429 only (absent on 413/503); add contract checks - specs/008-identity-platform/plan.md; api/tests/contracts/retry-after.spec.ts
- [X] T094 Cache rules on authenticated routes: set `Cache-Control: no-store, private` on any response that required auth; add contract test - api/src/middleware/cacheHeaders.ts; api/tests/contracts/cache.auth-routes.spec.ts
- [X] T095 CORS credentials guard: allow `Access-Control-Allow-Credentials: true` only when `Access-Control-Allow-Origin` is an exact origin (never `*`); contract test - api/src/middleware/cors.ts; api/tests/contracts/cors.credentials.guard.spec.ts
- [ ] T096 415 vs 406 matrix doc: add a 2×2 decision chart in contentType.ts/OpenAPI comments (“invalid Content-Type → 415; Accept excludes JSON → 406”) — api/src/middleware/contentType.ts; specs/008-identity-platform/contracts/openapi.yaml
- [X] T097 Origin=null dev carve-out: add dev allowlist toggle for `Origin: null` and test it is OFF in prod - api/src/middleware/cors.ts; api/tests/contracts/cors.origin-null.spec.ts
- [X] T098 Spectral custom rules: forbid `additionalProperties: true` on error envelopes; require integer types for rate-limit headers (assert numeric emission in test); require at least one 2xx example per operation - .spectral.yaml; scripts/validate-openapi.ts; api/tests/middleware.rate-limit.headers.spec.ts
- [ ] T102 (merged into T094) — track under T094
- [X] T103 Prod header invariant: fail startup if `ALLOW_CREDENTIALS=true` and `ALLOW_ORIGIN='*'` in prod; unit test - api/src/config/cors.ts; api/tests/cors.invariants.spec.ts
- [X] T104 Drop client identity fields: strip `userId/role/authorId` from request bodies before business logic; unit test - api/src/middleware/stripIdentity.ts; api/tests/strip-identity.spec.ts
- [ ] T107 401/403 doc note: add explicit line in spec/plan (invalid/expired token → 401; valid identity but forbidden resource → 403) — specs/008-identity-platform/spec.md; specs/008-identity-platform/plan.md
- [ ] T108 Rate-limit key doc & test: document key derivation `userId || IP`; add precedence test — api/src/middleware/rateLimit.ts; api/tests/middleware.rate-limit.key.spec.ts
- [ ] T109 CSP nonce rotation test: ensure nonce differs between sequential responses — api/tests/security.csp-nonce.spec.ts
- [ ] T110 OpenAPI servers prod guard: fail CI if a server URL contains `localhost` when NODE_ENV=production — scripts/validate-openapi.ts
- [ ] T111 Error envelope optional `traceId` field and contract assertion that at least one of `requestId` or `traceId` is present on 4xx/5xx — api/src/lib/errors.ts; api/tests/contracts/errors.traceid.spec.ts

## Phase 3 — [US1] Anonymous reader (P1)
- [ ] T007 [US1] Ensure public GET endpoints documented as unauthenticated — specs/008-identity-platform/spec.md
- [ ] T008 [US1] Hide mutation controls when signed out (auth-aware UI) — frontend-next/src/lib/auth/
- [ ] T009 [US1] Independent test criteria listed in plan — specs/008-identity-platform/plan.md
- [ ] T043 [US1] A11y specifics (polite vs assertive; focus to first invalid; Escape closes modals; visible focus ring) — frontend-next/src/components/

## Phase 4 — [US2] Owner manages own posts (P2)
- [ ] T010 [US2] Firebase Web SDK auth module (signIn, signOut, getIdToken) — frontend-next/src/lib/auth/auth.ts
- [ ] T011 [P] [US2] Next.js App Router handlers login/logout/posts/* (verify ID token) — frontend-next/src/app/api/
- [ ] T033 [US2] CSRF server mint/verify (BFF mint token; API enforce on POST/PUT/DELETE) — frontend-next/src/app/api/login/route.ts; api/src/middleware/csrf.ts
- [ ] T012 [US2] CSRF double-submit wiring in client (header X-CSRF-Token) — frontend-next/src/lib/auth/
- [ ] T034 [US2] Token refresh (single getIdToken(true)) and ±5m clock skew accept; otherwise 401 — frontend-next/src/lib/auth/auth.ts; api/src/middleware/auth.ts; api/tests/auth.clock-skew.spec.ts
- [ ] T035 [US2] JWT verification semantics (aud, iss, sub, exp) and reject other Firebase projects — api/src/middleware/auth.ts
- [ ] T013 [US2] Owner-only guards in API (authorId === userId) — api/src/core/posts/
- [ ] T014 [US2] Zod schemas + 1MB body limit + 422 envelope — api/src/schemas/post.ts
- [ ] T015 [US2] Rate limit 10/min/user, headers on 2xx and 429 — api/src/middleware/rateLimit.ts
- [ ] T016 [US2] Audit logs for create/update/delete (fields including traceId) — api/src/logging/audit.ts
- [ ] T017 [US2] Contract updates: per-op security + responses 401/403/422/429/413/503 — specs/008-identity-platform/contracts/openapi.yaml
- [ ] T018 [US2] Contract tests for 200/401/403/404/422/429/413/503 — api/tests/contracts/
- [ ] T019 [US2] Independent test criteria recorded in plan — specs/008-identity-platform/plan.md
- [ ] T036 [US2] Read-only mode (READ_ONLY=true) middleware returning 503 envelope on writes — api/src/middleware/readOnly.ts
- [ ] T037 [US2] Distinguish 404 (non-existent) vs 403 (unauthorized existing) in posts routes — api/src/core/posts/
- [ ] T038 [US2] Rate-limit precedence userId→IP and omit headers on OPTIONS — api/src/middleware/rateLimit.ts
- [ ] T047 [US2] 1MB overflow returns 413 `{ code:"PAYLOAD_TOO_LARGE", ... }`, minimal Content-Length — api/src/middleware/bodyLimit.ts
- [ ] T048 [US2] Logout semantics (clear cookie Max-Age=0; HttpOnly; Secure; SameSite=Strict; Path=/) — frontend-next/src/app/api/logout/route.ts
- [ ] T060 [US2] OpenAPI + tests for 415 (extend T017/T018/T042); add `api/tests/contracts/http.415.spec.ts` and include artifact under `packet/contracts/` — specs/008-identity-platform/contracts/openapi.yaml; api/tests/contracts/http.415.spec.ts
- [ ] T062 [US2] Session cookie rotation (~15m or on role change) and Set-Cookie assertion (fake timers >15m; new cookie; correct flags) — frontend-next/src/app/api/login/route.ts; api/tests/auth.session-rotation.spec.ts
- [ ] T063 [US2] CSRF token semantics (entropy, bound to session, TTL ≤2h at BFF; API verifies TTL); add replay-window test and cross-session replay test (403) — specs/008-identity-platform/plan.md; api/tests/csrf.replay.spec.ts
- [ ] T052 [US2] Standard error envelope helper `{ code, message, details?, requestId }` used by 401/403/422/429/413/503 — api/src/lib/errors.ts
- [ ] T053 [US2] BFF→API identity propagation check (forward x-user-id/x-user-role; API rejects writes if verified identity present but headers missing/mangled) — frontend-next/src/app/api/posts/[...proxy]/route.ts; api/src/middleware/auth.ts
- [ ] T074 [US2] Audit schema JSON examples (success + denied) added to plan/spec and aligned with emitted fields — specs/008-identity-platform/plan.md; specs/008-identity-platform/spec.md
- [ ] T077 [US2] Direct-API denial e2e: curl API POST/PUT with valid bearer but no CSRF/BFF headers → 403; with CSRF but no x-user-* → 403; save outputs under packet/contracts/ — api/tests/contracts/bff-denial.e2e.spec.ts
- [ ] T093 [US2] CSRF replay-protection clock test: fuzz ±5m around CSRF TTL boundaries to prove expected pass/fail behavior — api/tests/csrf.ttl-fuzz.spec.ts
- [ ] T099 [US2] Owner-check mischief test: client supplies mismatched `authorId`; API must ignore client field and use server-resolved user — api/tests/posts.owner-mischief.spec.ts

## Phase 5 — [US3] Admin moderates any post (P3)
- [ ] T020 [US3] Admin authorization path (mutate any post) — api/src/core/posts/
- [ ] T021 [US3] Revocation checks for admin-sensitive ops — api/src/middleware/auth.ts
- [ ] T022 [US3] UI shows admin controls when role=admin — frontend-next/src/app/
- [ ] T023 [US3] Independent test criteria in plan — specs/008-identity-platform/plan.md
- [ ] T064 [US3] Revocation integration test for admin-sensitive op (revoked token → 401/403 + audit entry `status:"denied"`, reason) — api/tests/revocation.int.spec.ts

## Phase 6 — Observability & Docs (Day 4)
- [ ] T024 Request-id + traceparent propagation (FE→BFF→API) — api/src/middleware/
- [ ] T025 `/health` endpoint (commit, deps, time; 503 if deps down; Cache-Control: `no-store`; Content-Type: `application/json; charset=utf-8`) — api/src/routes/health.ts
- [ ] T026 README Auth section, troubleshooting, live URLs; note SameSite=Strict tradeoff and pivot conditions for Lax — README.md; specs/008-identity-platform/plan.md
- [ ] T027 CI latency micro-bench (100 GET + 20 writes @ c=5), print p50/p95 and warn if p95 > 300ms (non-gating) — .github/workflows/ci.yml
- [ ] T039 Correlate logs across tiers (same x-request-id/traceparent FE→BFF→API) — frontend-next/src/middleware/requestId.ts; api/src/middleware/requestId.ts
- [ ] T040 Log redaction & retention (app ≤30d, audit 90d; redact emails/tokens/cookies/bodies) — api/src/logging/
- [ ] T041 `/health` headers & failure tests (Cache-Control: `no-store`; Content-Type: `application/json; charset=utf-8`; 503 on dependency down) — api/tests/health/
- [ ] T057 A11y artifacts & keyboard-only video in CI (upload a11y-frontend-next/<sha>/index.html + short video) — .github/workflows/ci.yml; tests/a11y/
- [ ] T059 429 backoff documentation and optional client retry helper — README.md; frontend-next/src/lib/http/backoff.ts
- [ ] T070 README: idempotency guidance (retry POST only when safe; prefer PUT/PATCH for idempotent updates) — README.md
- [ ] T071 Firebase Admin IAM: document least-privilege roles/permissions and link from quickstart — specs/008-identity-platform/quickstart.md; specs/008-identity-platform/plan.md
- [ ] T072 Local dev parity: document Firebase Emulators setup and how Admin/Web SDKs point to emulators — specs/008-identity-platform/quickstart.md
- [ ] T073 Extend log guard: also flag console.warn/error unless routed via logger; add redaction unit test — .eslintrc.js; api/tests/logging.redaction.spec.ts
- [ ] T075 `/health` dependency matrix: simulate single-dependency down (e.g., firebase keys) → 503 and `dependencies.firebase:"down"` in JSON — api/tests/health/
- [ ] T078 Error envelope examples parity: ensure 422/429 examples include realistic `details[]`; contract tests assert array shape — specs/008-identity-platform/contracts/openapi.yaml; api/tests/contracts/error.examples.spec.ts
- [ ] T079 5xx/429 alerting stub (non-gating): CI prints counts table for unexpected 5xx and abnormal 429 rates — .github/workflows/ci.yml; scripts/quality-gate/alerting-stub.ts
- [ ] T081 k6 toolchain cache/install (speed up latency job) — .github/workflows/ci.yml
- [ ] T083 Redaction snapshot test: log fake payload with email/token/body; snapshot omits/redacts PII — api/tests/logging.redaction.snapshot.spec.ts
- [ ] T088 OpenAPI schema+example for `/health`; contract test validates keys & types — specs/008-identity-platform/contracts/openapi.yaml; api/tests/contracts/health.schema.spec.ts
- [ ] T089 Threat sketch (1-pager) with STRIDE notes + mitigations mapped to tasks — specs/008-identity-platform/security.md
- [ ] T091 Log sampling knob: env flag to downsample info logs in prod; unit test ensures error/audit are never sampled — api/src/logging/sampling.ts; api/tests/logging.sampling.spec.ts
- [ ] T100 PII redaction e2e: capture a full request/response log path and assert no emails/tokens/body fragments are emitted to sinks (stdout → collector) — api/tests/logging.redaction.e2e.spec.ts
- [ ] T101 `/health` schema drift guard: fail test if new field added without updating OpenAPI example (keeps docs parity) — api/tests/contracts/health.schema-drift.spec.ts
- [ ] T105 Idempotency e2e: retry helper refuses POST; allows PUT/PATCH with same idempotency key; add docs link — frontend-next/src/lib/http/backoff.ts; tests/idempotency.e2e.spec.ts; README.md
- [ ] T112 k6 threshold (non-gating) verdict print in CI logs (e.g., p95<300ms) — .github/workflows/ci.yml

## Final Phase — Evidence & Release (Day 5)
- [ ] T028 Aggregate evidence to Packet with fixed map: packet/contracts/ (Spectral + contract tests), packet/a11y/ (HTML + keyboard video), packet/bench/ (CSV + CI table), packet/security/ (gitleaks, CSP check, log-guard) — packet/
- [ ] T029 Ensure Gate green (Spectral=0, coverage thresholds met) — scripts/quality-gate/
- [ ] T030 Tag and publish release v8.0.0 with links — release script
- [ ] T080 Engines & Node pin checks: ensure `"engines": { "node": "20.x" }` enforced in both apps and CI verifies node version — frontend-next/package.json; api/package.json; .github/workflows/ci.yml
- [ ] T082 Cookie SameSite regression test: simulate cross-site nav vs same-site XHR to validate Strict behavior; document pivot to Lax conditions — frontend-next/tests/cookie.samesite.spec.ts; README.md
- [ ] T106 Checklist-to-evidence gate: CI asserts each checked CHK maps to ≥1 task and ≥1 artifact under packet/; fail otherwise — scripts/quality-gate/check-checklist-evidence.ts; .github/workflows/ci.yml

## Dependencies
- US1 → US2 → US3 (auth and guards build on public reads)
- Foundational precedes all stories; Observability & Docs after core stories

## Parallel Opportunities
- [ ] T011 and T017 can proceed in parallel after T004
- [ ] T014, T015, T016 can proceed in parallel (different files)
- [ ] T024 and T025 parallel (separate middleware vs route)

## MVP Strategy
- MVP = US1 (public read + UI without mutation controls) with Foundational complete
=======
# Tasks — 008-identity-platform

Purpose: Actionable, dependency-ordered tasks for Week 8 implementation.
Source of truth: specs/008-identity-platform/spec.md
Plan: specs/008-identity-platform/plan.md

## Phase 1 — Setup
chore/T001-env-flags-setup-DEV-598
- [X] T001 Establish env/flags (.env examples) per plan (NEXT_PUBLIC_API_URL, FIREBASE_*, SESSION_SECRET) — specs/008-identity-platform/quickstart.md
- [X] T002 Create CI spectral step and artifacts path — .github/workflows/ci.yml
- [X] T003 Add `scripts/sync-openapi.ts` to copy canonical contract to app — scripts/sync-openapi.ts
- [X] T045 Document Secret Manager wiring (FIREBASE_ADMIN_*), add .env.example placeholders and secret-pattern checks — specs/008-identity-platform/quickstart.md
=======
- [ ] T001 Establish env/flags (.env examples) per plan (NEXT_PUBLIC_API_URL, FIREBASE_*, SESSION_SECRET) — specs/008-identity-platform/quickstart.md
- [ ] T002 Create CI spectral step and artifacts path — .github/workflows/ci.yml
- [ ] T003 Add `scripts/sync-openapi.ts` to copy canonical contract to app — scripts/sync-openapi.ts
- [ ] T045 Document Secret Manager wiring (FIREBASE_ADMIN_*), add .env.example placeholders and secret-pattern checks — specs/008-identity-platform/quickstart.md
main

## Phase 2 — Foundational
- [X] T004 Add canonical OpenAPI skeleton (bearer + protected ops) — specs/008-identity-platform/contracts/openapi.yaml
- [X] T005 [P] Add rate-limit header policy docs (headers on 2xx, 429; none on preflight) — specs/008-identity-platform/plan.md
- [X] T006 Add logging policy & retention (PII redaction, 30d; audit 90d) — specs/008-identity-platform/plan.md
- [X] T031 CORS & preflight policy (OPTIONS 204 with Access-Control-*; add `Vary: Origin, Access-Control-Request-Method, Access-Control-Request-Headers`; no rate-limit headers on preflight) — api/src/middleware/cors.ts; frontend-next/next.config.js
- [X] T032 Content-Type guard for mutations (require application/json; else 415 envelope) — api/src/middleware/contentType.ts
- [X] T042 OpenAPI CI checks (operationId uniqueness, examples for 401/403/422/429/413/503; fail if global `security` block present; verify `servers` map to local/staging/prod) — scripts/validate-openapi.ts
- [X] T044 Time sync assumption documented (NTP/chrony) to honor ±5m skew — specs/008-identity-platform/spec.md
- [X] T049 Canonical contracts path + CI sync documented — specs/008-identity-platform/plan.md
- [X] T050 Security headers baseline (Referrer-Policy: `strict-origin-when-cross-origin`; X-Content-Type-Options: `nosniff`; X-Frame-Options: `DENY` or CSP `frame-ancestors 'none'`; minimal CSP with nonce `default-src 'self'; script-src 'self' 'nonce-<nonce>'`) — api/src/middleware/securityHeaders.ts
- [X] T051 OPTIONS contract tests (204 + Access-Control-*; no auth; add `Vary: Origin, Access-Control-Request-Method, Access-Control-Request-Headers`; no rate-limit headers; assert `Access-Control-Max-Age: 600` or intentional omission) — api/tests/contracts/cors.preflight.spec.ts
- [ ] T054 Spectral ruleset pin & CI gate (stoplight/spectral@6.11.0) — .spectral.yaml; .github/workflows/ci.yml
- [ ] T055 Secret scanning in CI (gitleaks or equivalent; whitelist fixtures) — .github/workflows/ci.yml; .gitleaks.toml
- [ ] T056 App Router lint/CI check (no pages/ or pages/api/; only app/api/.../route.ts) — .eslintrc.js; .github/workflows/ci.yml
- [ ] T058 Contract drift CI (diff canonical specs/.../contracts/openapi.yaml vs app) — scripts/quality-gate/check-contract-drift.ts
- [ ] T061 Expose rate-limit headers to browsers (Access-Control-Expose-Headers: X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After, X-Request-Id); assert presence on GET/POST responses — api/src/middleware/cors.ts; api/tests/contracts/cors.expose-headers.spec.ts
- [ ] T065 Ensure OpenAPI error examples include `requestId` in envelope for 401/403/422/429/413/503 — specs/008-identity-platform/contracts/openapi.yaml; scripts/validate-openapi.ts
- [ ] T066 Log guard CI to prevent `console.log`/PII logs in app code — .eslintrc.js; .github/workflows/ci.yml
- [ ] T067 CSP nonce/strict policy (tighten T050; automated check) — api/src/middleware/securityHeaders.ts; scripts/quality-gate/check-csp.ts
- [ ] T068 Content negotiation guard: mutating routes require `Accept: application/json`; extend 415 tests accordingly — api/src/middleware/contentType.ts; api/tests/contracts/http.415.spec.ts
- [ ] T069 CORS hardening: reject `Origin: null` (unless explicitly allowed) and assert no wildcard `Access-Control-Allow-Origin` in prod — api/src/middleware/cors.ts; api/tests/contracts/cors.preflight.spec.ts
- [X] T076 Env validation on boot (fail fast; names only, not values) — api/src/config/env.ts; api/tests/env.validation.spec.ts; frontend-next/src/config/env.ts
- [X] T084 Security headers++: add `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Resource-Policy: same-origin`, and a minimal `Permissions-Policy`; add tests — api/src/middleware/securityHeaders.ts; api/tests/security.headers.spec.ts
- [X] T085 CORS vary on normal responses: ensure `Vary: Origin` on CORS’d non-preflight responses; add contract test — api/src/middleware/cors.ts; api/tests/contracts/cors.vary-normal.spec.ts
- [X] T086 406 guard (content negotiation): if `Accept` excludes `application/json`, return 406; extend OpenAPI/examples + tests — api/src/middleware/contentType.ts; specs/008-identity-platform/contracts/openapi.yaml; api/tests/contracts/http.406.spec.ts
- [X] T087 Error cache headers: set `Cache-Control: no-store` on 401/403/422/429/413/503 responses; assert in contract tests — api/src/lib/errors.ts; api/tests/contracts/errors.cache-control.spec.ts
- [ ] T090 Dependency policy gate (non-gating at first): CI fails on high/critical vulns with allowlist — .github/workflows/ci.yml
- [ ] T092 Retry-After semantics: document and assert `Retry-After` present on 429 only (absent on 413/503); add contract checks — specs/008-identity-platform/plan.md; api/tests/contracts/retry-after.spec.ts
- [ ] T094 Cache rules on authenticated routes: set `Cache-Control: no-store, private` on any response that required auth; add contract test — api/src/middleware/cacheHeaders.ts; api/tests/contracts/cache.auth-routes.spec.ts
- [ ] T095 CORS credentials guard: allow `Access-Control-Allow-Credentials: true` only when `Access-Control-Allow-Origin` is an exact origin (never `*`); contract test — api/src/middleware/cors.ts; api/tests/contracts/cors.credentials.guard.spec.ts
- [ ] T096 415 vs 406 matrix doc: add a 2×2 decision chart in contentType.ts/OpenAPI comments (“invalid Content-Type → 415; Accept excludes JSON → 406”) — api/src/middleware/contentType.ts; specs/008-identity-platform/contracts/openapi.yaml
- [ ] T097 Origin=null dev carve-out: add dev allowlist toggle for `Origin: null` and test it is OFF in prod — api/src/middleware/cors.ts; api/tests/contracts/cors.origin-null.spec.ts
- [ ] T098 Spectral custom rules: forbid `additionalProperties: true` on error envelopes; require integer types for rate-limit headers (assert numeric emission in test); require at least one 2xx example per operation — .spectral.yaml; scripts/validate-openapi.ts; api/tests/middleware.rate-limit.headers.spec.ts
- [ ] T102 (merged into T094) — track under T094
- [ ] T103 Prod header invariant: fail startup if `ALLOW_CREDENTIALS=true` and `ALLOW_ORIGIN='*'` in prod; unit test — api/src/config/cors.ts; api/tests/cors.invariants.spec.ts
- [ ] T104 Drop client identity fields: strip `userId/role/authorId` from request bodies before business logic; unit test — api/src/middleware/stripIdentity.ts; api/tests/strip-identity.spec.ts
- [ ] T107 401/403 doc note: add explicit line in spec/plan (invalid/expired token → 401; valid identity but forbidden resource → 403) — specs/008-identity-platform/spec.md; specs/008-identity-platform/plan.md
- [ ] T108 Rate-limit key doc & test: document key derivation `userId || IP`; add precedence test — api/src/middleware/rateLimit.ts; api/tests/middleware.rate-limit.key.spec.ts
- [ ] T109 CSP nonce rotation test: ensure nonce differs between sequential responses — api/tests/security.csp-nonce.spec.ts
- [ ] T110 OpenAPI servers prod guard: fail CI if a server URL contains `localhost` when NODE_ENV=production — scripts/validate-openapi.ts
- [ ] T111 Error envelope optional `traceId` field and contract assertion that at least one of `requestId` or `traceId` is present on 4xx/5xx — api/src/lib/errors.ts; api/tests/contracts/errors.traceid.spec.ts

## Phase 3 — [US1] Anonymous reader (P1)
- [ ] T007 [US1] Ensure public GET endpoints documented as unauthenticated — specs/008-identity-platform/spec.md
- [ ] T008 [US1] Hide mutation controls when signed out (auth-aware UI) — frontend-next/src/lib/auth/
- [ ] T009 [US1] Independent test criteria listed in plan — specs/008-identity-platform/plan.md
- [ ] T043 [US1] A11y specifics (polite vs assertive; focus to first invalid; Escape closes modals; visible focus ring) — frontend-next/src/components/

## Phase 4 — [US2] Owner manages own posts (P2)
- [ ] T010 [US2] Firebase Web SDK auth module (signIn, signOut, getIdToken) — frontend-next/src/lib/auth/auth.ts
- [ ] T011 [P] [US2] Next.js App Router handlers login/logout/posts/* (verify ID token) — frontend-next/src/app/api/
- [ ] T033 [US2] CSRF server mint/verify (BFF mint token; API enforce on POST/PUT/DELETE) — frontend-next/src/app/api/login/route.ts; api/src/middleware/csrf.ts
- [ ] T012 [US2] CSRF double-submit wiring in client (header X-CSRF-Token) — frontend-next/src/lib/auth/
- [ ] T034 [US2] Token refresh (single getIdToken(true)) and ±5m clock skew accept; otherwise 401 — frontend-next/src/lib/auth/auth.ts; api/src/middleware/auth.ts; api/tests/auth.clock-skew.spec.ts
- [ ] T035 [US2] JWT verification semantics (aud, iss, sub, exp) and reject other Firebase projects — api/src/middleware/auth.ts
- [ ] T013 [US2] Owner-only guards in API (authorId === userId) — api/src/core/posts/
- [ ] T014 [US2] Zod schemas + 1MB body limit + 422 envelope — api/src/schemas/post.ts
- [ ] T015 [US2] Rate limit 10/min/user, headers on 2xx and 429 — api/src/middleware/rateLimit.ts
- [ ] T016 [US2] Audit logs for create/update/delete (fields including traceId) — api/src/logging/audit.ts
- [ ] T017 [US2] Contract updates: per-op security + responses 401/403/422/429/413/503 — specs/008-identity-platform/contracts/openapi.yaml
- [ ] T018 [US2] Contract tests for 200/401/403/404/422/429/413/503 — api/tests/contracts/
- [ ] T019 [US2] Independent test criteria recorded in plan — specs/008-identity-platform/plan.md
- [ ] T036 [US2] Read-only mode (READ_ONLY=true) middleware returning 503 envelope on writes — api/src/middleware/readOnly.ts
- [ ] T037 [US2] Distinguish 404 (non-existent) vs 403 (unauthorized existing) in posts routes — api/src/core/posts/
- [ ] T038 [US2] Rate-limit precedence userId→IP and omit headers on OPTIONS — api/src/middleware/rateLimit.ts
- [ ] T047 [US2] 1MB overflow returns 413 `{ code:"PAYLOAD_TOO_LARGE", ... }`, minimal Content-Length — api/src/middleware/bodyLimit.ts
- [ ] T048 [US2] Logout semantics (clear cookie Max-Age=0; HttpOnly; Secure; SameSite=Strict; Path=/) — frontend-next/src/app/api/logout/route.ts
- [ ] T060 [US2] OpenAPI + tests for 415 (extend T017/T018/T042); add `api/tests/contracts/http.415.spec.ts` and include artifact under `packet/contracts/` — specs/008-identity-platform/contracts/openapi.yaml; api/tests/contracts/http.415.spec.ts
- [ ] T062 [US2] Session cookie rotation (~15m or on role change) and Set-Cookie assertion (fake timers >15m; new cookie; correct flags) — frontend-next/src/app/api/login/route.ts; api/tests/auth.session-rotation.spec.ts
- [ ] T063 [US2] CSRF token semantics (entropy, bound to session, TTL ≤2h at BFF; API verifies TTL); add replay-window test and cross-session replay test (403) — specs/008-identity-platform/plan.md; api/tests/csrf.replay.spec.ts
- [ ] T052 [US2] Standard error envelope helper `{ code, message, details?, requestId }` used by 401/403/422/429/413/503 — api/src/lib/errors.ts
- [ ] T053 [US2] BFF→API identity propagation check (forward x-user-id/x-user-role; API rejects writes if verified identity present but headers missing/mangled) — frontend-next/src/app/api/posts/[...proxy]/route.ts; api/src/middleware/auth.ts
- [ ] T074 [US2] Audit schema JSON examples (success + denied) added to plan/spec and aligned with emitted fields — specs/008-identity-platform/plan.md; specs/008-identity-platform/spec.md
- [ ] T077 [US2] Direct-API denial e2e: curl API POST/PUT with valid bearer but no CSRF/BFF headers → 403; with CSRF but no x-user-* → 403; save outputs under packet/contracts/ — api/tests/contracts/bff-denial.e2e.spec.ts
- [ ] T093 [US2] CSRF replay-protection clock test: fuzz ±5m around CSRF TTL boundaries to prove expected pass/fail behavior — api/tests/csrf.ttl-fuzz.spec.ts
- [ ] T099 [US2] Owner-check mischief test: client supplies mismatched `authorId`; API must ignore client field and use server-resolved user — api/tests/posts.owner-mischief.spec.ts

## Phase 5 — [US3] Admin moderates any post (P3)
- [ ] T020 [US3] Admin authorization path (mutate any post) — api/src/core/posts/
- [ ] T021 [US3] Revocation checks for admin-sensitive ops — api/src/middleware/auth.ts
- [ ] T022 [US3] UI shows admin controls when role=admin — frontend-next/src/app/
- [ ] T023 [US3] Independent test criteria in plan — specs/008-identity-platform/plan.md
- [ ] T064 [US3] Revocation integration test for admin-sensitive op (revoked token → 401/403 + audit entry `status:"denied"`, reason) — api/tests/revocation.int.spec.ts

## Phase 6 — Observability & Docs (Day 4)
- [ ] T024 Request-id + traceparent propagation (FE→BFF→API) — api/src/middleware/
- [ ] T025 `/health` endpoint (commit, deps, time; 503 if deps down; Cache-Control: `no-store`; Content-Type: `application/json; charset=utf-8`) — api/src/routes/health.ts
- [ ] T026 README Auth section, troubleshooting, live URLs; note SameSite=Strict tradeoff and pivot conditions for Lax — README.md; specs/008-identity-platform/plan.md
- [ ] T027 CI latency micro-bench (100 GET + 20 writes @ c=5), print p50/p95 and warn if p95 > 300ms (non-gating) — .github/workflows/ci.yml
- [ ] T039 Correlate logs across tiers (same x-request-id/traceparent FE→BFF→API) — frontend-next/src/middleware/requestId.ts; api/src/middleware/requestId.ts
- [ ] T040 Log redaction & retention (app ≤30d, audit 90d; redact emails/tokens/cookies/bodies) — api/src/logging/
- [ ] T041 `/health` headers & failure tests (Cache-Control: `no-store`; Content-Type: `application/json; charset=utf-8`; 503 on dependency down) — api/tests/health/
- [ ] T057 A11y artifacts & keyboard-only video in CI (upload a11y-frontend-next/<sha>/index.html + short video) — .github/workflows/ci.yml; tests/a11y/
- [ ] T059 429 backoff documentation and optional client retry helper — README.md; frontend-next/src/lib/http/backoff.ts
- [ ] T070 README: idempotency guidance (retry POST only when safe; prefer PUT/PATCH for idempotent updates) — README.md
- [ ] T071 Firebase Admin IAM: document least-privilege roles/permissions and link from quickstart — specs/008-identity-platform/quickstart.md; specs/008-identity-platform/plan.md
- [ ] T072 Local dev parity: document Firebase Emulators setup and how Admin/Web SDKs point to emulators — specs/008-identity-platform/quickstart.md
- [ ] T073 Extend log guard: also flag console.warn/error unless routed via logger; add redaction unit test — .eslintrc.js; api/tests/logging.redaction.spec.ts
- [ ] T075 `/health` dependency matrix: simulate single-dependency down (e.g., firebase keys) → 503 and `dependencies.firebase:"down"` in JSON — api/tests/health/
- [ ] T078 Error envelope examples parity: ensure 422/429 examples include realistic `details[]`; contract tests assert array shape — specs/008-identity-platform/contracts/openapi.yaml; api/tests/contracts/error.examples.spec.ts
- [ ] T079 5xx/429 alerting stub (non-gating): CI prints counts table for unexpected 5xx and abnormal 429 rates — .github/workflows/ci.yml; scripts/quality-gate/alerting-stub.ts
- [ ] T081 k6 toolchain cache/install (speed up latency job) — .github/workflows/ci.yml
- [ ] T083 Redaction snapshot test: log fake payload with email/token/body; snapshot omits/redacts PII — api/tests/logging.redaction.snapshot.spec.ts
- [ ] T088 OpenAPI schema+example for `/health`; contract test validates keys & types — specs/008-identity-platform/contracts/openapi.yaml; api/tests/contracts/health.schema.spec.ts
- [ ] T089 Threat sketch (1-pager) with STRIDE notes + mitigations mapped to tasks — specs/008-identity-platform/security.md
- [ ] T091 Log sampling knob: env flag to downsample info logs in prod; unit test ensures error/audit are never sampled — api/src/logging/sampling.ts; api/tests/logging.sampling.spec.ts
- [ ] T100 PII redaction e2e: capture a full request/response log path and assert no emails/tokens/body fragments are emitted to sinks (stdout → collector) — api/tests/logging.redaction.e2e.spec.ts
- [ ] T101 `/health` schema drift guard: fail test if new field added without updating OpenAPI example (keeps docs parity) — api/tests/contracts/health.schema-drift.spec.ts
- [ ] T105 Idempotency e2e: retry helper refuses POST; allows PUT/PATCH with same idempotency key; add docs link — frontend-next/src/lib/http/backoff.ts; tests/idempotency.e2e.spec.ts; README.md
- [ ] T112 k6 threshold (non-gating) verdict print in CI logs (e.g., p95<300ms) — .github/workflows/ci.yml

## Final Phase — Evidence & Release (Day 5)
- [ ] T028 Aggregate evidence to Packet with fixed map: packet/contracts/ (Spectral + contract tests), packet/a11y/ (HTML + keyboard video), packet/bench/ (CSV + CI table), packet/security/ (gitleaks, CSP check, log-guard) — packet/
- [ ] T029 Ensure Gate green (Spectral=0, coverage thresholds met) — scripts/quality-gate/
- [ ] T030 Tag and publish release v8.0.0 with links — release script
- [ ] T080 Engines & Node pin checks: ensure `"engines": { "node": "20.x" }` enforced in both apps and CI verifies node version — frontend-next/package.json; api/package.json; .github/workflows/ci.yml
- [ ] T082 Cookie SameSite regression test: simulate cross-site nav vs same-site XHR to validate Strict behavior; document pivot to Lax conditions — frontend-next/tests/cookie.samesite.spec.ts; README.md
- [ ] T106 Checklist-to-evidence gate: CI asserts each checked CHK maps to ≥1 task and ≥1 artifact under packet/; fail otherwise — scripts/quality-gate/check-checklist-evidence.ts; .github/workflows/ci.yml

## Dependencies
- US1 → US2 → US3 (auth and guards build on public reads)
- Foundational precedes all stories; Observability & Docs after core stories

## Parallel Opportunities
- [ ] T011 and T017 can proceed in parallel after T004
- [ ] T014, T015, T016 can proceed in parallel (different files)
- [ ] T024 and T025 parallel (separate middleware vs route)

## MVP Strategy
- MVP = US1 (public read + UI without mutation controls) with Foundational complete
main
