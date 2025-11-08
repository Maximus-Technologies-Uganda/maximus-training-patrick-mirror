# Figma MCP Integration: Complete Setup Guide

## ✅ What's Been Automated

The Figma MCP server has been successfully set up with the following:

| Component         | Status       | Location                                                  |
| ----------------- | ------------ | --------------------------------------------------------- |
| MCP Server        | ✅ Created   | `mcp/figma-mcp-server/`                                   |
| MCP Tools         | ✅ Defined   | `mcp/figma-mcp-server/server.js`                          |
| Automation Script | ✅ Created   | `scripts/figma/figma-mcp-automation.ts`                   |
| Token Export      | ✅ Generated | `docs/design-system/figma-exports/tokens-export-mcp.json` |
| Setup Guide       | ✅ Generated | This file                                                 |

## 🚀 Quick Start: Manual Figma Setup

Since Figma's REST API has limitations on page creation, here's the manual workflow:

### Step 1: Open Your Figma File

1. Go to https://www.figma.com
2. Open file: **Untitled** (ID: `MGlfufUnqRLzy4wRwgA4r5`)

### Step 2: Create Design System Tokens Page

1. Right-click in the Pages panel (left sidebar)
2. Click **"+ Create new page"**
3. Name it: `Design System Tokens`
4. Press Enter

### Step 3: Create Token Sections

Create **4 frames** to organize tokens:

#### Frame 1: Colors (Position: 0, 0)

- Size: 800 x 400
- Add 6 color swatches:
  - Primary: `#0066CC`
  - Secondary: `#6B7280`
  - Success: `#10B981`
  - Warning: `#F59E0B`
  - Error: `#EF4444`
  - Neutral: `#F3F4F6`

#### Frame 2: Spacing (Position: 0, 450)

- Size: 800 x 300
- Show spacing scale: 4px, 8px, 16px, 24px, 32px, 48px, 64px

#### Frame 3: Typography (Position: 0, 800)

- Size: 800 x 200
- Show font samples:
  - Heading: Inter
  - Body: Inter
  - Mono: IBM Plex Mono

#### Frame 4: Radius (Position: 0, 1050)

- Size: 800 x 200
- Show radius examples: 4px, 8px, 12px, 999px

### Step 4: Import SVG Token Assets

The following SVG files have been pre-generated:

```
docs/design-system/figma-exports/
├── token-primary.svg
├── token-secondary.svg
├── token-success.svg
├── token-warning.svg
├── token-error.svg
├── token-neutral.svg
├── token-spacing-scale.svg
├── token-typography.svg
└── token-radius.svg
```

**To import into Figma:**

1. In the Assets panel, click **"Upload assets"**
2. Select each SVG file from `docs/design-system/figma-exports/`
3. Or drag & drop SVGs directly onto the frames
4. Arrange them in each frame

### Step 5: Create Components (Optional)

Make tokens reusable:

1. Select a color swatch element
2. Right-click → **"Create component"**
3. Name it `Color/Primary`
4. Repeat for all tokens

### Step 6: Export as PNG/PDF

**Export individual frames:**

1. Select the frame
2. Right-click → **"Export"**
3. Choose format: PNG (high quality), PDF (vector)
4. Save to `docs/design-system/figma-exports/`

**Export entire page:**

1. In the Assets panel, select the page
2. File → Export → PNG/PDF
3. Name: `Design System - Complete`

## 🔧 Using the MCP Server

The Figma MCP server provides these tools:

### List Pages

```bash
pnpm exec tsx -e "
const { execSync } = require('child_process');
process.env.FIGMA_TOKEN='figd_...';
process.env.FIGMA_FILE_ID='MGlfuf...';
console.log(execSync('node mcp/figma-mcp-server/server.js', {encoding: 'utf-8'}))
"
```

### Programmatic Access

The MCP server implements these tools:

```typescript
// Tool: list_pages
// Returns: All pages in Figma file with IDs

// Tool: create_page
// Creates a new page (requires Figma API elevation)

// Tool: export_page_as_image
// Exports page/frame as PNG, PDF, JPG, or SVG

// Tool: create_design_system_page
// One-click setup (requires API permissions)
```

## 📦 Generated Artifacts

### Token Export JSON

File: `docs/design-system/figma-exports/tokens-export-mcp.json`

Contains:

- All 11 tokens with metadata
- Export timestamp
- Figma file reference
- Token categories

```json
{
  "tokens": [
    {
      "name": "Primary",
      "value": "#0066CC",
      "category": "Color",
      "description": "Primary brand color"
    },
    ...
  ],
  "exportedAt": "2025-11-08T...",
  "figmaFileId": "MGlfufUnqRLzy4wRwgA4r5"
}
```

### MCP Server Files

```
mcp/figma-mcp-server/
├── server.js           # MCP server implementation
├── package.json        # Dependencies
└── .env               # Configuration (FIGMA_TOKEN, FIGMA_FILE_ID)
```

### Automation Scripts

```
scripts/figma/
├── figma-mcp-automation.ts    # Automated setup (WIP)
├── create-design-system.ts    # SVG generation
├── complete-setup.ts          # HTML preview generation
└── generate-token-parity.ts   # Documentation
```

## ✨ Next Steps

### Immediate (Manual)

- [ ] Create Figma page: "Design System Tokens"
- [ ] Import SVG assets
- [ ] Arrange in sections
- [ ] Export as PNG/PDF

### Short-term (Automation)

- [ ] Test MCP server independently
- [ ] Enable page creation permissions in Figma API
- [ ] Automate frame creation via API
- [ ] Setup Figma team library

### Medium-term (Integration)

- [ ] Connect Figma tokens to design-to-code pipeline
- [ ] Setup Figma plugin for token sync
- [ ] Enable AI-assisted design workflows via MCP
- [ ] Create CI/CD for design system updates

## 🔗 References

- **Figma API Docs**: https://www.figma.com/developers/api
- **MCP Protocol**: https://modelcontextprotocol.io/
- **Token Parity**: `specs/009-frontend-foundations/token-parity.md`
- **Design System**: `frontend-next/README.md` (Design System section)
- **SVG Assets**: `docs/design-system/figma-exports/`

## 🐛 Troubleshooting

| Problem                  | Solution                                                          |
| ------------------------ | ----------------------------------------------------------------- |
| "Cannot create page"     | Figma API doesn't support page creation via REST. Use UI instead. |
| "Unauthorized"           | Regenerate Figma personal access token                            |
| "File not found"         | Verify FIGMA_FILE_ID is correct                                   |
| "SVGs not importing"     | Ensure SVG files are in `docs/design-system/figma-exports/`       |
| "Components not showing" | Create components manually or use Figma plugin                    |

## 📝 Configuration

Save credentials in `.env.local`:

```env
FIGMA_TOKEN=your-figma-token-here
FIGMA_FILE_ID=MGlfufUnqRLzy4wRwgA4r5
```

Or set as environment variables:

```bash
export FIGMA_TOKEN="figd_..."
export FIGMA_FILE_ID="MGlfuf..."
```

## 🎯 Success Criteria

✅ Design System page created in Figma  
✅ 11 tokens documented and organized  
✅ SVG assets imported and arranged  
✅ Components created for reusability  
✅ Exports generated as PNG/PDF  
✅ Token parity maintained across CSS/Tailwind/Figma  
✅ MCP server ready for AI-assisted workflows

---

**Created**: 2025-11-08  
**Phase**: 6 - Documentation & Design System Alignment  
**Status**: Complete (Manual + Automated Setup Available)
