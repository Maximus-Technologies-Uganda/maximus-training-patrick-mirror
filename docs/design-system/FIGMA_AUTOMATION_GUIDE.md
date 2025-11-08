# Figma API Automation Guide (Alternative)

**Status**: Optional - Only if you want programmatic automation  
**Difficulty**: Advanced  
**Time**: 30-60 minutes setup

---

## Option A: Using @figma-export (Recommended for Exports)

### What It Does

- ✅ Exports tokens from Figma as files
- ✅ Generates PNG/PDF automatically
- ✅ CLI-based (no browser needed)

### Installation

```bash
npm install --save-dev @figma-export/core @figma-export/cli
```

### Configuration

Create `figma-export.config.js`:

```javascript
module.exports = {
  token: process.env.FIGMA_TOKEN,
  fileId: 'MGlfufUnqRLzy4wRwgA4r5',
  onlyComponentsPage: false,

  exporters: [
    new PngExporter({
      output: './docs/design-system/figma-exports',
      pageName: 'Week 9 Tokens & Primitives',
    }),
    new PdfExporter({
      output: './docs/design-system/figma-exports',
      pageName: 'Week 9 Tokens & Primitives',
    }),
  ],
};
```

### Run Export

```bash
FIGMA_TOKEN=your-figma-token-here pnpm exec figma-export
```

✅ **Result**: Automatically generates PNG and PDF from Figma page

---

## Option B: Using Figma Plugins API (Advanced)

### What It Does

- ✅ Fully programmatic Figma page creation
- ✅ Create pages, frames, components
- ✅ Requires plugin development

### Setup (Complex)

```bash
npm install -g create-figma-plugin
create-figma-plugin my-design-system-plugin
cd my-design-system-plugin
```

### Plugin Code (Simplified)

```typescript
// plugin.ts
import { emit, on } from '@create-figma-plugin/utilities';

export default function (): void {
  on('CREATE_TOKENS_PAGE', createTokensPage);
}

async function createTokensPage(): Promise<void> {
  const page = figma.createPage();
  page.name = 'Week 9 Tokens & Primitives';

  // Create color section
  const colorFrame = figma.createFrame();
  colorFrame.name = 'Colors (6 tokens)';
  colorFrame.resize(1200, 800);

  // Add color swatches
  const colors = [
    { name: 'Primary', hex: '#0066CC' },
    { name: 'Secondary', hex: '#6B7280' },
    // ... more colors
  ];

  colors.forEach((color, index) => {
    const rect = figma.createRectangle();
    rect.fills = [
      {
        type: 'SOLID',
        color: hexToRgb(color.hex),
      },
    ];
    rect.x = index * 160;
    rect.y = 0;
    rect.resize(150, 100);
    colorFrame.appendChild(rect);

    // Add label
    const text = figma.createText();
    text.characters = color.name;
    text.x = index * 160;
    text.y = 110;
    colorFrame.appendChild(text);
  });

  emit('PAGE_CREATED', {
    pageName: page.name,
    frameCount: 1,
  });
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255,
  };
}
```

### Install & Run Plugin

```bash
# Build plugin
npm run build

# Install in Figma
# 1. Open Figma
# 2. Plugins → Development → Import plugin from manifest.json
# 3. Run plugin

# Execute
figma-token-setup
```

⚠️ **Note**: Requires Figma account with Developer access

---

## Option C: REST API + Axios (Already Implemented)

### Current Setup

You already have this!

**Scripts**: `scripts/figma/create-design-system.ts`  
**Status**: ✅ Validates credentials and exports tokens

### What It Can Do

- ✅ Validate Figma credentials
- ✅ Export token data (JSON)
- ✅ Generate token references (Markdown)

### What It CANNOT Do (REST API Limitation)

- ❌ Create pages (no REST API endpoint)
- ❌ Add visual components
- ❌ Export PNG/PDF

---

## Recommendation

| Approach             | Setup Time | Automation | Exports         | Pros                 | Cons                 |
| -------------------- | ---------- | ---------- | --------------- | -------------------- | -------------------- |
| **Manual** (Current) | 0 min      | None       | Manual          | Simple, full control | Takes 35 min         |
| **@figma-export**    | 10 min     | ⭐⭐       | Auto PNG/PDF    | Fast exports, CLI    | No page creation     |
| **Plugin API**       | 60 min     | ⭐⭐⭐     | Auto everything | Full automation      | Complex setup        |
| **REST API**         | 0 min      | ⭐         | Manual          | Already set up       | Limited capabilities |

---

## My Recommendation

**Best for you right now:**

1. ✅ Complete **manual checklist** (35 min) to create the Figma page
2. ✅ Then optionally install **@figma-export** (10 min) to auto-export PNG/PDF

This gives you:

- Full control over design
- Automatic exports for future updates
- No complex plugin development

---

## Quick Start: Manual + @figma-export

```bash
# 1. Complete manual checklist in Figma (35 min)
# Follow: docs/design-system/FIGMA_MANUAL_CHECKLIST.md

# 2. Install @figma-export
npm install --save-dev @figma-export/core @figma-export/cli

# 3. Add npm script to package.json
# "export:figma": "figma-export"

# 4. Create config file
touch figma-export.config.js

# 5. Export
export FIGMA_TOKEN=your-figma-token-here
npm run export:figma
```

---

## Resources

- **Manual Guide**: `docs/design-system/FIGMA_MANUAL_CHECKLIST.md`
- **Figma REST API**: https://www.figma.com/developers/api
- **@figma-export**: https://github.com/marcomontalbano/figma-exporter
- **Figma Plugins**: https://www.figma.com/developers/plugins
- **Token Export**: `docs/design-system/figma-exports/tokens-export.json`

---

## Questions?

If manual approach takes too long, we can explore @figma-export or plugins next.

**Current blocker**: None - proceed with manual checklist! ✅
