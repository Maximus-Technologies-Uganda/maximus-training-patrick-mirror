# Manual Figma Task Checklist

**Tasks**: T040, T041  
**Goal**: Create "Week 9 Tokens & Primitives" page in Figma with all 11 tokens documented and exported

---

## Prerequisites

✅ Figma file ID: `MGlfufUnqRLzy4wRwgA4r5`  
✅ Figma token: Already validated  
✅ 11 tokens exported: `docs/design-system/figma-exports/tokens-export.json`

---

## Task 1: Create Page (T040)

### Step 1.1: Create New Page

1. Open your Figma file: https://www.figma.com/design/MGlfufUnqRLzy4wRwgA4r5/Untitled
2. Right-click on the file name in the left sidebar
3. Select **New page** or click **+** icon
4. Name it: `Week 9 Tokens & Primitives`
5. Press Enter

✅ **Expected**: New page visible in sidebar

---

## Task 2: Add Token Documentation Sections (T040)

### Step 2.1: Create Color Section

**Frame name**: `Colors (6 tokens)`  
**Dimensions**: 1200 x 800px

1. Click **Insert** → **Frame**
2. Name it: `Colors (6 tokens)`
3. Set size: 1200 x 800
4. Add these text labels:
   ```
   • Primary: #0066CC (CTAs)
   • Secondary: #6B7280 (Accents)
   • Success: #10B981 (Confirmations)
   • Warning: #F59E0B (Caution)
   • Error: #EF4444 (Destructive)
   • Neutral: #F3F4F6 (Backgrounds)
   ```

**Visual guide**:

- Create 6 rectangles below labels, each 150x100px
- Fill with corresponding hex colors
- Label each with name + CSS variable

### Step 2.2: Create Typography Section

**Frame name**: `Typography (3 tokens)`  
**Dimensions**: 800 x 400px

1. Click **Insert** → **Frame**
2. Name it: `Typography (3 tokens)`
3. Add sections for:

   ```
   Heading Font (Inter)
   - Example: "Heading Text"
   - CSS: --font-heading

   Body Font (Inter)
   - Example: "Body text goes here"
   - CSS: --font-body

   Mono Font (IBM Plex Mono)
   - Example: `const token = value;`
   - CSS: --font-mono
   ```

### Step 2.3: Create Spacing Section

**Frame name**: `Spacing (1 token)`  
**Dimensions**: 600 x 400px

1. Click **Insert** → **Frame**
2. Name it: `Spacing (1 token)`
3. Add visual grid showing 8px base unit:

   ```
   Base Unit: 8px

   Visual ruler:
   |----| 4px (0.5x)
   |--------| 8px (1x)   ← base
   |----------------| 16px (2x)
   |------------------------| 24px (3x)
   |--------------------------------| 32px (4x)
   ```

4. Add CSS variable label: `--spacing-unit`

### Step 2.4: Create Radius Section

**Frame name**: `Radius (1 token)`  
**Dimensions**: 600 x 300px

1. Click **Insert** → **Frame**
2. Name it: `Radius (1 token)`
3. Create 4 rounded rectangles showing different radius values:

   ```
   4px (base)
   8px (2x)
   12px (3x)
   999px (full circle)
   ```

4. Label each: `--radius-base`, `--radius-md`, `--radius-lg`, `--radius-full`

---

## Task 3: Create Component Examples (T040)

### Step 3.1: Button Component Example

Create a frame showing button states using the tokens:

```
Button Component States:

Primary Button
  Background: var(--color-primary) #0066CC
  Padding: var(--spacing-unit) * 3
  Border Radius: var(--radius-md) 8px
  Font: var(--font-body)

Secondary Button
  Background: var(--color-secondary) #6B7280
  (same other props)

Success Button
  Background: var(--color-success) #10B981

Error Button
  Background: var(--color-error) #EF4444
```

### Step 3.2: Card Component Example

```
Card Component

Background: var(--color-neutral) #F3F4F6
Border: 1px var(--color-border) #E5E5E5
Border Radius: var(--radius-lg) 12px
Padding: var(--spacing-unit) * 4
Title Font: var(--font-heading)
Body Font: var(--font-body)
```

---

## Task 4: Export Tokens (T041)

### Step 4.1: Export as PNG

