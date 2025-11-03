# Implementation Plan: Week 9 Frontend Foundations & Design System Seed

**Branch**: `feat/frontend-foundations` | **Date**: 2025-11-03 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-frontend-foundations/spec.md`

---

## Summary

This week delivers core Next.js App Router frontend fundamentals with a design system seed (11 tokens + 3 base components: Button, Input, Card) that enable consistent, accessible UI at scale. The implementation focuses on SSR-first architecture for fast first paint (<2s FCP), route handlers as a backend-for-frontend (BFF) layer, state management patterns for loading/empty/error/success, and complete test coverage (≥80%) with Playwright a11y validation. All code is spec-driven, auditable in CI, deployed to GCP Cloud Run with Workload Identity Federation, and released as v9.0.0 with full traceability.

---

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), React 19, Next.js 15 App Router
**Primary Dependencies**: Tailwind CSS 4.x, SWR, Zod, Vitest, Playwright, @axe-core/playwright
**Storage**: N/A (stateless frontend; backend API provides data)
**Testing**: Vitest (unit + integration), Playwright (E2E + a11y)
**Target Platform**: Web (browser), deployed to GCP Cloud Run
**Project Type**: Web application (monorepo: api + frontend-next)
**Performance Goals**: <2s FCP on 4G, <1s API response, 100 Lighthouse score target
**Constraints**: SSR latency <500ms, ≥80% test coverage, 0 critical a11y violations
**Scale/Scope**: Single-page app with 5+ screens, 20-50 components by Week 10

---

## Constitution Check

**Gate: Must pass before Phase 0 research. Re-check after Phase 1 design.**

Based on project standards (DEVELOPMENT_RULES.md, CLAUDE.md):

✅ **Spec-Driven**: Feature specification (spec.md) complete with user stories, FRs, success criteria
✅ **Testing Mandatory**: ≥80% coverage required for components and route handlers
✅ **Type Safety**: TypeScript strict mode, Zod schema validation for API contracts
✅ **Accessibility**: WCAG 2.1 Level AA compliance, 0 critical a11y violations (Playwright + axe-core)
✅ **CI/CD Integration**: Quality Gate automation, artifact uploads, coverage aggregation
✅ **Documentation**: README with Design System section, Figma link, Run & Try guide
✅ **Traceability**: Linear issue linked, PRs reference spec, v9.0.0 release tag with evidence

**No violations detected.** Proceed to Phase 0 research.

---

## Project Structure

### Documentation (this feature)

```text
specs/009-frontend-foundations/
├── spec.md              # Feature specification (created)
├── research.md          # Phase 0 research (created)
├── data-model.md        # Phase 1 design (created)
├── plan.md              # This file (Phase 1 design)
├── quickstart.md        # Developer quick start (created)
├── tasks.md             # Phase 2 output (to be generated via /speckit.tasks)
├── checklists/
│   └── requirements.md  # Quality checklist (created)
└── contracts/           # Phase 1 output (to be generated for API contracts)
    ├── posts-get.schema.json
    ├── posts-post.schema.json
    └── posts-list.schema.json
