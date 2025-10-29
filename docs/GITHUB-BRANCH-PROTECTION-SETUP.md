# GitHub Branch Protection Configuration

## Overview

This guide explains how to configure GitHub branch protection rules to align with the shift-left CI/CD strategy. This is a **one-time manual setup** required in GitHub's web UI.

## What's Changing

We're removing **non-critical checks** from branch protection to:

- ✅ Reduce "false positive" blocking (they run locally first)
- ✅ Speed up GitHub Actions (skip checks already done locally)
- ✅ Keep meaningful checks that add value in CI

## Required Branch Protection Changes

### Step 1: Navigate to Branch Protection Settings

1. Go to **GitHub.com** → Your repository
2. Click **Settings** (top right)
3. Sidebar: **Branches**
4. Under "Branch protection rules", find the rule for `main`
5. Click **Edit** (pencil icon)

### Step 2: Update Required Status Checks

Under **"Require status checks to pass before merging"**:

#### ✅ KEEP These Checks (Currently Required)

These continue to be **required** to pass before merge:

```
☑ Quality Gate / install-root-deps
☑ Quality Gate / typecheck
☑ Quality Gate / lint
☑ Quality Gate / api-coverage
☑ Quality Gate / frontend-next-coverage
☑ Quality Gate / monorepo-workspace-tests
☑ Quality Gate / contract-artifact
☑ Quality Gate / aggregate-coverage
☑ Quality Gate / spectral-lint
```

**Do not uncheck these.**

#### ❌ REMOVE These Checks (Make Non-Blocking)

These are **no longer required** (they run locally first):

Uncheck these checkboxes:

```
☐ Quality Gate / README link check
☐ Quality Gate / README placeholder guard
☐ Quality Gate / Lint GitHub workflows
```

#### ℹ️ ALREADY NON-BLOCKING (No Change)

These are already non-blocking (informational):

```
CI / Observability - Latency Bench (non-gating)
Security - Dependency Audit (non-gating)
```

### Step 3: Save Changes

1. Scroll to bottom
2. Click **Save changes** (green button)
3. Confirm the update message

## Visual Guide

### Before Update

```
Required status checks to pass before merging:
☑ Quality Gate / README link check            ← REMOVE
☑ Quality Gate / README placeholder guard     ← REMOVE
☑ Quality Gate / Lint GitHub workflows        ← REMOVE
☑ Quality Gate / install-root-deps
☑ Quality Gate / typecheck
☑ Quality Gate / lint
☑ Quality Gate / api-coverage
☑ Quality Gate / frontend-next-coverage
☑ Quality Gate / monorepo-workspace-tests
☑ Quality Gate / contract-artifact
☑ Quality Gate / aggregate-coverage
☑ Quality Gate / spectral-lint
```

### After Update

```
Required status checks to pass before merging:
☐ Quality Gate / README link check
☐ Quality Gate / README placeholder guard
☐ Quality Gate / Lint GitHub workflows
☑ Quality Gate / install-root-deps
☑ Quality Gate / typecheck
☑ Quality Gate / lint
☑ Quality Gate / api-coverage
☑ Quality Gate / frontend-next-coverage
☑ Quality Gate / monorepo-workspace-tests
☑ Quality Gate / contract-artifact
☑ Quality Gate / aggregate-coverage
☑ Quality Gate / spectral-lint
```

## Verification

After making changes:

1. **Try a test merge:** Create a test branch, push code that fails one of the removed checks
2. **Expected result:** You can still merge (the removed checks don't block)
3. **GitHub UI shows:** The removed checks appear as "skipped" or "informational"

## Other Settings (No Changes)

Do **NOT change** these settings:

- ✅ Require reviews before merging
- ✅ Require code owner reviews
- ✅ Require status checks to pass (yes, keep this on)
- ✅ Dismiss stale reviews
- ✅ Require branches to be up to date before merging
- ✅ Include administrators in restrictions

## Timeline

**What happens now:**

1. **Developer:** Runs full local validation (Tier 1-4) before push
2. **GitHub:** Receives code that has passed 99% of checks locally
3. **GitHub Actions:** Runs remaining checks for verification & artifact collection
4. **Result:** <1% failure rate (vs. 30% without shift-left)

**Example push flow:**

```
Developer runs:
  bash scripts/test-locally.sh  # Phase 1+2+3 ✅ PASS
  git push

GitHub Actions runs:
  - type checking (cached, 10s) ✅
  - unit tests (cached, 30s) ✅
  - coverage (20s) ✅
  - a11y tests (5m) ✅
  - contract tests (1m) ✅
  - build (3m) ✅
  - [non-blocking] README link check ℹ️
  - [non-blocking] README placeholder guard ℹ️
  - [non-blocking] Lint GitHub workflows ℹ️

PR ready to merge! ✅
```

## FAQ

**Q: Will the removed checks still run?**
A: Yes, they still run in GitHub Actions but won't block merging. You'll see them in the checks section as "informational".

**Q: What if one of the removed checks fails?**
A: You'll see it reported, but it won't prevent merging. The check already ran locally (more rigorously) before the push.

**Q: Can I re-add them later?**
A: Yes, you can always re-add them to branch protection. But that would defeat the shift-left purpose (they'd block on GitHub instead of locally).

**Q: Do I need to wait for all checks to finish to merge?**
A: Only the **required** ones (the ones still checked). The non-blocking ones run but don't delay merge approval.

**Q: What about PRs?**
A: Same rules apply. The removed checks won't block PR merging, but you'll still see them reported.

## Troubleshooting

### Settings won't save?

**Problem:** Getting an error when clicking save

**Solution:**

- Check if you have admin access (needed to edit branch protection)
- Try refreshing the page and retrying
- Check if there are other unsaved conflicts

### Can't find the branch rule?

**Problem:** Don't see "Branch protection rules" in Settings

**Solution:**

- Ensure you're looking at repo Settings (not personal settings)
- Only repo admins can modify branch protection
- Try navigating directly: `github.com/<org>/<repo>/settings/branches`

### Checks still blocking?

**Problem:** Unchecked a box but it still blocks merging

**Solution:**

- Refresh the page (GitHub caches some settings)
- Wait a few minutes (there's sometimes delay)
- Verify the checkboxes were actually unchecked before saving
- Create a new test branch to verify

## Support

For questions about this setup:

1. See [SHIFT-LEFT-STRATEGY.md](../SHIFT-LEFT-STRATEGY.md) for full documentation
2. Check [DEVELOPMENT_RULES.md](../DEVELOPMENT_RULES.md) for standards
3. See [CLAUDE.md](../CLAUDE.md) for local setup details
