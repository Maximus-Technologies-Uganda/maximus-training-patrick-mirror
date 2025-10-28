# Monorepo CI/CD: API + Next.js (Cloud Run)

This repository hosts a monorepo with a Node.js API (`api/`) and a Next.js app (`frontend-next/`). A unified CI/CD pipeline runs tests first (quality gate) and then deploys both services sequentially via a single Google Cloud Build job.

## Live Deployments

- Frontend (Cloud Run): `https://maximus-training-frontend-673209018655.africa-south1.run.app`
- API (Cloud Run): `https://maximus-training-api-wyb2jsgqyq-bq.a.run.app`

You can retrieve service URLs from the Cloud Run console or via:

```bash
gcloud run services describe maximus-training-frontend --region <region> --format='value(status.url)'
gcloud run services describe maximus-training-api --region <region> --format='value(status.url)'
```

## Authentication

The identity flow follows the spec’s BFF-first model: browsers never contact the API directly for mutations. Instead, the Next.js App Router handlers verify Firebase credentials, mint session cookies, and forward normalized headers to the Express API so logs, rate limits, and audit records always align with a single `requestId`/`traceId` pair.

### Sign-in flow

1. The client posts credentials to `/api/auth/login`.
2. The BFF verifies the Firebase ID token (or accepted dev credentials in local smoke tests: `admin/password`, `alice/correct-password`).
3. On success, the BFF mints an HTTP-only `session` cookie (15-minute rolling expiry, `SameSite=Strict`, `Secure` in production) and issues a CSRF double-submit token (`csrf` cookie + `X-CSRF-Token` header).
4. Subsequent route handlers forward the verified identity to the API via `X-User-Id` and `X-User-Role` headers while also propagating tracing headers (`X-Request-Id`, `traceparent`, optional `tracestate`).
5. `/api/auth/logout` clears both cookies and rotates the tracing context so the next request starts fresh.

### Roles and permissions

| Action | Anonymous | Owner | Admin |
| --- | --- | --- | --- |
| View posts (`GET /posts`, `/posts/{id}`) | ✅ | ✅ | ✅ |
| Create post | ❌ | ✅ (attributed to `userId`) | ✅ |
| Edit/delete own post | ❌ | ✅ | ✅ |
| Edit/delete others’ posts | ❌ | ❌ (`403 Forbidden`) | ✅ |

Roles are enforced server-side. Client payloads that attempt to spoof `authorId`, `userId`, or `role` are stripped before business logic runs.

### Session, CSRF, and tracing propagation

- Session cookies are rotated on login, logout, and role change; back-end handlers never trust stale cookies.
- Double-submit CSRF enforcement rejects writes without matching cookie/header pairs or when tokens expire (>2h or ±5m clock skew).
- `ensureRequestContext` middleware guarantees that every request has a stable `requestId` and W3C trace headers so API logs, audit records, and CI benches correlate across tiers.

### SameSite tradeoffs

`SameSite=Strict` protects against cross-site forgery and remains the default. Pivot to `Lax` only when integrations demand third-party redirects or embedded frames. Document the justification in release notes, enable explicit origin allowlists, and tighten CSRF checks before changing this flag.

### Troubleshooting

