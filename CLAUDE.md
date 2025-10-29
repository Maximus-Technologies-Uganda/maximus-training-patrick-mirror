# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **Tooling:** This repo standardizes on **Node 20.x LTS** and **pnpm 9.x via Corepack**.  
> CI and hooks use pnpm. If you prefer npm locally, see the mapping table below—but pnpm is the source of truth.

> **Alignment:** This document targets **DEVELOPMENT_RULES.md @ <commit-sha>**.  
> If the rules change, update this file to match the latest `DEVELOPMENT_RULES.md`.

> **Scope:** These guidelines apply to **all work in this repository** unless a package documents an explicit override.

---

## Project Overview

Training monorepo containing a **Node.js Express API** and **Next.js 15** application with robust CI/CD, deployed to **Google Cloud Run**.  
The repository includes multiple training projects (`quote`, `todo`, `expense`, `stopwatch`) and a comprehensive **Quality Gate** system.

**Source of truth for standards:** See `DEVELOPMENT_RULES.md` (v3) for policies on PR evidence, branching, type suppression, coverage, a11y, performance, security, CI job names, artifacts, and governance. If anything here conflicts with that file, **follow `DEVELOPMENT_RULES.md`**.

---

## Workspace & Package Manager

### pnpm (preferred)

````bash
# Enable Corepack (recommended)
corepack enable && corepack prepare pnpm@9.x --activate

# Install all dependencies (root + workspaces)
pnpm install

NPM mapping (if you insist on npm locally)

Use at your own risk—CI uses pnpm.
| pnpm command | npm equivalent |
|--------------------------------------|---------------------------------------|
| pnpm install | npm ci |
| pnpm -r run <script> | (no exact equivalent) |
| pnpm dev (in a package) | npm run dev (in that package) |
| pnpm -r test | npm test (per package) |
| pnpm -r build | npm run build (per package) |
| pnpm -r lint | npm run lint (per package) |
| pnpm -r typecheck | npm run typecheck (per package) |

Key Commands
Development
# Install all deps (root + workspaces)
pnpm install

# Run API locally (port 8080)
cd api && pnpm dev

# Run Next.js app locally (port 3000)
cd frontend-next && pnpm dev
# Requires .env.local with:
# NEXT_PUBLIC_API_URL=http://localhost:8080

Testing
# Run all monorepo tests (quote, expense, stopwatch, todo)
pnpm -r test

# API tests with coverage (Jest)
cd api && pnpm test:ci

# Frontend tests with coverage (Vitest)
cd frontend-next && pnpm test:ci

# Playwright E2E + accessibility tests
cd frontend-next && pnpm test:e2e

# Contract validation (validates against api/openapi.json)
pnpm -w frontend-next run test:contract

# Run a single test file
cd api && pnpm test -- <test-file-path>
cd frontend-next && pnpm test -- <test-file-path>

Quality Gate & Local Validation Commands

**Mandatory 4-Tier Local Validation (Auto-run on push)**
```bash
# Tier 1: Pre-commit (auto-runs on commit)
# No manual command - runs automatically via lint-staged

# Tier 2: Pre-push type-check (auto-runs on push)
npm run typecheck:bail

# Tier 3: Pre-push full CI (auto-runs on push)
bash scripts/test-locally.sh

# Tier 4: Pre-push GitHub Actions simulation (auto-runs on push)
act -W .github/workflows/quality-gate.yml
````

**Tier 3: Phase 3 Mandatory Security & Quality Checks (Shift-Left)**

The local test suite includes **mandatory Phase 3** checks for every push:

```bash
# Full validation (Phase 1 + 2 + 3) - REQUIRED for all pushes
bash scripts/test-locally.sh
```

**Phase 3 Mandatory Checks:**

- Secret scanning (gitleaks) - detect hardcoded credentials
- README link validation - verify all documentation links
- GitHub workflow validation (actionlint) - catch CI config syntax errors
- Security dependency audit (npm audit) - find vulnerable dependencies
- Vendored binaries check - ensure no compiled executables in repo

**Phase 3 Setup (One-Time):**

```bash
# Install required tools for Phase 3
npm install -g gitleaks actionlint

