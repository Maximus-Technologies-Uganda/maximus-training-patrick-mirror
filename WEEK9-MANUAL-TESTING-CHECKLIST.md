# Week 9 Frontend Foundations - Manual Testing Checklist

**Live Deployment URL**: https://maximus-training-frontend-673209018655.africa-south1.run.app/posts

---

## Test Instructions

Open the live URL in your browser and perform the following manual tests. Check off each item as you verify it.

---

## P1: SSR & Posts List Rendering (User Story 1)

### Initial Load & Performance

- [ ] **Load Time**: Page loads and displays posts within 2-3 seconds
- [ ] **Server-Rendered Content**: Posts are visible in the page before JavaScript runs (check Page Source or Network tab)
- [ ] **No Loading Spinner on Initial Load**: Post list renders immediately without a spinner

### Post List Structure

- [ ] **Posts Display**: At least 3-5 posts are visible on the page
- [ ] **Post Title**: Each post displays a title (heading visible)
- [ ] **Post Author**: Each post shows an author name
- [ ] **Post Date**: Each post displays a creation date or timestamp
- [ ] **Post Content**: Post preview or content is visible

### Visual Styling

- [ ] **Post Container Styling**: Posts are inside card-like containers with borders/shadows
- [ ] **Typography**: Titles use a larger font than authors/dates
- [ ] **Spacing**: Posts have consistent padding and margins
- [ ] **Colors**: Text colors are readable (good contrast)

---

## P2: Pagination & Sorting (User Story 2)

### Pagination Controls

- [ ] **Pagination Visible**: A pagination section exists at the bottom or top
- [ ] **Previous Button**: "Previous" or "Prev" button is present
- [ ] **Next Button**: "Next" button is present
- [ ] **Page Info**: Page indicator shows "Page X of Y" or similar
- [ ] **Button States**: Buttons are enabled/disabled appropriately (Previous disabled on page 1)

### Pagination Functionality

- [ ] **Click Next**: Click the "Next" button
  - [ ] URL changes (check address bar)
  - [ ] New posts load
  - [ ] Page indicator updates
  - [ ] No full page reload (smooth transition)
- [ ] **Click Previous**: From page 2, click "Previous"
  - [ ] Returns to page 1
  - [ ] Original posts appear
- [ ] **URL Parameter**: Check that URL includes `?page=2` or similar parameter

### Sorting Controls

- [ ] **Sort Dropdown**: A sort control or dropdown exists
- [ ] **Sort Options**: Multiple sort options available (e.g., "Newest First", "Oldest First", "Title A-Z")
- [ ] **Sort Changes**: Change sort order
  - [ ] Posts reorder visibly
  - [ ] URL updates with `?sort=date-desc` or similar
  - [ ] Sort selection remains selected

### URL Shareability

- [ ] **Copy Page 2 URL**: Navigate to page 2, copy URL
- [ ] **Open in New Tab**: Paste URL in new tab
- [ ] **Same Content**: New tab shows page 2 content (posts 11-20 or similar)

---

## Design System Components (Phase 2 - Tokens & Components)

### Design Tokens

- [ ] **Token Colors**: Inspect a button or card element:
  - [ ] Right-click → Inspect
  - [ ] Check `--color-primary`, `--color-text`, `--color-surface` in styles
  - [ ] Values match spec (e.g., `--color-primary: #1f2937`)
- [ ] **Token Spacing**: Inspect card padding:
  - [ ] Check for `--space-1`, `--space-2`, `--space-3` CSS variables
  - [ ] Values are consistent (4px, 8px, 16px, 24px)
- [ ] **Border Radius Tokens**: Check card corners:
  - [ ] `--radius-sm`, `--radius-md`, `--radius-lg` applied

### Button Component

- [ ] **Button Present**: At least one button visible (pagination button, "Next", "Previous", etc.)
- [ ] **Button Variants**: Check for different button styles (primary, secondary, ghost)
- [ ] **Button States**:
  - [ ] **Normal**: Button renders with label/text
  - [ ] **Hover**: Mouse over button, it changes (opacity, color shift)
  - [ ] **Focus**: Tab to button, it shows focus ring/outline
  - [ ] **Active**: Click button, visual feedback appears
  - [ ] **Disabled**: If any disabled buttons exist, they appear grayed out
- [ ] **Button Accessibility**: Button has visible text or aria-label

### Input Component

- [ ] **Input Field**: Search or filter input exists (if applicable)
- [ ] **Label**: Input has associated label or placeholder text
- [ ] **Focus**: Click input field:
  - [ ] Cursor appears
  - [ ] Focus ring is visible (token color)
