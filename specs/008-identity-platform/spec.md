# Feature Specification: Identity Platform, Roles & Production Hardening (Week 8)

**Feature Branch**: `008-identity-roles-hardening`  
**Created**: 2025-10-21  
**Status**: Draft  
**Input**: User description: "Act as a senior software architect. Create a detailed feature specification document based on the requirements from our 'Week 8 Workbook – Identity Platform, Roles & Production Hardening'. The Week 8 Workbook is the single source of truth."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Anonymous reader sees only read capabilities (Priority: P1)

An anonymous visitor can browse and read posts. They must not see any mutation controls (create, edit, delete) anywhere in the UI.

**Why this priority**: Preserves public read access and serves as the fallback mode if identity services fail; it also validates that role-based controls are correctly hidden by default.

**Independent Test**: Load the posts page without being signed in; verify that posts are visible and no create/edit/delete controls are present.

**Acceptance Scenarios**:

1. **Given** a visitor not signed in, **When** they open the posts page, **Then** they can view the list of posts and details, and no mutation controls are visible.
2. **Given** a visitor not signed in, **When** they attempt a direct POST/PUT/DELETE call to `/posts`, **Then** the API responds with `401 Unauthorized` and no change occurs.

---

### User Story 2 - Owner can sign in/out and manage their own posts (Priority: P2)

A signed-in user with the `owner` role can create new posts and edit or delete only the posts they authored.

**Why this priority**: Enables core user value—managing one’s own content—while enforcing least privilege.

**Independent Test**: Sign in as an `owner`; create a post; edit and delete it; attempt to edit/delete a different user’s post and observe `403 Forbidden`.

**Acceptance Scenarios**:

1. **Given** a user with role `owner` is signed in, **When** they submit a valid create request to `/posts`, **Then** the post is created and attributed to their user id.
2. **Given** the same user, **When** they edit or delete a post they authored, **Then** the operation succeeds (200/204) and an audit record is emitted.
3. **Given** the same user, **When** they attempt to edit or delete a post authored by someone else, **Then** the API responds `403 Forbidden`.

---

### User Story 3 - Admin can moderate any post (Priority: P3)

A signed-in user with the `admin` role can edit or delete any user’s posts.

**Why this priority**: Supports moderation and operational administration across all content.

**Independent Test**: Sign in as an `admin`; edit and delete a post authored by another user and observe success.

**Acceptance Scenarios**:

1. **Given** a user with role `admin` is signed in, **When** they edit or delete any post, **Then** the operation succeeds (200/204) and an audit record is emitted.
2. **Given** a user with role `admin`, **When** they create a post, **Then** it is attributed to their user id and subject to the same validation, CSRF, and rate limiting as any mutation.

---

### Edge Cases

- Expired or invalid ID token: protected endpoints respond `401 Unauthorized`; UI reflects signed-out state.
- Authenticated `owner` attempts to mutate a post they do not own: respond `403 Forbidden` with standard envelope.
- Missing or invalid CSRF token on write: respond `403 Forbidden` with standard envelope; do not process payload.
- Request body exceeds 1MB: request is rejected with `413 Payload Too Large` before validation.
- Schema validation fails: respond `422 Unprocessable Entity` with `{ code, message, details }`.
- Rate limit exceeded (>10 writes/min/user): respond `429 Too Many Requests` with retry hints.
- Anonymous user tries to access create/edit/delete UI via deep link: UI redirects or hides controls; API still enforces AuthZ.

### 401 vs 403 Semantics (T107)

- `401 Unauthorized`: identity is missing, invalid, or expired (e.g., bad/expired token).
- `403 Forbidden`: identity is valid but the resource/action is not permitted (e.g., owner attempting to mutate another user’s post).

### 404 vs 403 Semantics (T037)

- Return `404 Not Found` when a target resource does not exist.
- Return `403 Forbidden` when the resource exists but the caller lacks permission to mutate it.
- Do not mask authorization failures as `404` for existing resources.

## Requirements *(mandatory)*

### Functional Requirements

AuthN (Identity Platform)

