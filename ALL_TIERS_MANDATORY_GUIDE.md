# All Tiers Mandatory & Automatic - Complete Guide

**Status:** ✅ All 4 tiers are now compulsory and automatic
**Implementation:** October 29, 2025
**Setup Required:** Yes - read below

---

## Overview

All GitHub Actions tests now run **automatically** before every push. You cannot push without passing all validations.

```
git push
    ↓
[AUTOMATIC - Cannot be skipped]
    ├─ Tier 1: Pre-Commit (Prettier, ESLint) ✓
    ├─ Tier 2: Pre-Push (TypeScript, ESLint config) ✓
    ├─ Tier 3: Full Local CI (All tests, coverage, contracts) ✓ [MANDATORY]
    └─ Tier 4: GitHub Actions Simulation (If act installed) ✓ [MANDATORY]
    ↓
Push allowed only if ALL pass
```

---

## What Changed

### Before

- Tier 1+2: Automatic ✓
- Tier 3: Manual (optional)
- Tier 4: Manual (optional)

### After (NOW)

- Tier 1: Automatic ✓ (pre-commit)
- Tier 2: Automatic ✓ (pre-push)
- Tier 3: Automatic ✓ (pre-push) **NOW MANDATORY**
- Tier 4: Automatic ✓ (pre-push) **NOW MANDATORY**

---

## The New Workflow

### Step 1: Commit Changes

```bash
git add .
git commit -m "feat: new feature"
```

**What runs automatically:**

- Prettier formatting
- ESLint linting
- Binary file checks
- Auto-fixes applied if possible

**If Tier 1 fails:**

```
❌ Commit blocked
→ Hooks auto-fix most issues
→ Try committing again
```

### Step 2: Push Changes

```bash
git push
```

**What runs automatically (in sequence):**

1. **Type Checking** (10-30 sec)
   - TypeScript compilation
   - ESLint config validation

2. **Full Local CI** (3-8 min) ← **NOW MANDATORY**
   - Type checking (all workspaces)
   - Linting (all workspaces)
   - API tests + coverage
   - Frontend-next tests + coverage
   - Monorepo tests (quote, todo, expense, stopwatch)
   - Contract validation
   - Build validation

3. **GitHub Actions Simulation** (5-15 min) ← **NOW MANDATORY** (if act installed)
   - Exact GitHub environment simulation
   - All workflows validated locally
   - Same conditions as GitHub CI

**If any tier fails:**

```
❌ Push blocked
→ Error details shown
→ Fix locally
→ git add . && git commit -m "fix: ..."
→ git push (try again)
```

**If all tiers pass:**

```
✓ Push succeeds
→ Code uploaded to GitHub
→ GitHub Actions runs automatically (extra validation)
```

---

## Installation & Setup

### Required: Nothing Extra

All tiers are already implemented in `.husky/pre-push`

### Required: Install act for Tier 4

GitHub Actions simulation is **MANDATORY**. All developers must have `act` installed.

**Windows:**

```bash
choco install act
```

**macOS:**

```bash
brew install act
```

**Linux:**
Download from: https://github.com/nektos/act/releases

**Verification:**

```bash
act --version
# Should output version number
```

**Without act:**

- Push will **FAIL** at Tier 4
- Error message shows installation instructions
- Must install act before pushing
- No exceptions

---

## Typical Workflow Example

### Small Bug Fix

```bash
# 1. Make changes
vim api/src/middleware/auth.ts

# 2. Commit
git add .
git commit -m "fix(auth): handle edge case"
# → Tier 1 auto-runs (30 sec)

# 3. Push
git push
# → Tier 2 auto-runs (30 sec)
# → Tier 3 auto-runs (5-8 min)
# → Tier 4 auto-runs if act installed (5-15 min)
#
# Total time: 6-24 minutes (first push)
# Then GitHub Actions runs (10-15 min)

# Result: All validations passed ✓
```

### Medium Feature

```bash
# 1. Make changes
vim frontend-next/src/components/Button.tsx
vim frontend-next/src/components/Button.test.tsx

# 2. Commit
git add .
git commit -m "feat(ui): add Button component"
# → Tier 1 auto-runs (45 sec)

# 3. Push
git push
# → Tier 2 auto-runs (1 min)
# → Tier 3 auto-runs (6-8 min) - runs all frontend tests
# → Tier 4 auto-runs if act installed (10-15 min)
#
# Total time: 17-24 minutes
# Then GitHub Actions runs (automatic)

# Result: All validations passed ✓
```

