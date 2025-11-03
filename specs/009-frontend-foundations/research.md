# Research: Week 9 Frontend Foundations

## Design System Implementation

**Decision**: Tailwind CSS with CSS custom properties (CSS variables) for design tokens

**Rationale**:

- The project already has Next.js infrastructure but no Tailwind config yet, providing a clean slate
- Tailwind provides utility-first CSS with excellent developer experience and minimal runtime overhead
- CSS variables enable runtime theming and align with industry-standard token patterns
- Figma token export can map directly to CSS variables for code-design parity
- JIT compilation ensures only used styles ship to production, keeping bundle size minimal
- Tailwind's `theme.extend` allows seamless token integration while preserving default utilities

**Alternatives Considered**:

- **Styled-components**: Requires runtime CSS-in-JS overhead (~8-12KB), slower SSR hydration, conflicts with Next.js App Router recommendations
- **CSS Modules with plain CSS**: More manual work for variants/states, no utility classes for rapid prototyping, harder to enforce consistency
- **Vanilla CSS with CSS variables only**: No component composition patterns, manual class management, steeper learning curve for teams

**Implementation Strategy**:

1. Define tokens in `frontend-next/tailwind.config.ts` using `theme.extend`
2. Export tokens as CSS variables in `frontend-next/src/styles/tokens.css` for runtime access
3. Components reference Tailwind utilities (e.g., `bg-primary`, `space-y-4`) backed by token values
4. Non-Tailwind contexts (e.g., inline styles for dynamic values) can reference `var(--color-primary)`

---

## Next.js SSR Data Fetching

**Decision**: Server Components with async fetch in page.tsx + client-side SWR revalidation pattern (already implemented)

**Rationale**:

- Existing `/posts/page.tsx` demonstrates this pattern: SSR fetch → pass `initialData` to client component → SWR revalidates on mount
- Server Components provide zero-JS-overhead initial render with full HTML in first paint (<2s FCP requirement)
- SWR's `revalidateOnMount` ensures fresh data without flicker (uses cached data during revalidation)
- Pattern supports both SSR SEO benefits and client-side interactivity (pagination, sorting) without full page reloads
- Falls back gracefully: if SSR fetch fails, client SWR retries with loading state

**Alternatives Considered**:

- **App Router generateStaticParams + ISR**: Requires build-time data, doesn't support dynamic pagination or user-specific content; over-engineered for this use case
- **Middleware-based revalidation**: Adds complexity for marginal benefit; SWR already handles cache invalidation elegantly
- **Pure client-side fetching (no SSR)**: Violates FR-006 (≤2s FCP) and degrades SEO; unacceptable for content pages

**Refinements for Week 9**:

- Current SSR only pre-fetches page 1; extend to support `?page=N` and `?sort=...` in SSR path
- Add skeleton/loading states for client-side page transitions (SWR `isLoading` flag)
- Ensure error boundaries capture SSR fetch failures and render fallback UI

---

## Route Handler Error Mapping

**Decision**: Standard error envelope pattern with structured error codes and client-friendly messages

**Rationale**:

- Existing `/api/posts/route.ts` already implements this: upstream errors → `{ error: { code, message } }` envelope
- Prevents leaking internal API details (stack traces, service URLs) to frontend
- Enables client-side error handling with predictable shape (e.g., `if (data.error) { ... }`)
- Matches API error schema from `api/openapi.json` (ErrorEnvelope, ValidationErrorEnvelope)
- Supports telemetry: structured logs with `requestId` + `traceparent` for distributed tracing

**Error Envelope Schema**:

```typescript
{
  error: {
    code: string;        // e.g., "UPSTREAM_FETCH_FAILED", "VALIDATION_ERROR"
    message: string;     // User-facing message (safe to display)
    details?: unknown;   // Optional: field-level errors for validation
  }
}
```

**Alternatives Considered**:

- **Pass-through errors**: Leaks internal details (stack traces, DB errors), security risk, inconsistent format across services
- **HTTP status codes only**: Insufficient context for UX (can't distinguish "network timeout" vs "unauthorized" without body), requires manual parsing
- **Custom status codes (e.g., 499 for client-closed request)**: Non-standard, breaks OpenAPI validation, confuses clients expecting standard HTTP semantics

**Implementation**:

- Route handlers catch all upstream errors and return 500 with `{ error: { code: "UPSTREAM_*", message: "..." } }`
- Validation errors (400, 422) preserve upstream `details` field for form feedback
- 401/403 errors map to login redirects (client-side) or clear "Unauthorized" messages

---

## Pagination Patterns

**Decision**: URL query parameters with `?page=N&pageSize=M&sort=field-direction` convention

**Rationale**:

- Already partially implemented in `/posts/page.tsx` (reads `page` and `pageSize` from searchParams)
- URL-based state enables:
  - Shareable links (users can bookmark or share page 3 of sorted results)
  - Browser back/forward navigation works intuitively
  - SEO-friendly (search engines can index paginated content)
- Next.js App Router's `searchParams` prop provides seamless server/client integration
- Matches REST API conventions and OpenAPI parameter patterns

**Parameter Schema**:

- `page`: Integer ≥1 (default: 1)
- `pageSize`: Integer 1-100 (default: 10)
- `sort`: Enum `date-asc | date-desc | title-asc | title-desc` (default: `date-desc`)

**Client Interaction**:

- Pagination controls call `router.push()` with updated query params
- SWR key includes pagination params → automatic cache invalidation on param change
- Server Components re-render with new `searchParams` → fresh SSR HTML

**Alternatives Considered**:

- **Cursor-based pagination**: Better for infinite scroll but harder to jump to arbitrary pages; overkill for this use case (posts list is finite and manageable)
- **Offset/limit params**: Similar to page/pageSize but less intuitive for users ("page 3" vs "offset 20"); industry prefers page-based for UI
- **POST body pagination**: Non-cacheable, breaks back button, violates REST conventions for GET requests

---

## Accessible State Management

**Decision**: ARIA live regions (`role="status"` for loading/success, `role="alert"` for errors) with `aria-describedby` linking

**Rationale**:

- WCAG 2.1 Level AA compliance requires announcing dynamic state changes to screen readers
- `aria-live="polite"` ensures announcements don't interrupt user flow (e.g., reading another section)
- `role="status"` for non-critical updates (loading, success) vs `role="alert"` for errors that need immediate attention
- `aria-describedby` links form inputs to help text and error messages, improving context for screen reader users
- React 19's improved support for ARIA attributes simplifies implementation (no need for refs or manual DOM manipulation)

**Implementation Pattern**:

```tsx
// Loading state
<div role="status" aria-live="polite" className="sr-only">
  Loading posts...
</div>

// Error state
<div role="alert" aria-live="assertive">
  <p id="error-msg">Failed to load posts. <button>Retry</button></p>
</div>

// Input with error
<input
  id="title"
  aria-describedby="title-error"
  aria-invalid={!!error}
/>
<p id="title-error" role="alert">{error}</p>
```

**Alternatives Considered**:

- **Toast notifications**: Require additional library, can be missed if dismissed too quickly, not always announced by screen readers
- **Modal dialogs for errors**: Too disruptive for non-critical errors (e.g., network retry), blocks interaction with rest of page
- **Client-side focus management only**: Insufficient for users who navigate by virtual cursor, doesn't announce asynchronous updates

**Testing Strategy**:

- Playwright + axe-core scans enforce ARIA best practices (FR-018: 0 critical violations)
- Manual screen reader testing (NVDA/JAWS on Windows, VoiceOver on macOS) validates announcements
- Automated tests assert presence of `role`, `aria-live`, `aria-describedby` attributes

---

## Component Prioritization

**Decision**: Button, Input, Card as Week 9 foundational primitives

**Rationale**:

- **Button**: Most reused component across app (CTAs, pagination, form submit, retry actions); needs variants (primary/secondary/ghost) and states (disabled/loading)
- **Input**: Required for any form interaction (post creation, search, login); demonstrates accessible label/error patterns with `aria-describedby`
- **Card**: Structural primitive for posts list, empty states, error messages; establishes layout patterns (header/body/footer) for future components

**Why These Over Others**:

- **Badge/Alert**: Less frequently used; can be added Week 10 once base patterns established
- **Modal/Dialog**: Complex accessibility requirements (focus trap, backdrop, ESC handling); defer to Week 10 with more time
- **Dropdown/Select**: Native `<select>` sufficient for initial sort controls; custom dropdown is Week 10 enhancement

**Success Criteria for Each**:

- **Button**: Renders 3 variants × 6 states = 18 test cases; all keyboard-accessible (Enter/Space activation); loading state shows spinner + disables clicks
- **Input**: Label + input + help text + error state; `aria-describedby` links to description; error styling uses token colors
- **Card**: Flexible composition with optional header/footer; spacing uses token scale (`space-2`, `space-4`); renders with or without elevation

---

## Figma Token Sync

**Decision**: Manual token definition export for Week 9; automated sync deferred to Week 10+

**Rationale**:

- Week 9 focus is establishing initial token vocabulary and proving the pattern works
- Manual export (copy values from Figma → code) is low-risk and requires minimal tooling
- Ensures team alignment on token names and values before investing in automation
- Automated sync (Figma Tokens plugin → CI validation) is valuable but non-blocking for MVP

**Week 9 Process**:

1. Designer defines tokens in Figma (Week 9 Tokens & Primitives page)
2. Developer manually transcribes token definitions to `tailwind.config.ts` and `tokens.css`
3. Design review confirms parity (visual comparison of Button/Input/Card in Figma vs localhost)
4. Document token reference in README with Figma link (FR-028)

**Week 10+ Automation**:

- Export Figma tokens as JSON (using Tokens Studio plugin or similar)
- Add CI check comparing exported tokens vs code definitions
- Fail CI if values drift (e.g., `--color-primary` is `#1F2937` in Figma but `#1E293B` in code)
- Automate PRs when Figma tokens update (optional future enhancement)

**Alternatives Considered**:

- **Automated sync from day 1**: Over-engineered for 11 tokens; manual process validates workflow first before tooling investment
- **Code-first tokens (no Figma sync)**: Designers lose single source of truth; risk of visual drift; Figma is established design collaboration tool
- **Live Figma API integration**: Requires network calls during build, fragile to Figma outages, adds unnecessary complexity

**Token Export Checklist** (Manual Validation):

- [ ] Color tokens: primary, surface, text, text-muted (4 tokens)
- [ ] Spacing tokens: space-1 through space-4 (4 tokens)
- [ ] Radius tokens: radius-sm, radius-md, radius-lg (3 tokens)
- [ ] All tokens documented in Figma with usage notes
- [ ] Code definitions match Figma values (hex colors, rem units for spacing)
- [ ] README links to Figma page with note about Week 10 automation

---

## Summary Table

| Decision Area            | Chosen Approach                             | Key Benefit                                     |
| ------------------------ | ------------------------------------------- | ----------------------------------------------- |
| Design System            | Tailwind + CSS Variables                    | Runtime theming, minimal bundle, DX             |
| SSR Data Fetching        | Server Components + SWR revalidation        | <2s FCP, fresh data, no flicker                 |
| Route Handler Errors     | Standard error envelope                     | Security, consistency, structured logs          |
| Pagination               | URL query params (`?page=N`)                | Shareable links, SEO, back button support       |
| Accessible State         | ARIA live regions + `aria-describedby`      | WCAG AA compliance, screen reader announcements |
| Component Prioritization | Button, Input, Card                         | High reuse, establishes patterns for Week 10    |
| Figma Token Sync         | Manual export (Week 9), automation deferred | Low risk, validates workflow before automation  |

---

## Risks & Mitigations

| Risk                                                 | Mitigation                                                                |
| ---------------------------------------------------- | ------------------------------------------------------------------------- |
| Tailwind increases bundle size                       | JIT purges unused classes; verify bundle size in build step               |
| SSR fetch timeout degrades UX                        | 5s timeout + fallback to skeleton; SWR retries client-side                |
| Token drift between Figma and code                   | Manual review in Week 9; CI automation in Week 10                         |
| Pagination breaks with large datasets                | Enforce `pageSize ≤ 100`; API should handle efficiently                   |
| Screen reader announcements ignored                  | Test with NVDA/JAWS; Playwright axe-core enforces ARIA attributes         |
| Components become inconsistent without design system | All components MUST use tokens (enforced by code review + snapshot tests) |

---

## Next Steps

1. Create `data-model.md` to define entities and API contracts
2. Create `quickstart.md` with step-by-step setup and deliverable checklist
3. Generate `plan.md` with full implementation strategy
4. Generate `tasks.md` with dependency-ordered task breakdown for 5-day sprint
