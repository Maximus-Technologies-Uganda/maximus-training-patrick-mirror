## Technology Stack Decisions

- **Runtime & Language**: Node.js LTS (single-threaded event loop) with JavaScript (CommonJS), aligning with the repository’s current setup.
- **Web Framework (Express vs Fastify)**: Recommend **Express 5**.
  - **Why Express**: The repo already uses Express and related middleware; it’s stable, widely supported, and sufficient for a lightweight REST API at our expected scale. This minimizes churn and accelerates delivery.
  - **Why not Fastify**: Fastify offers higher throughput and first-class JSON Schema validation, but switching would add migration cost now. If future non-functional requirements demand higher baseline throughput, we can introduce a framework-agnostic HTTP adapter to enable later migration.
- **Validation**: **Zod** at the route layer for request body and query param validation. Zod’s developer ergonomics and strong error primitives support our error envelope. Unknown fields are rejected (strict parsing). For contract tests, we rely on the OpenAPI document (JSON Schema) rather than runtime AJV.
- **Rate Limiting**: Simple IP-based limit with `express-rate-limit`, configured via environment (window and max requests) and enabled across all endpoints.
- **Security & Observability**: `helmet` for sensible security headers; `morgan` for HTTP access logs. Optional request id header for easier tracing (future enhancement).
- **Persistence**: Start with an **in-memory** store using a repository abstraction. Adopt a **Repository pattern** and **constructor injection** in the service layer so we can swap in a **SQLite** repository without changing controllers/routes.
  - Repository interface (conceptual): create, getById, list (with pagination), replace, update (partial), delete, count.
  - SQLite path: Use a lightweight driver (e.g., better-sqlite3). Store `tags` as a JSON-encoded TEXT column initially. Add indexes on `createdAt` and `id`.
- **API Contract**: OpenAPI 3.1 document stored in-repo is the source of truth. Optionally serve it at `/openapi.json` in non-production environments.


## High-Level Architecture & Data Model

- **Layered Architecture**
  - **Routes**: Define URL structure and bind to controllers; perform light parameter extraction and attach validators.
  - **Controllers**: Translate HTTP concerns to service calls, handle status codes and headers (e.g., `Location`), and map validation results to errors.
  - **Services**: Business logic; orchestrate repository calls; apply domain rules (timestamps, defaults, merge semantics for PATCH).
  - **Repositories**: Data access boundary. Start with in-memory Map-backed implementation; later add SQLite implementation. Both conform to the same interface.
  - **Middleware**: Cross-cutting concerns: JSON parsing, helmet, logging, rate limiting, central error handler.

- **Post Data Model**
  - Fields: `id` (string, unique), `title` (1–200 chars), `content` (1–10,000 chars), `tags` (array of strings, each 1–40 chars, max 20 items), `published` (boolean, default false), `createdAt` (ISO 8601 string), `updatedAt` (ISO 8601 string).
  - Defaults & semantics: `published` defaults to false; timestamps are generated/updated by services; list responses are sorted by `createdAt` descending.
  - Relationships: `tags` are intrinsic to the post object (no separate entity in this phase).

- **Validation Strategy**
  - Bodies: Zod schemas per operation.
    - Create/PUT: full object; unknown fields rejected; required fields validated; lengths enforced.
    - PATCH: partial object; at least one valid field required; only allowed fields permitted.
  - Query params (GET /posts): `page` >= 1; `pageSize` within [1, 100].
  - Path params: `id` required, non-empty string.
  - Validation errors are surfaced as a structured error envelope with field-level details.

- **Error Handling & Rate Limiting**
  - Central error handler maps domain error codes to HTTP statuses and a consistent error envelope: `{ code, message, details? }`.
  - Rate limiting applied globally with standard headers; 429 responses follow the same error envelope and include limit headers and `Retry-After`.

