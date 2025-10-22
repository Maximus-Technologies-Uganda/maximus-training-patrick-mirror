# Data Model (Week 8 – Identity Platform)

## Entities

### User
- userId (string, opaque UID)
- email (string)
- role (enum: owner | admin)

### Post
- id (string)
- authorId (string, FK -> User.userId)
- title (string, 1..200)
- body (string, 1..20_000)
- createdAt (ISO string)
- updatedAt (ISO string)

### AuditLog
- timestamp (ISO string)
- userId (string)
- role (enum)
- verb (enum: create | update | delete)
- targetType ("post")
- targetId (string)
- status (number)
- traceId/requestId (string)

## Validation Rules (Zod)
- PostCreate: { title: 1..200, body: 1..20_000 }
- PostUpdate: { title?: 1..200, body?: 1..20_000 } (at least one present)
- Body size limit enforced at 1MB pre-parse.

## Ownership & Roles
- Owner may mutate only when `post.authorId === userId`.
- Admin may mutate any post.