```

### Source Code (repository root)

```text
frontend-next/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (import tokens.css)
│   │   ├── posts/
│   │   │   ├── page.tsx            # SSR /posts page (enhanced with sort)
│   │   │   └── [id]/               # Post detail pages (Week 10)
│   │   ├── api/
│   │   │   └── posts/
│   │   │       └── route.ts        # Route handler proxy (enhanced)
│   │   └── components/
│   │       ├── PostsPage.tsx       # Server component
│   │       └── PostsPageClient.tsx # Client component (SWR)
│   ├── components/
│   │   ├── Button.tsx              # NEW: Button component
│   │   ├── Button.test.tsx         # NEW: Button tests
│   │   ├── Input.tsx               # NEW: Input component
│   │   ├── Input.test.tsx          # NEW: Input tests
│   │   ├── Card.tsx                # NEW: Card component
│   │   ├── Card.test.tsx           # NEW: Card tests
│   │   ├── LoadingState.tsx        # NEW: Skeleton/spinner
│   │   ├── EmptyState.tsx          # NEW: Empty state card
│   │   ├── ErrorState.tsx          # NEW: Error state card
│   │   ├── PaginationControls.tsx  # NEW: Pagination UI
│   │   └── ...existing components
│   ├── lib/
│   │   ├── tokens.ts               # NEW: Token definitions (or tailwind config)
│   │   ├── schemas.ts              # UPDATED: Add PostListSchema, ErrorEnvelopeSchema
│   │   └── swr.ts                  # UPDATED: Pagination-aware SWR hooks
│   └── styles/
│       ├── tokens.css              # NEW: CSS custom properties
│       └── globals.css             # UPDATED: Import tokens
├── tailwind.config.ts              # NEW: Tailwind config with token theme
├── vitest.config.ts                # UPDATED: Component snapshot tests
├── playwright.config.ts            # UPDATED: A11y test configuration
├── tests/
│   ├── unit/
│   │   ├── Button.spec.ts          # NEW: Button unit tests
│   │   ├── Input.spec.ts           # NEW: Input unit tests
│   │   ├── Card.spec.ts            # NEW: Card unit tests
│   │   └── ...component tests
│   ├── integration/
│   │   ├── posts-ssr.spec.ts       # NEW: SSR snapshot test
│   │   ├── posts-pagination.spec.ts# NEW: Pagination integration
│   │   └── ...integration tests
│   └── playwright/
│       ├── a11y-posts.spec.ts      # NEW: A11y smoke test
│       ├── core-flows.spec.ts      # UPDATED: Add pagination test
│       └── ...E2E tests
└── README.md                       # UPDATED: Add Design System section

api/
├── src/
│   ├── app.ts                      # UNCHANGED: No API changes
│   └── ...existing API code
└── openapi.json                    # UNCHANGED: Contract validated by Spectral

.github/
├── workflows/
│   └── quality-gate.yml            # UNCHANGED: Runs all validation stages
```

**Structure Decision**: Web application (monorepo, frontend-next + api). Design system tokens are the bridge between UI components and design specs. Components are self-contained primitives with internal state + styling; pages compose components and wire data fetching.

---

## Component Architecture

### Primitive Components (Week 9 Foundations)

**Button**:

- Props: `variant` (primary/secondary/ghost), `loading`, `disabled`, standard HTML button attributes
- States: default, hover, focus, active, disabled, loading
- Styling: All colors/spacing from tokens, no hardcoded values
- A11y: `aria-busy="true"` when loading, visible focus indicator, keyboard activation (Enter/Space)
- Testing: 18 state combinations (3 variants × 6 states), visual snapshots, keyboard tests

**Input**:

- Props: `label`, `error`, `description`, `id`, standard HTML input attributes
- Structure: `<label>` + `<input>` + optional `<p id="...">description</p>` + optional `<p id="..." role="alert">error</p>`
- A11y: `aria-describedby` linking input to description/error, `aria-invalid="true"` when error
- Styling: Token colors (primary for focus, red for error), spacing from tokens
- Testing: Label association, error state rendering, aria-describedby validation

**Card**:

- Props: `header`, `children` (body), `footer`, optional `className`
- Structure: Flexible composition (header/body/footer optional)
- Styling: Token colors (surface background, text color), spacing/radius from tokens
- Use Cases: Post containers, empty states, error states, list layouts
- Testing: Renders with/without sections, spacing consistency, visual snapshots

### Composite Components (Week 9, built from primitives)

**LoadingState**:

- Shows skeleton UI or spinner during data fetch
- `aria-live="polite"` announcement: "Loading posts..."
- Component: `<div role="status" aria-live="polite" className="sr-only">{text}</div>`

**EmptyState**:

- Card with centered message + CTA button
- Triggers when `items.length === 0` and not loading
- Example: "No posts yet" + "Create your first post" button

**ErrorState**:

- Card with error message + "Retry" button
- `role="alert"` + `aria-live="assertive"` for immediate attention
- Shows error code/message from ErrorEnvelope

**PaginationControls**:

- Previous/Next buttons (disabled when at boundaries)
- Page number display: "Page X of Y"
- Button components with `onClick={() => router.push(...)}`
- Sort dropdown (optional: use native `<select>` for MVP)

### Page Components

**PostsPage** (Server Component):

- Fetches `/api/posts?page=searchParams.page&pageSize=10&sort=searchParams.sort`
- Renders initial HTML with post list (SSR first paint)
- Passes `initialData` to `PostsPageClient` for hydration
- Error boundary catches SSR errors

**PostsPageClient** (Client Component):

- Receives `initialData` from server
- Uses SWR hook with pagination params in key
- Renders LoadingState, EmptyState, ErrorState, or PostList
- Pagination controls call `router.push()` with new query params

---

## State Management Strategy

### SSR + SWR Pattern

```
User visits /posts?page=2&sort=title-asc
  ↓
