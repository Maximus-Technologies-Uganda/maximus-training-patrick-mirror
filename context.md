```markdown
# System Context & Architecture (context.md)

_Last updated: TODO-YYYY-MM-DD_

## 1) System overview
Monorepo with:
- **API**: Node/Express (TypeScript). Routes: `/posts`, `/auth/login`.
- **Frontend (Next.js 15)**: App Router, SSR for key pages, SWR on client.
- **Shared**: Types and Zod schemas matching API contracts.

## 2) Environments
- **Local dev**: Node 20 + pnpm 9; API on :8080, frontend on :3000 (proxied/SSR).
- **Preview**: CI creates preview deployments per PR; smoke checks optional.
- **Production**: Google Cloud Run (see `docs/PRODUCTION-DEPLOYMENT.md`).

## 3) Data flow (high level)
1. Frontend SSR fetches via `API_BASE_URL` (server-only).
2. Client uses SWR with `initialData`, then revalidates on mount.
3. Route handlers under `/app/api/*` proxy to backend for client requests.

## 4) Security & boundaries
- **Org isolation** (RLS/context) is mandatory; no cross-org data access.
- **Contracts**: `api/openapi.json` is the source of truth.
- **Env boundaries**: Server-only vars must not be exposed as `NEXT_PUBLIC_*`.

## 5) Dependencies (runtime)
- PostgreSQL (Neon/local)
- Optional: Vertex AI (project/location/model via env)

## 6) Key env vars (summary)
- Dev: `DATABASE_URL`, `SESSION_SECRET`, `GCP_PROJECT_ID`, `GCP_REGION`, `VERTEX_LOCATION`, `VERTEX_MODEL`
- Prod: add `ASSISTANT_*` (flags, cors, forwarding secret)

## 7) Build & deploy summary
- CI named checks: lint, typecheck, unit, coverage, a11y, contract, build, deploy-preview.
- Artifacts: coverage/a11y/contract/traces/SBOM (see `DEVELOPMENT_RULES.md`).
- Deployment paths: `docs/PRODUCTION-DEPLOYMENT.md`.

## 8) ADRs
See `docs/adrs/` for cross-cutting decisions.

> Keep this doc current. If behavior, env, or architecture changes, update here and in `AGENTS.md`.

