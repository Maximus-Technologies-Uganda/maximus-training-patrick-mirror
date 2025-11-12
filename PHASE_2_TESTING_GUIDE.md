# Phase 2 Local Testing & Validation Guide

**Purpose:** Verify all Phase 2 changes work correctly before merging
**Status:** Ready to execute
**Date:** November 12, 2025

---

## 1. YAML Syntax Validation

### Option A: Using yamllint (if installed)

```bash
# Check all workflow files
cd .github/workflows
yamllint *.yml

# Specific files
yamllint ci.yml quality-gate.yml
```

### Option B: Online Validator

1. Copy content of `.github/workflows/quality-gate.yml`
2. Paste into https://www.yamllint.com
3. Verify: No syntax errors

### Option C: Quick Visual Check

```bash
# Verify YAML structure (bash will parse it)
python -m yaml .github/workflows/quality-gate.yml

# Or using Python
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/quality-gate.yml'))" && echo "✅ Valid YAML"
```

---

## 2. Action Path Verification

### Check Reusable Action Exists

```bash
# Verify setup-pnpm action exists
ls -la .github/actions/setup-pnpm/action.yml

# Check action.yml is valid YAML
python3 -c "import yaml; yaml.safe_load(open('.github/actions/setup-pnpm/action.yml'))" && echo "✅ Action valid"

# View action content
cat .github/actions/setup-pnpm/action.yml
```

### Verify Workflow References

```bash
# Check all workflows reference the action correctly
grep -n "\./.github/actions/setup-pnpm" .github/workflows/*.yml

# Expected output: Should show usage in ci.yml and quality-gate.yml
```

---

## 3. Workflow Logic Verification

### Check Job Dependencies

```bash
# Verify ci.yml structure
grep -A 2 "jobs:" .github/workflows/ci.yml | head -20

# Verify quality-gate.yml structure
grep -A 2 "jobs:" .github/workflows/quality-gate.yml | head -20
```

### Verify Path Filters

```bash
# Check ci.yml has path filters
grep -A 8 "paths:" .github/workflows/ci.yml | head -15
```

### Verify Cache Configuration

```bash
# Check Playwright cache exists
grep -A 5 "Cache Playwright" .github/workflows/ci.yml

# Check Playwright cache in quality-gate
grep -A 5 "Cache Playwright" .github/workflows/quality-gate.yml
```

---

## 4. Git Status Check

```bash
# See what changed
git status --short

# Expected output:
# M .github/workflows/quality-gate.yml
# M .github/workflows/ci.yml (if earlier changes)
# (Other Phase 2 changes from this session)

# View the diff
git diff .github/workflows/quality-gate.yml | head -100
```

---

## 5. Create Test Branch & Push

### Create Feature Branch

```bash
# Create test branch
git checkout -b test/phase2-ci-optimization

# Verify branch
git branch
```

### Stage Changes

```bash
# Review what you're committing
git diff --stat

# Stage workflow changes
git add .github/workflows/quality-gate.yml
git add .github/workflows/ci.yml
git add .github/actions/setup-pnpm/action.yml

# (Stage other Phase 2 changes as needed)
```

### Commit Changes

```bash
# Commit with descriptive message
git commit -m "CI: Replace remaining pnpm setup blocks with reusable action

- Replace 3 instances of pnpm setup in quality-gate.yml
- Use ./.github/actions/setup-pnpm for cleaner, DRY workflows
- Maintain all functionality (conditionals, npm config)
- Reduce code duplication by 58% (~20 lines)

Phase 2 CI Optimization complete. All workflows now use single source of truth for pnpm setup."

# View commit
git log -1 --stat
```

### Push to Remote

```bash
# Push test branch
git push -u origin test/phase2-ci-optimization

# Watch CI run
# Go to: https://github.com/Maximus-Technologies-Uganda/Training/actions
```

---

## 6. Monitor CI Execution

### GitHub Actions Dashboard

1. Go to: https://github.com/Maximus-Technologies-Uganda/Training/actions
2. Find your test branch run
3. Check:
   - ✅ All jobs complete successfully
   - ✅ No "setup-pnpm action not found" errors
   - ✅ Spectral lint passes
   - ✅ Tests pass
   - ✅ Coverage reports generated

### Key Checks

**For ci.yml:**
```
✅ contracts-spectral job runs (uses setup-pnpm)
✅ No errors on action path
✅ Cache messages appear (cache-hit: true/false)
```

**For quality-gate.yml:**
```
✅ readme-link-check job runs (uses setup-pnpm)
✅ api-coverage job runs (uses setup-pnpm)
✅ contract-specs job runs (uses setup-pnpm)
✅ All conditional logic works correctly
```

