# Contributing Guide

Welcome to the Training monorepo. This guide explains the repository layout, branching/review process, and the complete local validation workflow aligned to Week 7.5 Finish‑to‑Green. It references the feature artifacts:

- Spec: `specs/007-spec/week-7.5-finishers/spec.md`
- Plan: `specs/007-spec/week-7.5-finishers/plan.md`
- Tasks: `specs/007-spec/week-7.5-finishers/tasks.md`

## Repository Structure

- `api/`: Express API (TypeScript). OpenAPI source-of-truth at `api/openapi.json`.
- `frontend-next/`: Next.js app (TypeScript) with Vitest unit/integration and Playwright a11y/e2e.
- `frontend/`: Vite-based sample front-end (legacy exercises, still testable).
- `quote/`, `todo/`, `expense/`, `stopwatch/`: CLI learning projects with tests.
- `scripts/`: Monorepo utilities including Quality Gate helpers:
  - `scripts/run-tests.js` (root test runner)
  - `scripts/quality-gate/aggregate-results.js` (gate decision)
  - `scripts/quality-gate/build-review-packet.js` (Review Packet)
- `specs/007-spec/week-7.5-finishers/`: Spec, plan, and tasks for Week 7.5 Finish‑to‑Green.
- `.github/workflows/main.yml`: CI pipeline that runs gate checks and deploys via Cloud Build.

Node version: 18+ (see `package.json` engines).

## Branching & Reviews

- Create feature branches from `main` (e.g., `docs/finalize-week6-finishers`).
- Open PRs to `main` with clear descriptions, link to spec/plan/tasks as relevant.
- CI must pass the Quality Gate before merge.

## Install & Common Commands

From repository root:

```bash
npm ci

# Lint all workspaces
npm run lint

# Type-check aggregate (tsc --noEmit per workspace)
npm run typecheck

# Run monorepo tests (quote/expense/stopwatch/todo and optional dev-week-1)
npm test

# Build API + Next + legacy frontend
npm run build
```

Workspace-specific examples:

```bash
# API (Jest)
cd api && npm ci && npm run test:ci

# frontend-next (Vitest)
cd frontend-next && npm ci && npm run test:ci

# frontend-next contract-only tests (validates against api/openapi.json)
npm run test:contract -w frontend-next

# frontend-next Playwright a11y/e2e
npm run test:e2e -w frontend-next
```

## Local Validation Workflow (Quality Gate parity)

This mirrors the CI gate defined in `.github/workflows/main.yml` and the spec requirements.

1) Lint

```bash
npm run lint
```

2) Type-check gate (per spec requirements)

```bash
npm run typecheck  # or npm run typecheck:bail
```

3) Unit/Integration tests (+ coverage)

```bash
# Root runner for CLI projects
npm test

# API coverage (Jest)
cd api && npm run test:ci

# Frontend-next coverage (Vitest)
cd ../frontend-next && npm run test:ci
```

4) Contract validation (frontend-next → `api/openapi.json`) (FR-008)

```bash
npm run test:contract -w frontend-next
```

5) Build artifacts

```bash
npm run build
```

6) Accessibility and E2E checks (FR-007)

```bash
# Ensure the app runs locally first (default http://localhost:3000)
cd frontend-next && npm run dev

# In another terminal, run Playwright a11y/e2e
npm run test:e2e -w frontend-next
```

Thresholds per spec/plan:

- Coverage (including `frontend-next`): statements ≥ 60%, branches ≥ 50%, functions ≥ 55%.
- A11y: zero critical and zero serious violations on posts list and create post form.
- Contract: no breaking mismatches vs `api/openapi.json`.
- Type-check: 0 errors across `api` and `frontend-next`.

7) Review Packet (optional, local)

You may build a Review Packet locally to inspect artifacts and manifest:

```bash
node scripts/quality-gate/build-review-packet.js \
  --demo-url https://<your-demo-url> \
  --contract api/openapi.json \
  --force
```

Outputs are written under `docs/ReviewPacket/` with a zip at `docs/review-packet.zip`.

8) Governance basics

Generate a basic dependency snapshot as part of governance reporting:

```bash
node scripts/generate-governance-report.js
```

If you must request a temporary exception (e.g., security), document it in `SECURITY_EXCEPTIONS.md`, obtain mentor approval, and mirror the waiver in the CI governance JSON so the gate can record/audit it (see aggregator in `scripts/quality-gate/aggregate-results.js`).

Example governance JSON (repo root `governance/report.json`) compatible with `scripts/quality-gate/schemas/governance.schema.json`:

```json
{
  "passed": true,
  "approvedExceptions": [
    { "dimension": "security", "allowLevels": ["high"], "approved": true, "expiresAt": "2025-12-31T00:00:00.000Z" },
    { "dimension": "a11y", "allowImpacts": ["serious"], "approved": true },
    { "dimension": "coverage", "allowCoverageBelowThreshold": true, "approved": true },
    { "dimension": "contract", "allowBreaking": false, "approved": true }
  ]
}
```

9) Security audit summary

Produce `security/audit-summary.json` consumed by the Quality Gate:

```bash
npm run security:audit
```

- Attempts `npm audit --json` and writes a summarized severity count.
- Falls back to a zeroed summary when audit tooling is unavailable (local dev convenience).

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Base URL of the API used by `frontend-next`.
- `NEXT_PUBLIC_APP_URL`: Public URL of the app (used by CI Playwright tests and a11y scans).

## Code Style & Linting

- ESLint + Prettier are configured across workspaces.
- Prefer explicit types on exported APIs; avoid `any`.
- Keep functions small and expressive; prefer early returns over deep nesting.

## Commit Messages

- Use concise, imperative subjects (e.g., "Add contract validation to CI").
- Reference spec/plan/tasks when applicable.

## Support

If you encounter issues, open a GitHub issue or start a draft PR with reproduction steps. For spec alignment, reference:

- `specs/007-spec/week-7.5-finishers/spec.md`
- `specs/007-spec/week-7.5-finishers/plan.md`
- `specs/007-spec/week-7.5-finishers/tasks.md`

# Contributing

Thank you for contributing! Please follow these conventions to keep our workflow consistent.

## Branch Naming Convention

- Format: feature/LIN-###-short-scope
- Guidelines:
  - Replace LIN-### with the ticket ID (e.g., LIN-1234).
  - Use a concise, kebab-cased scope describing the change.
  - Use lowercase letters, numbers, and hyphens only.

- Example:
  - feature/LIN-1234-auth-login

## Pull Request (PR) Title Convention

- Format: feat(scope): short description (LIN-###)
- Guidelines:
  - Use imperative mood for the short description.
  - scope is the affected area or component.
  - Include the ticket ID in parentheses at the end.

- Example:
  - feat(auth): add login with OTP (LIN-1234)

