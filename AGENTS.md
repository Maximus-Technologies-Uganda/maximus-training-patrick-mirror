# Agents Guide (AGENTS.md)

This file provides **project-specific guidance for code agents** (Codex Cloud/Web, Cursor, CI bots) to build, run, test, and contribute safely in this repository.

> **Source of truth:** Follow `DEVELOPMENT_RULES.md` for mandatory standards (PR evidence, branching, type safety, artifacts, CI checks, accessibility, performance, security, governance). If anything here conflicts with that file, **follow `DEVELOPMENT_RULES.md`**.  
> **Tooling:** Node **20.x LTS** + **pnpm 9.x via Corepack**. CI and hooks use pnpm.

---

## Authoritative Sources

- **Rules & quality bar:** `DEVELOPMENT_RULES.md` (PR evidence, coverage/diff coverage, @ts-expect-error policy).
- **System context & architecture:** `context.md`.
- **Features & Navigation:** `features-and-navigation.md`.
- **Production guide:** `docs/PRODUCTION-DEPLOYMENT.md`.

---

## Platform & Toolchain

- **Node:** 20.x  
- **Package manager:** **pnpm** (preferred; repo declares `packageManager` in `package.json`).  
  npm can work locally, but **CI uses pnpm**.
- **OS:** Linux/macOS. CI uses Ubuntu.

