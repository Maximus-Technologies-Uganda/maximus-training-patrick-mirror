# Hybrid Local CI/CD Guide

**Run GitHub Actions locally before pushing to validate your changes**

This guide explains the three-tier approach to testing locally before pushing to GitHub.

---

## Quick Start

```bash
# Tier 1: Fast checks (auto-runs on commit)
git commit -m "..."
# Pre-commit hook runs lint-staged

# Tier 2: Pre-push checks (auto-runs on push)
git push
# Pre-push hook runs type checks

# Tier 3: Full local CI (optional - run manually)
pnpm test:local-ci
# Then commit and push
```

---

## Three-Tier Testing Approach

### Tier 1: Pre-Commit (Instant Feedback)

**Trigger:** Automatically on `git commit`
**Duration:** 10-45 seconds
**Tools:** lint-staged + Prettier + ESLint
**Scope:** Only changed files

```bash
# View what will run
cat .husky/pre-commit

# What happens:
# - Prettier formats changed files
# - ESLint fixes linting issues on changed files
# - Binary guard checks for accidentally added binaries
```

**Cost:** Very fast - catches formatting issues before they enter the repo

---

### Tier 2: Pre-Push (Type Safety)

**Trigger:** Automatically on `git push`
**Duration:** 30 seconds - 2 minutes
**Tools:** TypeScript compiler
**Scope:** Changed workspaces only

```bash
# View the pre-push logic
cat .husky/pre-push

# What happens:
# - Detects which workspaces changed
# - Runs typecheck:bail only on those workspaces
# - Checks ESLint config for changes
# - Provides tips for full CI testing
```

**Cost:** Reasonable - prevents type errors from reaching GitHub

---

### Tier 3: Full Local CI (Comprehensive)

**Trigger:** Manual - run before pushing complex changes
**Duration:** 3-8 minutes
**Tools:** All quality gates
**Scope:** All workspaces

```bash
pnpm test:local-ci
```

#### What This Runs:

1. **Type Checking** - All workspaces
2. **Linting** - All workspaces
3. **API Tests** - With coverage (`api/pnpm test:ci`)
4. **Frontend-Next Tests** - With coverage (`frontend-next/pnpm test:ci`)
5. **Monorepo Tests** - quote, todo, expense, stopwatch
6. **Contract Validation** - OpenAPI spec validation
7. **Build Check** - Ensures all packages build

#### Output Example:

```
╔════════════════════════════════════════════════════════════╗
║         Local CI/CD Test Suite - Pre-Push Validation      ║
╚════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ PHASE 1: Quick Checks (Type & Lint)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Type checking all workspaces...
✓ Type checking passed

→ Linting all workspaces...
✓ Linting passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ PHASE 2: Unit Tests with Coverage
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Running API tests with coverage...
✓ API coverage passed

→ Running frontend-next tests with coverage...
✓ Frontend-next coverage passed

...

╔════════════════════════════════════════════════════════════╗
║  ✓ All checks passed! Safe to push to GitHub               ║
╚════════════════════════════════════════════════════════════╝

Next steps:
  1. Review changes: git status
  2. Commit changes: git add . && git commit -m "..."
  3. Push to GitHub: git push

The GitHub Actions workflows will run automatically.
```

---

## Setup Instructions

### Step 1: Install Dependencies

The hybrid approach uses:

- **lint-staged** - Already installed ✅
- **Husky** - Already installed ✅
- **act** (Optional) - For GitHub Actions simulation

```bash
# Install act for Tier 4 (GitHub Actions simulation)
# Windows (Chocolatey)
choco install act

# macOS (Homebrew)
brew install act

# Linux (manual)
# Download from https://github.com/nektos/act/releases
```

### Step 2: Verify Setup

```bash
# Check pre-commit hook
cat .husky/pre-commit

# Check pre-push hook
cat .husky/pre-push

# Test lint-staged
pnpm lint --staged

# View test script
cat scripts/test-locally.sh
```

### Step 3: Optional - Configure Docker for act

The `.actrc` file is already configured. Verify it:

```bash
cat .actrc

# Expected output:
# -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:full-latest
# --bind
# --network host
# --container-label=com.github.actions.run=local
```

---

## Usage Scenarios

### Scenario 1: Small Bug Fix

```bash
# Make changes
vim api/src/middleware/auth.ts

# Commit (Tier 1 auto-runs)
git add api/
git commit -m "fix(auth): handle 401 responses"
# → Pre-commit hook runs lint-staged
# → lint-staged formats and lints changed files

# Push (Tier 2 auto-runs)
git push
# → Pre-push hook detects api/ changed
# → Runs typecheck:bail on api workspace only
# → Suggests running pnpm test:local-ci if needed
```

**Result:** Minimal feedback loop, fast iteration

---

### Scenario 2: Feature with Tests

```bash
# Make changes across multiple files
vim frontend-next/src/components/Button.tsx
vim frontend-next/src/components/Button.test.tsx

# Commit (Tier 1 auto-runs)
git commit -m "feat(ui): add Button component"
# → Pre-commit hook runs prettier + eslint on changed files

# Want to verify before pushing?
pnpm test:local-ci
# → Runs full test suite
# → Checks coverage for frontend-next
# → Validates all contracts
# → If passes, safe to push

git push
# → Pre-push hook runs type checks
# → You've already tested locally, so confident push
```

**Result:** Comprehensive validation before GitHub Actions

---

### Scenario 3: Complex Refactoring

```bash
# Large refactoring across multiple workspaces
# ... make changes to api/, frontend-next/, quote/

# Test progressively
pnpm test:local-ci
# → Runs all phases
# → Catches issues before GitHub

# Fix any failures locally

# Final validation with GitHub Actions simulation
pnpm test:act
# → Simulates exact GitHub Actions environment
# → Runs quality-gate workflow locally

git commit -m "refactor: consolidate error handling"
git push
# → GitHub Actions runs, but you've already validated
```

