# Workflow Optimization - Quick Start (Week 1)

**Goal:** Implement 5 quick wins for 5-8 minute savings per PR
**Time Required:** 3-4 hours
**Expected Savings:** 5-8 minutes per run + cleaner code

---

## Task Checklist

### ✅ Task 1: Add Playwright Cache (15 minutes)

**File:** `.github/workflows/ci.yml`

**Location:** Find `frontend-a11y` job, around line 137

**Before:**

```yaml
- name: Install Playwright browsers
  run: pnpm dlx playwright install --with-deps
```

**After:**

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: ${{ runner.os }}-playwright-${{ hashFiles('**/pnpm-lock.yaml') }}
    restore-keys: |
      ${{ runner.os }}-playwright-

- name: Install Playwright browsers
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: pnpm dlx playwright install --with-deps
```

**Also apply to:** `quality-gate.yml` → `frontend-next-a11y` job (around line 135)

**Verification:**

```bash
# After merging, check workflow run logs
# Look for: "Cache hit: true" or "Cache miss"
# Target: 80%+ hit rate over 10 runs
```

---

### ✅ Task 2: Add Path Filters to ci.yml (5 minutes)

**File:** `.github/workflows/ci.yml`

**Location:** Top of file, lines 1-15

**Before:**

```yaml
on:
  pull_request:
    # No paths filter - runs on all changes
  push:
    branches:
      - main
```

**After:**

```yaml
on:
  pull_request:
    paths:
      - 'frontend/**'
      - 'frontend-next/**'
      - 'api/**'
      - '.github/workflows/ci.yml'
  push:
    branches:
      - main
```

**Verification:**

```bash
# Create test PR that only touches quote/todo
# ci.yml should NOT trigger
# quality-gate.yml should NOT trigger (if paths also restricted there)
```

---

### ✅ Task 3: Extract Zero-Coverage Script (20 minutes)

**Create File:** `scripts/check-coverage-nonzero.sh`

```bash
#!/bin/bash
set -euo pipefail

# Fail if any workspace has zero coverage
# Usage: bash scripts/check-coverage-nonzero.sh api frontend-next expense quote todo

has_error=0

for workspace in "$@"; do
  summary="${workspace}/coverage/coverage-summary.json"

  if [ ! -f "$summary" ]; then
    echo "⚠️  SKIP: ${workspace} (no coverage file found)"
    continue
  fi

  # Extract coverage percentages
  statements=$(jq '.total.statements.pct // 0' "$summary" 2>/dev/null || echo "0")
  lines=$(jq '.total.lines.pct // 0' "$summary" 2>/dev/null || echo "0")

  # Check if zero
  if (( $(echo "$statements <= 0" | bc -l) )) || (( $(echo "$lines <= 0" | bc -l) )); then
    echo "❌ FAIL: ${workspace} has zero coverage!"
    echo "   statements=${statements}% | lines=${lines}%"
    has_error=1
  else
    echo "✅ PASS: ${workspace} (statements=${statements}% | lines=${lines}%)"
  fi
done

if [ $has_error -eq 0 ]; then
  echo ""
  echo "🎉 All workspaces have non-zero coverage!"
else
  echo ""
  echo "❌ Fix zero-coverage failures above"
fi

exit $has_error
```

**Make executable:**

```bash
chmod +x scripts/check-coverage-nonzero.sh
```

**File:** `.github/workflows/quality-gate.yml`

**Location:** Find the api-coverage job's zero-coverage check (around lines 349-469)

**Before (LONG):**

```yaml
- name: Fail if api coverage is zero
  if: always()
  shell: bash
  run: |
    node - <<'NODE'
    const fs = require('fs');
    const path = require('path');
    const summaryPath = path.join(process.cwd(), 'api/coverage/coverage-summary.json');
    // ... 30+ lines of duplicate code ...
    NODE
```

**After (SHORT):**

```yaml
- name: Check zero coverage (api, frontend-next)
  if: always()
  shell: bash
  run: bash scripts/check-coverage-nonzero.sh api frontend-next
```

**Location to Replace:** In aggregate-coverage job (consolidate all workspace checks into one)

**Verification:**

```bash
# Run locally
bash scripts/check-coverage-nonzero.sh api frontend-next