- [ ] **Error State** (if applicable): Type invalid input:
  - [ ] Error message appears below input
  - [ ] Input border changes color
  - [ ] aria-describedby connects input to error message

### Card Component

- [ ] **Card Structure**: Posts are displayed in card-like containers
- [ ] **Card Header**: Card has header section (optional but nice)
- [ ] **Card Body**: Post content is in the body area
- [ ] **Card Footer**: Card footer visible (optional)
- [ ] **Card Spacing**: Padding inside cards is consistent (16px/24px)
- [ ] **Card Colors**:
  - [ ] Background is light (white or near-white from `--color-surface`)
  - [ ] Border is subtle (light gray)
  - [ ] Text is dark (from `--color-text`)

### Composite Components

#### LoadingState

- [ ] **Skeleton or Spinner**: When fetching data, a loading UI appears (skeleton loader or spinner)
- [ ] **Loading Message**: "Loading posts..." or similar text visible
- [ ] **ARIA Live**: Open DevTools → Elements, find `aria-live="polite"` region

#### EmptyState

- [ ] **No Posts Scenario**: Navigate to a page with no posts (very high page number)
- [ ] **Empty Message**: "No posts yet" or "No posts found" displays
- [ ] **Call-to-Action**: A button like "Create Your First Post" appears
- [ ] **Empty Card**: Message is inside a styled card, not just plain text

#### ErrorState

- [ ] **Error Handling**: Simulate error (if possible, disable network or go to bad URL)
- [ ] **Error Message**: "Unable to fetch posts" or similar error text appears
- [ ] **Error Card**: Error is displayed in a styled card (red or warning colors)
- [ ] **Retry Button**: "Retry" or "Try Again" button is present
- [ ] **Retry Functionality**: Click Retry, page attempts to reload

---

## Accessibility Compliance (P3)

### Keyboard Navigation

- [ ] **Tab Through Elements**: Press Tab key repeatedly
  - [ ] Focus moves through all interactive elements (buttons, inputs)
  - [ ] Focus order is logical (left-to-right, top-to-bottom)
  - [ ] Skip links exist if applicable
- [ ] **Enter Key**: With button focused, press Enter
  - [ ] Button activation works
- [ ] **Space Key**: With button focused, press Space
  - [ ] Button activation works

### Screen Reader (ARIA)

- [ ] **Buttons Have Labels**: Check each button:
  - [ ] Right-click → Inspect
  - [ ] Button has `aria-label` or visible text content
- [ ] **Input Labels**: Check input elements:
  - [ ] `<label>` element with `for` attribute OR
  - [ ] `aria-label` attribute present