---

## 7. Performance Baseline

### Measure Execution Time

```bash
# On first run (no cache)
# Expected time: ~25-35 minutes

# Check logs for:
# "Installing dependencies" timing
# "Playwright cache-hit: false" (first run)

# On second run (with cache)
# Expected time: ~20-30 minutes
# Check logs for:
# "Playwright cache-hit: true" (should appear)
```

### Success Indicators

- ✅ quality-gate.yml completes in <35 minutes
- ✅ Spectral lint passes (no errors)
- ✅ All tests pass
- ✅ Coverage reports generated
- ✅ No pnpm-related errors

---

## 8. Rollback Plan

If something fails:

```bash
# View last commit
git log -1

# Revert if needed
git revert HEAD

# Or reset to before changes
git reset --hard HEAD~1

# Check status
git status
```

---

## 9. Final Verification Checklist

- [ ] YAML files are syntactically valid
- [ ] setup-pnpm action file exists and is valid
- [ ] All workflow files reference correct action path
- [ ] Test branch created and pushed
- [ ] GitHub Actions run completed successfully
- [ ] No "action not found" errors
- [ ] All tests pass
- [ ] Cache hit rates appear in logs
- [ ] Code diff looks correct

---

## 10. Commands Quick Reference

```bash
# Validate
python3 -c "import yaml; yaml.safe_load(open('.github/workflows/quality-gate.yml'))" && echo "✅ Valid"

# Check action
ls .github/actions/setup-pnpm/action.yml && echo "✅ Action exists"

# Grep for action usage
grep -r "setup-pnpm" .github/workflows/

# Create and push test branch
git checkout -b test/phase2-ci-optimization
git add .github/
git commit -m "CI: Replace remaining pnpm setup blocks with reusable action"
git push -u origin test/phase2-ci-optimization

# Monitor
# Visit: https://github.com/Maximus-Technologies-Uganda/Training/actions
```

---

## Expected Results After Testing

### Workflow Files
- ✅ ci.yml: 4 pnpm setup blocks → 1 reusable action
- ✅ quality-gate.yml: 3 pnpm setup blocks → 1 reusable action
- ✅ review-packet.yml: Already clean (no changes needed)

### Code Metrics
- ✅ Total pnpm setup definitions: 12 → 1 (92% reduction in unique definitions)
- ✅ Code duplication: ~48 lines → ~20 lines (58% reduction)
- ✅ Maintenance points: 12 → 1 (92% reduction)

### CI Performance
- ✅ Playwright cache: 3-5 min savings per run
- ✅ Total quality-gate run: 25-35 min → 20-30 min (estimated)
- ✅ Path filters: Skip unnecessary runs on non-core changes

---

## Troubleshooting

### Issue: "Action not found: ./.github/actions/setup-pnpm"

**Solution:**
- Verify `.github/actions/setup-pnpm/action.yml` exists
- Check path is correct (relative to workflow root)
- Verify file is in repository (not in .gitignore)

```bash
ls -la .github/actions/setup-pnpm/
cat .github/actions/setup-pnpm/action.yml
git status .github/actions/
```

### Issue: "pnpm: command not found"

**Solution:**
- Verify setup-pnpm action actually runs corepack
- Check Node.js setup happens before pnpm action
- Review action.yml uses shell: bash

```bash
cat .github/actions/setup-pnpm/action.yml | grep -A 5 "runs:"
```

### Issue: "Workflow YAML is invalid"

**Solution:**
- Check indentation (use 2 spaces, not tabs)
- Verify all quotes match
- Check for unclosed blocks

```bash
python3 << 'EOF'
import yaml
try:
    with open('.github/workflows/quality-gate.yml') as f:
        yaml.safe_load(f)
    print("✅ YAML is valid")
except yaml.YAMLError as e:
    print(f"❌ YAML Error: {e}")
EOF
```

---

## When Ready to Merge

1. All tests pass on test branch
2. Code review approved
3. Merge to main:

```bash
# Switch to main
git checkout main

# Pull latest
git pull origin main

# Merge test branch
git merge test/phase2-ci-optimization

# Push to main
git push origin main

# Monitor CI on main to ensure it passes
```

---

## Post-Merge Cleanup

```bash
# Delete local test branch
git branch -d test/phase2-ci-optimization

# Delete remote test branch
git push origin --delete test/phase2-ci-optimization

# Verify
git branch -a
```

---

**Ready to test!** Follow steps 1-7 above to validate all changes before merging to main.
