# DEVELOPMENT_RULES.md

## PURPOSE

Mandatory rules and procedures for any change to this repository. The goal is shippable, verifiable, and maintainable code with low regression risk.

---

## BASE POLICY (APPLIES TO ALL WORK)

### 1) Check Rules First

- Always read this file before starting any task. It is the first reference point.

### 2) Spec-Driven Development

- Follow: `/specify → /plan → /tasks` before writing code.
- No coding starts without a clear plan and task breakdown.
- **PRs must link to the plan** (issue/doc) in the PR body. CI fails if missing.

### 3) Robust and Permanent Solutions

- No temporary workarounds; fix root causes.
- If a temporary mitigation is unavoidable, it **requires**:
  - A dedicated “removal” issue labeled `temp-mitigation`
  - A named owner
  - A deadline **(YYYY-MM-DD)** in the issue title (e.g., `… (cleanup by 2025-11-30)`)
- A scheduled CI job fails if any `temp-mitigation` issue is past due.

### 4) Tiny, Single-Purpose PRs

- Each PR maps to one task/story; keep scope small.
- Suggested size: ≤300 changed LOC (excluding snapshots/lockfiles/generated).
- CI enforces size. Oversize PRs require the `oversize-pr` label **and** explicit CODEOWNER approval.

### 5) Evidence-Based PRs (PR Body Rule)

Every PR body MUST include:

- Linear key(s): DEV-XXX task(s) closed
- Gate run: link to the green CI run
- Gate artifacts: links to uploaded bundles
- Demo URL(s): Cloud Run preview (and main if relevant)
- Screenshots: mandatory for UI changes (e.g., SSR first-paint)

**Enforcement**

- `.github/pull_request_template.md` is mandatory.
- CI fails if any required fields are missing or placeholders remain.

### 6) Language, Lint, and Type Safety

- Must pass lint and typecheck with zero errors.
- TypeScript: `any` is prohibited; prefer `unknown` + type guards.
- `// @ts-ignore` prohibited. If suppression is unavoidable: `// @ts-expect-error <issue-link> (expires: YYYY-MM-DD)` with a **30-day cleanup SLA**. CI fails past expiry.
- Centralize unavoidable ambient types in `types/ambient.d.ts` with rationale.
- JS packages must still be type-checked (`allowJs: true`, `checkJs: true`) or be migrated to TS.
- Baseline TS strictness (per package):

````json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noPropertyAccessFromIndexSignature": true,
    "noFallthroughCasesInSwitch": true,
    "forceConsistentCasingInFileNames": true
  }
}
If a package cannot meet baseline, it must carry tsconfig.strict-exceptions.json citing specific flags, linked issue, and expiry (≤30 days).

7) Local Verification & Mandatory 4-Tier Validation

**ALL developers MUST pass the mandatory 4-tier local validation before push. No exceptions.**

**Tier 1: Pre-Commit (Automatic)**
- Runs: `lint-staged` with Prettier + ESLint
- Triggers: Automatically on `git commit`
- Cannot be bypassed: Code must pass formatting and linting to commit

**Tier 2: Pre-Push Type Check (Automatic)**
- Runs: `npm run typecheck:bail` on changed workspaces
- Triggers: Automatically on `git push`
- Blocks: Push if TypeScript errors found
- Cannot be bypassed: Use `git push --no-verify` only in declared emergencies with follow-up fix issue

**Tier 3: Pre-Push Full CI (Automatic - ALL MANDATORY)**
- Runs: `bash scripts/test-locally.sh`
  - **Phase 1 (mandatory):** Complete type checking
  - **Phase 2 (mandatory):** All Jest tests (API) + Vitest tests (frontend-next)
  - **Phase 3 (mandatory):** Security & quality checks
    - Secret scanning (gitleaks) - hardcoded credentials detection
    - README link validation - broken link detection
    - GitHub workflow validation (actionlint) - CI config syntax errors
    - Dependency audit (npm audit) - vulnerable packages
    - Vendored binaries check - compiled executable detection
- Triggers: Automatically on `git push` (after Tier 2)
- Blocks: Push if ANY phase fails (all 3 phases mandatory)
- Duration: ~2-3 minutes (all phases)
- Cannot be bypassed: All phases required for every push

**Tier 4: Pre-Push GitHub Actions Simulation (Automatic)**
- Runs: `act` tool simulates GitHub Actions workflows locally
- Simulates: Exact CI environment with Docker
- Requires: Docker + act tool (one-time setup)
- Triggers: Automatically on `git push` (after Tier 3)
- Blocks: Push if workflow simulation fails OR act tool unavailable
- Duration: ~15-25 minutes
- Cannot be bypassed for mandatory pushes

