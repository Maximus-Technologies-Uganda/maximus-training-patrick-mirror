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

## Local Development

### Prerequisites

- Node.js 18+
- Docker (optional, for container workflows)

### Run API locally

```bash
cd api
npm ci
npm run dev
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
npm ci
npm run dev
# App on http://localhost:3000
```

Note on server-side configuration:

> `API_BASE_URL` is required on the server (e.g., Cloud Run service env var) for the initial server-rendered request to `/posts` to fetch posts from the backend. Without it, SSR may not include post items on first paint. In local dev, SSR will fall back to `NEXT_PUBLIC_API_URL` if `API_BASE_URL` is not set, but production should always set `API_BASE_URL`.

## CI/CD Overview

### Stage 1: Tests (Quality Gate)

- Runs monorepo tests via `npm test` at the root.
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

Local gate commands (parity with CI):

```bash
# Generate security and governance artifacts
npm run security:audit
npm run governance:report

# Aggregate Quality Gate and emit Coverage Totals block
npm run gate:aggregate
```

To package the Review Packet locally (mirrors CI):

```bash
npm run gate:packet -- --force
```

## CI Overview

This repository uses Google Cloud Build for deploys (`cloudbuild.yaml`). Tests and quality gate run prior to deploys in the upstream CI environment.

## Useful Commands

```bash
# Run all tests (root)
npm test

# API tests
cd api && npm run test:ci

# Frontend tests
cd frontend-next && npm run test:ci
```

## Repository Structure

- `api/`: Express API (TypeScript), deployed to Cloud Run
- `frontend-next/`: Next.js app, deployed to Cloud Run
- `cloudbuild.yaml`: Monolithic build + deploy for both services
- `.github/workflows/main.yml`: Test + deploy workflow

## Notes

- Frontend image builds with `NEXT_PUBLIC_API_URL` passed as a build-arg from Cloud Build.
- Consider setting a Cloud Run service account for least privilege deployments.

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
   npm ci
   npm run dev
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
   npm ci
   npm run dev
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
npm ci
npm test
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
npm run governance:report
```

This writes `governance/report.json`. Add `approvedExceptions` entries as needed with mentor approval and expiry dates.