- [ ] **ARIA Live Regions**: Inspect page source:
  - [ ] `aria-live="polite"` for loading state (won't startle users)
  - [ ] `aria-live="assertive"` for error state (immediate attention)
- [ ] **Descriptions**: Error text linked to input:
  - [ ] Input has `aria-describedby="error-id"`
  - [ ] Error element has matching `id="error-id"`

### Color Contrast

- [ ] **Text Contrast**: Post text is easily readable
  - [ ] Dark text on light background OR
  - [ ] Light text on dark background
  - [ ] No low-contrast color combinations
- [ ] **Focus Indicator**: Focus ring is visible and high-contrast

### Semantic HTML

- [ ] **Heading Hierarchy**: Posts use `<h2>` or `<h3>` for titles (not `<div>`)
- [ ] **Links**: Links use `<a>` tags with `href`
- [ ] **Buttons**: Interactive buttons use `<button>` element
- [ ] **Form Elements**: Inputs use proper HTML form elements

---

## State Management (User Story 3)

### Loading State

- [ ] **Trigger Slow Load**: Refresh page, watch network tab
- [ ] **Skeleton UI**: Loading skeleton or spinner appears briefly
- [ ] **No Flicker**: Content doesn't flicker or jump around
- [ ] **ARIA Announcement**: Open accessibility inspector:
  - [ ] "Loading posts..." is announced to screen readers

### Empty State

- [ ] **No Posts Page**: Navigate to a high page number or add filter with no results
- [ ] **Empty Message**: Friendly message displays (not just blank page)
- [ ] **CTA Button**: "Create post" or similar call-to-action present
- [ ] **Centered UI**: Empty state is centered and visually prominent

### Error State

- [ ] **Trigger Error**: Disable network in DevTools or navigate to error URL
- [ ] **Error Message**: User-friendly error text displays (not technical)
- [ ] **Error Card**: Styled with warning colors (red/orange from tokens)
- [ ] **Retry Button**: Click "Retry" to attempt recovery
- [ ] **ARIA Alert**: `aria-live="assertive"` so error is immediately announced

---

## Performance & Responsiveness

### Performance

- [ ] **Fast Load**: Page fully loaded in < 3 seconds (visual inspection)
- [ ] **Smooth Pagination**: Next/Previous page loads quickly (< 1 second)
- [ ] **No Jank**: Scrolling is smooth, no lag

### Mobile Responsiveness

- [ ] **Responsive View**: Resize browser to 375px width (mobile)
  - [ ] Layout reflows (single column)
  - [ ] Text is readable
  - [ ] Buttons are tappable (large touch targets)
  - [ ] No horizontal scroll
- [ ] **Tablet View**: Resize to 768px width
  - [ ] Layout adjusts appropriately
  - [ ] Content is centered or uses appropriate margins
- [ ] **Desktop View**: Resize to 1920px width
  - [ ] Layout uses full width or stays centered
  - [ ] Columns arranged horizontally if applicable

---

## Code Quality & Structure (Verification in DevTools)

### CSS Variables

- [ ] **Inspect Button**: Right-click button → Inspect Element
  - [ ] Look at Styles panel
  - [ ] Find CSS rules using `var(--color-primary)`, `var(--space-2)`, etc.
  - [ ] No hardcoded hex colors or px values

### Component Structure

- [ ] **HTML Structure**: Open DevTools → Elements
  - [ ] Posts have semantic structure (`<article>` or `<div role="article">`)
  - [ ] Cards have headers, bodies, content
  - [ ] No empty `<div>` wrappers without purpose

### Console Errors

- [ ] **No Errors**: Open DevTools → Console
  - [ ] No red error messages
  - [ ] No TypeScript/React warnings
  - [ ] Network requests all successful (200 status)

---

## Task Coverage (Spec Alignment)

### Phase 2 Tasks (Design System Seed)

- [ ] **T004-T006**: Tokens defined and imported
  - [ ] CSS variables visible in computed styles
  - [ ] Tailwind classes use tokens
- [ ] **T007-T017**: Components (Button, Input, Card, Loading, Empty, Error, Pagination)
  - [ ] All components present on page
  - [ ] All using design tokens (no hardcoded colors)

### Phase 3 Tasks (SSR & Posts)

- [ ] **T019-T023**: SSR rendering and testing
  - [ ] Posts visible in initial HTML (SSR)
  - [ ] Sorting parameter in URL
  - [ ] No loading spinner on initial load

### Phase 4 Tasks (Pagination)

- [ ] **T026-T030**: Pagination integration
  - [ ] URL params update (`?page=X`)
  - [ ] Posts reorder correctly
  - [ ] Previous/Next buttons work

### Phase 5 Tasks (State Management)

- [ ] **T031-T039**: State UX
  - [ ] Loading state appears
  - [ ] Empty state appears
  - [ ] Error state appears
  - [ ] Retry works

### Phase 6 Tasks (Documentation)

- [ ] **T040-T044**: Figma & README
  - [ ] Look for Design System link in header/footer
  - [ ] Figma page exists with tokens documented

---

## Summary Scoring

**Total Test Items**: ~100

**Your Score**: **\_ / ~100 (\_\_**%)

**Issues Found**:

- [ ] None - All systems operational ✨
- [ ] Minor cosmetic issues
- [ ] Functional issues found:
  - [ ] Item 1: ******\_\_\_******
  - [ ] Item 2: ******\_\_\_******
  - [ ] Item 3: ******\_\_\_******

---

## Screenshots to Capture (For PR Review)

1. **Initial /posts load** (shows SSR content)
2. **Pagination controls** (Previous/Next buttons visible)
3. **Page 2 after clicking Next** (URL changed, new content)
4. **Mobile viewport** (responsive design check)
5. **Empty state** (if achievable)
6. **Error state** (if error is triggered)
7. **DevTools - CSS Variables** (showing token usage)
8. **DevTools - Console** (verifying no errors)

---

## Next Steps

If all tests pass:

- ✅ Week 9 frontend foundations are working correctly
- ✅ Design system tokens implemented
- ✅ SSR rendering functional
- ✅ Pagination and sorting working
- ✅ Accessibility compliant
- ✅ Ready for release as v9.0.0

If issues found:

- Open task items in the tasks.md file
- Create spec-update PR if behavior changes needed
- Link to this checklist in PR description
