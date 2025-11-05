# Phase 2 Component Showcase

## Overview

This document provides guidance for viewing and capturing screenshots of Phase 2 design system components for PR documentation.

## Live Demo Page

A comprehensive demo page showcasing all Phase 2 components is available at:

```
/design-system-demo
```

### Viewing Locally

```bash
cd frontend-next
npm run dev
# Open http://localhost:3001/design-system-demo
```

### Viewing in PR Preview

After deployment, the demo page will be available at:

```
https://[preview-url]/design-system-demo
```

## Components Included

### Primitive Components

1. **Button**
   - 3 variants: primary, secondary, ghost
   - 3 sizes: sm, md, lg
   - States: normal, disabled, loading
   - All variant/size combinations

2. **Input**
   - Basic input with label
   - Input with description
   - Error state with validation message
   - Disabled state
   - Combined features (label + description + error)

3. **Card**
   - Basic card (body only)
   - Card with header
   - Card with footer
   - Complete card (header + body + footer)

### Composite Components

4. **LoadingState**
   - Animated spinner
   - Customizable message
   - ARIA live region

5. **EmptyState**
   - Empty icon
   - Title and message
   - Optional action button

6. **ErrorState**
   - Error icon
   - Error message
   - Retry button
   - ARIA alert

7. **PaginationControls**
   - Previous/Next buttons
   - Page indicator
   - Disabled states
   - Full accessibility

### Additional Sections

- **Real-World Example**: User profile form demonstrating component composition
- **Design Tokens Reference**: Visual representation of colors, spacing, and border-radius tokens

## Capturing Screenshots

### Recommended Approach

1. Deploy PR to preview environment
2. Open `/design-system-demo` in browser
3. Take screenshots using browser dev tools or screenshot tool

### Screenshot Checklist

For PR documentation, capture the following:

- [ ] Full page overview
- [ ] Button variants section
- [ ] Button sizes section
- [ ] Button states (normal, disabled, loading)
- [ ] Input basic state
- [ ] Input error state
- [ ] Card layouts grid
- [ ] Composite components (LoadingState, EmptyState, ErrorState)
- [ ] PaginationControls
- [ ] Real-world example (User Profile form)

### Using Browser Dev Tools

**Chrome/Edge:**
1. Open dev tools (F12)
2. Press Ctrl+Shift+P (Cmd+Shift+P on Mac)
3. Type "Capture screenshot"
4. Choose "Capture full size screenshot" or "Capture node screenshot"

**Firefox:**
1. Right-click on page element
2. Select "Screenshot Node" or use Shift+F2 → `screenshot --fullpage`

### Automated Screenshot Capture (Local Only)

A Playwright screenshot script is available but requires a non-sandboxed environment:

```bash
# Note: May not work in Docker/CI environments
npx tsx scripts/capture-screenshots.ts
```

Screenshots will be saved to `docs/screenshots/`.

## PR Documentation Requirements

Per DEVELOPMENT_RULES.md, PRs with UI changes must include:

1. **Screenshots**: Visual evidence of rendered components
2. **Demo URL**: Link to preview deployment with `/design-system-demo` path
3. **Gate Artifacts**: Coverage, a11y, contract validation results
4. **Linked Plan**: Reference to spec.md → plan.md → tasks.md

## Component Testing Evidence

### Unit Tests
- 130+ tests covering all components
- Run: `npm test`
- Coverage: See Gate artifacts

### Accessibility Tests
- WCAG 2.1 AA compliance
- Playwright + axe-core
- Run: `npm run test:e2e -- tests/playwright/a11y-components.spec.ts`

### Visual Regression Testing
Future enhancement: Consider adding Playwright visual regression tests for automated screenshot comparison.

## Accessibility Features Demonstrated

All components showcase:
- ✅ Semantic HTML (button, input, nav, etc.)
- ✅ ARIA attributes (aria-label, aria-describedby, aria-invalid, etc.)
- ✅ Keyboard navigation support
- ✅ Focus indicators (focus:ring-2)
- ✅ Screen reader support (role="status", role="alert", aria-live)
- ✅ Disabled state handling
- ✅ Loading state announcements

## Design Token Usage

All components use design tokens defined in `tailwind.config.ts`:

**Colors:**
- `primary` (--color-primary)
- `surface` (--color-surface)
- `text` (--color-text)
- `text-muted` (--color-text-muted)
- `error` (--color-error)

**Spacing:**
- `xs`, `sm`, `md`, `lg`, `xl` (--spacing-*)

**Border Radius:**
- `rounded-sm`, `rounded-md`, `rounded-lg` (--border-radius-*)

## Browser Compatibility

Tested on:
- Chrome 120+
- Firefox 120+
- Safari 17+
- Edge 120+

## Performance Considerations

The demo page demonstrates:
- Module-level constants (no re-creation on render)
- Type-safe props with TypeScript
- Efficient className merging with `cn()` utility
- Minimal re-renders with proper React patterns

## Next Steps

After Phase 2 completion:
1. Capture screenshots from PR preview
2. Update PR description with visual evidence
3. Verify all Gate checks pass (coverage, a11y, contract)
4. Request review with complete documentation

## Questions?

See:
- [DEVELOPMENT_RULES.md](/DEVELOPMENT_RULES.md) - PR requirements
- [CLAUDE.md](/CLAUDE.md) - Project structure and standards
- Component source files in `frontend-next/src/components/`