1. In Figma, select the page or frames
2. Click **File** → **Export**
3. Or right-click frame → **Export**
4. Export settings:
   - Format: PNG
   - Scale: 1x
5. Save to: `docs/design-system/figma-exports/`
6. Filename: `token-page-week9.png`

✅ **Expected file**: `docs/design-system/figma-exports/token-page-week9.png`

### Step 4.2: Export as PDF

1. Repeat export process
2. Format: PDF
3. Save to: `docs/design-system/figma-exports/`
4. Filename: `token-page-week9.pdf`

✅ **Expected file**: `docs/design-system/figma-exports/token-page-week9.pdf`

### Step 4.3: Update Token Reference

Once Figma page is complete:

```bash
# Update token reference with Figma URL
echo "✅ Figma Design System: https://www.figma.com/design/MGlfufUnqRLzy4wRwgA4r5" >> docs/design-system/figma-exports/README.md
```

---

## Verification Checklist

### Page Creation

- [ ] Page "Week 9 Tokens & Primitives" created in Figma
- [ ] Page visible in file sidebar

### Color Documentation

- [ ] All 6 colors documented with hex values
- [ ] Color swatches added
- [ ] CSS variables labeled
- [ ] Contrast ratios documented

### Typography Documentation

- [ ] All 3 fonts documented
- [ ] Font samples shown (Heading, Body, Mono)
- [ ] CSS variables labeled
- [ ] Font sizes documented

### Spacing Documentation

- [ ] Base 8px unit shown
- [ ] Multiples visualized (4px, 8px, 16px, 24px, etc)
- [ ] CSS variable labeled
- [ ] Grid ruler created

### Radius Documentation

- [ ] All 4 radius values shown
- [ ] Rounded rectangles created for each
- [ ] CSS variables labeled

### Component Examples

- [ ] Button component with all token usage
- [ ] Card component showing token application
- [ ] Other components as time permits

### Exports (T041)

- [ ] PNG exported to `docs/design-system/figma-exports/token-page-week9.png`
- [ ] PDF exported to `docs/design-system/figma-exports/token-page-week9.pdf`
- [ ] Token reference updated with Figma URL

---

## Shortcuts & Tips

### Figma Keyboard Shortcuts

```
Ctrl+D         → Duplicate selected element
Ctrl+G         → Group elements
Ctrl+B         → Send to back
Ctrl+F         → Bring to front
Ctrl+Shift+X   → Export
```

### Color Paste Helper

If you need to quickly add colors:

1. Copy hex from token export: `#0066CC`
2. Create rectangle
3. Right-click → **Fill**
4. Paste hex directly in color field

### Text Styles

Create reusable text styles for consistency:

1. Select text
2. **Type** menu → **Create text style**
3. Name: `Body/Regular`, `Heading/Large`, etc
4. Reuse across documentation

---

## Time Estimates

| Task                      | Time    | Difficulty |
| ------------------------- | ------- | ---------- |
| Create page               | 2 min   | 🟢 Easy    |
| Add color section         | 5 min   | 🟢 Easy    |
| Add typography section    | 5 min   | 🟢 Easy    |
| Add spacing section       | 5 min   | 🟡 Medium  |
| Add radius section        | 3 min   | 🟢 Easy    |
| Create component examples | 10 min  | 🟡 Medium  |
| Export PNG/PDF            | 5 min   | 🟢 Easy    |
| **Total**                 | ~35 min | 🟡 Medium  |

---

## Next Steps After Manual Work

1. ✅ Complete the manual Figma tasks above
2. ✅ Export PNG and PDF
3. Run this command to verify:
   ```bash
   ls -la docs/design-system/figma-exports/
   ```
4. Commit the exported files:
   ```bash
   git add docs/design-system/figma-exports/
   git commit -m "docs(T041): add figma token page exports (PNG and PDF)"
   ```
5. Push and create PR

---

## Reference Files

- **Token Inventory**: `docs/design-system/figma-exports/tokens-export.json`
- **Token Reference**: `docs/design-system/figma-exports/tokens-reference.md`
- **Token Parity**: `specs/009-frontend-foundations/token-parity.md`
- **README Section**: `frontend-next/README.md` (Design System section already added)

---

**Status**: 📋 Ready for manual implementation  
**ETA**: ~35 minutes to complete  
**Tools**: Figma web editor only (no plugins needed)