- **Clock skew** — Firebase tokens tolerate ±5 minutes. Ensure local devices use NTP/chrony if logins fail with `401` after adjusting clocks.
- **Revoked token** — Admin revocations force re-authentication. Clear cookies and sign in again; check audit logs (`type:"audit"`) for denial reasons.
- **Stale session** — If the BFF refuses a request with `401` immediately after deploy, delete cookies and retry; deployments rotate signing secrets when `SESSION_SECRET` changes.
- **429 loops** — Writes are rate-limited to 10/minute/user. Use exponential backoff (200ms → 400ms → 800ms) and respect `Retry-After` headers before retrying. The `frontend-next/src/lib/http/backoff.ts` helper exposes `with429Backoff` to wrap fetch calls, emit retry telemetry, and avoid hammering the API.
- **CORS 401 vs 403** — `401` indicates an unauthenticated request (missing/expired token or cookie). `403` means the identity is valid but lacks access (e.g., owner editing another user's post, CSRF mismatch, or read-only maintenance mode).

### Idempotency & retry guidance

- **Idempotency keys explained** — An idempotency key is a unique, client-generated token (for example, a UUID stored alongside the pending request) that the server can use to de-duplicate retries. When a `POST` endpoint supports the pattern it will document the required header (e.g., `Idempotency-Key`) and retention window. The current `/api/posts` `POST` route does **not** yet accept an idempotency key, so treat that mutation as non-idempotent until the API changelog announces support.
- **Idempotent verbs first** — Prefer `PUT`/`PATCH` for updates so retries can safely re-send the request without creating duplicates. Only retry `POST` when the endpoint explicitly documents an idempotency key.
- **Use `with429Backoff` for safe retries** — Wrap idempotent requests in [`with429Backoff`](frontend-next/src/lib/http/backoff.ts) to honour `Retry-After`, cap attempts, and emit callbacks with remaining quota information:

  ```ts
  import { with429Backoff } from "@/lib/http/backoff";

  const response = await with429Backoff(() => fetch("/api/posts", { method: "PUT", body: JSON.stringify(payload) }), {
    maxAttempts: 3,
    onRetry: ({ attempt, delayMs, remaining }) => {
      console.info(`Retry #${attempt} in ${delayMs}ms (remaining quota: ${remaining ?? "unknown"})`);
    },
  });

  if (response.status === 429) {
    // Surface an actionable message: "We are throttling writes for your account. Please retry later."
  }
  ```
- **Surface guidance to users** — When retries are exhausted, display the `Retry-After` value and clarify that the action was not completed to prevent accidental duplicates.
- **Handle duplicates explicitly** — If a retry results in a `409 Conflict`, show the user which record already exists (e.g., "A post with this slug already exists") and avoid mutating local optimistic caches. Server handlers should log the conflicting idempotency key or unique field to help diagnose repeated submissions.

## Local Development

### Prerequisites

- Node.js 18+
- Docker (optional, for container workflows)

### Run API locally

```bash
cd api
pnpm install
pnpm dev
# API listens on http://localhost:8080
```

### Run Next.js locally

Create `.env.local` in `frontend-next/`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Then start the dev server:

```bash
cd frontend-next
pnpm install
pnpm dev
# App on http://localhost:3000
```

Note on server-side configuration:

> `API_BASE_URL` is required on the server (e.g., Cloud Run service env var) for the initial server-rendered request to `/posts` to fetch posts from the backend. Without it, SSR may not include post items on first paint. In local dev, SSR will fall back to `NEXT_PUBLIC_API_URL` if `API_BASE_URL` is not set, but production should always set `API_BASE_URL`.

## CI/CD Overview

### Stage 1: Tests (Quality Gate)

- Runs monorepo tests via `pnpm -r test` at the root.
- Individual packages also have their own `test:ci` scripts (e.g., `api/`, `frontend-next/`).

### Stage 2: Deploy (Single Cloud Build)

- A single Cloud Build job builds and deploys:
  - `frontend-next/` to Cloud Run (port 3000)
  - `api/` to Cloud Run (port 8080)
- Both services are deployed with `--min-instances=1` to avoid cold starts.

Cloud Build file: `cloudbuild.yaml`

### Evidence and Reports

- The Quality Gate job summary includes a section titled "frontend-next Coverage (with thresholds)" with the current coverage table.
- The Review Packet artifacts include the `coverage-frontend-next` HTML coverage report and the Playwright HTML report. See the Review Packet guide for details and local rebuild steps: [docs/ReviewPacket/README.md](docs/ReviewPacket/README.md)
- For guidance on finding and interpreting CI/CD evidence artifacts, see [docs/release-evidence.md](docs/release-evidence.md)

Local gate commands (parity with CI):

```bash
# Generate security and governance artifacts
pnpm run security:audit
pnpm run governance:report

