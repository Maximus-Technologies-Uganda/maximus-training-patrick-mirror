# Data Model: Week 9 Frontend Foundations

## Domain Entities

### Post

Represents a single blog post with identity, ownership, content, and timestamps.

**Properties**:

- `id` (string, UUID format, required) - Unique identifier for the post
- `ownerId` (string, UUID format, optional) - ID of the user who created the post
- `title` (string, required) - Post title, max 200 characters
- `author` (string, required) - Display name of the post author, max 100 characters
- `content` (string, required) - Post body content (markdown or plain text)
- `tags` (array of strings, optional) - Categorization tags for the post
- `published` (boolean, required) - Publication status (true = visible to all, false = draft)
- `createdAt` (ISO8601 timestamp string, required) - Post creation timestamp
- `updatedAt` (ISO8601 timestamp string, required) - Last modification timestamp
- `permissions` (object, optional) - Client-side computed permissions for current user
  - `canEdit` (boolean) - Whether current user can edit this post
  - `canDelete` (boolean) - Whether current user can delete this post

**Validation Rules**:

- `title`: Non-empty string, max 200 characters
- `author`: Non-empty string, max 100 characters
- `content`: Non-empty string (no max length enforced by schema)
- `createdAt`, `updatedAt`: Valid ISO8601 format (e.g., "2025-11-03T12:34:56.789Z")
- `id`: Valid UUID format (lowercase, hyphenated)
- `tags`: Array of strings, each tag max 50 characters

**Source of Truth**:

- Backend API (`api/openapi.json`) defines the canonical Post schema
- Frontend Zod schema (`frontend-next/src/lib/schemas.ts`) mirrors this for validation

---

### Token (Design System)

Represents a single design system token (primitive visual property).

**Properties**:

- `name` (string, required) - Token identifier in kebab-case with `--` prefix (e.g., `--color-primary`)
- `value` (string, required) - CSS-compatible value (e.g., `#1F2937`, `0.5rem`, `4px`)
- `category` (enum, required) - Token category: `color` | `spacing` | `radius` | `typography` | `shadow`
- `usageContext` (string, optional) - Human-readable description of token usage (e.g., "Primary button background")
- `figmaReference` (string, optional) - Link to corresponding Figma token or style

**Validation Rules**:

- `name`: Must start with `--`, kebab-case, alphanumeric + hyphens only
- `value`: Must be a valid CSS property value (no validation regex; rely on browser/Tailwind validation)
- `category`: Must be one of the enum values
- `usageContext`: Max 200 characters

**Storage**:

- Defined in `frontend-next/tailwind.config.ts` (theme.extend)
- Exported as CSS variables in `frontend-next/src/styles/tokens.css`
- Documented in Figma (Week 9 Tokens & Primitives page)

**Initial Token Set** (11 tokens for Week 9):

```typescript
{
  colors: {
    '--color-primary': '#1F2937',      // Primary brand color (buttons, links)
    '--color-surface': '#FFFFFF',      // Card/surface background
    '--color-text': '#111827',         // Primary text color
    '--color-text-muted': '#6B7280',   // Secondary/muted text
  },
  spacing: {
    '--space-1': '0.25rem',  // 4px  - tight spacing
    '--space-2': '0.5rem',   // 8px  - compact spacing
    '--space-3': '1rem',     // 16px - comfortable spacing
    '--space-4': '1.5rem',   // 24px - loose spacing
  },
  radius: {
    '--radius-sm': '2px',    // Subtle rounding
    '--radius-md': '4px',    // Standard rounding
    '--radius-lg': '8px',    // Prominent rounding
  }
}
```

---

### PostListResponse

Represents a paginated list of posts returned by the API.

**Properties**:

- `items` (array of Post, required) - Array of posts for the current page
- `page` (integer, required) - Current page number (1-indexed)
- `pageSize` (integer, required) - Number of items per page
- `hasNextPage` (boolean, required) - Whether additional pages exist
- `total` (integer, optional) - Total count of items across all pages (not always provided by API)

**Validation Rules**:

- `page`: Integer ≥ 1
- `pageSize`: Integer between 1 and 100
- `items`: Array (may be empty for no results)
- `hasNextPage`: Boolean

**Usage**:

- SSR: Server Component fetches this shape from `/api/posts?page=1&pageSize=10`
- Client: SWR hook returns this shape for client-side navigation
- Empty state: `items.length === 0` triggers "No posts yet" UI

---

### ErrorEnvelope

Represents a structured error response from route handlers or API.

**Properties**:

- `error` (object, required)
  - `code` (string, required) - Machine-readable error code (e.g., "UPSTREAM_FETCH_FAILED", "VALIDATION_ERROR")
  - `message` (string, required) - User-facing error message (safe to display)
  - `details` (array or object, optional) - Field-level validation errors or additional context

**Validation Rules**:

- `code`: UPPER_SNAKE_CASE, alphanumeric + underscores
- `message`: Non-empty string, max 500 characters
- `details`: Arbitrary structure (typically array of `{ field, message }` objects for validation errors)

