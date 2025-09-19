# Posts API – Implementation Tasks

Use this checklist to implement the feature end-to-end. Execute tasks in order; check off as you go.

## Foundations
- [ ] Initialize `api/src` substructure: `controllers/`, `services/`, `repositories/`, `middleware/`, `routes/`, `tests/`.
- [ ] Create an app factory `createApp(config, repository)` that wires middleware, routes, and error handling.
- [ ] Add a small config module to read env (RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX, JSON_LIMIT).

## Repository Layer
- [ ] Define `PostsRepository` interface: `create`, `getById`, `list(page, pageSize)`, `replace`, `update`, `delete`, `count`.
- [ ] Implement `InMemoryPostsRepository` using `Map` with sorting by `createdAt`.
- [ ] Add repository factory that returns in-memory by default; export for test injection.

## Service Layer
- [ ] Implement `PostsService` that depends on `PostsRepository`:
  - [ ] `create(data)` sets defaults, ids, timestamps; returns created.
  - [ ] `getById(id)` returns post or domain not-found error.
  - [ ] `list(page, pageSize)` enforces bounds; returns items + `hasNextPage`.
  - [ ] `replace(id, data)` validates existence; preserves `id` and `createdAt`; updates `updatedAt`.
  - [ ] `update(id, partial)` merges allowed fields; updates `updatedAt`.
  - [ ] `delete(id)` deletes or returns not-found.

## Validation
- [ ] Create Zod schemas: `PostCreate`, `PostUpdate` (partial + at least one field), and query schema for `page`/`pageSize`.
- [ ] Export validation helpers for controllers to invoke and format errors.

## Controllers & Routes
- [ ] Implement controllers mapping HTTP ↔ service results; set status codes/headers:
  - [ ] `GET /health` → 200 `{ status: 'ok' }`.
  - [ ] `GET /posts` → 200 list with pagination metadata.
  - [ ] `POST /posts` → 201 with `Location` header.
  - [ ] `GET /posts/:id` → 200 or 404.
  - [ ] `PUT /posts/:id` → 200 or 400/404.
  - [ ] `PATCH /posts/:id` → 200 or 400/404.
  - [ ] `DELETE /posts/:id` → 204 or 404.
- [ ] Create route modules that attach validators and bind controllers.

## Middleware
- [ ] Wire `helmet`, `express.json({ limit })`, `morgan`.
- [ ] Configure global IP rate limiting via `express-rate-limit` using env config; include standard headers.
- [ ] Implement central error handler mapping `{ code }` → HTTP status and envelope `{ code, message, details? }`.

## OpenAPI Contract
- [ ] Verify/update `api/openapi.json` to reflect limits and schemas (strict, no additional properties).
- [ ] Optionally expose `/openapi.json` in dev; ensure file in repo is source of truth.

## Testing
### Unit Tests
- [ ] Services: all operations, timestamps, defaults, and merge behavior.
- [ ] Pagination calculations and ordering.
- [ ] Repository (in-memory): CRUD and edge cases (missing ids, empty sets).
- [ ] Validation: bodies, query params, unknown-field rejection, PATCH empty payload.
- [ ] Error mapping: domain → HTTP status and envelope.

### Integration Tests
- [ ] Boot app with in-memory repository. Test each route end-to-end (status, headers, body).
- [ ] `POST /posts` success and validation failures.
- [ ] `GET /posts` pagination behavior and bounds.
- [ ] `GET /posts/:id` 200/404.
- [ ] `PUT` and `PATCH` success and 400/404 paths.
- [ ] `DELETE` 204 and 404.
- [ ] Rate limiting: set tiny limits; assert 429 with headers and error envelope.
- [ ] `GET /health` returns 200 status payload.

### Contract Tests
- [ ] Load `api/openapi.json` and register with `jest-openapi`.
- [ ] For each route, assert response bodies and required headers match the OpenAPI schemas.
- [ ] Add a spec validation test that lints the OpenAPI document against the OpenAPI 3.1 meta-schema.

## Dev Experience
- [ ] Add npm scripts for `dev`, `start`, `test`, and `test:watch` in `api/package.json` if missing.
- [ ] Document quickstart in `specs/002-posts-api/quickstart.md` (optional for this phase).

## Acceptance Check
- [ ] Cross-check acceptance scenarios from the spec against tests; ensure coverage for all.
- [ ] Ensure consistent error envelope across 4xx/5xx.
- [ ] Confirm unknown fields rejected; PATCH requires at least one field.
- [ ] Confirm OpenAPI doc is committed and tests pass.


