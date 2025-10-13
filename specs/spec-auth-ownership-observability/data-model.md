# Data Model: Auth, Ownership, Observability

## Entities

### User
- userId: string (stable identifier)
- username: string (unique)

### Session
- sessionId: string (opaque)
- userId: string (FK → User)
- issuedAt: datetime
- expiresAt: datetime

### Post
- id: string
- ownerId: string (FK → User)
- title: string
- body: string
- createdAt: datetime
- updatedAt: datetime

## Validation Rules
- username: non-empty, normalized, unique
- title: non-empty, bounded length
- body: bounded length
- ownerId: server-assigned from session, immutable by clients

## State Transitions
- Post: create (assign ownerId), update (owner only), delete (owner only)