# Verify installation
gitleaks --version
actionlint --version
```

**Why Phase 3 is Mandatory:**

- Catches critical security issues (hardcoded secrets, vulnerable deps)
- Prevents broken documentation and CI configuration errors
- Total local validation: ~99%+ of CI issues caught
- Cost: Extra 60-90 seconds per push (essential investment!)
- Benefit: <1% GitHub CI failures vs 30% without shift-left

**Shift-Left Strategy (Advanced)**

This repository implements **shift-left CI/CD optimization** where checks run locally first, GitHub Actions provides verification only. See [SHIFT-LEFT-STRATEGY.md](SHIFT-LEFT-STRATEGY.md) for full documentation.

**Impact:**

- GitHub Actions failures reduced from 30% to <1%
- GitHub Actions time reduced by ~25% (non-critical checks moved local)
- Developer confidence increased (99%+ issues caught before push)

**What Changed in GitHub Actions:**
Non-critical checks are now **non-blocking** (informational only):

- README link check (runs locally in Phase 3)
- README placeholder guard (runs locally in Phase 3)
- Lint GitHub workflows (runs locally in Phase 3)

These checks still run in GitHub but don't block merging.

**Branch Protection Update Required:**
One-time manual setup in GitHub Settings to make the above checks non-blocking. See [docs/GITHUB-BRANCH-PROTECTION-SETUP.md](docs/GITHUB-BRANCH-PROTECTION-SETUP.md) for instructions.

**Manual Quality Gate Commands**

```bash
# Type-check all TypeScript workspaces
npm run typecheck

# Type-check with bail on errors (exit code 1 if errors)
npm run typecheck:bail

# Lint all workspaces
pnpm -r lint

# Run all tests with coverage (simulates Tier 3 Phase 1+2 manually)
bash scripts/test-locally.sh --quick

# Run all tests + quality checks (full Tier 3 with Phase 3)
bash scripts/test-locally.sh

# Manually run GitHub Actions simulation (simulates Tier 4)
npm run test:act

# Generate security audit summary
pnpm run security:audit

# Generate governance report
pnpm run governance:report

# Aggregate quality gate results
pnpm run gate:aggregate