Server Component (PostsPage)
  ├─ Reads searchParams from URL
  ├─ Fetches GET /api/posts?page=2&sort=title-asc
  └─ Renders HTML with posts (Server-Side-Rendered)
  ↓
Client hydrates PostsPageClient
  ├─ Receives initialData from server
  ├─ SWR hook: key = ['posts', page, sort], fallbackData = initialData
  ├─ revalidateOnMount = true (fetches fresh data)
  └─ User interaction (click pagination)
      ↓
  router.push('/posts?page=3')
      ↓
  URL changes, Server Component re-renders with new searchParams
      ↓
  Fresh HTML + updated initialData sent to client
      ↓
  SWR cache invalidated by key change
      ↓
  New data rendered
```

**Benefits**:

- SSR: <2s FCP, SEO-friendly, works without JS
- SWR: Fresh data, stale-while-revalidate caching, automatic refetch on focus
- URL-based state: Shareable links, back button support, browser history

### Error Handling

All errors follow ErrorEnvelope pattern:

```typescript
{
  error: {
    code: "UPSTREAM_FETCH_FAILED" | "VALIDATION_ERROR" | "UNAUTHORIZED",
    message: "User-friendly message",
    details?: { field: string; message: string }[] // for validation errors
  }
}
```

**Handling Strategy**:

- Route handlers wrap API calls in try-catch, map errors to ErrorEnvelope
- Client components check `if (response.error)` and render ErrorState
- SWR `onError` callback triggers error UI
- Error boundaries catch React errors (fallback UI)

---

## Design System Token Implementation

### Approach: Tailwind + CSS Variables

**Why Both?**

- Tailwind: Utility classes for rapid development, JIT purging for small bundle
- CSS Variables: Runtime theming, component style overrides, design tool integration

### Token Definitions (11 total)

**Colors** (4):

```css
--color-primary: #1f2937; /* Primary button, link hover, focus ring */
--color-surface: #ffffff; /* Card background, input background */
--color-text: #111827; /* Primary text color */
--color-text-muted: #6b7280; /* Secondary text, descriptions */
```

**Spacing** (4):

```css
--space-1: 0.25rem; /* 4px  - tight spacing (button padding) */
--space-2: 0.5rem; /* 8px  - compact spacing (input padding) */
--space-3: 1rem; /* 16px - comfortable spacing (card body padding) */
--space-4: 1.5rem; /* 24px - loose spacing (page margins) */
```

**Border Radius** (3):

```css
--radius-sm: 2px; /* Subtle rounding (input, button) */
--radius-md: 4px; /* Standard rounding (cards) */
--radius-lg: 8px; /* Prominent rounding (modals, popovers) */
```

### Tailwind Theme Config

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        surface: 'var(--color-surface)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
      },
      spacing: {
        '1': 'var(--space-1)',
        '2': 'var(--space-2)',
        '3': 'var(--space-3)',
        '4': 'var(--space-4)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
    },
  },
};
```

### Component Token Usage (No Hardcoded Values)

