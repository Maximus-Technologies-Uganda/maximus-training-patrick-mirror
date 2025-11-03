# GitHub Projects Automation Guide

Complete setup guide for automating GitHub Projects with full status tracking, auto-labeling, and scope management.

---

## Overview

This automation system provides:

- ✅ **Auto-add PRs & Issues** to GitHub Projects (all items, or filtered by labels/scope)
- ✅ **Status Automation** (Backlog → In Progress → Ready for Merge → Done)
- ✅ **Auto-labeling** (type, priority, scope)
- ✅ **Milestone Assignment** (auto-assign to current sprint)
- ✅ **Out-of-Scope Tracking** (separate project for non-core work)
- ✅ **Spec Project** (dedicated tracking for [SPEC] PRs)

---

## Prerequisites

1. GitHub Organization (admin access)
2. GitHub Projects enabled
3. GitHub Actions secrets configured:
   - `GITHUB_TOKEN` (auto-generated, no setup needed)

---

## Step 1: Create GitHub Projects

### Project 1: Main Work (All PRs & Issues)

**URL**: `https://github.com/orgs/Maximus-Technologies-Uganda/projects/1`

**Steps**:

1. Go to [Organization Projects](https://github.com/orgs/Maximus-Technologies-Uganda/projects)
2. Click **New project**
3. Name: `Main Work`
4. Description: `All PRs and issues tracked by priority and status`
5. Visibility: `Private`
6. Choose template: **Table** (for status column)
7. Click **Create project**

**Custom Fields**:

| Field    | Type   | Options                                                       |
| -------- | ------ | ------------------------------------------------------------- |
| Status   | Select | `Backlog`, `In Progress`, `Ready for Merge`, `Done`, `Closed` |
| Priority | Select | `Critical`, `High`, `Medium`, `Low`                           |
| Type     | Select | `Feature`, `Bug`, `Docs`, `Chore`, `Refactor`, `Test`, `Spec` |
| Sprint   | Text   | (auto-populated from milestone)                               |

**Save project number** from URL (should be **1**)

---

### Project 2: Spec Tracking (Featured)

**URL**: `https://github.com/orgs/Maximus-Technologies-Uganda/projects/2`

**Steps**:

1. Create new project
2. Name: `📋 Spec & Planning`
3. Description: `[SPEC] PRs, planning documents, and week deliverables`
4. Template: **Table**
5. Add same custom fields as Project 1

**Purpose**: Track all specification work separately for visibility

**Save project number** from URL (should be **2**)

---

### Project 3: Backlog (Out-of-Scope)

**URL**: `https://github.com/orgs/Maximus-Technologies-Uganda/projects/3`

**Steps**:

1. Create new project
2. Name: `📦 Future Work (Out-of-Scope)`
3. Description: `Issues and features that don't fit current sprint`
4. Template: **Table**
5. Add custom fields

**Purpose**: Collect future ideas and out-of-scope work for later sprint planning

**Save project number** from URL (should be **3**)

---

## Step 2: Update Workflow with Project Numbers

Edit `.github/workflows/github-projects-automation.yml`:

**Find these lines and replace with YOUR project numbers**:

```yaml
# Main project (all PRs/issues)
project-url: https://github.com/orgs/Maximus-Technologies-Uganda/projects/1

# Spec project (featured)
project-url: https://github.com/orgs/Maximus-Technologies-Uganda/projects/2

# Backlog project (out-of-scope)
project-url: https://github.com/orgs/Maximus-Technologies-Uganda/projects/3
```

To find your project numbers:

- Open each project in browser
- URL will be: `https://github.com/orgs/YOUR-ORG/projects/NUMBER`
- Extract the NUMBER

---

## Step 3: Configure Project Automation Rules

For each project, set up **built-in automation rules** in GitHub Projects:

### Project 1: Main Work

**Rule 1: Auto-set status when PR opened**

1. Open project **Main Work**
2. Click **Workflows** (left sidebar)
3. Click **Add automation**
4. **When**: Pull request status is changed to "open"
5. **Then**: Set status to "In Progress"
6. Save

**Rule 2: Auto-set status when PR merged**

1. Click **Add automation**
2. **When**: Pull request is merged
3. **Then**: Set status to "Done"
4. Save

**Rule 3: Auto-set status when issue closed**

1. Click **Add automation**
2. **When**: Issue is closed
3. **Then**: Set status to "Done"
4. Save

**Rule 4: Auto-prioritize by label**

1. Click **Add automation**
2. **When**: Item is added with label "priority:critical"
3. **Then**: Set Priority to "Critical"
4. Save

(Repeat for each priority level)

---

### Project 2: Spec Tracking

**Rule 1: Auto-add [SPEC] PRs**

1. Open project **Spec Tracking**
2. Click **Workflows**
3. Click **Auto-add to project**
4. **Filters**:
   - `is:pr` (only PRs)
   - `title:"[SPEC]"` (title contains [SPEC])
5. Save

**Rule 2: Set type to "Spec"**

1. Click **Add automation**
2. **When**: Item is added with label "type:spec"
3. **Then**: Set Type to "Spec"
4. Save

---

### Project 3: Backlog (Future Work)

**Rule 1: Auto-add out-of-scope**

1. Open project **Backlog**
2. Click **Auto-add to project**
3. **Filters**:
   - `label:"out-of-scope"` (has out-of-scope label)
4. Save

**Rule 2: Auto-set status to Backlog**

1. Click **Add automation**
2. **When**: Item is added
3. **Then**: Set Status to "Backlog"
4. Save

---

## Step 4: Test the Automation

### Test Auto-Add (PRs)

1. Create a test PR with any title (e.g., `test: automation`)
2. Check **Main Work** project → should appear within 1 minute
3. Check PR status in project → should be "In Progress"

### Test Auto-Add (Issues)

1. Create a test issue (e.g., `Test issue for automation`)
2. Add label `type:feature` and `priority:high`
3. Check **Main Work** project → should appear within 1 minute
4. Check status → should be "Backlog"
5. Check labels → should show as table columns

### Test Out-of-Scope

1. Create issue with `[OUT-OF-SCOPE]` in title
2. Add label `out-of-scope`
3. Check **Backlog (Future Work)** project → should appear
4. Check **Main Work** project → should NOT appear

### Test Spec PRs

1. Create PR with `[SPEC]` in title (e.g., `[SPEC] Week 10 Features`)
2. Check **Spec Tracking** project → should appear
3. Check **Main Work** project → should ALSO appear (in addition to spec project)

---

## Step 5: Configure Branch Protection (Optional)

For stronger automation, update branch protection rules:

**Settings → Branches → main → Edit protection**

Add required checks:

```
- lint
- typecheck
- unit
- coverage
- a11y
- contract
- build
- github-projects-automation
```

This ensures:

- No PRs merge without automation running
- Issues are always categorized
- All items get status tracking

---

## Automation Workflow Details

### PR Lifecycle (Auto-Updated)

```
[PR Opened]
    ↓
Status → "In Progress" (via GitHub Actions)
    ↓
[Review Requested]
    ↓
[Approved]
    ↓
Status → "Ready for Merge" (via GitHub Actions)
    ↓
[PR Merged]
    ↓
Status → "Done" (via GitHub Actions)
```

### Issue Lifecycle (Auto-Updated)

```
[Issue Created]
    ↓
Status → "Backlog" (via GitHub Actions)
Label → type + priority (auto-labeled)
Milestone → current sprint (if exists)
    ↓
[Worked On / PR Created]
    ↓
Status → "In Progress" (manual or via PR automation)
    ↓
[Issue Closed]
    ↓
Status → "Done" (via GitHub Actions)
```

### Labeling System (Auto-Applied)

**Type Labels** (mutually exclusive):

- `type:spec` - Specification/planning work
- `type:feature` - New feature
- `type:bug` - Bug fix
- `type:docs` - Documentation
- `type:chore` - Maintenance
- `type:refactor` - Code refactoring
- `type:test` - Testing

**Priority Labels** (mutually exclusive):

- `priority:critical` (P0)
- `priority:high` (P1)
- `priority:medium` (P2)
- `priority:low` (P3)

**Scope Labels**:

- `in-scope` - Current sprint work
- `out-of-scope` - Future work
- `blocked` - Blocked by another issue

---

## Advanced Customization

### Auto-Create Issues from Discussions

To auto-create issues from GitHub Discussions:

1. **Discussions Settings** → Enable discussions
2. Use GitHub CLI script:

```bash
#!/bin/bash
# .github/workflows/discussions-to-issues.yml

name: Discussion to Issue

on:
  discussion:
    types: [created]

jobs:
  create-issue:
    runs-on: ubuntu-latest
    steps:
      - name: Create issue from discussion
        uses: actions/github-script@v7
        with:
          script: |
            const discussion = context.payload.discussion;
            const issue = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[Discussion] ${discussion.title}`,
              body: discussion.body,
              labels: ['type:discussion', 'priority:low', 'out-of-scope']
            });
            console.log(`Created issue #${issue.data.number}`);