**Result:** High confidence in complex changes

---

## Tier 4: Simulate GitHub Actions (Optional)

Once you have `act` installed, you can fully simulate GitHub Actions locally.

### Quick Simulation

```bash
# List available workflows
act -l

# Run quality-gate workflow
act -W .github/workflows/quality-gate.yml

# Run specific job
act -j frontend-next-a11y

# Run with verbose output
act -v -W .github/workflows/quality-gate.yml
```

### Simulating PR Events

```bash
# Simulate pull_request event
act pull_request

# Simulate push to main
act push -b main

# Simulate workflow_dispatch (manual trigger)
act workflow_dispatch
```

### Using the Convenience Script

```bash
# Added to package.json for easy access
pnpm test:act

# This runs: act -W .github/workflows/quality-gate.yml --artifact-server-path=/tmp/act-artifacts
```

### Troubleshooting act

```bash
# If Docker not found
# → Start Docker Desktop

# If container fails
act -P ubuntu-latest=ghcr.io/catthehacker/ubuntu:full-latest

# Check runner setup
act --list-runners

# Verbose debugging
act -v --debug
```

---

## Performance Benchmarks

| Tier       | Command              | Duration       | When to Use                 |
| ---------- | -------------------- | -------------- | --------------------------- |
| **Tier 1** | Auto on commit       | 10-45 sec      | Every commit (automatic)    |
| **Tier 2** | Auto on push         | 30 sec - 2 min | Every push (automatic)      |
| **Tier 3** | `pnpm test:local-ci` | 3-8 min        | Before complex changes      |
| **Tier 4** | `pnpm test:act`      | 5-15 min       | Final validation (optional) |

---

## What Each Tier Catches

### Tier 1: Pre-Commit

- ✅ Formatting issues
- ✅ Linting problems
- ✅ Accidentally added binaries
- ❌ Type errors
- ❌ Test failures
- ❌ Coverage issues

### Tier 2: Pre-Push

- ✅ Type errors (TypeScript compilation)
- ✅ ESLint config issues
- ❌ Test failures
- ❌ Coverage issues
- ❌ E2E test failures

### Tier 3: Full Local CI

- ✅ Type errors
- ✅ Lint failures
- ✅ Unit test failures
- ✅ Coverage gaps
- ✅ Contract validation
- ✅ Build errors
- ❌ E2E test failures (optional)

### Tier 4: GitHub Actions Simulation

- ✅ Everything Tier 3 catches
- ✅ E2E tests
- ✅ Exact GitHub environment
- ✅ Workflow order and dependencies
- ✅ Cache behavior
- ✅ Artifact generation

---

## Recommended Workflow

### For Small Changes (< 20 files)

```bash
git add .
git commit -m "..."          # Tier 1 auto-runs
git push                     # Tier 2 auto-runs
# Done! GitHub Actions runs automatically
```

### For Medium Changes (> 20 files, multiple workspaces)

```bash
git add .
git commit -m "..."          # Tier 1 auto-runs
pnpm test:local-ci          # Tier 3 - validate locally
git push                     # Tier 2 auto-runs
# Done! GitHub Actions runs automatically
```

### For Major Changes (refactoring, schema changes)

```bash
git add .
git commit -m "..."          # Tier 1 auto-runs
pnpm test:local-ci          # Tier 3 - full validation
pnpm test:act               # Tier 4 - GitHub simulation (optional)
git push                     # Tier 2 auto-runs
# Done! GitHub Actions runs automatically
```

---

## Troubleshooting

### Pre-commit hook not running

```bash
# Verify Husky is installed
npm run prepare

# Re-install hooks
husky install

# Test it
echo "test" > temp.txt
git add temp.txt
git commit -m "test" || true
rm temp.txt
```

### Pre-push hook failing

```bash
# Bypass temporarily (not recommended)
git push --no-verify

# Fix the issues it caught
pnpm -r typecheck
pnpm -r lint --fix
git add .
git commit -m "fix: resolve type/lint errors"
git push
```

### Test script failing

```bash
# Run with more verbose output
bash -x scripts/test-locally.sh

# Run individual phases
pnpm -r typecheck
pnpm -r lint
cd api && pnpm test:ci && cd ..
```

### act not working

```bash
# Verify Docker is running
docker ps

# Check act installation
act --version

# Download latest catthehacker image
docker pull ghcr.io/catthehacker/ubuntu:full-latest

# Try simple test
act -j lint-workflows
```

---

## Files Reference

| File                      | Purpose                                   |
| ------------------------- | ----------------------------------------- |
| `.husky/pre-commit`       | Tier 1 - Linting and formatting           |
| `.husky/pre-push`         | Tier 2 - Type checking                    |
| `scripts/test-locally.sh` | Tier 3 - Full local CI                    |
| `.actrc`                  | Tier 4 - GitHub Actions simulation config |
| `package.json`            | Scripts: `test:local-ci`, `test:act`      |

---

## Next Steps

1. ✅ Run `git commit` - Verify Tier 1 works
2. ✅ Run `git push` - Verify Tier 2 works
3. ✅ Run `pnpm test:local-ci` - Verify Tier 3 works
4. ✅ (Optional) Install `act` and run `pnpm test:act` - Verify Tier 4

---

## Questions?

For more details:

- **Local Testing:** See `scripts/test-locally.sh`
- **CI/CD Optimization:** See `OPTIMIZATION_FINAL_REPORT.md`
- **Workflow Configuration:** See `.github/workflows/quality-gate.yml`

---

**Happy Testing! 🚀**
