# Week-7 Release Evidence (T034 / DEV-550)

This folder will contain the screenshots and log samples proving ownership enforcement, structured logging with `request-id` and `userId`, and UI ownership gating.

## Deliverables (filenames)
- 01-403-delete-not-owner.png — Terminal screenshot: 403 on DELETE of another user’s post
- 02-api-structured-log.png — API terminal screenshot: structured JSON log includes `requestId` and `userId`
- 03-ui-ownership-controls-hidden.png — Browser screenshot: Edit/Delete hidden for non-owner

## How to capture

### 0) Start services
1. API (port 3000 by default)
   - From repo root: `npm --workspace api run dev`
   - Expected line on start: `API listening on http://localhost:3000`
2. Next.js UI
   - Ensure `frontend-next/.env.local` contains:
```
NEXT_PUBLIC_API_URL=http://localhost:3000
API_BASE_URL=http://localhost:3000
```
   - Run: `npm --workspace frontend-next run dev` (accept suggested port if 3000 is taken)

### 1) Produce 403 Forbidden (ownership enforcement)
- Login as Alice and create a post:
```
curl -i -c alice.cookies.txt -H "Content-Type: application/json" \
  --data-raw '{"username":"alice","password":"correct-password"}' \
  http://localhost:3000/auth/login

# Create a post as Alice; capture the id (response body or Location header)
curl -i -b alice.cookies.txt -H "Content-Type: application/json" \
  --data-raw '{"title":"Owned by Alice","content":"Evidence post for 403"}' \
  http://localhost:3000/posts
```
- Login as Admin and attempt to delete Alice’s post (expect 403):
```
curl -i -c admin.cookies.txt -H "Content-Type: application/json" \
  --data-raw '{"username":"admin","password":"password"}' \
  http://localhost:3000/auth/login

# Replace <ID> with the id from the create response
curl -i -b admin.cookies.txt -X DELETE http://localhost:3000/posts/<ID>
```
- Take a terminal screenshot showing the 403 response and save as `01-403-delete-not-owner.png` in this folder.

### 2) Capture structured API log with request-id and userId
- While executing the above, the API terminal will print structured JSON logs, e.g.:
  - `{ "level": "info", "message": "User authenticated successfully", "requestId": "...", "userId": "user-alice-1" }`
  - `{ "level": "info", "message": "Auth ok", "requestId": "...", "userId": "..." }`
- Take a screenshot with one of these entries clearly visible and save as `02-api-structured-log.png` in this folder.

### 3) Capture UI ownership controls hidden for non-owner
- In the browser (UI dev server output will print the URL, typically `http://localhost:3001`):
  1. Go to `/login`, sign in as Admin (`admin` / `password`).
  2. Navigate to `/posts` and locate the Alice-owned post you just created.
  3. Verify that the list item shows no “Edit”/“Delete” buttons for Admin when viewing Alice’s post.
  4. Take a browser screenshot and save as `03-ui-ownership-controls-hidden.png` in this folder.

## References (spec and code)
- Requirements: `specs/spec-auth-ownership-observability/spec.md`
  - FR-012 (ownership on update/delete), FR-014 (public read), FR-030/FR-031 (structured logs + request-id)
- Tasks: `specs/spec-auth-ownership-observability/tasks.md` (T034)
- OpenAPI: `api/openapi.json` (`DELETE /posts/{id}` protected with 401/403)
- Ownership enforcement (routes): `api/src/core/posts/posts.routes.ts` (DELETE protected)
- Ownership check (controller): `api/src/core/posts/posts.controller.ts` (403 when non-owner)
- Request-id propagation: `api/src/middleware/requestId.ts`
- Structured request logs: `api/src/middleware/logger.ts`
- Auth logs contain userId: `api/src/core/auth/auth.routes.ts`
- UI gating (hide Edit/Delete unless owner): `frontend-next/components/PostsList.tsx`

## Notes
- If ports differ locally, adjust URLs in `.env.local` and curl commands accordingly.
- Credentials: `admin`/`password`; `alice`/`correct-password`.
- Save the three PNGs into this folder and commit them.