```

### Custom Status Workflow

To add custom statuses (beyond GitHub default):

**In Project Settings → Fields → Status**:

Add custom options like:

- `Scoping` (discussing scope/requirements)
- `Design Review` (waiting for design feedback)
- `Code Review` (waiting for code review)
- `Testing` (in QA)
- `Ready to Deploy` (approved, waiting for release)

Then update workflow to handle these:

```yaml
- name: Set custom status
  if: github.event.pull_request.draft == false
  uses: leonsteinhaeuser/project-beta-automations@v2.2.0
  with:
    status_value: 'Code Review'
```

---

## Troubleshooting

### Issue Not Appearing in Project

**Cause**: Automation workflow didn't run or failed

**Fix**:

1. Check workflow run: `.github/workflows/github-projects-automation.yml`
2. Click **Actions** tab in repo
3. Look for `GitHub Projects Automation` workflow
4. Check for failures in logs
5. Ensure `add-to-project` permissions are granted:

```yaml
permissions:
  contents: read
  issues: write
  pull-requests: write
```

### Status Not Updating

**Cause**: GitHub Projects status field not linked to workflow

**Fix**:

1. Open project
2. Go to **Workflows**
3. Verify automation rules exist for status field
4. Check that rule conditions match (e.g., "PR is merged")

### Labels Not Applied

**Cause**: Auto-labeling script didn't detect keywords

**Fix**:

1. Check PR/issue title contains:
   - `feat:`, `fix:`, `docs:`, `chore:` (for type)
   - `P0`, `critical`, `P1`, `high`, `P2`, `medium`, `P3`, `low` (for priority)
2. Or manually add labels (workflow won't override manual labels)

### Out-of-Scope Items Mixed with Main

**Cause**: Item has both `in-scope` and `out-of-scope` labels

**Fix**:

Use only ONE scope label per item. Workflow prefers:

- `in-scope` > `out-of-scope` (if both present)

---

## Metrics & Reporting

### Dashboard Queries

**In GitHub Projects**, save these views:

**View 1: Current Sprint**

```
Milestone: <current milestone>
Status: "In Progress" or "Ready for Merge"
```

**View 2: Ready to Merge**

```
Type: PR
Status: "Ready for Merge"
```

**View 3: Blocked Issues**

```
Label: blocked
Status: not "Done"
```

**View 4: High Priority**

```
Priority: "Critical" or "High"
Status: not "Done"
```

**View 5: Completed This Sprint**

```
Milestone: <current milestone>
Status: "Done"
```

---

## FAQ

### Can I disable automation for specific PRs?

**Yes**: Add label `no-automation` to skip GitHub Projects automation for that item.

### Can I have different projects per team?

**Yes**: Create additional projects and update workflow with filters:

```yaml
- name: Add to team-specific project
  if: contains(github.event.issue.labels.*.name, 'team:frontend')
  uses: actions/add-to-project@v0.5.0
  with:
    project-url: https://github.com/orgs/.../projects/10
```

### How do I bulk-add existing PRs to projects?

**Workaround**: Use GitHub CLI:

```bash
# Add all open PRs to project
gh pr list --state open --json number --jq '.[] | .number' | while read pr; do
  gh project item-add <project-number> --owner <org> --repo <repo> --id $pr
done
```

### Can I export project data for reporting?

**Yes**: Use GitHub CLI:

```bash
# Export all items from project
gh project item-list 1 --owner <org> --format json > project-export.json
```

---

## References

- [GitHub Projects Documentation](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub Actions add-to-project](https://github.com/marketplace/actions/add-to-project)
- [GitHub Actions github-script](https://github.com/marketplace/actions/github-script)
- [Workflow Status Badge](https://docs.github.com/en/actions/monitoring-and-troubleshooting-workflows/adding-a-workflow-status-badge)

---

## Next Steps

1. ✅ Create 3 GitHub Projects (Main, Spec, Backlog)
2. ✅ Configure automation rules in each project
3. ✅ Test with sample PR/issue
4. ✅ Update team docs with label conventions
5. ✅ Set up dashboard views for daily standup