**Common Error Codes**:

- `UPSTREAM_FETCH_FAILED`: Backend API unreachable or timeout
- `UPSTREAM_CREATE_FAILED`: POST /posts failed upstream
- `VALIDATION_ERROR`: Request body failed schema validation (400/422)
- `UNAUTHORIZED`: User not authenticated (401)
- `FORBIDDEN`: User lacks permission for resource (403)
- `NOT_FOUND`: Resource does not exist (404)

**Usage**:

- Route handlers (`/api/posts/route.ts`) return this shape on errors
- Client components check `if (data.error)` to display error UI
- Error boundaries can catch and display `error.message`

---

## State Transitions

### Post List Page State Machine

The `/posts` page transitions through distinct states based on data fetching:

```
[Initial/Loading]
  ├─> [Success] (posts fetched, items.length > 0)
  ├─> [Empty] (posts fetched, items.length === 0)
  └─> [Error] (API error or network failure)

[Success]
  ├─> [Loading] (user clicks pagination/sort)
  └─> [Success] (data refreshed via SWR)

[Empty]
  ├─> [Success] (user creates first post, list revalidates)
  └─> [Loading] (user retries fetch)

[Error]
  ├─> [Loading] (user clicks "Retry")
  └─> [Success] or [Error] (depending on retry outcome)
```

**State Indicators**:

- **Loading**: Skeleton UI or spinner visible, `aria-live="polite"` announces "Loading posts..."
- **Success**: Post cards rendered, pagination controls enabled
- **Empty**: Styled empty state card with "No posts yet" message + CTA
- **Error**: Error card with `role="alert"`, error message, and "Retry" button

---

### Button Component State Machine

Buttons transition through interaction states:

```
[Default]
  ├─> [Hover] (mouse over, :hover)
  ├─> [Focus] (Tab key, :focus-visible)
  ├─> [Active] (mouse down, :active)
  ├─> [Disabled] (disabled prop true)
  └─> [Loading] (loading prop true)

[Hover] ──> [Active] (mouse down)
[Focus] ──> [Active] (Enter/Space key)
[Loading] ──> [Disabled] (clicks ignored during load)
[Disabled] ──> (no transitions, non-interactive)
```

**State Styles** (token-based):

- **Default**: `bg-primary`, `text-white`
- **Hover**: `bg-primary-dark` (derived from primary token)
- **Focus**: `ring-2 ring-primary ring-offset-2` (visible focus indicator)
- **Active**: `scale-95` (slight press animation)
- **Disabled**: `opacity-50 cursor-not-allowed`
- **Loading**: Spinner visible, clicks ignored, `aria-busy="true"`

---

### Input Component State Machine

Input fields transition based on user interaction and validation:

```
[Empty + Untouched]
  ├─> [Focused] (user clicks/tabs into field)
  └─> [Filled] (value entered)

[Focused]
  ├─> [Blurred + Valid] (focus lost, validation passes)
  ├─> [Blurred + Invalid] (focus lost, validation fails)
  └─> [Filled + Focused] (user typing)

[Blurred + Invalid]
  ├─> [Focused] (user returns to fix error)
  └─> [Blurred + Valid] (error corrected, field revalidated)
```

**State Indicators**:

- **Empty + Untouched**: Placeholder visible, no error styling
- **Focused**: Border color changes (e.g., `border-primary`), label may float
- **Filled + Valid**: Checkmark icon (optional), no error message
- **Filled + Invalid**: Red border (`border-error`), error message visible with `aria-describedby`, `aria-invalid="true"`

---

## Relationships

### Post ↔ User

- A Post has one `ownerId` (foreign key to User entity, not modeled in frontend)
- A User can own many Posts (one-to-many)
- Frontend receives `permissions` object to determine if current user can edit/delete

### Post ↔ PostListResponse

- PostListResponse contains many Posts (zero or more per page)
- Pagination controls navigate between PostListResponse pages

### Component ↔ Token

- All styled components (Button, Input, Card) reference Tokens for colors, spacing, radius
- Tokens are shared primitives; changing a token value updates all consuming components
- No hardcoded hex/px values allowed in component styles (enforced by code review)

### Route Handler ↔ ErrorEnvelope

- Route handlers (`/api/posts/*`) catch errors and return ErrorEnvelope shape
- Client components parse ErrorEnvelope to display user-friendly error UI

---

## API Contracts

### GET /posts

Fetch a paginated list of posts with optional sorting.

**Request**:

- Method: `GET`
- URL: `/posts`
- Query Parameters:
  - `page` (integer, optional, default: 1) - Page number (1-indexed)
  - `pageSize` (integer, optional, default: 10) - Items per page (1-100)
  - `sort` (string, optional, default: "date-desc") - Sort order: `date-asc | date-desc | title-asc | title-desc`

**Response** (200 OK):

