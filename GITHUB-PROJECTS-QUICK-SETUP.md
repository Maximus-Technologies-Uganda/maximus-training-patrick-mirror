# GitHub Projects Automation - Quick Setup (5 Minutes)

## What You Get

✅ **Auto-add** all PRs & issues to GitHub Projects
✅ **Auto-update status** (Backlog → In Progress → Ready for Merge → Done)
✅ **Auto-label** items (type, priority, scope)
✅ **Auto-track** out-of-scope work separately
✅ **Auto-assign** current sprint/milestone

---

## 3-Step Setup

### Step 1: Create 3 GitHub Projects (2 minutes)

**Project 1: Main Work**

1. Go: https://github.com/orgs/Maximus-Technologies-Uganda/projects
2. Click: **New project**
3. Name: `Main Work`
4. Template: **Table**
5. Click: **Create project**
6. **Note the project number from URL** (should be `/projects/1`)

**Project 2: 📋 Spec & Planning**

1. Repeat steps 1-5
2. Name: `📋 Spec & Planning`
3. **Note the project number** (should be `/projects/2`)

**Project 3: 📦 Future Work**

1. Repeat steps 1-5
2. Name: `📦 Future Work (Out-of-Scope)`
3. **Note the project number** (should be `/projects/3`)

---

### Step 2: Update Your Project Numbers (1 minute)

**File**: `.github/workflows/github-projects-automation.yml`

Find these lines and replace **1, 2, 3** with YOUR actual project numbers:

```yaml
# Line 22: Main project
project-url: https://github.com/orgs/Maximus-Technologies-Uganda/projects/1

# Line 44: Spec project
project-url: https://github.com/orgs/Maximus-Technologies-Uganda/projects/2

# Line 69: Backlog project
project-url: https://github.com/orgs/Maximus-Technologies-Uganda/projects/3
```

Then commit and push:

```bash
git add .github/workflows/github-projects-automation.yml
git commit -m "ci: update github projects numbers"
git push
```

---

### Step 3: Configure Project Automation Rules (2 minutes)

**For Project 1 (Main Work)**:

1. Open: https://github.com/orgs/Maximus-Technologies-Uganda/projects/1
2. Click: **Workflows** (left sidebar)
3. Click: **Add automation**
4. Set: **When** → "Pull request is merged" → **Then** → "Set status to Done"
5. Click: **Save**

Repeat for:

- When PR opened → Set status to "In Progress"
- When issue closed → Set status to "Done"

**For Project 2 (Spec & Planning)**:

1. Open your Spec project
2. Click: **Auto-add to project**
3. Filter: `is:pr title:"[SPEC]"` (adds [SPEC] PRs automatically)
4. Save

**For Project 3 (Future Work)**:

1. Open your Backlog project
2. Click: **Auto-add to project**
3. Filter: `label:"out-of-scope"` (adds out-of-scope items automatically)
4. Save

---

## Testing (30 seconds)

### Test #1: Auto-Add PR

```bash
git checkout -b test/automation
echo "test" > test.txt
git add test.txt
git commit -m "test: automation"
git push -u origin test/automation
```

Then open a PR. Within 1 minute, it should appear in **Main Work** project.

### Test #2: Auto-Add Issue

1. Create new issue: `Test issue for automation`
2. Add label: `priority:high`
3. Within 1 minute, should appear in **Main Work** project

### Test #3: Out-of-Scope

1. Create issue: `[OUT-OF-SCOPE] Future feature idea`
2. Add label: `out-of-scope`
3. Should appear in **Future Work** project (NOT in Main Work)

---

## How It Works

### Auto-Labeling

When you create an issue/PR, the workflow automatically labels it based on **title**:

| If title contains... | Gets label          |
| -------------------- | ------------------- |
| `feat:` or `feat(`   | `type:feature`      |
| `fix:` or `fix(`     | `type:bug`          |
| `docs:` or `docs(`   | `type:docs`         |
| `[SPEC]`             | `type:spec`         |
| `P0`, `critical`     | `priority:critical` |
| `P1`, `high`         | `priority:high`     |
| `[OUT-OF-SCOPE]`     | `out-of-scope`      |

**Example PR titles**:

```
feat(design-system): add Button component       → type:feature, priority:low
fix(api): handle 401 errors (P1)               → type:bug, priority:high
[SPEC] Week 9 Frontend Foundations             → type:spec, priority:low
[OUT-OF-SCOPE] Dark mode support               → out-of-scope
```

### Auto-Status Updates

Status updates automatically as PR/issue progresses:

**PRs**:

- Opened → "In Progress"
- Approved → "Ready for Merge"
- Merged → "Done"

**Issues**:

- Opened → "Backlog"
- Closed → "Done"

---

## Common Questions

### Q: Will this break anything?

**A:** No. This is purely additive automation. It doesn't modify your code or existing workflows.

### Q: Can I disable it for specific PRs?

**A:** Yes. Add label `no-automation` to skip GitHub Projects for that item.

### Q: What if my project numbers are different?

**A:** Update `.github/workflows/github-projects-automation.yml` with your actual numbers from the project URL.

### Q: Why separate projects?

**A:** Keeps work organized:

- **Main Work**: Current sprint (in-scope PRs/issues)
- **Spec & Planning**: Long-term planning and design docs
- **Future Work**: Out-of-scope ideas for backlog

---

## Next: Team Workflow

**Tell your team**:

> When creating PRs/issues, start title with the type:
>
> - `feat: new feature`
> - `fix: bug fix`
> - `docs: documentation`
> - `[SPEC] specification`
> - `[OUT-OF-SCOPE] future idea`
>
> The workflow will auto-label and add to projects!

---

## Files Created

- ✅ `.github/workflows/github-projects-automation.yml` - Main automation workflow
- ✅ `docs/GITHUB-PROJECTS-AUTOMATION.md` - Full reference guide

---

## Support

If something doesn't appear in projects:

1. **Check workflow runs**: Go to **Actions** tab, look for `GitHub Projects Automation`
2. **Check project filters**: Projects > Workflows > Auto-add > Verify filters
3. **Check permissions**: Ensure `GITHUB_TOKEN` has write access (default in GitHub Actions)
4. **Check labels**: Verify PR/issue has correct label (e.g., `type:feature`)

---

## Done!

Your GitHub Projects automation is now live. Every PR and issue will be:

- ✅ Auto-added to the right project
- ✅ Auto-labeled for organization
- ✅ Auto-assigned current sprint
- ✅ Auto-status-updated as it progresses

No more manual project management! 🎉
