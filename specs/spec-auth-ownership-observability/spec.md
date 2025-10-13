# Feature Specification: Foundational Authentication, Ownership, and Observability

**Feature Branch**: `spec-auth-ownership-observability`  
**Created**: 2025-10-13  
**Status**: Draft  
**Input**: User description: "write a technical specification for adding a foundational layer of authentication, ownership, and observability to a web application.Act as a principal engineer writing a technical specification."

## User Scenarios & Testing (mandatory)

### User Story 1 - Sign in and sign out with a username and password (Priority: P1)

As a user, I can sign in by providing my username and password to establish an authenticated session, and I can sign out to end my session.

**Why this priority**: Authentication is the prerequisite for ownership enforcement on write operations.

**Independent Test**: Validate sign-in returns a session cookie and sign-out clears it, without depending on any post data.

**Acceptance Scenarios**:

1. Given a valid username and password, when the user signs in, then a signed `HttpOnly` session cookie is set in the response.
2. Given invalid credentials or a disallowed user, when the user attempts to sign in, then the request is rejected with 401 Unauthorized and no cookie is set.
3. Given a valid session cookie, when the user signs out, then the session is invalidated and the cookie is cleared/expired.
4. Given no active session, when the user calls sign out, then the response is successful and idempotent with no active session remaining.

---

### User Story 2 - Write operations restricted to post owners (Priority: P1)

As an authenticated user, I can create, edit, and delete only my own posts. Attempts to modify others’ posts are blocked.

**Why this priority**: Ownership enforcement protects user data integrity and is the core security objective for write operations.

**Independent Test**: With two distinct authenticated users, verify that each can only modify posts they own.

**Acceptance Scenarios**:

1. Given an authenticated user, when creating a post, then the post is created with `ownerId` set to the authenticated `userId`.
2. Given an authenticated user who owns a post, when updating the post, then the update succeeds.
3. Given an authenticated user who does not own a post, when updating or deleting that post, then the request is rejected with 403 Forbidden.
4. Given no authenticated session, when attempting to create, update, or delete a post, then the request is rejected with 401 Unauthorized.
5. Given any user, when referencing a non-existent post for update/delete, then the response is 404 Not Found and reveals no ownership information.

---

### User Story 3 - Read posts publicly (Priority: P2)

As any user (public or authenticated), I can read all posts (lists and details) without authentication.

**Why this priority**: Public readability ensures discoverability and supports non-authenticated traffic.

**Independent Test**: Fetch posts without a session and verify responses are successful and complete.

**Acceptance Scenarios**:

1. Given no session, when listing posts, then the response is successful and includes public post data.
2. Given no session, when fetching a post by id, then the response is successful if the post exists (404 if it does not).

---

### User Story 4 - Trace requests end-to-end (Priority: P2)

As an operator, I can trace a request from the web layer through the API using a `request-id` included in all structured JSON logs.

**Why this priority**: Improves operability, incident response, and auditability with minimal overhead.

**Independent Test**: Initiate a request at the edge, verify the `request-id` appears in both web and API logs, and that the same id propagates to downstream calls.

**Acceptance Scenarios**:

1. Given a request without a client-provided id, when it enters the edge, then a `request-id` is generated and attached to all logs and downstream calls.
2. Given a request with a client-provided id, when it enters the edge, then the id is validated (length/charset) and propagated to logs and downstream calls.
3. Given any API request, when inspecting logs, then entries are structured JSON and include the `request-id` and, if authenticated, the `userId`.

### Edge Cases

- Tampered or expired session cookie results in 401 Unauthorized; no user context is established.
- Authenticated user attempts to modify another user’s post results in 403 Forbidden.
- Post not found results in 404 without leaking ownership information.
- Repeated sign-in requests should replace prior session and set a fresh cookie.
- Sign-out is idempotent whether or not a valid session exists.
- `request-id` collisions are extremely unlikely; if collision detection is feasible, treat as new id and continue.
- Username format violations (length/charset) are rejected with 400; excessive attempts may be rate-limited [out of scope for this spec].

## Requirements (mandatory)

### Functional Requirements

Authentication (AuthN)

- **FR-001**: Upon successful sign-in, the API MUST issue a signed, `HttpOnly` session cookie.
- **FR-002**: The session cookie MUST be invalidated/cleared on sign-out and MUST not be accessible to client-side scripts.
- **FR-003**: The API MUST validate the session cookie on protected requests and reject invalid/expired/tampered sessions with 401.
- **FR-004**: The session signing secret MUST be stored in GCP Secret Manager and injected into the Cloud Run service as an environment variable.
- **FR-005**: Credential flow for login MUST require username and password; other inputs are rejected with 400.
- **FR-006**: Session lifetime MUST be 24 hours absolute and 60 minutes idle; rotation on active use.

Authorization & Ownership (AuthZ)

- **FR-010**: The `Post` domain model MUST include an `ownerId` attribute representing the authenticated creator’s stable identifier.
- **FR-011**: All Create/Update/Delete (CUD) routes MUST be protected by authorization middleware that requires a valid session.
- **FR-012**: For Update and Delete, the middleware MUST enforce that `session.userId` equals the post’s `ownerId`; otherwise respond 403.
- **FR-013**: On Create, the API MUST set `ownerId` to the authenticated user’s identifier; clients cannot override this value.
- **FR-014**: Read endpoints for posts MUST remain publicly accessible (no authentication required).

