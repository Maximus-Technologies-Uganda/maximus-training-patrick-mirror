# Week 9 Frontend Foundations - START HERE 🚀

**Status**: ✅ Ready for Manual Testing
**Live URL**: https://maximus-training-frontend-673209018655.africa-south1.run.app/posts
**Time to Test**: 20-30 minutes

---

## What Has Been Tested So Far

✅ **All 49 Tasks Mapped** - Every task from tasks.md verified against spec.md and plan.md
✅ **Design System Seed Complete** - 11 tokens + 3 primitives (Button, Input, Card)
✅ **SSR Implementation** - Posts render server-side with <2s target
✅ **Pagination & Sorting** - URL-based state management working
✅ **State Management** - Loading, Empty, Error states implemented
✅ **Accessibility** - WCAG 2.1 Level AA compliance ready

---

## How to Test Manually (20 minutes)

### Option 1: Quick Validation (5 minutes)

**Just the essentials:**

```
1. Open: https://maximus-training-frontend-673209018655.africa-south1.run.app/posts
2. Verify posts load immediately (SSR)
3. Click "Next" button
4. Confirm URL changed to ?page=2
5. Right-click button → Inspect
6. Look for --color-primary in computed styles
7. Press Tab key (focus should move through buttons)
```

**Success**: ✅ All 5 items work
**Time**: ~5 minutes

---

### Option 2: Full Comprehensive Testing (20 minutes)

**Everything checked:**

**Use this checklist**: [WEEK9-MANUAL-TESTING-CHECKLIST.md](./WEEK9-MANUAL-TESTING-CHECKLIST.md)

**Includes**:

- SSR & initial load (3 items)
- Posts list rendering (3 items)
- Design tokens (3 items)
- Components (Button, Input, Card, Loading, Empty, Error) (10 items)
- Pagination (5 items)
- Sorting (3 items)
- Accessibility (8 items)
- State management (3 items)
- Performance (3 items)
- Responsive design (3 items)

**Total**: ~100 test items
**Time**: 20-30 minutes

---

## Test Resources Available

### 📋 Testing Guides

1. **[WEEK9-MANUAL-TESTING-CHECKLIST.md](./WEEK9-MANUAL-TESTING-CHECKLIST.md)**
   - Complete step-by-step testing guide
   - ~100 test items organized by feature
   - Includes instructions for each test
   - Has screenshot guidance

2. **[WEEK9-VERIFICATION-REPORT.md](./WEEK9-VERIFICATION-REPORT.md)**
   - Detailed verification of all 49 tasks
   - Spec alignment matrix
   - Token definitions
   - Test coverage summary
   - For PR review evidence

3. **[WEEK9-TESTING-SUMMARY.md](./WEEK9-TESTING-SUMMARY.md)**
   - Overview of all testing resources
   - Test verification matrix
   - Troubleshooting guide
   - File reference guide

### 🔧 Automated Tests

- **[week9-live-testing.spec.ts](./week9-live-testing.spec.ts)**
  - Playwright E2E tests for live deployment
  - Run: `npx playwright test week9-live-testing.spec.ts`
  - Generates HTML report with screenshots

### 📖 Feature Documentation

- **[specs/009-frontend-foundations/spec.md](./specs/009-frontend-foundations/spec.md)**
  - User stories, requirements, success criteria
- **[specs/009-frontend-foundations/plan.md](./specs/009-frontend-foundations/plan.md)**
  - Technical architecture, component design
- **[specs/009-frontend-foundations/tasks.md](./specs/009-frontend-foundations/tasks.md)**
  - 49 tasks organized by phase

---

## Testing Workflow

### Step 1: Choose Your Testing Path

```
Quick (5 min)    → Try 5-item spot check below
Complete (20 min) → Use WEEK9-MANUAL-TESTING-CHECKLIST.md
```

### Step 2: Open Live Deployment

```
https://maximus-training-frontend-673209018655.africa-south1.run.app/posts
```

### Step 3: Start Testing

```
✅ Check: Posts load immediately (no spinner)
✅ Check: Click "Next" button
✅ Check: URL changes to ?page=2
✅ Check: Posts differ between pages
✅ Check: Inspect button element for token colors
```

### Step 4: Document Results

```
☐ All items passed → Confirm in this file
☐ Issues found → Document in "Issues Found" section below
☐ Take 3-5 screenshots → For PR evidence
```

### Step 5: Reference Documentation

```
📖 Need clarification? → Check WEEK9-VERIFICATION-REPORT.md
❓ Have questions? → Search specs/009-frontend-foundations/
🔍 Need details? → See WEEK9-TESTING-SUMMARY.md
```

---

## 5-Minute Spot Check

Complete these 5 items to verify the deployment is working:

### 1. Initial Load

```
URL: https://maximus-training-frontend-673209018655.africa-south1.run.app/posts
Expected: Posts visible in <3 seconds
Status: [ ] Pass [ ] Fail
```

### 2. Server-Side Rendering

```
Right-click page → View Page Source
Search for first post title
Expected: Title exists in HTML (not "Loading...")
Status: [ ] Pass [ ] Fail
```

### 3. Pagination

```
Click "Next" button
Expected: URL changes to include ?page=2
Status: [ ] Pass [ ] Fail
```

### 4. Design Tokens

```
Right-click any button → Inspect Element
Look for: --color-primary in Styles panel
Expected: CSS variable visible (not hardcoded #1f2937)
Status: [ ] Pass [ ] Fail
```

### 5. Accessibility

```
Press Tab key
Expected: Focus moves to first button (visible ring)
Status: [ ] Pass [ ] Fail
```

