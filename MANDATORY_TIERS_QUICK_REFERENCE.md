# All Tiers Mandatory - Quick Reference

## The Simple Truth

```
git commit → Auto-runs Tier 1 (formatting/linting)
git push   → Auto-runs Tier 2 (types)
           → Auto-runs Tier 3 (ALL TESTS) ← MANDATORY
           → Auto-runs Tier 4 (GitHub sim) ← MANDATORY

Cannot push until all pass ✓
```

---

## Typical Push Flow

```
$ git push

[10-45 sec] ⏳ Tier 1: Pre-Commit checks
[30-120 sec] ⏳ Tier 2: Type checking
[3-8 min] ⏳ Tier 3: Full test suite (MANDATORY)
[5-15 min] ⏳ Tier 4: GitHub simulation (MANDATORY)

Total: 6-24 minutes

✓ ALL PASS → Code pushed to GitHub
✗ ANY FAIL → Push blocked, fix & retry
```

---

## What Gets Checked

### Tier 1 (Auto-Commit)

```
✓ Code formatting (Prettier)
✓ Linting rules (ESLint)
✓ Binary files (never added)
```

### Tier 2 (Auto-Push)

```
✓ TypeScript types
✓ ESLint config
```

### Tier 3 (Auto-Push - MANDATORY)

```
✓ All TypeScript types
✓ All linting
✓ All unit tests + coverage
✓ All monorepo tests
✓ Contract validation
✓ Build validation
```

### Tier 4 (Auto-Push - MANDATORY if act installed)

```
✓ GitHub Actions simulation
✓ E2E tests
✓ Exact GitHub environment
```

---

## If Push Fails

```
Push blocked? Error shown above ↑

1. Read the error message
2. Fix locally:
   - Type errors: Run pnpm -r typecheck
   - Lint issues: Run pnpm -r lint --fix
   - Test failures: Run cd <workspace> && pnpm test:ci
3. Commit fix: git add . && git commit -m "fix: ..."
4. Push again: git push

Try again! 🔄
```

---

## Installation Setup

### What's Already Done ✓

- Pre-commit hook
- Pre-push hook
- Test scripts
- Configuration files

### REQUIRED: Install act for Tier 4

GitHub Actions simulation is **MANDATORY** for all developers:

```bash
# Install act (required):
choco install act    # Windows
brew install act     # macOS

# Verify:
act --version
```

Without act:

- Push will **FAIL** at Tier 4
- Error message shown with install instructions
- Must install before pushing
- No exceptions

---

## Common Commands

```bash
# Commit (Tier 1 auto-runs)
git add .
git commit -m "feat: description"

# Push (Tiers 2, 3, 4 auto-run)
git push

# If type errors:
pnpm -r typecheck

# If lint issues:
pnpm -r lint --fix

# If test failures:
cd api && pnpm test:ci && cd ..

# Manual test run (same as Tier 3):
pnpm test:local-ci
```

---

## Expected Times

| Action            | Time           |
| ----------------- | -------------- |
| Tier 1 (Commit)   | 10-45 sec      |
| Tier 2 (Pre-Push) | 30 sec - 2 min |
| Tier 3 (Tests)    | 3-8 min        |
| Tier 4 (Act)      | 5-15 min       |
| **Total**         | **6-25 min**   |

---

## Pro Tips

✅ Make small commits (failures are faster to debug)
✅ Read error messages (they tell you exactly what to fix)
✅ Install act (complete validation before GitHub)
✅ Be patient (comprehensive testing takes time)

❌ Don't use --no-verify (defeats all protections)
❌ Don't ignore errors (they indicate real problems)
❌ Don't force push (same - defeats protections)

---

## Status

✅ Tier 1: Automatic
✅ Tier 2: Automatic
✅ Tier 3: **Automatic & Mandatory**
✅ Tier 4: **Automatic & Mandatory** (if act installed)

**Result:** All code pushed to GitHub has been fully validated locally! 🚀

---

For full details, see: `ALL_TIERS_MANDATORY_GUIDE.md`