**Button Example**:

```tsx
// ✅ GOOD: Using token via Tailwind
<button className="bg-primary text-white px-4 py-2 rounded-md hover:opacity-90">
  Click me
</button>

// ❌ BAD: Hardcoded value
<button style={{ backgroundColor: '#1F2937' }}>
  Click me
</button>
```

**Card Example**:

```tsx
// ✅ GOOD: Using token spacing
<div className="bg-surface border border-gray-200 rounded-lg">
  <div className="px-4 py-3 border-b">
    {' '}
    {/* Uses space-2 + space-3 */}
    Header
  </div>
  <div className="px-4 py-4">
    {' '}
    {/* Uses space-4 */}
    Body
  </div>
</div>
```

---

## Testing Strategy

### Unit Tests (Vitest)

**Component Tests** (18+ total):

- Button: 18 snapshots (3 variants × 6 states)
- Input: 6 snapshots (with/without error, different states)
- Card: 3 snapshots (header, body, footer combinations)
- LoadingState, EmptyState, ErrorState: 1 snapshot each

**Coverage Goals**: ≥80% per component file

- All props tested
- All CSS classes applied correctly
- ARIA attributes present and correct
- Event handlers called appropriately

**Example Test**:

```typescript
describe('Button', () => {
  it('renders primary variant', () => {
    const { container } = render(
      <Button variant="primary">Click me</Button>
    );
    expect(container.firstChild).toHaveClass('bg-primary');
  });

  it('disables when loading', () => {
    const { getByRole } = render(
      <Button loading>Click me</Button>
    );
    expect(getByRole('button')).toBeDisabled();
  });

  it('has focus ring on focus', () => {
    const { getByRole } = render(
      <Button>Click me</Button>
    );
    fireEvent.focus(getByRole('button'));
    expect(getByRole('button')).toHaveClass('focus:ring-2');
  });
});
```

### Integration Tests (Vitest)

**SSR Snapshot Test**:

- Fetch `/api/posts` server-side
- Render `PostsPage` component
- Assert HTML contains expected post rows (before hydration)
- Verify no "Loading..." spinners in initial HTML

**Pagination Integration**:

- Render `PostsPageClient` with initialData (page 1)
- Click "Next Page" button
- Assert URL changed to `?page=2`
- Assert SWR key updated
- Verify new data rendered

**Example Test**:

```typescript
describe('Posts SSR', () => {
  it('renders posts in initial HTML', async () => {
    const initialData = {
      items: [{ id: '1', title: 'Post 1', author: 'Author' }],
      page: 1,
      pageSize: 10,
      hasNextPage: false,
    };
    const { container } = render(
      <PostsPage initialData={initialData} />
    );
    // Assert post title exists in DOM (server-rendered)
    expect(container.innerHTML).toContain('Post 1');
  });
});
```

### E2E Tests (Playwright)

**Core Flows**:

1. Load `/posts` → verify posts visible
2. Click "Next Page" → verify URL + new posts
3. Change sort → verify posts reorder
4. Simulate no posts → verify "No posts yet" message
5. Simulate API error → verify error message + retry button

**A11y Smoke Tests** (with axe-core):

- Scan `/posts` page
- Assert 0 critical violations
- Assert `<label>` for all inputs
- Assert ARIA attributes on dynamic regions
- Assert focus order is logical
- Assert color contrast meets WCAG AA

**Example Test**:

```typescript
test('posts list loads and paginates', async ({ page }) => {
  await page.goto('/posts');

  // Verify first post visible
  await expect(page.locator('text=Post 1')).toBeVisible();

  // Click next page
  await page.click('button:has-text("Next")');

  // Verify URL changed
  expect(page.url()).toContain('page=2');

  // Verify different post visible
  await expect(page.locator('text=Post 11')).toBeVisible();
});

test('posts page has no a11y violations', async ({ page }) => {
  await page.goto('/posts');
  const violations = await new AxeBuilder({ page }).analyze();
  expect(violations.violations.length).toBe(0);
});
```