- **FR-001**: Integrate a managed identity platform (Google Identity Platform/Firebase Auth) for user authentication.
- **FR-002**: Client obtains a short‑lived ID token upon sign‑in (Email/Password to start).
- **FR-003**: Preserve the BFF pattern: the browser sends the ID token to server-side route handlers; no direct browser→API mutations.
- **FR-004**: Server-side route handlers verify the ID token using server credentials; on success, they forward verified user identity (subject/userId) and role to the downstream API. Optionally, a short‑lived HttpOnly session cookie MAY be issued.

AuthZ (Roles & Permissions)

- **FR-010**: Introduce roles `owner` and `admin`.
- **FR-011**: Protect mutating endpoints on `/posts` (`POST`, `PUT`, `DELETE`): require authenticated identity.
- **FR-012**: Owners may create posts and may edit/delete only posts where `authorId === userId`.
- **FR-013**: Admins may edit/delete any post.
- **FR-014**: Non‑mutating reads (`GET /posts`, `GET /posts/{id}`) remain public.

Security & Validation

- **FR-020**: All mutating requests MUST include a valid CSRF token bound to the user/session context.
- **FR-021**: Validate all API request bodies using a formal schema; enforce a maximum payload size of 1MB.
- **FR-022**: Return `422 Unprocessable Entity` with envelope `{ code, message, details? }` for validation failures.
- **FR-023**: Rate‑limit mutating endpoints to 10 requests per minute per authenticated user; for anonymous contexts use IP as a fallback key.
- **FR-024**: Respond `429 Too Many Requests` when rate limit is exceeded; include retry hints.
- **FR-025**: Mutating requests MUST use `Content-Type: application/json`; otherwise respond `415 Unsupported Media Type` with a standardized error envelope including `requestId` when available.

Observability & Health

- **FR-030**: Generate or forward a `request-id` for every request and include it in all structured logs across tiers.
- **FR-031**: Emit audit logs for create/update/delete with fields `{ timestamp, userId, role, verb, targetId, traceId }`.
- **FR-032**: Provide a `/health` endpoint that returns service status (including commit SHA and dependency checks).

API Design (OpenAPI)

- **FR-040**: Define `securitySchemes` for Bearer token authentication in the API contract.
- **FR-041**: Mark all protected operations with the `security` requirement referencing the Bearer scheme.
- **FR-042**: Standardize error envelopes for `401 Unauthorized` and `403 Forbidden` responses across protected operations.
- **FR-043**: Document schemas and responses for `422 Unprocessable Entity` and `429 Too Many Requests`.

Risks & Rollback

- **FR-050**: If identity integration is unavailable or verification fails system‑wide, gracefully degrade to public, read‑only access to posts (preserving prior Week‑7 behavior). All mutation controls remain hidden and API mutations are disabled.

Assumptions & Dependencies

- Roles are assigned out‑of‑band (no role management UI in scope for Week 8).
- Supported sign‑in method this week: Email/Password. Additional SSO providers may be considered later if trivial.
- BFF is the only browser path for writes; direct browser→API writes are prohibited.
- Data model for posts exists from prior weeks; this spec does not change persistence schema.

### Key Entities *(include if feature involves data)*

- **User**: Represents an authenticated principal. Key attributes: `userId` (subject/UID), `email` (for display), `role` (`owner`|`admin`).
- **Post**: User‑generated content. Key attributes: `id`, `authorId`, `title`, `body`, `createdAt`, `updatedAt`.
- **AuditLog**: Immutable log of mutations. Attributes: `timestamp`, `userId`, `role`, `verb` (`create`|`update`|`delete`), `targetId` (post id), `traceId`.
- **RateLimitBucket**: Logical counter keyed by `userId` (or IP fallback) with 1‑minute window and capacity 10.
- **CsrfToken**: Token bound to user/session to protect writes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Anonymous users can load posts and details with no sign‑in, and do not see any mutation controls (verified via automated UI test).
- **SC-002**: Owners can create, edit, and delete their own posts; attempts to mutate others’ posts return `403` in 100% of tested cases.
- **SC-003**: Admins can edit/delete any post; success rate 100% across targeted tests.
- **SC-004**: 100% of create/update/delete operations produce an audit record containing `{ timestamp, userId, role, verb, targetId, traceId }`.
- **SC-005**: All protected endpoints enforce authentication; unauthenticated calls receive standardized `401` responses in 100% of tests.
- **SC-006**: Rate limit of 10 writes per minute per user is enforced; exceeding requests return `429` in 100% of tests.
- **SC-007**: All write requests require CSRF; absence or mismatch yields standardized `403` in 100% of tests.
- **SC-008**: Request logs include a `request-id` end‑to‑end in 100% of observed requests during test runs.
- **SC-009**: `/health` endpoint returns service status including commit identifier; endpoint reachable in < 300ms p95 in CI smoke.