- **Decisions resolving spec clarifications**
  - Pagination: Offset-based with `page` and `pageSize`; response includes `page`, `pageSize`, `hasNextPage`, and `items`.
  - Unknown fields: Rejected with validation error (strict mode) for bodies.
  - PATCH semantics: Only `title`, `content`, `tags`, `published` are updatable; at least one must be provided.
  - DELETE semantics: Return 404 when the `id` does not exist (non-idempotent delete per spec’s leaning).
  - Concurrency: Last-write-wins with `updatedAt` tracking; optimistic concurrency is out of scope for this phase.
  - Serving OpenAPI: Keep spec in-repo; optionally serve `/openapi.json` in dev.


## Testing Strategy

- **Test Tooling**: Jest test runner, Supertest for HTTP, and `jest-openapi` for contract assertions against the OpenAPI 3.1 spec. Use Node.js environment. Keep rate limit thresholds configurable for tests.

- **Unit Tests**
  - Services: create/list/get/replace/update/delete behavior, including timestamping, default values, and merge rules for PATCH.
  - Pagination logic: slicing, ordering, `hasNextPage` calculations.
  - Validation: route schemas for create/put/patch and query parameter validation, ensuring clear field-level errors and unknown field rejection.
  - Repository (in-memory): CRUD behaviors and edge cases.
  - Error mapping: verify custom errors map to standardized codes and HTTP statuses.

- **Integration Tests**
  - Spin up the Express app in-memory; verify end-to-end behavior of each route.
  - Validate headers (`Location` on create), status codes, and error envelopes.
  - Rate limiting: override config to a tiny threshold; assert 429 with appropriate headers and error body.
  - Health endpoint returns 200 with minimal payload.

- **Contract Tests (OpenAPI as source of truth)**
  - Load `api/openapi.json` and register with `jest-openapi`.
  - For each route/status pair in acceptance scenarios, assert `response.body` satisfies the spec schema and required headers are present.
  - Add a static check to validate the OpenAPI document is itself valid (OpenAPI schema validation) as a separate test.

- **Coverage Goals**: High coverage for services, repositories, and validation logic. Critical path routes covered integration + contract. Aim ≥ 90% lines/branches on core modules.


## Project Organization

- `api/` (project)
  - `api/src/` (all source)
    - `controllers/` — Translate HTTP to service calls; set status codes and headers; map results to DTOs.
    - `services/` — Business logic; accepts a repository via constructor; defines domain operations and validation usage.
    - `repositories/` — Data access layer. Start with `in-memory`. Add `sqlite` implementation later behind the same interface.
    - `middleware/` — Error handler and rate limiting; also JSON parsing and security middleware wiring.
    - `routes/` — Route registration modules that bind validators and controllers.
    - `tests/` — All tests organized under `unit/`, `integration/`, and `contract/` subfolders.

- **Config & DI**
  - Expose a small app factory that accepts configuration (rate limit window/threshold) and a repository instance. Server startup composes the default in-memory repository; tests can inject alternatives.
  - Store environment-driven config in a simple module for consistent usage.

- **Migration Path to SQLite**
  - Implement `SQLitePostsRepository` that conforms to the repository interface; wire via DI without changing controllers/services.
  - Schema: table `posts(id TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, tags TEXT, published INTEGER NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL)`; `tags` stored as JSON text; index on `createdAt`.
  - Add repository factory to select backend based on env flag.

- **Operational Notes**
  - Default rate limit: 100 requests per 60s per IP; configurable via env.
  - Error envelope is stable across 4xx/5xx.
  - Non-functional: keep cold start minimal and avoid heavy deps; log in common format.


## Acceptance Alignment

- Endpoints: health, posts CRUD with list pagination.
- Input validation with clear errors; reject unknown fields.
- Consistent error envelope with code/message/details.
- IP-based rate limiting with 429 and standard headers.
- OpenAPI 3.1 document in repo; contract tests assert conformance.
- In-memory persistence now; clean path to SQLite via repository pattern and DI.