```json
{
  "items": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "ownerId": "user-123",
      "title": "My First Post",
      "author": "John Doe",
      "content": "This is the post content.",
      "tags": ["intro", "welcome"],
      "published": true,
      "createdAt": "2025-11-03T10:00:00Z",
      "updatedAt": "2025-11-03T10:00:00Z",
      "permissions": {
        "canEdit": true,
        "canDelete": true
      }
    }
  ],
  "page": 1,
  "pageSize": 10,
  "hasNextPage": false,
  "total": 1
}
```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication (returns ErrorEnvelope)
- `500 Internal Server Error`: Upstream API failure (returns ErrorEnvelope with `code: "UPSTREAM_FETCH_FAILED"`)

---

### POST /api/posts (Route Handler)

Create a new post via the Next.js route handler (proxies to backend).

**Request**:

- Method: `POST`
- URL: `/api/posts`
- Headers:
  - `Content-Type: application/json`
  - `X-CSRF-Token: <token>` (required for mutation)
  - `Cookie: session=<jwt>` (for authentication)
- Body:

```json
{
  "title": "New Post Title",
  "content": "Post content goes here.",
  "tags": ["tag1", "tag2"],
  "published": true
}
```

**Response** (201 Created):

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174001",
  "ownerId": "user-123",
  "title": "New Post Title",
  "author": "John Doe",
  "content": "Post content goes here.",
  "tags": ["tag1", "tag2"],
  "published": true,
  "createdAt": "2025-11-03T12:00:00Z",
  "updatedAt": "2025-11-03T12:00:00Z"
}
```

**Error Responses**:

- `400 Bad Request`: Missing required fields or validation failure (ErrorEnvelope with `details`)
- `401 Unauthorized`: Not authenticated
- `422 Unprocessable Entity`: Validation error (ErrorEnvelope with field-level `details`)
- `500 Internal Server Error`: Upstream create failed (ErrorEnvelope)

---

### GET /api/posts (Route Handler)

Client-side route handler that proxies to backend `/posts` with authentication forwarding.

**Request**:

- Method: `GET`
- URL: `/api/posts?page=1&pageSize=10&sort=date-desc`
- Headers:
  - `Cookie: session=<jwt>` (forwarded to upstream)

**Response**: Same as `GET /posts` above (PostListResponse shape)

**Behavior**:

- Injects user permissions (`canEdit`, `canDelete`) into each post based on session
- Falls back to in-memory store if backend unreachable (non-production only)
- Returns ErrorEnvelope on upstream failure

---

## Schema Validation

### Zod Schemas (frontend-next/src/lib/schemas.ts)

All API responses are validated using Zod schemas to ensure type safety and catch contract drift.

**PostSchema**:

```typescript
import { z } from 'zod';

export const PostSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  content: z.string().min(1),
  tags: z.array(z.string().max(50)).optional().default([]),
  published: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  permissions: z
    .object({
      canEdit: z.boolean(),
      canDelete: z.boolean(),
    })
    .optional(),
});

export type Post = z.infer<typeof PostSchema>;
```

**PostListSchema**:

```typescript
export const PostListSchema = z.object({
  items: z.array(PostSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  hasNextPage: z.boolean(),
  total: z.number().int().optional(),
});

export type PostList = z.infer<typeof PostListSchema>;
```

**ErrorEnvelopeSchema**:

```typescript
export const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export type ErrorEnvelope = z.infer<typeof ErrorEnvelopeSchema>;
```

---

## Data Flow Diagram

```
[User visits /posts?page=1]
         ↓
[Next.js Server Component: PostsPage]
         ↓
[SSR fetch: GET /api/posts?page=1&pageSize=10]
         ↓
[Route Handler: /api/posts/route.ts]
         ├─ Forwards session cookie
         ├─ Proxies to backend API
         └─ Enriches response with permissions
         ↓
[Backend API: GET /posts]
         ↓
[PostListResponse returned to route handler]
         ↓
[Route handler validates with PostListSchema]
         ↓
[SSR: PostsPage receives initialData]
         ↓
[Server renders HTML with post list]
         ↓
[Client hydrates: PostsPageClient component]
         ├─ Receives initialData as fallbackData for SWR
         ├─ SWR revalidates on mount (fetches fresh data)
         └─ User clicks "Next Page"
                 ↓
         [SWR fetches /api/posts?page=2]
                 ↓
         [UI updates with new posts, URL changes]
```

---

## Summary

This data model defines:

1. **Entities**: Post, Token, PostListResponse, ErrorEnvelope
2. **State machines**: Page states (Loading/Success/Empty/Error), Button states, Input states
3. **Relationships**: Post ↔ User, Component ↔ Token, Route Handler ↔ ErrorEnvelope
4. **API contracts**: GET /posts, POST /api/posts with request/response shapes
5. **Validation**: Zod schemas for type-safe data handling

All entities align with existing `api/openapi.json` schema and `frontend-next/src/lib/schemas.ts` patterns. No breaking changes required.