Enable pnpm locally:
```bash
corepack enable && corepack prepare pnpm@9.x --activate
pnpm install

Environment Variables (Minimum)

Define via .env.local for dev and GitHub/Secret Manager for CI/prod. Never commit secrets.

Development

DATABASE_URL — PostgreSQL (Neon/local). Required for server start & DB tests.

SESSION_SECRET — strong random string (dev only).

GCP_PROJECT_ID — e.g., proj-rms-dev

GCP_REGION — e.g., africa-south1 or us-central1

VERTEX_LOCATION — e.g., us-central1

VERTEX_MODEL — gemini-2.5-flash

Assistant flags (optional):

ASSISTANT_ENABLED=true|false (default false)

ASSISTANT_MACROS_ONLY=true|false (default false)

VITE_ASSISTANT_ENABLED=true|false (default false; client build-time)

ASSISTANT_CORS_ORIGINS — CSV of allowed origins (defaults include localhost)

Production (Google Cloud Run)

NODE_ENV=production

DATABASE_URL — Neon PostgreSQL prod connection

SESSION_SECRET — 32+ char secret (required)

GCP_PROJECT_ID — e.g., proj-rms-prod

GCP_REGION — e.g., africa-south1

VERTEX_LOCATION — e.g., us-central1

VERTEX_MODEL — gemini-2.5-flash

ASSISTANT_ENABLED=true

VITE_ASSISTANT_ENABLED=true (frontend build-time)

ASSISTANT_CORS_ORIGINS — CSV of allowed origins

ASSISTANT_FORWARDING_SECRET — HMAC secret for assistant ingress

Auth to GCP: Prefer Workload Identity Federation. If you must use a key, keep it in GitHub Actions Secrets and inject at runtime.

See docs/PRODUCTION-DEPLOYMENT.md for complete production configuration.

Install
pnpm install

Development (Local)
# Start the server (dev)
pnpm dev

# Default dev URL
# http://localhost:5000


Dev server (single origin)

pnpm dev serves Express + Vite at http://localhost:5000.

Keep requests same-origin to mirror production behavior.

Build & Start (Production Mode)
pnpm build
pnpm start

Testing Commands
# CI bundle: lint + types + unit + API + E2E
pnpm run test:ci

# Targeted suites
pnpm run test:unit        # Unit only
pnpm run test:api         # API only
pnpm run test:e2e         # Playwright (E2E)

Targeted Test Execution (Non-E2E)

Keep feedback fast; only run related tests for your changes. Do not include E2E here.

API/server changes

pnpm exec jest --selectProjects api --findRelatedTests --passWithNoTests --bail=1 --maxWorkers=50% $(git diff --name-only --diff-filter=ACMR origin/main...HEAD)


Frontend/client changes

pnpm exec jest --selectProjects unit --findRelatedTests --passWithNoTests --bail=1 --maxWorkers=50% $(git diff --name-only --diff-filter=ACMR origin/main...HEAD)


Shared contracts (e.g., shared/, API shapes, schema, auth/session) → run both:

pnpm run test:unit && pnpm run test:api


Pre-commit hooks run targeted unit tests for staged *.{ts,tsx}. If you touched server code, also run the API project manually.

Best practice order: pnpm run test:types && pnpm run lint → targeted tests → E2E only for smoke/regression.

Playwright Policy (Performance & Config)

Use optimized config by default:

npx playwright test -c playwright.optimized.config.ts


Tag new tests @smoke or @regression (default @smoke).

No hard waits > 250ms in new tests.

Keep smoke suite ≤ 3 minutes on CI.

For single-file debugging, use --workers=1 unless you have a dev config.

Performance budgets & SSR evidence:
CI enforces LCP/TTFB budgets; for UI changes, attach SSR first paint evidence in PR (raw HTML, Playwright trace, screenshot) per DEVELOPMENT_RULES.md.

Type Safety, Linting, Build
# Type checks
pnpm run test:types

# ESLint
pnpm run lint

# Production build
pnpm run build

TypeScript Gating Policy

Always run pnpm run test:types and pnpm run lint before unit/API/E2E.

any is prohibited. Prefer unknown + runtime narrowing (type guards, in, instanceof).

@ts-ignore is prohibited. Use:

// @ts-expect-error <issue-url> (expires: YYYY-MM-DD)


Only when unavoidable, with a linked follow-up task. Never in auth, org scoping, financial calcs, or migrations.

Type-check tests when relevant:

tsc -p tsconfig.jest.json
tsc -p tsconfig.jest.frontend.json


Do not weaken tsconfig.json ("strict": true) without an approved, time-boxed exception documented in changelog.md.

Dev/Prod Parity & Security Defaults

CSP parity: Dev mirrors prod by default:

style-src 'self'

script-src 'self' 'unsafe-eval' (HMR only)

Avoid 'unsafe-inline' in any environment.

Inline style enforcement (client)

ESLint forbids style prop on DOM nodes (react/forbid-dom-props).

node scripts/check-inline-styles.mjs blocks inline styles.

Allowed exception: CSS custom properties only:

style={{ ['--token' as string]: value }}


Local production smoke test

pnpm run serve:prod  # builds & starts with NODE_ENV=production


Deployment verification

./scripts/verify-production-deployment.sh must pass:

CSP present

No unsafe-inline/unsafe-eval

No localhost in CSP

Includes script-src 'self' and style-src 'self'

Environment flags (development only)

STRICT_CSP_IN_DEV=true (default). Temporarily set false only for debugging.

CSP_SCRIPT_SRC_EXTRA, CSP_STYLE_SRC_EXTRA for targeted host additions (CSV).

Styling/animation patterns

Prefer Tailwind, component CSS, CSS variables.

Use CSS transitions/animations (custom properties + keyframes); avoid inline animation styles.

Assistant Feature Flags (Server/Client)

Backend routes at /api/assistant/* gated by ASSISTANT_ENABLED.

Provider can be disabled via ASSISTANT_MACROS_ONLY=true (macros-only mode).

Client UI controlled at build time by VITE_ASSISTANT_ENABLED.

See context.md for behavior, idempotency, rate limits, and security.

Multi-Organization & Financial Data Rules

Respect organization isolation at all times (e.g., Org 1: JB Properties; Org 4: JB Complex).

Never cross-contaminate data across orgs; validate RLS context.

Preserve financial balances and audit trails. Avoid destructive updates; use reversals.

Documentation Requirements (MANDATORY)

After any change:

Update changelog.md (concise, dated entries).

Update context.md if behavior or functionality changes.

Update features-and-navigation.md if routes/navigation change.

Known Entry Points & Scripts

Dev server: pnpm dev → server/index.ts

Build: pnpm build → vite build (client) + esbuild (server)

Start: pnpm start → dist/index.js

Utilities: See scripts/ and docs for seeding/verification.

Manual Verification (Human Operator)

Provide manual steps using realistic data, covering org isolation and financial integrity.

List potential regression areas for review.

If This File Is Missing

Cloud agents may fall back to agent.md (lowercase) if configured. This repository can provide both to maximize compatibility.

Appendix: CI Hints for Agents

Named checks (branch protection): lint, typecheck, unit, coverage, a11y, contract, build, deploy-preview.

PR evidence: Linear DEV-XXX, Gate Run link, Gate Artifacts, Demo URL(s), Screenshots (UI), Linked Plan.

PR size guideline: ≤ 300 LOC (excludes lockfiles/snapshots). Overages require oversize-pr + CODEOWNER approval.

Temporaries: temp-mitigation issues must have owner and (cleanup by YYYY-MM-DD); overdue items fail Gate.

Secrets & vars: use repository/Environment Actions Variables/Secrets; avoid hardcoding. IDE warnings are expected until configured.