# Build review packet (artifacts + manifest)
pnpm run gate:packet -- --force
```

Build

# Build all workspaces (API + Next.js + legacy frontend)

pnpm -r build

# Build individual workspaces

pnpm --filter api build
pnpm --filter frontend-next build
pnpm --filter frontend build

Architecture
API (api/)

Stack: Express 5, TypeScript, Jest, Better-SQLite3 (optional)

Structure:

src/core/ – Feature modules (posts, auth) with routes, controllers

src/repositories/ – Data access layer with repository pattern

InMemoryPostsRepository – default in-memory implementation

SqlitePostsRepository – optional persistent storage

src/services/ – Business logic layer (PostsService)

src/middleware/ – Request ID, logging, error handling, rate limiting

src/validation/ – Zod schemas for request/response validation

openapi.json – OpenAPI 3.1 spec (contract source of truth)

Repository selection:

Controlled by POSTS_REPOSITORY env var: inmemory (default) or sqlite

Factory pattern in repositories/factory.ts

Key patterns:

Dependency injection via createApp(config, repository)

Controllers receive services (not repositories) directly

All routes protected by configurable rate limiting

Frontend-Next (frontend-next/)

Stack: Next.js 15 (App Router), React 19, TypeScript, Vitest, Playwright, SWR

Structure:

src/app/ – App Router pages and layouts

posts/ – posts list with SSR + client SWR revalidation

api/ – route handlers (server-side proxy to backend API)

login/ – authentication pages

src/lib/ – Shared utilities, config, schemas, SWR configuration

schemas.ts – Zod schemas matching API contracts

config.ts – centralized config with server/client env handling

swr.ts – SWR config

tests/ – Vitest unit/integration + Playwright E2E/a11y tests

playwright/ – E2E test helpers

\*.spec.ts – Playwright tests (a11y, auth, core flows)

\*.test.ts – Vitest tests

SSR + Client Data Flow:

Server-side: PostsPage fetches from API using API_BASE_URL

Client-side: PostsPageClient uses SWR with SSR-provided initialData

SWR revalidates on mount to ensure fresh data without flicker

Route handlers at /app/api/\* proxy to backend (for client requests)

Environment Variables (boundary rules):

API_BASE_URL (server-only) – API base URL for SSR/Route Handlers (required in prod)

NEXT_PUBLIC_API_URL (client + SSR fallback) – used in dev if API_BASE_URL unset

NEXT_PUBLIC_APP_URL (CI/E2E) – public app URL for Playwright tests

Important: Server-only vars must not be exposed as NEXT*PUBLIC*_.
Client-visible config must use the NEXT*PUBLIC*_ prefix. See DEVELOPMENT_RULES.md.

Performance & SSR

CI enforces LCP/TTFB budgets (frontend-next/perf-budgets.json). See DEVELOPMENT_RULES.md for thresholds and failure/warn behavior.

For UI changes, attach SSR first paint evidence in the PR: raw HTML of the preview (pre-hydration), Playwright trace, and a screenshot. These are uploaded as Gate artifacts.

Monorepo structure

Workspaces: api, frontend-next, frontend (legacy Vite), quote, todo, expense, stopwatch

Scripts directory:

run-tests.js – monorepo test orchestrator

quality-gate/ – Quality Gate system

check-types.js – TS checker across workspaces

aggregate-results.js – gate decision engine

build-review-packet.js – packages artifacts for review

schemas/ – JSON schemas for gate artifacts

generate-security-audit.js – audit summarizer

generate-governance-report.js – dependency governance reporting

Quality Gate System (high level)

Source of truth: thresholds and gating rules live in DEVELOPMENT_RULES.md.
Follow that file for exact coverage (per-package + diff), a11y, performance, security, artifacts, and failure modes.

Checks (summary):

Type-check: 0 TypeScript errors (api, frontend-next)

Lint: ESLint passes across all workspaces

Tests: All unit/integration tests pass

Coverage: per-package thresholds and diff coverage as defined in DEVELOPMENT_RULES.md

A11y: 0 critical violations (Playwright + axe-core)

Contract: 0 breaking mismatches vs api/openapi.json (Spectral lint + contract tests)

Security: audit summary generated; critical vulns block merge

Build: all packages build

Artifacts: coverage, a11y, contract, traces, SBOM uploaded as required

Temporary mitigations: issues labeled temp-mitigation must include an owner and (cleanup by YYYY-MM-DD); overdue items fail Gate.

Governance waivers:

Temporary exceptions documented in SECURITY_EXCEPTIONS.md

Mirrored in governance/report.json with approval + expiry dates

Schema: scripts/quality-gate/schemas/governance.schema.json

Dependencies (Renovate):

Managed by Renovate: majors never auto-merge; minors/patches grouped. Review required; CI must be green.

Artifacts (examples):

typecheck/results.json, coverage/coverage-summary.json

security/audit-summary.json, governance/report.json

docs/ReviewPacket/ – HTML reports (a11y, coverage) + manifest

CI/CD Pipeline

Workflow: .github/workflows/quality-gate.yml

Named checks used by branch protection:
lint, typecheck, unit, coverage, a11y, contract, build, deploy-preview

Stages (typical):

Install dependencies (root + workspaces, Corepack + pnpm)

Lint workflows (actionlint)

README validation (link check + placeholder guard)

Frontend-next coverage (Vitest)

API coverage (Jest, in-memory repo)

Contract artifact upload (api/openapi.json)

A11y/E2E tests (Playwright)

Aggregate coverage + summarize in GitHub Step Summary

Spectral lint (OpenAPI spec validation)

Latency snapshot (non-gating, /auth/login p50/p95)

Deployment: cloudbuild.yaml (Google Cloud Build)

Sequence:

Build + deploy API to Cloud Run (port 8080)

Capture API URL

Build frontend with API_BASE_URL baked at runtime

Deploy frontend to Cloud Run (port 8080; Next runs on 3000 internally)

Grant frontend service account invoker role on API

Verify frontend responds (ID token if private)

Cloud Run configuration (typical):

Region: africa-south1

Min instances: 0 (API), 1 (frontend) – configurable

Memory: 512Mi, CPU: 1 (both)

Env: NODE_ENV=production, API_BASE_URL=<api-url>, ID_TOKEN_AUDIENCE=<api-url>

Git Hooks & Mandatory 4-Tier Local Validation

The repository enforces a **mandatory 4-tier local validation system** that blocks pushes until ALL tiers pass. This prevents 95%+ of CI failures before code reaches GitHub.

**Tier 1: Pre-Commit Hook (.husky/pre-commit)**

- Runs: `lint-staged` (Prettier + ESLint on staged files)
- Runs: Binary validation checks
- Triggers: Automatically on `git commit`
- Blocks: Push if formatting or linting fails

**Tier 2: Pre-Push Hook - Quick Type Check (.husky/pre-push)**

- Runs: `npm run typecheck:bail` (scoped to changed workspaces)
- Detects: Changed workspaces (frontend-next, frontend, api, quote, todo, expense, stopwatch)
- Triggers: On `git push` (after Tier 1)
- Blocks: Push if TypeScript errors found

**Tier 3: Pre-Push Hook - Full Local CI (bash scripts/test-locally.sh)**

- Runs: Complete test suite locally
  - Type checking (all workspaces)
  - Jest tests (API with coverage)
  - Vitest tests (frontend-next with coverage)
- Triggers: On `git push` (after Tier 2)
- Blocks: Push if any tests fail
- Duration: ~60-90 seconds

**Tier 4: Pre-Push Hook - GitHub Actions Simulation (act tool)**

- Runs: Local GitHub Actions simulation via `act`
- Simulates: Exact GitHub Actions workflow environment
- Requires: Docker + act tool installed
- Triggers: On `git push` (after Tier 3)
- Blocks: Push if act is unavailable OR workflow simulation fails
- Duration: ~15-25 minutes (optional but mandatory for first-time setup)

**Installation & Setup**

```bash
# Install act (one-time setup)
# Windows: Download from https://github.com/nektos/act/releases or use chocolatey
# macOS: brew install act
# Linux: Download from releases or install via package manager