### Complex Refactoring

```bash
# 1. Make changes across multiple workspaces
vim api/src/core/posts/controller.ts
vim api/src/services/posts.ts
vim frontend-next/src/app/posts/page.tsx

# 2. Commit
git add .
git commit -m "refactor: consolidate posts logic"
# → Tier 1 auto-runs (45 sec)

# 3. Push
git push
# → Tier 2 auto-runs (1-2 min) - checks all workspaces
# → Tier 3 auto-runs (7-8 min) - runs ALL tests
#   - Type check all workspaces
#   - Lint all workspaces
#   - All unit tests
#   - All coverage
# → Tier 4 auto-runs if act installed (12-15 min)
#
# Total time: 20-26 minutes
# Then GitHub Actions runs (automatic)

# Result: All validations passed ✓
```

---

## What Each Tier Validates

### Tier 1: Pre-Commit (Automatic)

- ✅ Prettier formatting
- ✅ ESLint issues
- ✅ Binary file additions
- ❌ Type errors
- ❌ Test failures
- ❌ Coverage
- ❌ Contracts

### Tier 2: Pre-Push (Automatic)

- ✅ TypeScript types (changed workspaces)
- ✅ ESLint config changes
- ❌ Unit tests
- ❌ Coverage
- ❌ E2E tests

### Tier 3: Full Local CI (Automatic - MANDATORY)

- ✅ TypeScript types (ALL workspaces)
- ✅ Linting (ALL workspaces)
- ✅ API tests + coverage
- ✅ Frontend-next tests + coverage
- ✅ Monorepo tests (quote, todo, expense, stopwatch)
- ✅ Contract validation
- ✅ Build validation
- ❌ E2E tests (optional)
- ❌ GitHub-specific features

### Tier 4: GitHub Actions Simulation (Automatic - MANDATORY if act installed)

- ✅ Everything Tier 3 validates
- ✅ E2E tests (if configured)
- ✅ Exact GitHub Actions environment
- ✅ Workflow ordering
- ✅ Cache behavior
- ✅ Artifact generation

### GitHub CI (Always)

- ✅ Full end-to-end validation
- ✅ Deployment validations
- ✅ Final safety net

---

## Expected Duration

| Step                    | Duration            | Cumulative        |
| ----------------------- | ------------------- | ----------------- |
| Tier 1 (Commit)         | 10-45 sec           | 10-45 sec         |
| Tier 2 (Pre-Push)       | 30 sec - 2 min      | 40 sec - 2:45 min |
| Tier 3 (Full Local CI)  | 3-8 min             | 3:40 - 10:45 min  |
| Tier 4 (Act Simulation) | 5-15 min (optional) | 8:40 - 25:45 min  |
| **Total Local**         | **6-24 minutes**    | -                 |
| GitHub Actions          | 10-15 min           | 16-40 min         |

---

## Bypassing Validations (Not Recommended)

### Emergency: Force Push Without Checks

```bash
git push --no-verify
```

⚠️ **WARNING:** This bypasses ALL validations:

- Skips type checking
- Skips linting
- Skips all tests
- Skips act simulation
- Likely to fail in GitHub Actions

**Only use for:** Reverting broken code in emergencies

### After Force Push

```bash
# Fix the issues
git add .
git commit -m "fix: ..."

# Push normally (all checks run)
git push
```

---

## Troubleshooting

### Push blocked: Type errors

```bash
# Fix type errors
pnpm -r typecheck
# See which workspace has errors
# cd <workspace> && fix errors

git add .
git commit -m "fix: resolve type errors"
git push
```

### Push blocked: Lint issues

```bash
# Auto-fix lint issues
pnpm -r lint --fix

git add .
git commit -m "fix: resolve lint issues"
git push
```

### Push blocked: Test failures

```bash
# Run tests locally to debug
cd api && pnpm test:ci && cd ..
cd frontend-next && pnpm test:ci && cd ..

# Fix failing tests
# ... (implement fixes)

git add .
git commit -m "fix: resolve test failures"
git push
```

### Push blocked: Act simulation failed

```bash
# If you don't have act installed, skip this tier
# (just notify the warning)

# If you have act and it's blocking:
# Check Docker is running
docker ps

# Try again
git push
```

### Pre-push taking too long

