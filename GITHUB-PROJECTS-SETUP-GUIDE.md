# GitHub Projects Setup - Step-by-Step Execution Guide

**Total Time**: 5 minutes (can't be automated - requires GitHub UI)
**Status**: Ready to execute

---

## ⏱️ Step 1: Create 3 GitHub Projects (2 minutes)

### Project 1: Main Work

**Navigate to**: https://github.com/orgs/Maximus-Technologies-Uganda/projects

**Steps**:

1. Click **New project** (green button, top right)
2. **Name**: `Main Work`
3. **Description**: `All PRs and issues tracked by priority and status`
4. **Visibility**: `Private`
5. **Template**: `Table` (important - we need status column)
6. Click **Create project**
7. **Note the URL** - should be something like `.../projects/1`
   - If it's not `/projects/1`, note the number you get

**What you'll see**:

- Empty table with columns for Title, Status, Assignees
- Left sidebar with "Workflows" and "Custom fields" options

---

### Project 2: 📋 Spec & Planning

**Steps**:

1. Back to https://github.com/orgs/Maximus-Technologies-Uganda/projects
2. Click **New project**
3. **Name**: `📋 Spec & Planning`
4. **Description**: `[SPEC] PRs, planning documents, and design system work`
5. **Template**: `Table`
6. Click **Create project**
7. **Note the URL number** (should be `/projects/2`)

---

### Project 3: 📦 Future Work

**Steps**:

1. Back to https://github.com/orgs/Maximus-Technologies-Uganda/projects
2. Click **New project**
3. **Name**: `📦 Future Work (Out-of-Scope)`
4. **Description**: `Issues and features that don't fit current sprint - future backlog`
5. **Template**: `Table`
6. Click **Create project**
7. **Note the URL number** (should be `/projects/3`)

---

## ✅ Step 2: Verify Project Numbers (30 seconds)

**Check your project numbers**:

- Open each project's URL
- You should have:
  - `.../projects/1` → Main Work
  - `.../projects/2` → 📋 Spec & Planning
  - `.../projects/3` → 📦 Future Work

**If your numbers are different**:

- Edit `.github/workflows/github-projects-automation.yml`
- Replace all instances of `/projects/1`, `/projects/2`, `/projects/3` with your actual numbers
- Commit and push

---

## 🎯 Step 3: Configure Automation Rules (2 minutes)

### For Project 1: Main Work

**Open**: https://github.com/orgs/Maximus-Technologies-Uganda/projects/1

**Configure Rule 1: PR Opened → In Progress**

1. Click **Workflows** (left sidebar, under your project name)
2. Click **Add automation** (blue button)
3. You'll see a form:
   - **When**: Select "Pull request" from dropdown
   - **status changes to**: Select "opened"
   - **Then**: Select "Set status to"
   - **Value**: Select "In Progress"
4. Click **Save**

**Configure Rule 2: PR Merged → Done**

1. Click **Add automation** again
2. **When**: "Pull request"
3. **status changes to**: "merged" (scroll to find it)
4. **Then**: "Set status to"
5. **Value**: "Done"
6. Click **Save**

**Configure Rule 3: Issue Opened → Backlog**

1. Click **Add automation** again
2. **When**: "Issue"
3. **status changes to**: "opened"
4. **Then**: "Set status to"
5. **Value**: "Backlog"
6. Click **Save**

**Configure Rule 4: Issue Closed → Done**

1. Click **Add automation** again
2. **When**: "Issue"
3. **status changes to**: "closed"
4. **Then**: "Set status to"
5. **Value**: "Done"
6. Click **Save**

✅ **Project 1 is now fully configured!**

---

### For Project 2: 📋 Spec & Planning

**Open**: https://github.com/orgs/Maximus-Technologies-Uganda/projects/2

**Configure Rule: Auto-add [SPEC] PRs**

1. Click **Workflows** (left sidebar)
2. Click **Auto-add to project** (find this option in Workflows menu)
3. You'll see filter options:
   - Type: Select "Pull request"
   - Additional filters: `title:"[SPEC]"`
4. Click **Save**

This automatically adds any PR with `[SPEC]` in the title!

**Also add status rules** (same as Project 1):

- PR opened → In Progress
- PR merged → Done

Click **Add automation** for each:

1. PR opened → In Progress
2. PR merged → Done

✅ **Project 2 is now configured!**

---

### For Project 3: 📦 Future Work

**Open**: https://github.com/orgs/Maximus-Technologies-Uganda/projects/3

**Configure Rule: Auto-add Out-of-Scope**

1. Click **Workflows**
2. Click **Auto-add to project**
3. Filter: `label:"out-of-scope"`
4. Click **Save**

**Configure Status Rules**:

1. Click **Add automation**
   - When: "Issue"
   - Status: "opened"
   - Then: "Set status to" → "Backlog"
2. Click **Add automation**
   - When: "Issue"
   - Status: "closed"
   - Then: "Set status to" → "Done"

✅ **Project 3 is now configured!**

---

## 🧪 Step 4: Test Everything (1 minute)

### Test 1: Auto-Add to Main Work

**Create a test PR**:

```bash
cd c:\Users\LENOVO\Training
git checkout -b test/automation-verify
echo "test" > test-automation.txt
git add test-automation.txt
git commit -m "feat: test automation"
git push -u origin test/automation-verify
```

**Then open a PR** on GitHub:

1. Go to https://github.com/Maximus-Technologies-Uganda/Training/pulls
2. Click **New Pull Request**
3. **Base**: `main` | **Compare**: `test/automation-verify`
4. **Title**: `feat: test automation`
5. Click **Create Pull Request**

**Check Main Work project**:

- Go to https://github.com/orgs/Maximus-Technologies-Uganda/projects/1
- **Within 1 minute**, you should see your PR appear
- **Status should automatically be**: "In Progress"

✅ **Automation is working!**

---

### Test 2: Auto-Add Out-of-Scope

**Create a test out-of-scope issue**:

1. Go to https://github.com/Maximus-Technologies-Uganda/Training/issues
2. Click **New Issue**
3. **Title**: `[OUT-OF-SCOPE] Dark mode support`
4. **Description**: `Future feature for Week 10+`
5. Click **Submit new issue**

**Check Future Work project**:

- Go to https://github.com/orgs/Maximus-Technologies-Uganda/projects/3
- **Within 1 minute**, your issue should appear
- **Status should be**: "Backlog"

✅ **Out-of-scope tracking is working!**

---

### Test 3: Auto-Add [SPEC] PR

**Create a test spec PR**:

```bash
git checkout main
git pull origin main
git checkout -b test/spec-automation
echo "# Test Spec" > test-spec.md
git add test-spec.md
git commit -m "[SPEC] Test specification"
git push -u origin test/spec-automation
```

**Open a PR**:

1. Go to https://github.com/Maximus-Technologies-Uganda/Training/pulls
2. Click **New Pull Request**
3. **Base**: `main` | **Compare**: `test/spec-automation`
4. **Title**: `[SPEC] Test specification`
5. Click **Create Pull Request**

**Check Spec & Planning project**:

- Go to https://github.com/orgs/Maximus-Technologies-Uganda/projects/2
- **Within 1 minute**, PR should appear
- **Status should be**: "In Progress"

✅ **Spec automation is working!**

---

## 📊 What You Should See After Setup

### Main Work Project

```
Title                          Status          Priority
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
feat: test automation          In Progress     (auto-set)
[Other PRs/issues...]          ...             ...
```

### 📋 Spec & Planning Project

```
Title                          Status          Priority
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[SPEC] Test specification      In Progress     (auto-set)
[SPEC] Week 9 Foundations      ...             ...
```

### 📦 Future Work Project

```
Title                                  Status     Priority
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[OUT-OF-SCOPE] Dark mode support       Backlog    (auto-set)
```

---

## ✨ Success Criteria

- ✅ 3 projects created
- ✅ Automation rules configured for each
- ✅ Test PR appears in Main Work with "In Progress" status
- ✅ Test spec PR appears in Spec & Planning with "In Progress" status
- ✅ Test out-of-scope issue appears in Future Work with "Backlog" status

---

## 🚀 Next Steps After Setup

1. **Delete test branches** (optional):

   ```bash
   git branch -D test/automation-verify
   git branch -D test/spec-automation
   git push origin --delete test/automation-verify
   git push origin --delete test/spec-automation
   ```

2. **Share with team**:
   - Send them `GITHUB-PROJECTS-QUICK-SETUP.md`
   - Tell them to use title patterns:
     - `feat:` for features
     - `fix:` for bugs
     - `[SPEC]` for specs
     - `[OUT-OF-SCOPE]` for future ideas

3. **Start using it**:
   - All future PRs and issues will be auto-managed!
   - Zero manual overhead

---

## ⚠️ Troubleshooting

### Projects Not Appearing

**Check**:

1. Workflow ran? Go to **Actions** tab, look for `GitHub Projects Automation`
2. Did you wait 1+ minute? (GitHub Actions can be slow)
3. Are you using the right account? (Must be in the org)

### Status Not Updating

**Check**:

1. Is the automation rule saved? (Reload the Workflows page)
2. Is the status field set correctly? (Should match exactly: "In Progress", "Done", etc.)
3. Try merging the PR manually to trigger the rule

### Items in Wrong Project

**Check**:

1. Did you use the right title pattern? (`feat:` vs `fix:` vs `[SPEC]`)
2. Did you add the right label? (`out-of-scope` for backlog)
3. Is your project filter correct? (Check in Workflows → Auto-add)

---

## Questions?

See `GITHUB-PROJECTS-QUICK-SETUP.md` for more FAQs.

All done! Your GitHub Projects automation is now live! 🎉