# Verify installation
act --version

# Verify Docker is running
docker ps

# First push will run all 4 tiers (20-30 minutes total)
git push

# Subsequent pushes cache results, typically 10-15 minutes
```

**Workflow**

1. Write code and commit: `git add . && git commit -m "..."`
   - Tier 1 runs automatically (Prettier + ESLint)
   - ~5 seconds

2. Push to GitHub: `git push`
   - Tier 2 runs (TypeScript typecheck) - ~10 seconds
   - Tier 3 runs (Full local CI) - ~60-90 seconds
   - Tier 4 runs (Act simulation) - ~15-25 minutes (if act installed)
   - Total: 15-30 minutes before push succeeds

3. GitHub Actions runs (final validation)
   - Quality gate workflow
   - Build & deploy workflows
   - Typically 5-10 minutes (much faster due to pre-validation)

**What If a Tier Fails?**

- **Tier 1 fails:** Fix formatting/linting: `pnpm -r lint --fix` then commit again
- **Tier 2 fails:** Fix TypeScript errors in the files shown, commit again
- **Tier 3 fails:** Run `bash scripts/test-locally.sh` locally to see details, fix tests, commit again
- **Tier 4 fails:** Either:
  - Install act tool (recommended for best CI fidelity)
  - OR skip by removing act from PATH (reduces pre-push confidence)

**Key Differences from Old System**

| Aspect                    | Old                | New (4-Tier)                               |
| ------------------------- | ------------------ | ------------------------------------------ |
| Pre-commit validation     | Prettier only      | Prettier + ESLint (lint-staged)            |
| Pre-push validation       | Basic type-check   | 4 mandatory tiers                          |
| Test coverage locally     | Manual (optional)  | Mandatory before push (Tier 3)             |
| GitHub Actions simulation | Never (after push) | Mandatory before push (Tier 4)             |
| Average push time         | 5 min              | 15-30 min first time, 10-15 min thereafter |
| CI failure rate           | ~30%               | <5% (95%+ caught locally)                  |
| Developer confidence      | Low                | Very high                                  |

**Commit Messages:**

Conventional Commits enforced (commitlint). Examples:

feat(posts): add SSR first paint check (DEV-123)

fix(api): handle 401 from /posts (DEV-456)

Testing Patterns
API Tests

Jest with ts-jest

Supertest for HTTP integration tests

In-memory repository for isolation

Coverage via jest --coverage

Frontend-Next Tests

Unit/Integration: Vitest + Testing Library + MSW

MSW handlers mock API responses

Component tests use Testing Library queries

E2E: Playwright with Chromium

Uses live app (NEXT_PUBLIC_APP_URL)

tests/playwright/helpers.ts – shared utilities

A11y: @axe-core/playwright

Scans critical pages (posts list, create form)

Fails on critical violations

Contract Testing

tests/openapi.validation.test.ts validates:

Route handlers match api/openapi.json schema

Request/response shapes align with contracts

Uses @hyperjump/json-schema + @apidevtools/openapi-schemas

Code Patterns
Error Handling (API)

Custom error classes in src/errors/ (ValidationError, NotFoundError, etc.)

errorHandler middleware converts errors to standard JSON responses

Request IDs attached via middleware for tracing

Validation

Zod schemas defined once, shared between API and frontend-next

API: src/validation/posts.ts

Frontend: src/lib/schemas.ts

Type inference: z.infer<typeof PostSchema>

Data Fetching (Frontend)

SSR: fetch() in Server Components with API_BASE_URL

Client: SWR with initialData from SSR (prevents flash)

Route handlers: /app/api/posts/route.ts proxies to backend

SWR config: revalidateOnMount: true ensures fresh data post-SSR

Authentication (Placeholder)

API: /auth/login route exists (placeholder response)

Frontend: login UI exists but not fully integrated

Future: ID token flow via Cloud Run IAP

Branch & PR Conventions

Branch format:

feat/<area>-<change> or fix/<area>-<bug> (lowercase, kebab-case)

PR body (mandatory fields; CI-enforced):

Linear Key(s): DEV-XXX

Gate Run: link to the green CI run

Gate Artifacts: [coverage | a11y | contract | traces]

Demo URL(s): Cloud Run preview (and main if relevant)

Screenshots: required for UI changes

Linked Plan: link to /specify → /plan → /tasks

Type suppression policy:
Use // @ts-expect-error <issue-url> (expires: YYYY-MM-DD) only.
// @ts-ignore is prohibited.

Reminder: This repo enforces a ≤300 LOC PR size guideline (excluding lockfiles/snapshots). Oversize PRs require the oversize-pr label and CODEOWNER approval.

Important Notes

Prefer in-memory tests for speed/isolation — set POSTS_REPOSITORY=inmemory in test env.

SSR requires API_BASE_URL in production; without it, SSR may fall back to NEXT_PUBLIC_API_URL (not ideal).

Pre-push hook scopes checks to changed workspaces to save time.

Contract validation tests run separately — pnpm -w frontend-next run test:contract.

Review Packet is optional locally; primarily for CI/PR reviews.

Coverage policy is enforced by the Gate (not runners): per-package thresholds + diff coverage; see DEVELOPMENT_RULES.md.

Playwright tests require a running app — start pnpm dev in frontend-next first.

api/openapi.json is the contract source of truth for all related tests.

Rate limiting is enabled by default (config via RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX).

Cloud Build uses Artifact Registry (not legacy Container Registry).

Temporary mitigations: create an issue labeled temp-mitigation with a named owner and (cleanup by YYYY-MM-DD); overdue items fail Gate.

Dependencies: Renovate manages updates—majors do not auto-merge, minors/patches are grouped; critical vulns block merges.

Live Deployments

Frontend: https://maximus-training-frontend-673209018655.africa-south1.run.app

API: https://maximus-training-api-wyb2jsgqyq-bq.a.run.app

Documentation References

Spec: specs/007-spec/week-7.5-finishers/spec.md

Plan: specs/007-spec/week-7.5-finishers/plan.md

Tasks: specs/007-spec/week-7.5-finishers/tasks.md

Review Packet Guide: docs/ReviewPacket/README.md

Contributing: CONTRIBUTING.md

Security Exceptions: SECURITY_EXCEPTIONS.md

Standards (source of truth): DEVELOPMENT_RULES.md