---

## API Contracts

### GET /api/posts (Route Handler)

**Request**: `GET /api/posts?page=1&pageSize=10&sort=date-desc`

**Response** (200 OK):

```json
{
  "items": [
    {
      "id": "uuid-1",
      "title": "Post Title",
      "author": "Author Name",
      "content": "...",
      "createdAt": "2025-11-03T10:00:00Z",
      "updatedAt": "2025-11-03T10:00:00Z",
      "permissions": {
        "canEdit": true,
        "canDelete": true
      }
    }
  ],
  "page": 1,
  "pageSize": 10,
  "hasNextPage": false,
  "total": 1
}
```

**Error Response** (500):

```json
{
  "error": {
    "code": "UPSTREAM_FETCH_FAILED",
    "message": "Unable to fetch posts from backend"
  }
}
```

### Zod Schema

```typescript
const PostSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  author: z.string().min(1).max(100),
  content: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  permissions: z
    .object({
      canEdit: z.boolean(),
      canDelete: z.boolean(),
    })
    .optional(),
});

const PostListSchema = z.object({
  items: z.array(PostSchema),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  hasNextPage: z.boolean(),
  total: z.number().int().optional(),
});

const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});
```

---

## File Manifest

### New Files (Created in Week 9)

**Spec/Design Documents**:

- `specs/009-frontend-foundations/spec.md`
- `specs/009-frontend-foundations/research.md`
- `specs/009-frontend-foundations/data-model.md`
- `specs/009-frontend-foundations/plan.md` (this file)
- `specs/009-frontend-foundations/quickstart.md`
- `specs/009-frontend-foundations/checklists/requirements.md`

**Frontend Components & Styling**:

- `frontend-next/tailwind.config.ts` - Tailwind configuration with token theme
- `frontend-next/src/styles/tokens.css` - CSS custom properties
- `frontend-next/src/components/Button.tsx` - Button component
- `frontend-next/src/components/Input.tsx` - Input component
- `frontend-next/src/components/Card.tsx` - Card component
- `frontend-next/src/components/LoadingState.tsx` - Loading UI
- `frontend-next/src/components/EmptyState.tsx` - Empty state UI
- `frontend-next/src/components/ErrorState.tsx` - Error UI
- `frontend-next/src/components/PaginationControls.tsx` - Pagination UI

**Tests**:

- `frontend-next/tests/unit/Button.spec.ts`
- `frontend-next/tests/unit/Input.spec.ts`
- `frontend-next/tests/unit/Card.spec.ts`
- `frontend-next/tests/integration/posts-ssr.spec.ts`
- `frontend-next/tests/integration/posts-pagination.spec.ts`
- `frontend-next/tests/playwright/a11y-posts.spec.ts`

### Modified Files (Updated in Week 9)

**Core Files**:

- `frontend-next/src/app/layout.tsx` - Import `tokens.css`
- `frontend-next/src/app/posts/page.tsx` - Add `?sort=...` support to SSR
- `frontend-next/src/app/api/posts/route.ts` - Enhance error handling
- `frontend-next/src/components/PostsPageClient.tsx` - Add state UX (loading/empty/error)
- `frontend-next/src/lib/schemas.ts` - Add PostListSchema, ErrorEnvelopeSchema
- `frontend-next/src/lib/swr.ts` - Update to include pagination/sort params in key
- `frontend-next/README.md` - Add Design System section with Figma link
- `frontend-next/vitest.config.ts` - Enable snapshot tests
- `frontend-next/playwright.config.ts` - Add a11y configuration

### API Files (Minimal Changes)

- `api/openapi.json` - No changes (schema already defined)
- `api/src/app.ts` - No changes (API contract stable)

---

## Implementation Milestones

### Phase 0: Research (Complete)

- ✅ Tailwind + CSS variables approach confirmed
- ✅ SSR + SWR pattern validated
- ✅ Component prioritization (Button, Input, Card) locked
- ✅ Token set (11 tokens) defined
- ✅ Error handling pattern confirmed
- ✅ Pagination URL params schema finalized