# Aggregate Quality Gate and emit Coverage Totals block
pnpm run gate:aggregate
```

To package the Review Packet locally (mirrors CI):

```bash
pnpm run gate:packet -- --force
```

## CI Overview

This repository uses Google Cloud Build for deploys (`cloudbuild.yaml`). Tests and quality gate run prior to deploys in the upstream CI environment.

## Useful Commands

```bash
# Run all tests (root)
pnpm -r test

# API tests
cd api && pnpm run test:ci

# Frontend tests
cd frontend-next && pnpm run test:ci
```

## Repository Structure

- `api/`: Express API (TypeScript), deployed to Cloud Run
- `frontend-next/`: Next.js app, deployed to Cloud Run
- `cloudbuild.yaml`: Monolithic build + deploy for both services
- `.github/workflows/main.yml`: Test + deploy workflow

## Notes

- Frontend image builds with `NEXT_PUBLIC_API_URL` passed as a build-arg from Cloud Build.
- Consider setting a Cloud Run service account for least privilege deployments.
- `/health` dependency probes can optionally call the Firebase Admin SDK when `HEALTHCHECK_FIREBASE_ADMIN_PING=true` and honour
  `HEALTHCHECK_TIMEOUT_MS` (or per-dependency overrides) to prevent slow checks from delaying responses.

### Production configuration (required)

- Ensure the runtime has `NODE_ENV=production` so development fallbacks in route handlers are disabled.
- Set `API_BASE_URL` on the frontend service (Cloud Run) to the API HTTPS URL.
- If protecting the API with IAP or requiring ID tokens, set `IAP_AUDIENCE` (or `ID_TOKEN_AUDIENCE`) so the app can mint ID tokens for upstream calls.

# Training

[Quality Gate workflow](.github/workflows/quality-gate.yml)

Monorepo containing multiple small apps and exercises (`quote/`, `expense/`, `stopwatch/`, `todo/`, `frontend/`, and more).

### Run & Try (frontend-next)

Prerequisites:

- Node.js 18+
- A running Posts API (default: `http://localhost:8080` from `api` workspace)

Local steps:

1. Start the API service:

   ```bash
   cd api
   pnpm install
   pnpm dev
   # API listens on http://localhost:8080
   ```

2. Create the frontend env file:

   ```env
   # file: frontend-next/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:8080
   ```

3. Install dependencies and start the frontend:

   ```bash
   cd frontend-next
   pnpm install
   pnpm dev
   # App on http://localhost:3000
   ```

4. Verify it works:

   - Visit http://localhost:3000/posts
   - You should see a list of posts. If not, ensure the API is running on http://localhost:8080 and that `NEXT_PUBLIC_API_URL` is set accordingly in `.env.local`.

Environment variables:

| Variable | Scope | Local example | Production example | Purpose |
|---|---|---|---|---|
| `API_BASE_URL` | Server-only (Cloud Run) | `http://localhost:8080` | `https://maximus-training-api-wyb2jsgqyq-bq.a.run.app` | Upstream API base URL used by server SSR and Route Handlers. Set on Cloud Run service env vars. |
| `NEXT_PUBLIC_API_URL` | Client and SSR fallback | `http://localhost:8080` | (not required) | Base URL for API in local dev; SSR falls back to this if `API_BASE_URL` is unset. Prefer server proxy (`/api`) in production. |
| `NEXT_PUBLIC_APP_URL` | CI/E2E usage | `http://localhost:3000` | `https://maximus-training-frontend-673209018655.africa-south1.run.app` | Public URL of the app for Playwright and link checks in CI. |
| `DATABASE_URL` | Server-only | `postgresql://localhost:5432/dev` | `postgresql://...neon.tech/prod` | PostgreSQL connection string (Neon or local). Required for server start and DB tests. |
| `SESSION_SECRET` | Server-only | `dev-secret-32chars` | `(32+ char random)` | Strong random string for session encryption. Required in production. |
| `GCP_PROJECT_ID` | Server-only | `proj-rms-dev` | `proj-rms-prod` | Google Cloud project ID for GCP services. |
| `GCP_REGION` | Server-only | `africa-south1` | `africa-south1` | Google Cloud region for deployments. |
| `VERTEX_LOCATION` | Server-only | `us-central1` | `us-central1` | Vertex AI location for model access. |
| `VERTEX_MODEL` | Server-only | `gemini-2.5-flash` | `gemini-2.5-flash` | Vertex AI model name. |
| `ASSISTANT_ENABLED` | Server-only | `false` | `true` | Enable assistant API routes at `/api/assistant/*`. |
| `ASSISTANT_MACROS_ONLY` | Server-only | `false` | `false` | Restrict assistant to macros-only mode. |
| `VITE_ASSISTANT_ENABLED` | Client build-time | `false` | `true` | Enable assistant UI in client build. |
| `ASSISTANT_CORS_ORIGINS` | Server-only | `http://localhost:3000` | `https://maximus-training-frontend-673209018655.africa-south1.run.app` | CSV of allowed CORS origins for assistant endpoints. |
| `ASSISTANT_FORWARDING_SECRET` | Server-only | (random) | (random) | HMAC secret for assistant ingress authentication. |

