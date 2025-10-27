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

**Audit Log JSON Examples:**

```json
// Success audit log (POST /posts)
{
  "level": "info",
  "type": "audit",
  "ts": "2025-10-22T15:30:45.123Z",
  "verb": "create",
  "targetType": "post",
  "targetId": "post-abc123",
  "userId": "firebase-uid-abc123",
  "role": "owner",
  "status": 201,
  "requestId": "550e8400-e29b-41d4-a716-446655440000",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4736"
}

// Denied audit log (PUT /posts/post-xyz789 - insufficient permissions)
{
  "level": "info",
  "type": "audit",
  "ts": "2025-10-22T15:32:30.789Z",
  "verb": "update",
  "targetType": "post",
  "targetId": "post-xyz789",
  "userId": "firebase-uid-ghi789",
  "role": "owner",
  "status": 403,
  "requestId": "550e8400-e29b-41d4-a716-446655440002",
  "traceId": "4bf92f3577b34da6a3ce929d0e0e4738"
}
```

## Validation Rules (Zod)
- PostCreate: { title: 1..200, body: 1..20_000 }
- PostUpdate: { title?: 1..200, body?: 1..20_000 } (at least one present)
- Body size limit enforced at 1MB pre-parse.

## Ownership & Roles
- Owner may mutate only when `post.authorId === userId`.
- Admin may mutate any post.