### Phase 1: Design (Complete)

- ✅ Data model entities documented
- ✅ State machines designed
- ✅ API contracts defined
- ✅ Zod schemas specified
- ✅ File structure planned
- ✅ Testing strategy outlined

### Phase 2: Implementation (Next: /speckit.tasks)

**Day 1**: Spec PR + Linear issue creation
**Day 2**: Tokens + Components (Button, Input, Card) + Tests
**Day 3**: SSR `/posts` + State UX + Route handlers + Pagination
**Day 4**: Figma documentation + README updates
**Day 5**: Release v9.0.0 + Review Packet + Evidence links

### Phase 3: Validation (CI/CD)

- Lint: ESLint passes (no style violations)
- Typecheck: 0 TypeScript errors
- Tests: All unit + integration + E2E tests pass
- Coverage: ≥80% frontend + API
- A11y: 0 critical violations (Playwright + axe-core)
- Contract: Spectral validation errors = 0
- Build: All packages build successfully
- Deploy: Cloud Build → Cloud Run green
- Artifacts: Coverage, a11y HTML, contract results uploaded

---

## Risk Mitigations

| Risk                              | Mitigation                                                          |
| --------------------------------- | ------------------------------------------------------------------- |
| Tailwind bundle size grows        | Use JIT purging; verify bundle in build step; aim for <15KB gzipped |
| SSR latency exceeds budget        | Set 5s timeout; fallback to skeleton; SWR retries client-side       |
| Token drift (Figma ≠ Code)        | Manual review in Week 9; automate validation in Week 10             |
| A11y violations slip through      | Playwright + axe-core + manual screen reader testing                |
| SSR HTML mismatches client        | Enforce Server Components for data; use `"use client"` carefully    |
| Pagination breaks with large data | Enforce `pageSize ≤ 100`; test with 1000+ records                   |
| Spec changes mid-sprint           | Open spec-update PR; maintain traceability; update PR description   |

---

## Success Criteria Checklist

- [ ] All 29 functional requirements implemented (FR-001 through FR-029)
- [ ] 4 user stories fully realized with acceptance scenarios passing
- [ ] 11 design tokens defined and used (zero hardcoded values)
- [ ] 3 components (Button, Input, Card) with ≥80% coverage
- [ ] SSR first paint <2s on 4G network
- [ ] Pagination controls work with URL params
- [ ] Loading/empty/error states render correctly with ARIA live regions
- [ ] Playwright a11y scan: 0 critical violations
- [ ] Spectral validation: 0 errors
- [ ] Route handlers error map correctly
- [ ] Cloud Build deploy succeeds with WIF auth
- [ ] v9.0.0 release tagged with full traceability
- [ ] Review Packet contains all artifacts
- [ ] README updated with Design System section + Figma link
- [ ] 4-tier local validation passes for all PRs

---

## Next Steps

1. **Generate `/speckit.tasks`**: Create dependency-ordered task list for 5-day sprint
2. **Execute tasks**: Follow task breakdown (Day 1–5) with daily PRs
3. **Week 10 Planning**: Expand component library (Modal, Dropdown, Badge, Alert), automate Figma token sync, add dark mode theme
4. **Week 11+**: Form field grouping, internationalization (i18n), advanced validation patterns

---

## Resources & References

- **Spec**: [spec.md](spec.md)
- **Research**: [research.md](research.md)
- **Data Model**: [data-model.md](data-model.md)
- **Quick Start**: [quickstart.md](quickstart.md)
- **Development Rules**: [DEVELOPMENT_RULES.md](../../DEVELOPMENT_RULES.md)
- **Project Guidance**: [CLAUDE.md](../../CLAUDE.md)
- **Tailwind Docs**: https://tailwindcss.com/docs
- **Next.js App Router**: https://nextjs.org/docs/app
- **Playwright A11y**: https://playwright.dev/docs/accessibility-testing
- **Cloud Run**: https://cloud.google.com/run/docs
