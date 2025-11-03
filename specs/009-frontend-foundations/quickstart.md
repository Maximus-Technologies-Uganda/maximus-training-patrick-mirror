# Quick Start: Week 9 Frontend Foundations

## Development Setup

### 1. Prerequisites

Ensure you have the following installed and configured:

- **Node.js 20.x LTS** (`node --version` should show v20.x)
- **pnpm 9.x** via Corepack (`corepack enable && corepack prepare pnpm@9.x --activate`)
- **Google Cloud SDK** (for deployment, optional for local dev)
- **Figma access** (read/write to team workspace for design review)
- **Docker** (for running GitHub Actions locally via `act`)

**Verify Installation**:

```bash
node --version   # Should be v20.x
pnpm --version   # Should be 9.x
gcloud --version # Optional for deployment
```

---

### 2. Install Dependencies

From the repository root:

```bash
# Install all monorepo dependencies
pnpm install

# Verify frontend-next can build
cd frontend-next
pnpm build
```

---

### 3. Token Implementation

Design system tokens will be defined in two places:

#### a. Tailwind Config (`frontend-next/tailwind.config.ts`)

Create or update the Tailwind config to include token definitions:

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
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
  plugins: [],
};

export default config;
```

#### b. CSS Variables (`frontend-next/src/styles/tokens.css`)

Define CSS custom properties for runtime access:

```css
:root {
  /* Colors */
  --color-primary: #1f2937;
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-text-muted: #6b7280;

  /* Spacing */
  --space-1: 0.25rem; /* 4px */
  --space-2: 0.5rem; /* 8px */
  --space-3: 1rem; /* 16px */
  --space-4: 1.5rem; /* 24px */

  /* Border Radius */
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
}
```

Import this file in your root layout (`frontend-next/src/app/layout.tsx`):

```tsx
import '../styles/tokens.css';
```

---

### 4. Component Library Setup

Create the three foundational components in `frontend-next/src/components/`:

#### a. Button Component (`Button.tsx`)

```tsx
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps): React.ReactElement {
  const baseStyles =
    'px-4 py-2 rounded-md font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
  const variantStyles = {
    primary: 'bg-primary text-white hover:opacity-90 active:scale-95',
    secondary: 'bg-surface border border-text text-text hover:bg-gray-50',
    ghost: 'text-primary hover:bg-gray-100',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variantStyles[variant]} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      aria-busy={loading}
      {...props}
    >
      {loading ? <span>Loading...</span> : children}
    </button>
  );
}
```

#### b. Input Component (`Input.tsx`)

```tsx
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  description?: string;
}