### Running with Docker

Build the container:
```bash
docker build -t nextjs-app:latest ./frontend-next
```

Run the container:
```bash
docker run -p 3000:3000 nextjs-app:latest
```

**Note:** For optimal Google Cloud Run deployment, use `output: "standalone"` in `frontend-next/next.config.ts`.

Live Demo (frontend-next):

- Demo URL: https://maximus-training-frontend-673209018655.africa-south1.run.app
  - Once deployed from the default branch, this link will be referenced in the Review Packet manifest and PR summaries.

## Quickstart

Prerequisites:

- Node.js 18+
- Git

From the repo root:

```bash
# install root tools and run the monorepo test runner
pnpm install
pnpm -r test
```

### Spec Kit (Specify) integration

Slash commands are available via your AI assistant (Cursor/Copilot) using the prompts in `.github/prompts`.

Non-interactive CLI setup (Windows/PowerShell):

```powershell
# one-time: ensure uv is available
python -m pip install --user uv

# run Specify CLI (examples)
python -m uv tool run --from git+https://github.com/github/spec-kit.git specify init --here --ai cursor --script ps --ignore-agent-tools --no-git

# create or update a spec in Cursor/Copilot chat
/specify Build a todo filtering feature by status and text search

# generate an implementation plan
/plan Use React state + URL params; add tests and docs

# generate tasks from artifacts
/tasks Generate dependency-ordered tasks for the above plan
```

Relevant files and scripts:

- `.github/prompts/specify.prompt.md`, `plan.prompt.md`, `tasks.prompt.md`
- `.specify/templates/*.md` (templates used by prompts)
- `.specify/scripts/powershell/*.ps1` (helper scripts invoked by prompts)

<!-- Removed legacy references to the separate Vite-based frontend project to avoid confusion with `frontend-next`. CI evidence for `frontend-next` is surfaced in the Quality Gate summary and Review Packet as noted above. -->

## Governance Waivers and Quality Gate

If a temporary exception is required (e.g., security audit has high findings or audit unavailable), follow the policy in `SECURITY_EXCEPTIONS.md` and mirror approved waivers in the governance report consumed by the gate.

- Guide: see `CONTRIBUTING.md` section "Governance basics" (example JSON provided)
- Schema: `scripts/quality-gate/schemas/governance.schema.json`
- Generate a baseline governance report:

```bash
pnpm run governance:report
```

This writes `governance/report.json`. Add `approvedExceptions` entries as needed with mentor approval and expiry dates.

## Status checks & docs-only exemption

This repo enforces protected checks per **DEVELOPMENT_RULES.md**:

- Required checks: lint, 	ypecheck, unit, coverage, 11y, contract, uild, deploy-preview
- PR body must include evidence fields (Linear key, Gate run, Artifacts, Demo URL(s), Screenshots if UI, Linked Plan).

**Docs-only PRs:** If your change only updates documentation and touches no runtime code:

- Add label **docs-only** **or** put **DEV-EXEMPT** under **Linear Key(s)** in the PR body.
- Gate Artifacts may be N/A for docs-only PRs.
- The PR template checker (scripts/check-pr-template.js) recognizes these exemptions.

See **DEVELOPMENT_RULES.md** for full details.
