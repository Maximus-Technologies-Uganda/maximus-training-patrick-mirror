## Quickstart

End-to-end guide to run the API and Next.js frontend locally, authenticate, and make an authenticated request.

## Prerequisites

- Node.js 20+ and npm
- Windows users: use `curl.exe` (not `Invoke-WebRequest`) for the examples below

## Install dependencies

```bash
# from repo root
npm install
```

## Start the API

```bash
# from repo root
npm --workspace api run dev
# Expect: "API listening on http://localhost:3000"
```

## Start the frontend (Next.js)

1) Create `frontend-next/.env.local`:

```bash
# file: frontend-next/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000
# Optional server-only override for Route Handlers:
# API_BASE_URL=http://localhost:3000
```

2) Start the dev server:

```bash
# from repo root
npm --workspace frontend-next run dev
# If port 3000 is busy, Next.js will use port 3001. Accept the prompt if asked.
```

3) Open the app: visit the printed URL (e.g., `http://localhost:3001`) and go to `/posts`.

## Authenticate via API (receive session cookie)

Windows PowerShell (curl.exe):

```powershell
# From any directory; writes cookie jar to cookies.txt
curl.exe -i -c cookies.txt -H "Content-Type: application/json" --data-binary "{\"username\":\"alice\",\"password\":\"correct-password\"}" http://localhost:3000/auth/login
# Expect HTTP/1.1 204 No Content and a Set-Cookie: session=... header
```

POSIX shells (macOS/Linux WSL):

```bash
curl -i -c cookies.txt -H 'Content-Type: application/json' --data '{"username":"alice","password":"correct-password"}' http://localhost:3000/auth/login
# Expect HTTP/1.1 204 No Content and a Set-Cookie: session=... header
```

Valid credentials (from the reference implementation):
- username: `alice`, password: `correct-password`
- username: `admin`, password: `password`

## Authenticated request (create a post)

Windows PowerShell (curl.exe):

```powershell
curl.exe -i -b cookies.txt -H "Content-Type: application/json" --data-binary "{\"title\":\"Hello from Quickstart\",\"content\":\"My first post\"}" http://localhost:3000/posts
# Expect HTTP/1.1 201 Created, a Location header (e.g., /posts/<id>), and a JSON body for the created Post
```

POSIX shells (macOS/Linux WSL):

```bash
curl -i -b cookies.txt -H 'Content-Type: application/json' --data '{"title":"Hello from Quickstart","content":"My first post"}' http://localhost:3000/posts
# Expect HTTP/1.1 201 Created, a Location header (e.g., /posts/<id>), and a JSON body for the created Post
```

## Verify in the UI

- Open the frontend (e.g., `http://localhost:3001/posts`) and verify the newly created post is visible.

## Troubleshooting

- Frontend stuck on "Loading…":
  - Ensure the API is running on `http://localhost:3000` (`npm --workspace api run dev`).
  - Confirm `frontend-next/.env.local` contains `NEXT_PUBLIC_API_URL=http://localhost:3000`.
  - Restart the frontend dev server after changing `.env.local`.
- PowerShell login shows 400 Bad Request:
  - Use `curl.exe` and pass JSON with `--data-binary` and escaped quotes as shown above.
- Frontend port already in use:
  - Next.js will choose another port (e.g., 3001). Use the printed URL.

## Reference

- API contract: `specs/spec-auth-ownership-observability/contracts/openapi-skeleton.yaml` (published in CI as `openapi-contract`)
- Backend scripts: see `api/package.json`
- Frontend scripts: see `frontend-next/package.json`