```bash
# Normal timing:
# - Tier 1: 10-45 sec
# - Tier 2: 30 sec - 2 min
# - Tier 3: 3-8 min
# - Tier 4: 5-15 min
# Total: 6-25 min

# If it's taking longer:
# 1. Check if tests are running correctly
# 2. Monitor for hanging processes
# 3. Check disk space (node_modules, caches)
```

---

## Configuration Files

### `.husky/pre-push` (Main validation script)

```bash
# Runs:
# 1. Type checking (Tier 2)
# 2. Full local CI test suite (Tier 3)
# 3. GitHub Actions simulation if act available (Tier 4)
```

### `.actrc`

```bash
# Configuration for act (GitHub Actions simulator)
# Specifies Ubuntu image, Docker settings
```

### `scripts/test-locally.sh`

```bash
# The comprehensive test suite run in Tier 3
# Includes all test phases and coverage checks
```

### `package.json`

```json
{
  "scripts": {
    "test:local-ci": "bash scripts/test-locally.sh",
    "test:act": "act -W .github/workflows/quality-gate.yml --artifact-server-path=/tmp/act-artifacts"
  }
}
```

---

## For CI/CD Admins

### Modifying Validations

To change which tests run in pre-push:

Edit `.husky/pre-push` and modify:

1. Line 108: `bash scripts/test-locally.sh` (Tier 3)
2. Line 125: `act -W .github/workflows/...` (Tier 4)

### Disabling Specific Tiers (Not Recommended)

```bash
# To disable Tier 3 (NOT RECOMMENDED)
# Comment out line 108 in .husky/pre-push:
# if ! bash scripts/test-locally.sh; then

# To disable Tier 4 (NOT RECOMMENDED)
# Comment out line 122-133 in .husky/pre-push:
# if command -v act &> /dev/null; then
```

---

## Best Practices

✅ **DO:**

- Let all tiers run (don't bypass with `--no-verify`)
- Fix errors locally before pushing
- Install act for complete validation: `choco install act`
- Commit frequently (smaller changes fail faster)
- Read error messages carefully

❌ **DON'T:**

- Use `git push --no-verify` (defeats all protections)
- Skip failing tests (they indicate real problems)
- Push without local validation
- Ignore Tier 4 warnings

---

## Summary

### What Developers See When Pushing:

```
$ git push

╔════════════════════════════════════════════════════════════╗
║         Mandatory Pre-Push Validation (All Tiers)         ║
╚════════════════════════════════════════════════════════════╝

🧪 TIER 1+2: Running type checks and linting for changed workspaces...
✓ Type checking passed
✓ Linting passed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TIER 3: Running full comprehensive local CI...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Running 4 test phases...]
✓ Phase 1: Type checking
✓ Phase 2: Linting
✓ Phase 3: Unit tests
✓ Phase 4: Build validation

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 TIER 4: Simulating GitHub Actions locally...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ act tool found; running GitHub Actions simulation...
[Running GitHub workflows...]
✓ GitHub Actions simulation passed!

╔════════════════════════════════════════════════════════════╗
║  ✓ All mandatory pre-push validations passed!              ║
║  Proceeding with push to GitHub...                        ║
╚════════════════════════════════════════════════════════════╝

[Pushing to GitHub...]
To github.com:your-repo/repo.git
   a1b2c3d..e4f5g6h main -> main
```

---

## Files Modified

1. **`.husky/pre-push`** - Now includes Tier 3 and Tier 4 as mandatory
2. **`package.json`** - Scripts for manual fallback
3. **`scripts/test-locally.sh`** - Comprehensive test suite
4. **`.actrc`** - GitHub Actions simulator configuration

---

## Next Steps

1. ✅ Read this guide
2. ✅ Try committing changes: `git commit -m "..."`
3. ✅ Try pushing: `git push`
4. ⚠️ Wait for all tiers to run (6-25 minutes)
5. 🎉 Celebrate when all pass!

---

## Questions?

All tiers are **mandatory and automatic**. You cannot push without passing them.

If push is blocked:

1. Read the error message
2. Fix the issue locally
3. Commit again
4. Push again

The system ensures code quality before GitHub CI runs.

---

**Status:** ✅ COMPLETE
**All Tiers:** Mandatory & Automatic
**No Manual Steps:** Required
**Quality Gates:** All enforced before push

All code pushed to GitHub has already passed comprehensive local validation! 🚀
