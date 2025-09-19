## Feature: Blog Posts REST API

### Summary
Production-shaped REST API for managing blog posts. Provides a health check endpoint and full CRUD for posts, with input validation, consistent error handling via RFC 7807 Problem Details, and simple IP-based rate limiting. Ships with an in-memory data store and leaves room for an optional SQLite adapter later. Authentication and multi-user roles are explicitly out of scope.

### Goals
- Provide a reliable health check endpoint for readiness/liveness.
- Expose RESTful CRUD endpoints for posts: create, list, read, update, delete.
- Enforce input validation with clear, consistent error responses.
- Implement simple IP-based rate limiting with standard headers.

### Non-Goals
- Authentication, authorization, and multi-user roles.
- Persistent storage by default; advanced rate limiting strategies or distributed quotas.

### User Stories
- As a client application, I can create, list, read, update, and delete blog posts.
- As an operator, I can check the API health to integrate with uptime monitors.

### API Surface (OpenAPI 3.1)
```yaml
openapi: 3.1.0
info:
  title: Blog Posts API
  version: 1.0.0
  description: |
    REST API that offers health and CRUD operations for blog posts. Includes
    input validation, RFC 7807 error responses, and basic IP rate limiting.
servers:
  - url: http://localhost:{port}
    description: Local development
    variables:
      port:
        default: "3000"
tags:
  - name: Health
  - name: Posts
components:
  schemas:
    ProblemDetails:
      type: object
      additionalProperties: true
      properties:
        type:
          type: string
          format: uri-reference
          description: A URI reference that identifies the problem type.
        title:
          type: string
        status:
          type: integer
          minimum: 100
          maximum: 599
        detail:
          type: string
        instance:
          type: string
          format: uri-reference
        errors:
          type: object
          description: Optional field-level validation errors keyed by field name.
      required: [title, status]

    Post:
      type: object
      additionalProperties: false
      properties:
        id:
          type: string
          description: Server-generated unique identifier (UUID v4 string).
        title:
          type: string
          minLength: 1
          maxLength: 200
        content:
          type: string
          minLength: 1
          maxLength: 10000
        slug:
          type: string
          description: Optional URL-friendly slug. If omitted, server may derive from title.
          pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
          minLength: 1
          maxLength: 200
        published:
          type: boolean
          default: false
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
      required: [id, title, content, published, createdAt, updatedAt]

    PostCreate:
      type: object
      additionalProperties: false
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        content:
          type: string
          minLength: 1
          maxLength: 10000
        slug:
          type: string
          pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
          minLength: 1
          maxLength: 200
        published:
          type: boolean
          default: false
      required: [title, content]

    PostUpdate:
      type: object
      additionalProperties: false
      properties:
        title:
          type: string
          minLength: 1
          maxLength: 200
        content:
          type: string
          minLength: 1
          maxLength: 10000
        slug:
          type: string
          pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$"
          minLength: 1
          maxLength: 200
        published:
          type: boolean
      minProperties: 1

    PostList:
      type: object
      additionalProperties: false
      properties:
        items:
          type: array
          items:
            $ref: '#/components/schemas/Post'
        total:
          type: integer
          minimum: 0
        limit:
          type: integer
          minimum: 1
          maximum: 100
        offset:
          type: integer
          minimum: 0
      required: [items, total, limit, offset]

  responses:
    RateLimited:
      description: Too Many Requests
      headers:
        X-RateLimit-Limit:
          description: Max requests allowed in the current window.
          schema: { type: integer }
        X-RateLimit-Remaining:
          description: Remaining requests in the current window.
          schema: { type: integer }
        Retry-After:
          description: Seconds until the limit resets.
          schema: { type: integer }
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/ProblemDetails'
    ErrorResponse:
      description: Problem Details error response
      content:
        application/problem+json:
          schema:
            $ref: '#/components/schemas/ProblemDetails'

paths:
  /health:
    get:
      tags: [Health]
      summary: Health check
      operationId: getHealth
      responses:
        '200':
          description: Service is healthy
          content:
            application/json:
              schema:
                type: object
                additionalProperties: false
                properties:
                  status:
                    type: string
                    enum: [ok]
                  uptimeMs:
                    type: integer
                    minimum: 0
                required: [status]
        '429':
          $ref: '#/components/responses/RateLimited'
        default:
          $ref: '#/components/responses/ErrorResponse'

  /posts:
    get:
      tags: [Posts]
      summary: List posts
      operationId: listPosts
      parameters:
        - in: query
          name: limit
          schema: { type: integer, minimum: 1, maximum: 100, default: 20 }
        - in: query
          name: offset
          schema: { type: integer, minimum: 0, default: 0 }
        - in: query
          name: q
          description: Optional case-insensitive substring match on title or content.
          schema: { type: string, minLength: 1, maxLength: 200 }
      responses:
        '200':
          description: A paginated list of posts
          headers:
            X-RateLimit-Limit: { schema: { type: integer } }
            X-RateLimit-Remaining: { schema: { type: integer } }
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PostList'
        '429':
          $ref: '#/components/responses/RateLimited'
        default:
          $ref: '#/components/responses/ErrorResponse'

    post:
      tags: [Posts]
      summary: Create a post
      operationId: createPost
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PostCreate'
      responses:
        '201':
          description: Post created
          headers:
            Location:
              description: URL of the created resource
              schema: { type: string }
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '409':
          description: Slug conflict (if provided slug already exists)
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'
        '429':
          $ref: '#/components/responses/RateLimited'
        default:
          $ref: '#/components/responses/ErrorResponse'

  /posts/{id}:
    parameters:
      - name: id
        in: path
        required: true
        schema: { type: string }
    get:
      tags: [Posts]
      summary: Get a post by id
      operationId: getPost
      responses:
        '200':
          description: The post
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          description: Not found
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'
        '429':
          $ref: '#/components/responses/RateLimited'
        default:
          $ref: '#/components/responses/ErrorResponse'

    put:
      tags: [Posts]
      summary: Replace a post by id
      operationId: replacePost
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PostCreate'
      responses:
        '200':
          description: Post replaced
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          description: Not found
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'
        '409':
          description: Slug conflict (if provided slug already exists)
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'
        '429':
          $ref: '#/components/responses/RateLimited'
        default:
          $ref: '#/components/responses/ErrorResponse'

    patch:
      tags: [Posts]
      summary: Partially update a post by id
      operationId: updatePost
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/PostUpdate'
      responses:
        '200':
          description: Post updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Post'
        '404':
          description: Not found
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'
        '409':
          description: Slug conflict (if provided slug already exists)
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'
        '429':
          $ref: '#/components/responses/RateLimited'
        default:
          $ref: '#/components/responses/ErrorResponse'

    delete:
      tags: [Posts]
      summary: Delete a post by id
      operationId: deletePost
      responses:
        '204': { description: Deleted }
        '404':
          description: Not found
          content:
            application/problem+json:
              schema:
                $ref: '#/components/schemas/ProblemDetails'
        '429':
          $ref: '#/components/responses/RateLimited'
        default:
          $ref: '#/components/responses/ErrorResponse'
```