# In CI: grep logs for "All workspaces have non-zero coverage"
```

---

### ✅ Task 4: Create pnpm Setup Composite Action (15 minutes)

**Create Directory & File:** `.github/actions/setup-pnpm/action.yml`

```yaml
name: Setup pnpm
description: Enable Corepack and configure pnpm 9.x
author: Your Team

runs:
  using: composite
  steps:
    - name: Enable Corepack (pnpm 9)
      shell: bash
      run: |
        set -euo pipefail
        corepack enable
        corepack prepare pnpm@9.x --activate
        pnpm --version
```

**Verification:**

```bash
# Ensure directory structure
ls -la .github/actions/setup-pnpm/
# Should contain: action.yml
```

---

### ✅ Task 5: Update 12 Workflow Instances (30 minutes)

**Find all pnpm setup patterns and replace with composite action.**

**Files to Update:**

1. `.github/workflows/quality-gate.yml`
2. `.github/workflows/ci.yml`
3. `.github/workflows/review-packet.yml`
4. `.github/workflows/deploy-cloud-run.yml` (if applicable)

**Pattern to Find:**

```yaml
- name: Enable Corepack (pnpm 9)
  run: |
    corepack enable
    corepack prepare pnpm@9.x --activate
```

**Replace With:**

```yaml
- uses: ./.github/actions/setup-pnpm
```

**Locations in quality-gate.yml:**

- Line ~73-76 (install-root-deps job)
- Line ~104-107 (frontend-next-a11y job)
- Line ~161-164 (frontend-next-coverage job)
- Line ~268-271 (api-coverage job - if using pnpm)

**Locations in ci.yml:**

- Line ~90 (check-contracts job)

**Locations in review-packet.yml:**

- Line ~70+ (multiple jobs)

**Verification:**

```bash
# Ensure no more "Enable Corepack" text in workflow files
grep -r "Enable Corepack" .github/workflows/

# Should return only the action.yml definition, not usages
```

---

## Testing Checklist

After making changes:

### 1. Syntax Validation

```bash
# Check workflow syntax (requires gh CLI)
gh workflow list

# Or manually verify YAML is valid
npm install -g yaml-lint
yamllint .github/workflows/
```

### 2. Dry Run

```bash
# Create a test branch
git checkout -b test/optimization

# Make a small dummy change
echo "// test" >> api/src/test.ts

# Commit & push (observe CI jobs triggered)
git add .
git commit -m "test: verify optimization changes"
git push -u origin test/optimization

# Monitor GitHub Actions UI
# Verify:
# - ci.yml SKIPS for this PR (path filters working)
# - quality-gate.yml RUNS (paths changed)
# - Playwright cache shows "cache-hit: true/false"
# - pnpm setup shows "pnpm --version" output
```

### 3. Verification Metrics

Monitor the CI run and verify:

- [ ] Playwright cache added (check logs for "Cache Playwright")
- [ ] Path filters working (ci.yml skipped when only quote/todo changed)
- [ ] Zero-coverage script working (grep logs for "PASS: api")
- [ ] pnpm action working (check logs for "pnpm --version")

### 4. Rollback Plan

If something breaks:

```bash
# Revert all changes
git revert HEAD

# Or manually revert specific file
git checkout HEAD~1 .github/workflows/quality-gate.yml

# Push and merge
git push
```

---

## Performance Baseline

### Before (Current - 2025-10-29)

```
ci.yml avg duration:           20 min
quality-gate.yml avg:          30 min
playwright install time:        4-6 min
pnpm install time:             3-5 min × 5 jobs = 15-25 min total
Monthly CI minutes:            ~700 min
```

### Expected After Week 1

```
ci.yml avg duration:           20 min (unchanged - PR path filter helps only if non-main)
quality-gate.yml avg:          25-28 min (-2-5 min from Playwright cache)
playwright install time:        1-2 min (cache hit)
pnpm setup cleaner:            No behavior change, but 30+ LOC cleaner
Monthly CI minutes:            ~650 min (-50 min, 7% reduction)
```

### Measurement Script

```bash
# Track CI times over 2 weeks
gh run list --repo owner/repo \
  --workflow quality-gate.yml \
  --limit 20 \
  --json "durationMinutes,createdAt" \
  --jq '.[] | "\(.createdAt): \(.durationMinutes)m"'

