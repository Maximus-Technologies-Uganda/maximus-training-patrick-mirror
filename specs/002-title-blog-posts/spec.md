# Feature Specification: Blog Posts REST API

**Feature Branch**: `002-title-blog-posts`  
**Created**: 2025-09-19  
**Status**: Draft  
**Input**: User description: "Build a production-shaped Blog Posts REST API. The API must include endpoints for a health check and full CRUD operations for posts (create, read, update, delete). It needs to handle input validation, consistent error handling, and simple IP-based rate limiting. The API will be defined by an OpenAPI 3.1 spec and will use an in-memory database initially. Authentication and multi-user roles are out of scope."

## User Scenarios & Testing *(mandatory)*

### Primary User Story
As an API consumer, I need a stable REST API to create, read, update, delete, and list blog posts so that I can integrate content workflows with external systems and tooling.

### Acceptance Scenarios
1. Given a valid post payload, When the client POSTs to `/posts`, Then the API returns `201 Created` with the created post including a unique `id` and sets a `Location` header to `/posts/{id}`.
2. Given a missing or invalid required field, When the client POSTs to `/posts`, Then the API returns `400 Bad Request` with a structured error body describing validation failures.
3. Given multiple existing posts, When the client GETs `/posts` with pagination parameters, Then the API returns `200 OK` with an array of posts and pagination metadata. [NEEDS CLARIFICATION: pagination style and parameter names]
4. Given an existing post `id`, When the client GETs `/posts/{id}`, Then the API returns `200 OK` with the full post body.
5. Given a non-existent post `id`, When the client GETs `/posts/{id}`, Then the API returns `404 Not Found` with a structured error body.
6. Given an existing post, When the client PUTs `/posts/{id}` with a valid full replacement payload, Then the API returns `200 OK` with the updated post.
7. Given an existing post, When the client PATCHes `/posts/{id}` with a valid partial payload, Then the API returns `200 OK` with the updated post. [NEEDS CLARIFICATION: allowed fields and patch semantics]
8. Given an existing post, When the client DELETEs `/posts/{id}`, Then the API returns `204 No Content` with no body.
9. Given rapid repeated requests from the same IP exceeding the limit, When the client calls any endpoint, Then the API returns `429 Too Many Requests` with standard rate limit headers and a `Retry-After` indicator. [NEEDS CLARIFICATION: rate limit window and threshold]
10. Given the service is up, When the client GETs `/health`, Then the API returns `200 OK` with a minimal status payload.
11. Given the API is defined, When the client fetches the OpenAPI document, Then a valid OpenAPI 3.1 document is available in the repository and programmatically consumable. [NEEDS CLARIFICATION: should the spec also be served at a runtime endpoint?]

### Edge Cases
- Very long `title` or `content` near limits → validation error with clear messages.
- Unknown fields in payload → rejected or ignored consistently. [NEEDS CLARIFICATION: reject unknown vs. strip]
- Pagination parameters out of bounds (negative page, zero/too large page size) → validation error.
- PATCH payload with no recognized fields → validation error.
- Concurrent updates to the same post → last-write-wins vs. versioning. [NEEDS CLARIFICATION]
- Delete of a non-existent `id` → `404 Not Found`. [NEEDS CLARIFICATION: should delete be idempotent and return 204?]

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: Provide `GET /health` returning service status and HTTP 200.
- **FR-002**: Provide `POST /posts` to create a post with required fields validated; on success return 201, the created post, and `Location` header.
- **FR-003**: Provide `GET /posts` to list posts with pagination parameters and metadata in response.
- **FR-004**: Provide `GET /posts/{id}` to fetch a single post by `id`; return 404 when not found.
- **FR-005**: Provide `PUT /posts/{id}` to fully replace a post; validate full payload; return 200 with updated post.
- **FR-006**: Provide `PATCH /posts/{id}` to partially update a post; validate provided fields; return 200 with updated post.
- **FR-007**: Provide `DELETE /posts/{id}` to delete a post; return 204 on success; return 404 when not found. [NEEDS CLARIFICATION: idempotent delete]
- **FR-008**: Implement input validation for all endpoints with clear field-level error messages.
- **FR-009**: Implement consistent error responses with a stable envelope including an error `code` and human-readable `message`. [NEEDS CLARIFICATION: include correlation/trace id?]
- **FR-010**: Enforce simple IP-based rate limiting across endpoints and return 429 when exceeded, with standard rate limit headers. [NEEDS CLARIFICATION: exact limit and window]
- **FR-011**: Maintain an in-memory data store for posts for this initial phase; persistence is out of scope.
- **FR-012**: Provide an OpenAPI 3.1 specification of the API stored in-repo; validation of the spec is part of acceptance.
- **FR-013**: Use stable and descriptive HTTP status codes across all operations.
- **FR-014**: Document request and response schemas, including error schemas, in the OpenAPI document.
- **FR-015**: Include minimal metadata on list responses (e.g., total or next-page indicator). [NEEDS CLARIFICATION: which metadata set]

### Key Entities *(include if feature involves data)*
- **Post**: Represents a blog post visible to client applications. Key attributes: `id` (string), `title` (string, required), `content` (string, required), `tags` (array of strings, optional), `published` (boolean, default false), `createdAt` (datetime), `updatedAt` (datetime). Constraints and exact limits to be finalized. [NEEDS CLARIFICATION: field limits]
- **Error**: Stable error envelope for non-2xx responses. Attributes: `code` (machine-readable), `message` (human-readable), `details` (optional structured info). [NEEDS CLARIFICATION: include `requestId`/`traceId`]
- **Pagination**: Request params (e.g., `page`, `pageSize` or cursor), Response metadata (e.g., `page`, `pageSize`, `hasNextPage` or `nextCursor`). [NEEDS CLARIFICATION: choose offset vs. cursor]

---

## Review & Acceptance Checklist
*GATE: Automated checks run during review*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---

## Execution Status
*To be updated during implementation*

- [ ] User description parsed
- [ ] Key concepts extracted
- [ ] Ambiguities marked
- [ ] User scenarios defined
- [ ] Requirements generated
- [ ] Entities identified
- [ ] Review checklist passed

---