### Validation
- **Title**: required; length 1–200; trimmed; reject pure whitespace.
- **Content**: required; length 1–10,000; trimmed.
- **Slug**: optional; lowercase `[a-z0-9-]`; no leading/trailing/multiple hyphens; 1–200.
- **Published**: boolean; default false when omitted on create.
- **PUT replace**: must satisfy `PostCreate` (title and content required). 
- **PATCH update**: must satisfy `PostUpdate` with at least one field; apply same constraints as create.
- **Query pagination**: `limit` [1, 100], default 20; `offset` ≥ 0, default 0.
- **Conflict**: creating or updating with a `slug` that already exists returns 409.

### Error Handling
- Use RFC 7807 Problem Details (`application/problem+json`) for all errors.
- Common statuses: 400 (bad request), 404 (not found), 409 (slug conflict), 415 (unsupported media type), 422 (validation), 429 (rate limited), 500 (internal).
- Problem shape: `{ type, title, status, detail, instance, errors? }` where `errors` holds per-field validation details.
- Always include a stable `type` URI for programmatic categorization when feasible.

### Rate Limiting
- Fixed-window per-IP strategy: default 100 requests per 60 seconds per IP address.
- Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`; on 429 include `Retry-After` (seconds).
- 429 returns a Problem Details body describing the limit and reset time.
- IP is determined from direct connection; trust proxies is out of scope.

### Data Storage
- Default: in-memory store (process-bound). Data is volatile and cleared on restart.
- Entity: `Post` with fields `id`, `title`, `content`, `slug?`, `published`, `createdAt`, `updatedAt`.
- Identifier: UUID v4 string generated server-side.
- Optional future adapter: SQLite with the same schema; adapter is not required in this phase.

### Deployment & Operations
- Runtime port configurable via `PORT` (default 3000).
- Rate limiting configurable via env: `RATE_LIMIT_WINDOW_MS` (default 60000), `RATE_LIMIT_MAX` (default 100).
- Log request method, path, status, latency; redact bodies in error logs.
- Health endpoint (`GET /health`) suitable for uptime checks.

### Test Plan
- Contract tests generated from the OpenAPI spec for all endpoints and error cases.
- Unit tests for validation and slug conflict detection.
- Integration tests for CRUD flows and pagination (including 404, 409, 415, 422 paths).
- Rate limit tests covering headers and 429 behavior.
- Smoke tests for health endpoint.

### Risks & Mitigations
- Volatile in-memory storage can lose data: document clearly; provide export/import helpers later.
- Rate limiting by IP can affect NATed users: keep conservative defaults; make configurable.
- Slug collisions on user-provided slugs: validate and return 409; allow clients to retry with a different slug.
