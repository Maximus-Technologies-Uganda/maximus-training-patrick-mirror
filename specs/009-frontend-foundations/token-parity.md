# Token Parity Checklist

**Phase**: 6 (Documentation & Design System Alignment)  
**Status**: In Progress  
**Goal**: Ensure all 11 design tokens are documented in Figma, exported, and synced with codebase

---

## Design Tokens (11 Total)

### Color Tokens (6)

- [ ] **Primary**: `#0066CC` - Primary action color (buttons, links, accents)
  - Figma name: `colors/primary`
  - CSS variable: `--color-primary`
  - Usage: CTA buttons, active states, primary links
  - Parity: ⚠️ Pending

- [ ] **Secondary**: `#6B7280` - Secondary actions and text
  - Figma name: `colors/secondary`
  - CSS variable: `--color-secondary`
  - Usage: Secondary buttons, secondary text, borders
  - Parity: ⚠️ Pending

- [ ] **Success**: `#10B981` - Success states and confirmations
  - Figma name: `colors/success`
  - CSS variable: `--color-success`
  - Usage: Success messages, checkmarks, positive indicators
  - Parity: ⚠️ Pending

- [ ] **Warning**: `#F59E0B` - Warning and caution states
  - Figma name: `colors/warning`
  - CSS variable: `--color-warning`
  - Usage: Warning messages, alerts, attention indicators
  - Parity: ⚠️ Pending

- [ ] **Error**: `#EF4444` - Error and destructive states
  - Figma name: `colors/error`
  - CSS variable: `--color-error`
  - Usage: Error messages, delete buttons, critical alerts
  - Parity: ⚠️ Pending

- [ ] **Neutral**: `#F3F4F6` - Backgrounds, borders, disabled states
  - Figma name: `colors/neutral`
  - CSS variable: `--color-neutral`
  - Usage: Backgrounds, dividers, disabled elements
  - Parity: ⚠️ Pending

### Typography Tokens (3)

- [ ] **Heading Font**: `Inter` - All heading elements
  - Figma name: `typography/heading-font`
  - CSS variable: `--font-heading`
  - Usage: `<h1>` through `<h6>`, component headings
  - Parity: ⚠️ Pending

- [ ] **Body Font**: `Inter` - Body text and content
  - Figma name: `typography/body-font`
  - CSS variable: `--font-body`
  - Usage: Paragraphs, list items, regular text
  - Parity: ⚠️ Pending

- [ ] **Mono Font**: `IBM Plex Mono` - Code and technical content
  - Figma name: `typography/mono-font`
  - CSS variable: `--font-mono`
  - Usage: Code blocks, technical references, examples
  - Parity: ⚠️ Pending

### Spacing Token (1)

- [ ] **Base Unit**: `8px` - Foundation for all spacing
  - Figma name: `spacing/base-unit`
  - CSS variable: `--spacing-base`
  - Derived values: `4px` (0.5x), `16px` (2x), `24px` (3x), `32px` (4x), `48px` (6x), `64px` (8x)
  - Usage: Margins, padding, gaps in layout
  - Parity: ⚠️ Pending

### Border Radius Token (1)

- [ ] **Base Radius**: `4px` - Standard corner rounding
  - Figma name: `radius/base`
  - CSS variable: `--radius-base`
  - Derived values: `8px` (2x), `12px` (3x), `999px` (full circle)
  - Usage: Buttons, cards, input fields, modals
  - Parity: ⚠️ Pending

---

## Figma Documentation Checklist

- [ ] T040: Create Figma page named "Week 9 Tokens & Primitives"
- [ ] Create section for each token category (Colors, Typography, Spacing, Radius)
- [ ] Document each token with:
  - Visual representation (color swatch, font sample, spacing ruler, radius example)
  - Token name and value
  - CSS variable name
  - Use cases and guidelines
  - Live component examples using the token
- [ ] Create component library showcase:
  - Button component (showing primary, secondary, success, warning, error states)
  - Card component (showing neutral background, border radius, spacing)
  - Typography examples (headings, body, mono)
  - Form input (showing radius, spacing, borders)
- [ ] Add "Tokens & Primitives" page link to main design file

---

## Export & Archive

- [ ] T041: Export Figma reference materials
  - [ ] Screenshot of "Week 9 Tokens & Primitives" page (PNG)
  - [ ] Color palette export (PDF with all 6 colors + usage)
  - [ ] Typography guide export (PDF with font families, sizes, weights)
  - [ ] Spacing scale visual (PNG showing all spacing values)
  - [ ] Store exports in: `docs/design-system/figma-exports/`

---

## Code Parity Validation

### CSS Variables

- [ ] All 11 tokens have corresponding CSS variables in `frontend-next/src/styles/tokens.css`
- [ ] Variables follow naming convention: `--{category}-{token}`
- [ ] All variables exported from root CSS file
- [ ] No hardcoded color/font/spacing values in components (use tokens instead)

### Component Usage

- [ ] Audit all components for token compliance:
  - [ ] `PostsPageClient.tsx` - uses color tokens for buttons, text
  - [ ] `LoadingState.tsx` - uses spacing tokens
  - [ ] `PostForm.tsx` - uses radius tokens for inputs
  - [ ] `Header.tsx` - uses typography tokens
  - [ ] `Footer.tsx` - uses neutral color token

### Tests

- [ ] Unit tests verify color contrast (WCAG AA minimum)
- [ ] E2E tests verify token rendering in all components
- [ ] Visual regression tests capture token changes

---

## README Integration

- [ ] T043: Design System section in `frontend-next/README.md`
  - [ ] Link to Figma design page
  - [ ] Link to token parity checklist
  - [ ] CSS variables reference table
  - [ ] Component examples using tokens

- [ ] T044: Deployment & Live URLs section in `frontend-next/README.md`
  - [ ] Development environment URL
  - [ ] Production environment URL
  - [ ] Staging environment URL (if applicable)
  - [ ] API endpoint documentation
  - [ ] Environment configuration guide

---

## Phase 6 Completion Criteria

✅ **When all boxes are checked:**

1. Figma page "Week 9 Tokens & Primitives" created with all 11 tokens
2. Token reference exports (PNG/PDF) available in `docs/design-system/figma-exports/`
3. Token parity checklist maintained and validated
4. CSS variables fully documented in codebase
5. Design System section added to `frontend-next/README.md`
6. Live URLs and deployment info documented in README
7. All E2E tests passing with token usage verified
8. PR merged to main with phase completion evidence

---

## Notes

- **Token Documentation**: Priority is establishing the single source of truth (Figma)
- **Export Strategy**: Store exports alongside code for CI/CD reference
- **Component Audit**: Ensure no component uses hardcoded values
- **Accessibility**: All color tokens must meet WCAG AA contrast requirements
