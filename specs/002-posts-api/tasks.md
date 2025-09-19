# Posts API – Implementation Tasks

Use this checklist to implement the feature end-to-end. Execute tasks in order; check off as you go.

## Foundations
- [x] Initialize `api/src` substructure: `controllers/`, `services/`, `repositories/`, `middleware/`, `routes/`, `tests/`.
- [x] Create an app factory `createApp(config, repository)` that wires middleware, routes, and error handling.
- [x] Add a small config module to read env (RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, JSON_LIMIT).

## Repository Layer
- [x] Define `PostsRepository` interface: `create`, `getById`, `list(page, pageSize)`, `replace`, `update`, `delete`, `count`.
- [x] Implement `InMemoryPostsRepository` using `Map` with sorting by `createdAt`.
- [x] Add repository factory that returns in-memory by default; export for test injection.

## Service Layer
- [x] Implement `PostsService` that depends on `PostsRepository`:
  - [x] `create(data)` sets defaults, ids, timestamps; returns created.
  - [x] `getById(id)` returns post or domain not-found error.
  - [x] `list(page, pageSize)` enforces bounds; returns items + `hasNextPage`.
  - [x] `replace(id, data)` validates existence; preserves `id` and `createdAt`; updates `updatedAt`.
  - [x] `update(id, partial)` merges allowed fields; updates `updatedAt`.
  - [x] `delete(id)` deletes or returns not-found.

## Validation
- [x] Create Zod schemas: `PostCreate`, `PostUpdate` (partial + at least one field), and query schema for `page`/`pageSize`.
- [x] Export validation helpers for controllers to invoke and format errors.

## Controllers & Routes
- [x] Implement controllers mapping HTTP ↔ service results; set status codes/headers:
  - [x] `GET /health` → 200 `{ status: 'ok' }`.
  - [x] `GET /posts` → 200 list with pagination metadata.
  - [x] `POST /posts` → 201 with `Location` header.
  - [x] `GET /posts/:id` → 200 or 404.
  - [x] `PUT /posts/:id` → 200 or 400/404.
  - [x] `PATCH /posts/:id` → 200 or 400/404.
  - [x] `DELETE /posts/:id` → 204 or 404.
- [x] Create route modules that attach validators and bind controllers.

## Middleware
- [x] Wire `helmet`, `express.json({ limit })`, `morgan`.
- [x] Configure global IP rate limiting via `express-rate-limit` using env config; include standard headers.
- [x] Implement central error handler mapping `{ code }` → HTTP status and envelope `{ code, message, details? }`.

## OpenAPI Contract
- [x] Verify/update `api/openapi.json` to reflect limits and schemas (strict, no additional properties).
- [x] Optionally expose `/openapi.json` in dev; ensure file in repo is source of truth.

## Testing
### Unit Tests
- [x] Services: all operations, timestamps, defaults, and merge behavior.
- [x] Pagination calculations and ordering.
- [x] Repository (in-memory): CRUD and edge cases (missing ids, empty sets).
- [x] Validation: bodies, query params, unknown-field rejection, PATCH empty payload.
- [x] Error mapping: domain → HTTP status and envelope.

### Integration Tests
- [x] Boot app with in-memory repository. Test each route end-to-end (status, headers, body).
- [x] `POST /posts` success and validation failures.
- [x] `GET /posts` pagination behavior and bounds.
- [x] `GET /posts/:id` 200/404.
- [x] `PUT` and `PATCH` success and 400/404 paths.
- [x] `DELETE` 204 and 404.
- [x] Rate limiting: set tiny limits; assert 429 with headers and error envelope.
- [x] `GET /health` returns 200 status payload.

### Contract Tests
- [x] Load `api/openapi.json` and register with `jest-openapi`.
- [x] For each route, assert response bodies and required headers match the OpenAPI schemas.
- [x] Add a spec validation test that lints the OpenAPI document against the OpenAPI 3.1 meta-schema.

## Dev Experience
- [x] Add npm scripts for `dev`, `start`, `test`, and `test:watch` in `api/package.json` if missing.
- [ ] Document quickstart in `specs/002-posts-api/quickstart.md` (optional for this phase).

## Acceptance Check
- [x] Cross-check acceptance scenarios from the spec against tests; ensure coverage for all.
- [x] Ensure consistent error envelope across 4xx/5xx.
- [x] Confirm unknown fields rejected; PATCH requires at least one field.
- [x] Confirm OpenAPI doc is committed and tests pass.

---

All tasks complete. Date: 2025-09-19


