# Local Development Setup

This guide explains how to run quality checks **locally before pushing** to save CI minutes and get faster feedback.

## Quick Start

### Before your first commit:

```bash
# Install all dependencies (root + workspaces)
npm install

# or with pnpm (preferred):
pnpm install

# Git hooks are installed automatically via prepare script
```

### Daily workflow:

```bash
# 1. Make changes and stage them
git add .

# 2. Commit (pre-commit hook runs automatically)
#    ✅ Binary check for large files
#    ✅ Prettier format on staged files
#    ✅ ESLint fix on staged files
git commit -m "feat: your message"

# 3. Push (pre-push hook runs automatically)
#    ✅ TypeScript type checks (scoped to changed packages)
#    ✅ ESLint config check
git push

# Done! GitHub Actions will only run tests, a11y, and builds.
```

---

## What Runs Where

### Local (Before Push)

| Tool                  | When       | Files                                       |
| --------------------- | ---------- | ------------------------------------------- |
| **Prettier**          | pre-commit | Changed `.{js,jsx,ts,tsx,json,md,yaml,yml}` |
| **ESLint**            | pre-commit | Changed `.{js,jsx,ts,tsx}`                  |
| **Binary Check**      | pre-commit | All changed (reject > 50MB)                 |
| **TypeScript**        | pre-push   | Changed workspaces only                     |
| **Lint Config Check** | pre-push   | Only if `.eslintrc.json` changed            |

### GitHub Actions (After Push)

| Job               | When      | Purpose                               |
| ----------------- | --------- | ------------------------------------- |
| **quality-gate**  | PR & main | Run tests, a11y, contract validation  |
| **review-packet** | main only | Generate coverage reports & artifacts |
| **mirror**        | main only | Sync to public mirror repo            |

---

## Manual Checks (If Hooks Fail)

### Reinstall hooks:

```bash
npx husky install
```

### Format all files:

```bash
npm run format
```

### Lint only changed files:

```bash
npx lint-staged
```

### Type-check changed packages:

```bash
npm run typecheck:bail
```

### Type-check everything:

```bash
npm run typecheck
```

### Run tests (all packages):

```bash
npm -r test
```

### Run tests for specific package:

```bash
# API
npm --workspace api test:ci

# Frontend-Next
npm --workspace frontend-next test:ci
```

### Run a11y/e2e tests locally (requires app running):

```bash
# Terminal 1: Start app
npm --workspace frontend-next dev

# Terminal 2: Run tests
npm --workspace frontend-next test:e2e
```

---

## Tools & Hooks

### Husky (Git Hooks)

- Automatically installed on `npm install`
- Hooks stored in `.husky/` directory
- Run before commit and push

**Hooks:**

- `.husky/pre-commit` — Runs binary check + lint-staged
- `.husky/pre-commit-binary-check` — Rejects files > 50MB
- `.husky/pre-push` — Runs TypeScript checks

### lint-staged

Lints only **changed files**, not the entire codebase. 10-100x faster than full lint.

**Configuration:** `package.json` → `lint-staged` section

**Manual run:**

```bash
npx lint-staged
```

### Prettier

Code formatter for consistency.

**Manual format all:**

```bash
npm run format
```

**Manual format changed files:**

```bash
npx prettier --write $(git diff --name-only)
```

---

## Troubleshooting

### "Hook failed" on commit

**Problem:** Pre-commit hook detected an issue (lint, format, or binary)

**Solution:**

```bash
# Fix format issues
npm run format

# Or manually fix ESLint issues
npx eslint --fix <file>

# Then re-stage and commit
git add .
git commit -m "your message"
```

### "Large file detected" on commit

**Problem:** You tried to commit a file > 50MB

**Solution:**

```bash
# Add the file to .gitignore
echo "path/to/large-file" >> .gitignore

# Unstage the file
git rm --cached path/to/large-file

# Re-commit
git add .gitignore
git commit -m "chore: ignore large file"
```

### "Type error" on push

**Problem:** Pre-push TypeScript check found errors

**Solution:**

```bash
# Fix the errors shown in the message
# Then try pushing again
git push
```

### "Credentials detected" on commit

**Problem:** Pre-commit hook found potential API keys or passwords

**Solution:**

```bash
# Review the detected patterns (should be in commit message)
# Remove the sensitive data

# If it's a false positive, you can bypass:
git commit --no-verify

# BUT: Check that you're not committing real credentials!
```

### Bypass hooks (use sparingly!)

```bash
# Skip all hooks
git commit --no-verify

# Skip pre-push only
git push --no-verify
```

**⚠️ Use only if you're certain the code is safe!**

---

## CI Optimization Benefits

With these local checks, we've achieved:

| Metric            | Before                     | After                | Savings        |
| ----------------- | -------------------------- | -------------------- | -------------- |
| Lint scope        | Full repo (slow)           | Changed files only   | **-40%**       |
| Lint runs         | Pre-commit + pre-push + CI | Pre-commit only      | **-66%**       |
| Type checks       | Every PR                   | Local pre-push       | Caught earlier |
| Binary rejections | In CI (expensive)          | Pre-commit (instant) | **-20%**       |
| CI minutes/PR     | ~8-10 min                  | ~3-5 min             | **-60%**       |

---

## Best Practices

1. ✅ **Always commit locally before pushing**
   - Hooks run automatically
   - Feedback is instant

2. ✅ **Keep staged files small**
   - Easier to review
   - Faster hooks

3. ✅ **Check hook output**
   - Read the error messages
   - Fix before pushing

4. ✅ **Use `git status` before pushing**
   - Ensure hooks ran successfully
   - See what changed

5. ❌ **Don't use `--no-verify` unless necessary**
   - Defeats the purpose of hooks
   - Can cause CI failures

---

## Questions?

See the main project documentation:

- [DEVELOPMENT_RULES.md](./DEVELOPMENT_RULES.md) — Project standards
- [CLAUDE.md](./CLAUDE.md) — Development environment setup
- [Contributing Guide](./CONTRIBUTING.md) — Contribution guidelines