Contracts (OpenAPI)

- **FR-020**: The OpenAPI specification MUST define a cookie-based `securitySchemes` entry documenting session authentication.
- **FR-021**: All post CUD operations MUST be marked as protected in OpenAPI and reference the cookie security scheme.
- **FR-022**: Standardized error schemas MUST be defined and referenced for `401 Unauthorized` and `403 Forbidden` responses.

Observability

- **FR-030**: All logs from the web layer and the API MUST be structured JSON, including timestamp, severity, component, route, method, and if available, `userId`.
- **FR-031**: A `request-id` MUST be generated or forwarded at the web edge and included in all logs and propagated to downstream API calls via the `X-Request-Id` header.
- **FR-032**: The API MUST expose a `/health` endpoint suitable for readiness checks, returning a simple status payload.

Non-Goals and Constraints

- OAuth providers, multi-tenant RBAC, and database migrations are out of scope for this feature.
- Rate limiting, brute-force protection, and user registration flows are not included in this scope.

### Key Entities (data)

- **User**: Represents an actor authenticated by username. Key attributes: `userId` (stable identifier), `username` (unique, human-readable). User profile storage is not required for this scope.
- **Session**: Represents authenticated state. Key attributes: `sessionId` (opaque), `userId`, `issuedAt`, `expiresAt`. Materialized as a signed cookie.
- **Post**: Represents user-authored content. Key attributes: `id`, `ownerId`, `title`, `body`, `createdAt`, `updatedAt`.

## Success Criteria (mandatory)

### Measurable Outcomes

- **SC-001**: 95% of sign-in attempts complete successfully within 3 seconds under nominal load.
- **SC-002**: 100% of write attempts by non-owners are rejected with 403; 0 known ownership bypasses in tests.
- **SC-003**: 100% of protected endpoints return 401 when called without a valid session.
- **SC-004**: 100% of log entries for served requests contain a `request-id` and are valid JSON.
- **SC-005**: `/health` endpoint is reachable and returns readiness status suitable for monitoring systems.

## Assumptions & Constraints (informational)

- Usernames are unique and immutable for the purposes of ownership attribution.
- Default session timeouts (if not otherwise specified): 24 hours absolute, 60 minutes idle; rotation on active use.
- Session cookie is marked `Secure`, `HttpOnly`, and uses a conservative same-site policy (e.g., Lax) appropriate for the app’s flows.
- `request-id` is a unique, opaque string generated at the edge when absent; canonical header is `X-Request-Id`.
- The `ownerId` attribute is a domain requirement; any data migration to backfill or persist it is tracked separately (out of scope here).

## Out of Scope

- OAuth/OIDC or social login, multi-tenant RBAC, user registration/password reset flows.
- Data/schema migrations and backfills for `ownerId` or user records.
- Rate limiting, anti-abuse, and anomaly detection.

## Acceptance Criteria by Requirement

- **FR-001**: Given successful login input, when the response is returned, then a `Set-Cookie` header exists for a signed `HttpOnly` session.
- **FR-002**: Given an active session, when sign-out is called, then the session is invalidated and the cookie is cleared/expired on the client.
- **FR-003**: Given a protected endpoint request with an invalid/expired/tampered cookie, when processed, then the response is 401 and no user context appears in logs.
- **FR-004**: Given runtime configuration, when the service starts, then the session secret is sourced from managed secret storage and available as an environment variable; attempts to run without it fail fast with clear error.
- **FR-005**: Given the decided credential flow, when a login attempt is made, then only the approved inputs are accepted and others return 400 with no cookie issued.
- **FR-006**: Given a session older than the absolute timeout or idle beyond the idle timeout, when a protected endpoint is accessed, then 401 is returned and a new login is required.
- **FR-010**: Given post creation, when persisting, then `ownerId` equals `session.userId` regardless of any client-provided owner fields.
- **FR-011**: Given a CUD request, when authorization middleware executes, then requests without a valid session are rejected with 401 before handler logic runs.
- **FR-012**: Given an update/delete request on a post not owned by the user, when authorization middleware executes, then the request is rejected with 403.
- **FR-013**: Given a create request including an explicit `ownerId`, when validated, then client-provided owner fields are ignored or rejected and the server sets `ownerId`.
- **FR-014**: Given a read request for posts, when processed without a session, then the response is successful (subject to existence of the resource).
- **FR-020**: Given the OpenAPI document, when inspected, then a cookie-based `securitySchemes` entry exists describing session authentication.
- **FR-021**: Given the OpenAPI document, when inspecting post CUD operations, then each references the cookie security scheme and is marked as protected.
- **FR-022**: Given the OpenAPI document, when inspecting `401` and `403` responses, then standardized error schemas are referenced consistently.
- **FR-030**: Given emitted logs from web and API, when sampled, then each entry is valid JSON and includes timestamp, severity, component, route, method, and `request-id` (plus `userId` when authenticated).
- **FR-031**: Given inbound requests, when a `request-id` is present, then it is validated and propagated; when absent, a new id is generated, logged, and forwarded to downstream components.
- **FR-032**: Given a call to `/health`, when invoked, then a success payload is returned indicating readiness; failures return non-200 with a diagnostic payload suitable for monitoring.
