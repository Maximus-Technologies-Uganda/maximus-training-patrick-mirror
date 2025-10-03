# Monorepo CI/CD: API + Next.js (Cloud Run)

This repository hosts a monorepo with a Node.js API (`api/`) and a Next.js app (`frontend-next/`). A unified CI/CD pipeline runs tests first (quality gate) and then deploys both services sequentially via a single Google Cloud Build job.

## Live Deployments

- Frontend (Cloud Run): `https://maximus-training-frontend-<hash>-<region>-a.run.app`
- API (Cloud Run): `https://maximus-training-api-<hash>-<region>-a.run.app`

Replace `<hash>` and `<region>` with your actual deployment values. You can retrieve service URLs from the Cloud Run console or via:

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

## GitHub Actions

The primary workflow `.github/workflows/main.yml` has two jobs:

1. `test`: installs dependencies and runs the monorepo test suite
2. `deploy`: triggers the Cloud Build on `main` after `test` passes

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

# Training

[![Review Packet](https://github.com/Maximus-Technologies-Uganda/Training/actions/workflows/review-packet.yml/badge.svg)](https://github.com/Maximus-Technologies-Uganda/Training/actions/workflows/review-packet.yml)

Monorepo containing multiple small apps and exercises (`quote/`, `expense/`, `stopwatch/`, `todo/`, `frontend/`, and more).

### Run & Try (frontend-next)

Prerequisites:

- Node.js 18+
- A running Posts API (default: `http://localhost:3000` from `api` workspace)

Local steps:

```bash
cd frontend-next
npm ci
cp .env.example .env.local  # or create .env.local
# Required environment variables
# NEXT_PUBLIC_API_URL=http://localhost:3000

npm run dev
# Open http://localhost:3000
```

Environment variables:

- `NEXT_PUBLIC_API_URL`: Base URL of the Posts API (required for the app)
- `NEXT_PUBLIC_APP_URL`: Public URL of the app (used by Playwright a11y/e2e in CI)

### Running with Docker

Build the container:
```bash
docker build -t nextjs-app:latest ./frontend-next
```

Run the container:
```bash
docker run -p 3000:3000 nextjs-app:latest
```

**Note:** For optimal Google Cloud Run deployment, consider changing `output: "export"` to `output: "standalone"` in `frontend-next/next.config.ts`.

Live Demo (frontend-next):

- Demo URL: https://<your-vercel-project>.vercel.app
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

Frontend (unit tests with coverage):

```bash
cd frontend
npm ci
npm run test:run -- --coverage
```

## Live Demo

🚀 **Try the To-Do Mini Project live**: [https://maximus-technologies-uganda.github.io/maximus-training-patrick-mirror/frontend/todo.html](https://maximus-technologies-uganda.github.io/maximus-training-patrick-mirror/frontend/todo.html)

![Screenshot](./docs/screenshot.png)

Features:
- Add, toggle, and delete tasks
- Search and filter by due date and priority
- Export tasks to CSV
- Persistent storage with LocalStorage
- Full accessibility support (WCAG AA)

## Test Coverage

📊 **Coverage Report**: [./frontend/coverage/lcov-report/index.html](./frontend/coverage/lcov-report/index.html)

- **Core modules**: ≥55% statement coverage required
- **UI modules**: ≥40% statement coverage required
- **Overall coverage**: [![Coverage](https://img.shields.io/badge/coverage-92%25-brightgreen)](frontend/coverage/lcov-report/index.html)

Coverage is enforced via CI with detailed per-file reporting and automated gates.

## Deployment & Quality

- Live deployment: https://maximus-technologies-uganda.github.io/maximus-training-patrick-mirror/
- UI preview:

  [![Application UI](docs/assets/screenshot-app.png)](https://maximus-technologies-uganda.github.io/maximus-training-patrick-mirror/)

Local development server:

```bash
cd frontend
npm ci
npm run dev
```

## Coverage Index

- Open the frontend HTML coverage index directly: [frontend/coverage/lcov-report/index.html](frontend/coverage/lcov-report/index.html)
- CI posts a coverage summary for the frontend to the PR job summary and comments.
- The full HTML coverage report is bundled in the "Review Packet" artifact from CI runs. Download the artifact from a run of the Review Packet workflow and open the coverage report inside (e.g., `frontend/coverage/lcov-report/index.html`).
- Raw summary JSON path in CI: `frontend/coverage/coverage-summary.json`.
- Coverage artifact (CI): See Actions artifacts named "review-packet".

Local HTML report for the frontend:

```bash
cd frontend
npm run test:run -- --coverage
# then open coverage/lcov-report/index.html
```

Each package (`quote/`, `expense/`, `stopwatch/`, `todo/`) also produces coverage when running tests within that package.