## Traceability & Artifacts (mandatory)

- **PR naming**: `[SPEC] Identity Platform & Roles` (merges to `specs/008-identity-platform/`).
- **Artifacts path**:
  - `specs/008-identity-platform/spec.md` (this doc)
  - `specs/008-identity-platform/plan.md` (day-by-day)
  - `specs/008-identity-platform/tasks.md` (ticketized)
  - `specs/008-identity-platform/contracts/` (OpenAPI + Spectral reports)
- **Automation**: On merge of `[SPEC]` PR → auto-create Linear issue (ID captured here: `LINEAR-XXXX`).
- **Code PRs**: Each code PR must (1) reference `LINEAR-XXXX`, and (2) reference this spec path.
- **Mirror**: publish-only; disable backflow.

## Out of Scope (explicit)

- Only Email/Password (+ one trivial SSO if time allows).
- No multi-tenant projects, no new DB migrations (unless already in use).
- No IAP/Gateway.

## Security Controls (pin specifics)

- **Body size limit**: 1MB on all route handlers and API ingress.
- **Timeouts**: 10s per handler; abort and structured error on exceed.
- **Deny lists**: Reserve endpoints for future; none enabled this week.
- **Secrets**: Firebase Admin keys via Secret Manager; no secrets in env files or code.
- **Clock skew**: Accept ±5 minutes on ID token `iat/exp` to reduce false 401s.
- **Time synchronization**: Infrastructure assumes NTP/chrony is configured and operational to maintain ±5m maximum clock drift between API servers, client systems, and Firebase token issuers. This supports the clock skew tolerance for token validation.
- **Revocation**: Honor Firebase token revocation on privileged actions (admin).

## CSRF Model (unambiguous)

- **Token binding**: Double-submit cookie + header (`X-CSRF-Token`) bound to the short-lived session (if using cookie mode); else bind to user session state.
- **Where required**: `POST/PUT/DELETE` only.
- **Failure**: `403` with standard envelope.

## Logout (T048)

- `POST /api/logout` clears the session cookie with: `Set-Cookie: session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0` and clears any CSRF cookie similarly (`Max-Age=0`, `Path=/`, `SameSite=Strict`).
- `Secure` flag is included when served over HTTPS.

## Session Cookie Rotation (T062)

- Rotate the short‑lived session cookie approximately every 15 minutes, or immediately upon role change.
- New cookie flags: `HttpOnly`, `Secure` (HTTPS), `SameSite=Strict`, `Path=/`, `Max‑Age=1800`.

## Rate-Limit Spec (pin the algorithm)