# Calculate average
# Average before: ____ min
# Average after: ____ min
# Savings: ____ min (____%)
```

---

## Commit & PR Guidance

### Commit 1: Add Playwright Cache

```
git checkout -b feat/playwright-cache
# Make changes to ci.yml and quality-gate.yml
git add .github/workflows/{ci,quality-gate}.yml
git commit -m "perf(workflows): cache Playwright browsers (saves 3-5m per run)"
git push
```

### Commit 2: Add Path Filters

```
git checkout -b feat/path-filters
# Modify ci.yml
git add .github/workflows/ci.yml
git commit -m "perf(ci): add path filters to skip non-core workspace changes"
git push
```

### Commit 3: Extract Coverage Script

```
git checkout -b feat/coverage-script
# Create scripts/check-coverage-nonzero.sh
# Modify quality-gate.yml
git add scripts/check-coverage-nonzero.sh .github/workflows/quality-gate.yml
git commit -m "refactor(scripts): extract zero-coverage check to reusable script"
git push
```

### Commit 4: Add pnpm Action

```
git checkout -b feat/pnpm-action
# Create .github/actions/setup-pnpm/action.yml
git add .github/actions/setup-pnpm/
git commit -m "refactor(actions): create reusable pnpm setup action"
git push
```

### Commit 5: Use pnpm Action

```
git checkout -b feat/use-pnpm-action
# Modify all workflow files
git add .github/workflows/
git commit -m "refactor(workflows): use composite action for pnpm setup (saves 30+ LOC)"
git push
```

---

## Success Criteria

✅ **Week 1 Complete When:**

- [ ] All 5 tasks implemented
- [ ] No workflow syntax errors
- [ ] Test PR created and verified
- [ ] Playwright cache working (cache-hit shows true/false)
- [ ] Path filters preventing unnecessary runs
- [ ] Coverage script running successfully
- [ ] pnpm action in use in 4+ workflows
- [ ] Code review approval ✓
- [ ] Merged to main ✓

---

## Estimated Time Breakdown

| Task                        | Estimated         | Actual | Notes |
| --------------------------- | ----------------- | ------ | ----- |
| Task 1 (Playwright cache)   | 15m               | \_\_   | -     |
| Task 2 (Path filters)       | 5m                | \_\_   | -     |
| Task 3 (Coverage script)    | 20m               | \_\_   | -     |
| Task 4 (pnpm action)        | 15m               | \_\_   | -     |
| Task 5 (Apply to workflows) | 30m               | \_\_   | -     |
| Testing & verification      | 30m               | \_\_   | -     |
| Code review & merge         | 20m               | \_\_   | -     |
| **Total**                   | **2.5-3.5 hours** | \_\_   | -     |

---

## Troubleshooting

### Issue: "actions/cache@v4 not found"

**Solution:** Ensure using correct syntax:

```yaml
uses: actions/cache@v4 # ✓ Correct
# NOT: use: actions/cache@v4
```

### Issue: "Composite action not found"

**Solution:** Ensure file path is correct:

```yaml
uses: ./.github/actions/setup-pnpm # ✓ Correct
# NOT: uses: .github/actions/setup-pnpm (missing /)
```

### Issue: "Script not found"

**Solution:** Make script executable and check path:

```bash
chmod +x scripts/check-coverage-nonzero.sh
# Verify path in workflow:
run: bash scripts/check-coverage-nonzero.sh api frontend-next
```

### Issue: "Path filters skip necessary jobs"

**Solution:** Review path patterns:

```yaml
# Make sure to include:
- 'frontend/**'
- 'frontend-next/**'
- 'api/**'
- '.github/workflows/ci.yml' # Include workflow file itself!
```

---

## Next Steps (Week 2)

Once Week 1 is complete and verified:

1. **Implement medium improvements** from [WORKFLOW_OPTIMIZATION_ROADMAP.md](./WORKFLOW_OPTIMIZATION_ROADMAP.md)
2. **Monitor CI metrics** over 1-2 weeks
3. **Adjust cache keys** based on hit rates
4. **Plan long-term** consolidation in Month 2

---

## Quick Reference Commands

```bash
# View workflow syntax documentation
# https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions

# Test workflow locally (requires act: https://github.com/nektos/act)
act -l  # List jobs
act push  # Simulate push event

# Monitor CI runs
gh run list --repo owner/repo --limit 10

# View specific workflow run
gh run view <run-id> --log
```

---

**Ready to start? Begin with Task 1!**