**Setup Instructions**
```bash
# Install act (one-time)
# Windows: choco install act OR download from https://github.com/nektos/act/releases
# macOS: brew install act
# Linux: Download from releases or use package manager

# Verify installation
act --version

# Verify Docker running
docker ps

# First push: all 4 tiers run (20-30 min total)
git push
````

**Why 4 Tiers? (With Mandatory Security Tier 3)**

- **Tier 1:** Catch formatting issues before commit (~5s)
- **Tier 2:** Fast type-check on changed code (~10s)
- **Tier 3:** Full mandatory local validation (~2-3m)
  - Phase 1: Type checking all workspaces
  - Phase 2: All unit tests with coverage
  - Phase 3: Security & quality checks catching 99%+ of failure modes
    - Secret scanning (gitleaks) - prevent credentials in repo
    - README link validation (broken links)
    - GitHub workflow validation (actionlint)
    - Dependency audit (vulnerable packages)
    - Vendored binaries check
- **Tier 4:** Exact CI simulation before GitHub (15-25 min)
- **Result:** 99%+ of CI failures caught before GitHub
- **CI Pass Rate:** <1% failures (vs. 30% without shift-left)

**Shift-Left Optimization (Advanced)**

This repository implements a **shift-left CI/CD strategy** to maximize local validation. See [SHIFT-LEFT-STRATEGY.md](SHIFT-LEFT-STRATEGY.md) for complete documentation.

Key changes:

- Non-critical checks (README links, workflow linting, etc.) run locally in Phase 3 only
- GitHub Actions focuses on **verification**, not **discovery**
- Result: <1% GitHub failure rate (vs. 30% without shift-left)
- GitHub Actions time reduced by ~25% (checks moved to local)

**Required GitHub Actions Setup:**
Update branch protection rules (one-time manual step in GitHub Settings) to make these checks non-blocking:

- README link check
- README placeholder guard
- Lint GitHub workflows

See [docs/GITHUB-BRANCH-PROTECTION-SETUP.md](docs/GITHUB-BRANCH-PROTECTION-SETUP.md) for step-by-step instructions.

**If a Tier Fails**

| Tier | Failure           | Fix                                                                 |
| ---- | ----------------- | ------------------------------------------------------------------- |
| 1    | Formatting/lint   | `pnpm -r lint --fix` then `git add` and `git commit`                |
| 2    | TypeScript errors | Fix TS errors shown, `git add` and `git commit`                     |
| 3    | Test failures     | Run `bash scripts/test-locally.sh` locally, fix tests, commit       |
| 4    | Act unavailable   | Install act tool OR use `git push --no-verify` (not recommended)    |
| 4    | Workflow fails    | Debug with `act -l` and `act -W .github/workflows/quality-gate.yml` |

8. CI/CD Is Source of Truth

Green Gate is mandatory to merge.

Required checks (must be green): lint, typecheck, unit, coverage, a11y, contract, build, deploy-preview (PRs), deploy (main).

Gate summary must include Cloud Build and Cloud Run links.

Deploy must run on main (not skipped) and attach URLs to the job summary.

9. Artifacts Are Non-Negotiable

Gate must upload:

coverage-frontend-next: coverage bundle (per-package totals)

a11y-frontend-next: HTML report + JSON summary

contract-api: OpenAPI/Spectral report + the exact openapi.json used

Performance: Lighthouse/Playwright traces + screenshots

SBOM: CycloneDX JSON per package

Retention & naming

Retain 21 days.

Include commit SHA, package name, and date in artifact names.

10. Git Hygiene & Branch Protection

Do not commit node_modules or coverage outputs.

Squash merges only; signed commits required (GPG or SSH).

No force pushes to main.

Branch naming: feat/<area>-<change>, fix/<area>-<bug>.

Conventional Commits enforced via commitlint (commit-msg hook).

CODEOWNERS present; at least one CODEOWNER reviewer in branch protection.

For risk-high label: require one CODEOWNER + one non-author reviewer.

11. Architecture Decision Records (ADR)

Non-trivial cross-cutting decisions require an ADR at docs/adrs/NNN-title.md (template provided).

Link the ADR in the PR body.

TOOLING AND WORKSPACES
Package Manager and Workspaces

We use pnpm as the single package manager.

pnpm workspaces defined in root pnpm-workspace.yaml.

Root scripts standardize commands across packages:

pnpm run lint → pnpm -r run lint

pnpm run typecheck → pnpm -r run typecheck

pnpm run test → pnpm -r run test

Toolchain Pinning

Pin toolchain to avoid drift:
{
"engines": { "node": ">=20 <21", "pnpm": ">=9 <10" },
"packageManager": "pnpm@9.x"
}
Provide .nvmrc or .node-version.

Enable Corepack locally/CI: corepack enable && corepack prepare pnpm@9.x --activate.

Caching & Execution

Cache pnpm store in CI (actions/setup-node@v4 with cache: pnpm).

Cache Playwright browsers.

Optional Turborepo remote cache; if not used, ensure actions/cache covers ~/.pnpm-store and .cache.

Cross-Platform Scripts

Write scripts in Node (no bashisms).

Use cross-env for environment variables so hooks and CI work on Windows/macOS/Linux.

Prettier is mandatory; run via pre-commit (lint-staged).

Enforce eslint-plugin-import (no-cycle, simple-import-sort, import/no-default-export for shared libs).

Dependency Hygiene & Updates

Renovate enabled; majors never auto-merge; grouped minors/patches.

Dependency review is required; critical vulns block merge.

QUALITY BARS AND POLICIES
Coverage Policy

Per-package thresholds (starting point): frontend-next lines ≥70%.

Diff coverage: ≥80% of changed lines (fail if changed LOC ≥40 and diff <80%).

“No negative delta”: do not reduce coverage vs base.

Print per-package totals in Gate summary; fail on threshold breach.

Accessibility (frontend-next)

Produce HTML report and JSON summary.

Fail Gate on critical violations; warn on serious/minor.

Use @axe-core/cli for components and Playwright + axe for flows.

Link both artifacts in PR body.

Performance (frontend-next)

Budgets live in frontend-next/perf-budgets.json (LCP, TTFB).

Upload Lighthouse CI report + Playwright trace and screenshots.

Gate warns on budget breach; fails on severe regressions.

Security & Licenses

Secret scanning via gitleaks in pre-commit and CI (allowlist maintained).

Enable GitHub dependency review and Dependabot/OSV checks; block on critical vulnerabilities.

Generate SBOM (CycloneDX) per package; upload as sbom-<pkg>-<sha>.json.

OpenSSF Scorecard runs (non-blocking) on default branch.

Environment & Configuration

Each package must provide .env.example and validate env at startup using a typed schema (e.g., Zod).

CI check ensures .env.example superset of schema keys.

Document env vars in README.md tables; auto-generate if possible.

OVERLAYS
Frontend Web (Next.js)

SSR first paint

Verify server-rendered HTML contains content before hydration by fetching raw HTML from preview URL and asserting expected content.

Upload HTML response body, Playwright trace, and screenshot as artifacts.

Next.js environment boundaries

Server-only vars: never NEXT*PUBLIC*\* (e.g., API_BASE_URL server-only).

Client-exposed vars: MUST be prefixed with NEXT*PUBLIC*\*.

Preview requirement

UI changes must include a preview URL and screenshots from that preview.

Preview healthcheck must return non-5xx; CI blocks PR if unhealthy.

Backend API

Contract Testing

Enforce Spectral linting against a pinned ruleset version.

Breaking semantic changes require version bump, migration note, and breaking-contract label.

Artifacts

Upload the exact openapi.json used.

(Optional) Library/SDK

Publish API diff and bundle size report (size-limit).

Changesets for semver & changelogs.

Deprecation policy with timelines and migration guide.

(Optional) Data/ML

Data quality gates; model lineage; reproducible training; model cards & bias checks.

Version datasets/models as artifacts.

STANDARD PR WORKFLOW

Sync: git checkout main and git pull

Branch: Create a task-specific branch

Code: Implement the single task from your plan

Verify locally:

pnpm run test

pnpm run typecheck

pnpm run lint

Commit: Conventional commit

Push: hooks run

PR: Open a Pull Request

Evidence: Update PR body with Gate link, artifacts, demo URL(s), screenshots

Review: CODEOWNER required; risk-high needs CODEOWNER + non-author

Merge: Green CI + approval → squash merge

DEFINITION OF DONE

SSR (frontend-next): Pre-hydration content verified; HTML body + trace + screenshot uploaded.

Coverage: Thresholds met; diff ≥80%; no negative delta; per-package totals printed.

A11y: HTML report + JSON summary uploaded; zero critical violations.

Contract (api): Spectral passes; artifact includes exact openapi.json.

Docs: Root README.md has working Cloud Run URLs, “Run & Try,” and env tables; package docs updated.

SBOM: CycloneDX artifacts per package.

EMERGENCY PROCEDURES

If main breaks (CI red or Cloud Run failure):

Stop. No “fix forward.”

Revert the bad PR via GitHub UI immediately.

Communicate to the team.

Fix in a new branch; go through full PR + Gate again.

Set repo-level freeze=true to block non-revert merges until Gate is green.