- **Window**: fixed window 60s; capacity 10.
- **Key**: `userId`; fallback `ip` when unauthenticated. Precedence is `userId || ip` (T108).
- **Store**: in-memory for demo; adapter interface for Redis/Cloud Memorystore later.
- **Headers**: include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` on 429.
- **Admin**: NOT exempt.
 - **Admin**: NOT exempt.
 - **Preflight**: `OPTIONS` (CORS preflight) requests are not rate limited and MUST NOT include any rate‑limit headers; respond `204` with appropriate `Access-Control-*` headers.

## Observability (fields & propagation)

- **Request-ID propagation**: Browser → Next.js route handler → API via `x-request-id` (generate UUID if absent).
- **Structured logs** (all tiers): `{ ts, level, requestId, traceId, userId?, role?, method, path, status, latency_ms, msg }`.
- **Audit log** (write ops only): `{ ts, userId, role, verb, targetType:"post", targetId, status, traceId }`. Storage: app logs; searchable by `requestId`/`traceId`.

## Health Endpoint (shape)

- `GET /health` → `200`

```json
{
  "service": "api",
  "status": "ok",
  "commit": "<git-sha>",
  "dependencies": { "firebase": "ok", "db": "ok" },
  "time": "<RFC3339>"
}
```

- CI smoke SLO: p95 < 300ms.

## OpenAPI Contract Additions (drop-in)

### Public Read Endpoints (Unauthenticated)
- `GET /posts` — public listing; no authentication required.
- `GET /posts/{id}` — public detail; no authentication required.

OpenAPI explicitly marks these operations with `security: []` to denote no auth, while protected write operations specify `security: [{ BearerAuth: [] }]`.

- **SecuritySchemes**:

```yaml
components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
security: [] # default none; per-op security below
```

- **Protected ops example**:

```yaml
paths:
  /posts:
    post:
      operationId: createPost
      tags: [Posts]
      summary: Create a post
      security: [{ BearerAuth: [] }]
      responses:
        "201": { $ref: "#/components/responses/Post" }
        "401": { $ref: "#/components/responses/Err401" }
        "403": { $ref: "#/components/responses/Err403" }
        "422": { $ref: "#/components/responses/Err422" }
        "429": { $ref: "#/components/responses/Err429" }
        "415": { $ref: "#/components/responses/Err415" }
components:
  responses:
    Err401:
      description: Unauthorized
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorEnvelope"
    Err403:
      description: Forbidden
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorEnvelope"
    Err422:
      description: Unprocessable Entity
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ValidationErrorEnvelope"
    Err429:
      description: Too Many Requests
      headers:
        Retry-After:
          schema: { type: integer }
          description: Seconds until next allowed request
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorEnvelope"
    Err415:
      description: Unsupported Media Type
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorEnvelope"
  schemas:
    ErrorEnvelope:
      type: object
      required: [code, message]
      properties:
        code: { type: string, example: "FORBIDDEN" }
        message: { type: string }
        details: { type: object, additionalProperties: true }
    ValidationErrorEnvelope:
      allOf:
        - $ref: "#/components/schemas/ErrorEnvelope"
        - type: object
          properties:
            details:
              type: array
              items:
                type: object
                properties:
                  path: { type: string }
                  issue: { type: string }
