# GitHub Projects Automation - Single Training Project Setup

**Total Time**: 3 minutes
**What You Get**: Auto-add all PRs & issues to one Training project with automatic status and label updates

---

## Step 1: Create Your Training Project (1 minute)

1. Go to: https://github.com/orgs/Maximus-Technologies-Uganda/projects
2. Click **New project**
3. **Name**: `Training`
4. **Template**: **Table** (important - we need status column)
5. Click **Create project**
6. **Note the URL** - it will look like: `https://github.com/orgs/Maximus-Technologies-Uganda/projects/6`
7. **Save the project ID** (the number after `/projects/`) - in this example: `6`

---

## Step 2: Update the Workflow with Your Project ID (1 minute)

1. Open: `.github/workflows/github-projects-automation.yml`
2. Find the comment at the top of the `jobs:` section that says:
   ```
   # CONFIGURATION: Update PROJECT_ID below with your Training project's numeric ID
   ```
3. Find all lines with `project_id: 6` and replace `6` with **YOUR project ID** from Step 1
4. Also update line 30 if your project name isn't exactly "Training":
   ```yaml
   project-url: https://github.com/orgs/Maximus-Technologies-Uganda/projects/Training
   ```
5. Commit and push:
   ```bash
   git add .github/workflows/github-projects-automation.yml
   git commit -m "ci: update training project configuration"
   git push
   ```

---

## Step 3: Configure Automation Rules in GitHub (1 minute)

1. Open your Training project: `https://github.com/orgs/Maximus-Technologies-Uganda/projects/6` (or your project URL)
2. Click **Workflows** (left sidebar)
3. Add 4 automation rules:

   **Rule 1: PR Opened**
   - Click **Add automation**
   - When: "Pull request" → "opened"
   - Then: "Set status to" → "In Progress"
   - Save

   **Rule 2: PR Approved**
   - When: "Pull request" → "ready for review"
   - Then: "Set status to" → "In Review"
   - Save

   **Rule 3: PR Merged**
   - When: "Pull request" → "closed"
   - Then: "Set status to" → "Done"
   - Save

   **Rule 4: Issue Opened**
   - When: "Issue" → "opened"
   - Then: "Set status to" → "Backlog"
   - Save

   **Rule 5: Issue Closed**
   - When: "Issue" → "closed"
   - Then: "Set status to" → "Done"
   - Save

---

## Testing (Quick Verify)

### Create a test PR

```bash
git checkout -b test/automation
echo "test" > test-automation.txt
git add test-automation.txt
git commit -m "test: automation verify"
git push -u origin test/automation
```

Then open a PR on GitHub. **Within 1 minute**, you should see it appear in your Training project with:

- Status: "In Progress" (auto-set)
- Labels: Auto-applied (type:test, priority:low)

### Create a test issue

1. Go to: https://github.com/Maximus-Technologies-Uganda/Training/issues
2. **New Issue**
3. **Title**: `test: check automation`
4. **Submit**

**Within 1 minute**, check your Training project - the issue should appear with status "Backlog".

---

## How It Works

### Auto-Add

Every PR and issue is automatically added to your Training project.

### Auto-Label

Based on title patterns:

- `feat:` → `type:feature`
- `fix:` → `type:bug`
- `docs:` → `type:docs`
- `[SPEC]` → `type:spec`
- `P0`, `critical` → `priority:critical`
- `P1`, `high` → `priority:high`

### Auto-Status

- PR created → In Progress
- PR approved → In Review
- PR merged → Done
- Issue created → Backlog
- Issue closed → Done

---

## Troubleshooting

**Items not appearing in project?**

1. Check the workflow ran: Go to **Actions** tab, look for "GitHub Projects Automation"
2. Wait 1-2 minutes (GitHub Actions can be slow)
3. Verify your project URL is correct in the workflow

**Status not updating?**

1. Verify the automation rules are saved in Workflows
2. Make sure status names match exactly (case-sensitive)
3. Check that your project_id in the workflow matches your actual project

**Wrong status values?**
Available statuses depend on your project template. Table template includes:

- Backlog
- In Progress
- In Review
- Done

---

## Next Steps

1. **Delete test branches** (optional):

   ```bash
   git branch -D test/automation
   git push origin --delete test/automation
   ```

2. **Team workflow**: Tell your team to use these title patterns:

   ```
   feat: new feature
   fix: bug fix
   docs: documentation
   [SPEC] specification
   ```

3. **You're done!** All future PRs and issues will be auto-managed. Zero manual overhead.

---

## Quick Reference

| You Do            | Automation Does                   |
| ----------------- | --------------------------------- |
| Create PR/issue   | Auto-adds to Training project     |
| Use title pattern | Auto-applies labels               |
| Push code         | Auto-sets status to "In Progress" |
| Approve PR        | Auto-sets status to "In Review"   |
| Merge/Close       | Auto-sets status to "Done"        |

---

Questions? See `.github/workflows/github-projects-automation.yml` for full configuration.