export function Input({
  label,
  error,
  description,
  id,
  className = '',
  ...props
}: InputProps): React.ReactElement {
  const inputId = id || `input-${Math.random().toString(36).slice(2)}`;
  const errorId = `${inputId}-error`;
  const descId = `${inputId}-desc`;

  return (
    <div className="flex flex-col space-y-1">
      <label htmlFor={inputId} className="text-sm font-medium text-text">
        {label}
      </label>
      {description && (
        <p id={descId} className="text-sm text-text-muted">
          {description}
        </p>
      )}
      <input
        id={inputId}
        className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : description ? descId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
```

#### c. Card Component (`Card.tsx`)

```tsx
import React from 'react';

interface CardProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function Card({ header, children, footer, className = '' }: CardProps): React.ReactElement {
  return (
    <div className={`bg-surface border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {header && <div className="px-4 py-3 border-b border-gray-200">{header}</div>}
      <div className="px-4 py-4">{children}</div>
      {footer && <div className="px-4 py-3 border-t border-gray-200">{footer}</div>}
    </div>
  );
}
```

---

### 5. SSR Posts Page

The `/posts` page already has SSR implemented. Enhance it with the new components:

**Key Files**:

- `frontend-next/src/app/posts/page.tsx` - Server Component with SSR fetch
- `frontend-next/components/PostsPageClient.tsx` - Client component with SWR + state UX

**Enhancements Needed**:

1. Add loading/empty/error state UI using Card component
2. Add pagination controls using Button component
3. Ensure ARIA live regions announce state changes

**Example Loading State**:

```tsx
{
  isLoading && (
    <div role="status" aria-live="polite" className="sr-only">
      Loading posts...
    </div>
  );
}
```

**Example Empty State**:

```tsx
{
  !isLoading && items.length === 0 && (
    <Card>
      <div className="text-center py-8">
        <p className="text-text-muted mb-4">No posts yet</p>
        <Button variant="primary" onClick={() => router.push('/posts/create')}>
          Create your first post
        </Button>
      </div>
    </Card>
  );
}
```

**Example Error State**:

```tsx
{
  error && (
    <Card>
      <div role="alert" className="text-center py-8">
        <p className="text-red-600 mb-4">Failed to load posts</p>
        <Button variant="secondary" onClick={() => mutate()}>
          Retry
        </Button>
      </div>
    </Card>
  );
}
```

---

### 6. Run the App Locally

#### a. Start API Backend

```bash
cd api
pnpm dev
# API runs on http://localhost:8080
```

#### b. Start Frontend

```bash
cd frontend-next
pnpm dev
# Frontend runs on http://localhost:3000
```

#### c. View Posts Page

Navigate to http://localhost:3000/posts - you should see:

- Server-rendered post list (view page source to confirm HTML before hydration)
- Pagination controls (if more than 10 posts exist)
- Loading/empty/error states (simulate by stopping API or using empty DB)

---

### 7. Testing

#### a. Unit Tests (Vitest)

Test components in isolation:

```bash
cd frontend-next
pnpm test:unit

# Test specific component
pnpm test -- Button.test.tsx
```

#### b. E2E + A11y Tests (Playwright)

Test full user flows and accessibility:

```bash
cd frontend-next
pnpm test:e2e

# Run with UI
pnpm test:e2e --ui

# Generate HTML report
pnpm test:e2e --reporter=html
```

#### c. Contract Tests

Validate route handlers match API schema:

```bash
pnpm -w frontend-next run test:contract
```

---

### 8. Local Validation (Pre-Push)

Before pushing, run the mandatory 4-tier validation:

```bash
# Tier 1 (automatic on commit): Prettier + ESLint
git add . && git commit -m "feat(design-system): add Button, Input, Card components"

# Tier 2 (automatic on push): TypeScript type-check
npm run typecheck:bail

# Tier 3 (automatic on push): Full test suite
bash scripts/test-locally.sh

# Tier 4 (automatic on push): GitHub Actions simulation
act -W .github/workflows/quality-gate.yml
```

---

## Key Files to Modify/Create

### New Files (Week 9)

- `frontend-next/tailwind.config.ts` - Tailwind config with token definitions
- `frontend-next/src/styles/tokens.css` - CSS custom properties
- `frontend-next/src/components/Button.tsx` - Button component
- `frontend-next/src/components/Button.test.tsx` - Button tests
- `frontend-next/src/components/Input.tsx` - Input component
- `frontend-next/src/components/Input.test.tsx` - Input tests
- `frontend-next/src/components/Card.tsx` - Card component
- `frontend-next/src/components/Card.test.tsx` - Card tests

### Modified Files (Week 9)

- `frontend-next/src/app/posts/page.tsx` - Enhance SSR with sort param support
- `frontend-next/components/PostsPageClient.tsx` - Add state UX (loading/empty/error) using new components
- `frontend-next/src/app/layout.tsx` - Import `tokens.css`
- `frontend-next/README.md` - Add Design System section with Figma link

---

## Deliverable Checklist

Use this checklist to track Week 9 progress:

### Day 1: Spec + Planning

- [ ] Spec PR merged to main
- [ ] Linear issue created and linked to spec
- [ ] research.md, data-model.md, quickstart.md created
- [ ] Plan document generated via `/speckit.plan`

### Day 2: Design System Tokens + Components

- [ ] Tailwind config created with token definitions
- [ ] `tokens.css` created and imported in layout
- [ ] Button component implemented with 3 variants (primary/secondary/ghost)
- [ ] Input component implemented with label/error/description
- [ ] Card component implemented with header/body/footer
- [ ] Component tests pass (Vitest unit tests ≥80% coverage)
- [ ] Playwright a11y scan shows 0 critical violations
- [ ] PR opened with "feat(design-system): add foundational components"

### Day 3: SSR Posts Page + State UX

- [ ] `/posts` page supports `?page=N&sort=...` URL params
- [ ] Loading state UI implemented with skeleton or spinner
- [ ] Empty state UI implemented with styled Card + CTA
- [ ] Error state UI implemented with error Card + Retry button
- [ ] ARIA live regions added for state announcements
- [ ] Pagination controls implemented using Button component
- [ ] Playwright E2E tests pass (posts list, pagination, states)
- [ ] PR opened with "feat(posts): add pagination and state UX"

### Day 4: Figma Documentation + README

- [ ] Figma page "Week 9 Tokens & Primitives" created
- [ ] All 11 tokens documented in Figma with usage notes
- [ ] Button/Input/Card variants visually documented in Figma
- [ ] Design review completed (code vs Figma parity confirmed)
- [ ] README updated with Design System section linking to Figma
- [ ] PR opened with "docs: add design system documentation"

### Day 5: Release + Review Packet

- [ ] All PRs merged to main
- [ ] Quality Gate green (lint, typecheck, tests, coverage, a11y, contract)
- [ ] Coverage reports uploaded as artifacts
- [ ] A11y HTML report uploaded as artifact
- [ ] Cloud Build deploy job completes successfully
- [ ] Cloud Run service responds to requests (smoke test passes)
- [ ] Review packet generated with all artifacts
- [ ] Git tag `v9.0.0` created with release notes
- [ ] Release notes link to spec PR, Linear issue, Gate run, Packet, demo URL
- [ ] Retro journal entry completed

---

## Common Pitfalls & Tips

### Pitfall: Tailwind Not Picking Up New Classes

**Solution**: Ensure `tailwind.config.ts` `content` array includes all component paths. Restart dev server after config changes.

### Pitfall: ARIA Attributes Not Announced by Screen Readers

**Solution**: Test with actual screen reader (NVDA/JAWS/VoiceOver). Ensure `aria-live` regions exist in DOM before state changes. Use `role="status"` for non-critical updates, `role="alert"` for errors.

### Pitfall: SSR HTML Doesn't Match Client Hydration

**Solution**: Avoid client-only code in Server Components. Use `"use client"` directive for components with `useState`, `useEffect`, or event handlers. Ensure SSR fetch and client SWR return same shape.

### Pitfall: Pagination URL Params Not Updating

**Solution**: Use `router.push()` from `next/navigation` with full query string. Ensure SWR key includes pagination params to trigger refetch.

### Pitfall: Token Values Drift Between Figma and Code

**Solution**: Manually review tokens after Figma updates. Document expected values in README. Add CI automation in Week 10.

---

## Deployment

### Local Preview (Cloud Build Simulation)

```bash
# Build Docker image locally
cd frontend-next
docker build -t frontend-preview .
docker run -p 3000:3000 -e API_BASE_URL=http://localhost:8080 frontend-preview
```

### Deploy to Cloud Run (via CI)

1. Push to main branch (after PR merge)
2. GitHub Actions triggers Cloud Build
3. Cloud Build builds and deploys API + frontend
4. Verify deployment at Cloud Run URLs (printed in CI logs)

### Manual Deploy (if needed)

```bash
cd frontend-next
gcloud builds submit --config=cloudbuild.yaml --project=<PROJECT_ID>
```

---

## Support & Troubleshooting

- **API not responding**: Check `pnpm dev` is running in `api/` directory. Verify port 8080 is not in use.
- **Frontend build errors**: Run `pnpm install` again. Clear `.next/` cache with `rm -rf .next`.
- **Playwright tests fail locally**: Ensure app is running on port 3000. Check `NEXT_PUBLIC_APP_URL` env var.
- **Coverage below threshold**: Run `pnpm test:ci` to see detailed coverage report. Add tests for uncovered branches.
- **Figma tokens don't match code**: Re-export tokens from Figma. Update `tailwind.config.ts` and `tokens.css` manually.

---

## Next Actions After Week 9

1. **Week 10**: Expand component library (Modal, Dropdown, Badge, Alert)
2. **Week 10**: Automate Figma token sync (Tokens Studio → CI validation)
3. **Week 10**: Add dark mode theme system using CSS variables
4. **Week 11**: Form field grouping and advanced validation patterns
5. **Week 11**: Internationalization (i18n) for multi-language support

---

## Resources

- **Spec**: `specs/009-frontend-foundations/spec.md`
- **Plan**: `specs/009-frontend-foundations/plan.md` (generated via `/speckit.plan`)
- **Tasks**: `specs/009-frontend-foundations/tasks.md` (generated via `/speckit.tasks`)
- **Development Rules**: `DEVELOPMENT_RULES.md` (standards and policies)
- **Figma**: [Week 9 Tokens & Primitives](https://figma.com/...) (link to be added after creation)
- **Cloud Run Frontend**: https://maximus-training-frontend-673209018655.africa-south1.run.app
- **Cloud Run API**: https://maximus-training-api-wyb2jsgqyq-bq.a.run.app

---

## Success Metrics

At the end of Week 9, you should have:

- **11 design tokens** defined and used across all components
- **3 foundational components** (Button, Input, Card) with tests and a11y compliance
- **SSR posts page** with <2s FCP, pagination, sorting, and state UX
- **0 critical a11y violations** in Playwright scans
- **≥80% test coverage** for frontend components and route handlers
- **Green Quality Gate** with all artifacts uploaded
- **v9.0.0 release** tagged with complete traceability

If any metric is not met, the week is not complete. Use the checklist above to track progress and ensure all deliverables are met.