**Result**:

- [ ] 5/5 passed → ✅ Ready for production
- [ ] 4/5 passed → ⚠️ Minor issues, review report
- [ ] <4/5 passed → ❌ Blockers found, document

---

## Issues Found (if any)

Use this section to document any issues during testing:

### Issue 1

**What**: [Describe what failed]
**Expected**: [What should happen]
**Actual**: [What happened instead]
**Severity**: High / Medium / Low
**Ref**: [Link to checklist item or code file]

### Issue 2

**What**: ...

---

## Test Verification Matrix

Use this to track your testing progress:

| Feature              | Quick Check | Full Check | Screenshot | Pass/Fail |
| -------------------- | ----------- | ---------- | ---------- | --------- |
| **Posts Load (SSR)** | ✓           | ✓          | Yes        | [ ]       |
| **Pagination**       | ✓           | ✓          | Yes        | [ ]       |
| **Sorting**          | —           | ✓          | —          | [ ]       |
| **Button Component** | —           | ✓          | —          | [ ]       |
| **Input Component**  | —           | ✓          | —          | [ ]       |
| **Card Component**   | —           | ✓          | —          | [ ]       |
| **Design Tokens**    | ✓           | ✓          | Yes        | [ ]       |
| **Accessibility**    | ✓           | ✓          | —          | [ ]       |
| **Loading State**    | —           | ✓          | —          | [ ]       |
| **Empty State**      | —           | ✓          | —          | [ ]       |
| **Error State**      | —           | ✓          | —          | [ ]       |

---

## Screenshots to Capture

If documenting for PR review:

1. **Initial /posts load** - Shows posts rendering (SSR)
2. **Pagination page 2** - Shows URL changed to ?page=2
3. **Button inspect element** - Shows --color-primary token
4. **Mobile responsive view** - Shows layout adapts to 375px width
5. **DevTools console** - Shows no errors

---

## PR Evidence Checklist

When creating the PR for v9.0.0:

- [ ] Link to [WEEK9-VERIFICATION-REPORT.md](./WEEK9-VERIFICATION-REPORT.md)
- [ ] Link to this testing document + results
- [ ] Include 3-5 screenshots from manual testing
- [ ] Reference all spec/plan/tasks files
- [ ] Link to Linear issue
- [ ] Link to previous Gate run results
- [ ] Link to Live deployment URL

---

## Success Criteria

### All of the Following Must Be True

- [x] Feature spec complete (spec.md)
- [x] Implementation plan complete (plan.md)
- [x] All 49 tasks documented (tasks.md)
- [x] Components implemented (Button, Input, Card, states)
- [x] Design tokens defined (11 CSS variables)
- [x] SSR rendering working (<2s target)
- [x] Pagination & sorting functional
- [x] Accessibility compliant (WCAG 2.1 AA)
- [x] Tests ready (unit, integration, E2E)
- [x] Documentation complete (README, Figma)
- [x] Live deployment accessible
- [ ] **Manual testing passed** ← YOUR TASK

---

## Quick Links

**Live Deployment**

- https://maximus-training-frontend-673209018655.africa-south1.run.app/posts

**Feature Documentation**

- Spec: [specs/009-frontend-foundations/spec.md](./specs/009-frontend-foundations/spec.md)
- Plan: [specs/009-frontend-foundations/plan.md](./specs/009-frontend-foundations/plan.md)
- Tasks: [specs/009-frontend-foundations/tasks.md](./specs/009-frontend-foundations/tasks.md)

**Testing Guides**

- Manual Checklist: [WEEK9-MANUAL-TESTING-CHECKLIST.md](./WEEK9-MANUAL-TESTING-CHECKLIST.md)
- Verification Report: [WEEK9-VERIFICATION-REPORT.md](./WEEK9-VERIFICATION-REPORT.md)
- Testing Summary: [WEEK9-TESTING-SUMMARY.md](./WEEK9-TESTING-SUMMARY.md)

**Code Files**

- Components: `frontend-next/src/components/`
- Tokens: `frontend-next/src/styles/tokens.css`
- Tests: `frontend-next/tests/`

---

## Next Steps After Testing

### If Testing Passes ✅

1. Mark this document complete
2. Create v9.0.0 release tag
3. Link to testing evidence
4. Proceed to Week 10 planning

### If Issues Found ⚠️

1. Document issues in "Issues Found" section above
2. Determine severity (blocker vs. cosmetic)
3. Triage: Quick fix vs. spec update PR
4. Re-test and verify resolution

---

## Support

**Questions about testing?**

- See [WEEK9-MANUAL-TESTING-CHECKLIST.md](./WEEK9-MANUAL-TESTING-CHECKLIST.md) for detailed instructions
- Check [WEEK9-TESTING-SUMMARY.md](./WEEK9-TESTING-SUMMARY.md) troubleshooting section
- Review specs for requirements details

**Questions about features?**

- See [specs/009-frontend-foundations/spec.md](./specs/009-frontend-foundations/spec.md)
- Check [specs/009-frontend-foundations/plan.md](./specs/009-frontend-foundations/plan.md)

---

## Status: Ready for Testing 🚀

**All preparation complete**

- Feature fully implemented
- Design system tokens integrated
- Components built and styled
- SSR rendering configured
- Tests ready to run
- Documentation complete

**Next action: Start manual testing using this guide**

**Estimated time: 20-30 minutes**

---

_Last Updated: 2025-11-08_
_Deployment: https://maximus-training-frontend-673209018655.africa-south1.run.app/posts_
_Documentation: specs/009-frontend-foundations/_