```

- **Spectral**: ruleset pinned; CI fails on any errors; report goes into Packet.

## Testing & Evidence (what CI must produce)

- **Contract tests**: 200/401/403/404/422; plus 429 for rate-limit.
- **Coverage thresholds**:
  - API ≥ 80% lines, 70% branches
  - Frontend-next ≥ 70% lines (login + posts surfaces)
- **A11y smokes** (Playwright + axe/pa11y):
  - Labeled inputs on login
  - Keyboard path (login → posts → create/delete)
  - `aria-live` status during auth state changes
  - Focus management on dialog open/close
  - Artifacts uploaded under `a11y-frontend-next/` (HTML reports)
- **Latency micro-bench (non-gating)**: 100 GETs + 20 writes at c=5; print p50/p95 in Gate summary and attach raw CSV to Packet.
- **Gate summary must show**: FE+API coverage totals, Spectral summary (errors=0), latency mini-table, live URLs.
- **Packet must include**: coverage artifacts, a11y HTML, Spectral report, screenshots of login + post actions.

## Client Integration Details (Next.js)

- **Auth module**: expose `signIn(email,pw)`, `signOut()`, `getIdToken(forceRefresh?)`.
- **Route handlers**: `/api/login`, `/api/logout`, `/api/posts/*`: verify ID token; optionally set short-lived HttpOnly cookie (15–30m) with rotation; forward `x-user-id` + `x-user-role` to API.
- **UI**: show/hide mutate controls by auth state; SSR reads remain public.

## Ownership & Role Resolution

- **Role source**: assigned out-of-band and fetched from backend/user store on verification; cached in session (if cookie mode) or re-resolved on each verified call (if bearer-only).
- **Owner check**: `authorId === userId`.

## Risks & Rollback (operational)

- If Firebase/verification is down: app switches to read-only; mutation UI hidden; all writes return `503` with clear message; link to status page in README Troubleshooting.

## README Truth Table (must-haves)

- **Live URLs**: Cloud Run frontend + API.
- **Run & Try** (Next.js): commands + env table (`API_BASE_URL`, `NEXT_PUBLIC_API_URL`, Firebase config).
- **Evidence links**: Gate run, Packet, a11y HTML, Spectral report, coverage screenshots.
- **Auth notes**: owner/admin behaviors; troubleshooting (clock skew, revoked tokens).


## Final Blockers (must include)

1) Cookie + session hardening

```
Session cookie (if used): HttpOnly, Secure, SameSite=Strict, Path=/, Max-Age=1800 (30m).
Rotate on every 15m or role change; revoke on sign-out.
```

2) CORS & allowed headers

```
CORS: only NEXT_PUBLIC_API_URL origins. Allowed headers: Authorization, X-CSRF-Token, X-Request-Id, Content-Type. Methods: GET, POST, PUT, DELETE. Credentials: true (if cookie mode).
```

3) Explicit token lifetimes & refresh behavior

```
ID token: ~60m (default). On 401 due to exp/clock skew, attempt single getIdToken(true) refresh; otherwise force re-auth.
```

4) 403 vs 503 split for rollback mode

```
Read-only degradation: writes return 503 SERVICE_UNAVAILABLE with envelope { code:"READ_ONLY", ... }. AuthZ failures remain 403; unauthenticated remain 401.
```

5) PII logging policy

```
Never log: email, passwords, tokens, cookies, raw request bodies. Allow only userId (opaque UID) + role. Redaction filter applied before emit.
```

6) Log retention

```
Structured logs retained 14 days (CI/demo), audit entries 30 days. No export of raw payloads.
```

7) Tracing header contract

```
Propagation: prefer W3C traceparent/tracestate; include x-request-id for human debugging. Generate UUIDv4 if missing.
```

8) OpenAPI: 413 + 503 (add to protected write ops)

```yaml
"413": { $ref: "#/components/responses/Err413" }
"503": { $ref: "#/components/responses/Err503" }
components:
  responses:
    Err413:
      description: Payload Too Large
      content:
        application/json:
          schema: { $ref: "#/components/schemas/ErrorEnvelope" }
    Err503:
      description: Service Unavailable (read-only mode or dependency failure)
      content:
        application/json:
          schema: { $ref: "#/components/schemas/ErrorEnvelope" }
```

9) A11y: live region level + focus rules

```
aria-live="polite" for non-critical auth state; "assertive" only for error banners. Move focus to the first invalid field on validation errors; trap focus in modal dialogs.
```

10) Spectral pin

```
Spectral ruleset: stoplight/spectral:6.11.0 (pinned). CI fails on any error; warnings allowed but listed in Gate summary.
```

## Nice-to-have Polish

- Admin abuse guardrails: log a WARN when admin mutates non-owned content; include previous→new diffs size, not body.
- Rate-limit headers everywhere: on non-429 responses too (helpful for clients).
- Role resolution cache key: document TTL (e.g., 5m) and cache bust on sign-out/role change.
- Health deep checks: document that `/health` verifies Firebase Admin can fetch public keys and DB ping < 100ms; include `uptime_s`.
- CI labels: name a11y report dir `a11y-frontend-next/<commit-sha>/index.html` and link it in the Gate summary.
- Micro-bench note: name the tool (e.g., `k6`), include the exact scenario in repo under `bench/week8.js`, and archive results CSV in Packet.
- README troubleshooting: add entries for “clock skew”, “token revoked”, “429 loops (backoff advice)”, “CORS 401 vs 403”.
- Error codes: propose canonical codes (`UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `RATE_LIMITED`, `READ_ONLY`, `PAYLOAD_TOO_LARGE`).

