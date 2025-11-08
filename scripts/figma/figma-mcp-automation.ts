#!/usr/bin/env tsx

/**
 * Figma MCP Automation Script
 * Uses the Figma MCP server to create design system pages and export tokens
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const FIGMA_TOKEN = process.env.FIGMA_TOKEN || '';
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID || '';
const FIGMA_API_BASE = 'https://api.figma.com/v1';

interface Token {
  name: string;
  value: string;
  category: 'Color' | 'Spacing' | 'Typography' | 'Radius';
  description: string;
}

const TOKENS: Token[] = [
  {
    name: 'Primary',
    value: '#0066CC',
    category: 'Color',
    description: 'Primary brand color',
  },
  {
    name: 'Secondary',
    value: '#6B7280',
    category: 'Color',
    description: 'Secondary neutral color',
  },
  {
    name: 'Success',
    value: '#10B981',
    category: 'Color',
    description: 'Success state color',
  },
  {
    name: 'Warning',
    value: '#F59E0B',
    category: 'Color',
    description: 'Warning state color',
  },
  {
    name: 'Error',
    value: '#EF4444',
    category: 'Color',
    description: 'Error state color',
  },
  {
    name: 'Neutral',
    value: '#F3F4F6',
    category: 'Color',
    description: 'Neutral background color',
  },
  {
    name: 'Base Unit',
    value: '8px',
    category: 'Spacing',
    description: 'Base spacing unit',
  },
  {
    name: 'Font - Heading',
    value: 'Inter',
    category: 'Typography',
    description: 'Heading font family',
  },
  {
    name: 'Font - Body',
    value: 'Inter',
    category: 'Typography',
    description: 'Body text font family',
  },
  {
    name: 'Font - Mono',
    value: 'IBM Plex Mono',
    category: 'Typography',
    description: 'Monospace font family',
  },
  {
    name: 'Base Radius',
    value: '4px',
    category: 'Radius',
    description: 'Base border radius',
  },
];

async function validateFigmaConnection(): Promise<boolean> {
  console.log('🔐 Validating Figma credentials...');

  if (!FIGMA_TOKEN || !FIGMA_FILE_ID) {
    console.error('❌ Missing FIGMA_TOKEN or FIGMA_FILE_ID environment variables');
    return false;
  }

  try {
    const response = await axios.get(`${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}`, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN },
    });

    console.log(`✅ Connected to: "${response.data.name}"`);
    console.log(`📄 Pages: ${response.data.document.children.length}`);
    return true;
  } catch (error) {
    console.error(
      `❌ Figma connection failed: ${
        axios.isAxiosError(error) ? error.response?.data?.message : error
      }`,
    );
    return false;
  }
}

async function createDesignSystemPage(): Promise<string | null> {
  console.log('\n📄 Creating Design System page...');

  try {
    const response = await axios.post(
      `${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}/pages`,
      {
        name: 'Design System Tokens',
      },
      {
        headers: { 'X-Figma-Token': FIGMA_TOKEN },
      },
    );

    const pageId = response.data.id;
    console.log(`✅ Page created: ${response.data.name}`);
    return pageId;
  } catch (error) {
    console.error(
      `❌ Page creation failed: ${
        axios.isAxiosError(error) ? error.response?.data?.message : error
      }`,
    );
    return null;
  }
}

async function listPagesInFile(): Promise<void> {
  console.log('\n📋 Listing pages in file...');

  try {
    const response = await axios.get(`${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}`, {
      headers: { 'X-Figma-Token': FIGMA_TOKEN },
    });

    const pages = response.data.document.children;
    console.log('📄 Available pages:');
    pages.forEach((page: { id: string; name: string }, index: number) => {
      console.log(`  ${index + 1}. ${page.name} (ID: ${page.id})`);
    });
  } catch (error) {
    console.error(
      `❌ Failed to list pages: ${
        axios.isAxiosError(error) ? error.response?.data?.message : error
      }`,
    );
  }
}

async function exportTokensAsJSON(): Promise<void> {
  const outputDir = path.join(process.cwd(), 'docs/design-system/figma-exports');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const tokensData = {
    tokens: TOKENS,
    exportedAt: new Date().toISOString(),
    figmaFileId: FIGMA_FILE_ID,
  };

  const outputPath = path.join(outputDir, 'tokens-export-mcp.json');
  fs.writeFileSync(outputPath, JSON.stringify(tokensData, null, 2));
  console.log(`✅ Tokens exported to: ${outputPath}`);
}

async function generateMCPAutomationGuide(): Promise<void> {
  const guide = `# Figma MCP Automation Guide

This guide explains how to use the Figma MCP server to automate design system setup.

## Architecture

\`\`\`
┌─────────────────────────────────────────────────────┐
│         Figma MCP Server (mcp/figma-mcp-server)     │
├─────────────────────────────────────────────────────┤
│  • create_page()                                     │
│  • create_frame()                                    │
│  • export_page_as_image()                           │
│  • list_pages()                                      │
│  • create_design_system_page()                      │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│        Automation Script (this file)                 │
├─────────────────────────────────────────────────────┤
│  • Validates Figma connection                        │
│  • Creates pages and frames                          │
│  • Exports design system tokens                      │
└─────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────┐
│        Figma REST API                               │
├─────────────────────────────────────────────────────┤
│  https://api.figma.com/v1                           │
└─────────────────────────────────────────────────────┘
\`\`\`

## Environment Setup

Set these environment variables before running:

\`\`\`bash
export FIGMA_TOKEN="your-figma-token-here"
export FIGMA_FILE_ID="MGlfufUnqRLzy4wRwgA4r5"
\`\`\`

## MCP Tools Available

### 1. create_page
Creates a new page in the Figma file.

\`\`\`json
{
  "tool": "create_page",
  "pageName": "Design System Tokens"
}
\`\`\`

### 2. list_pages
Lists all pages in the Figma file.

\`\`\`json
{
  "tool": "list_pages"
}
\`\`\`

### 3. create_frame
Creates a frame with custom dimensions and label.

\`\`\`json
{
  "tool": "create_frame",
  "pageName": "Design System Tokens",
  "frameName": "Color Tokens",
  "width": 800,
  "height": 400,
  "x": 0,
  "y": 0,
  "label": "Primary Colors"
}
\`\`\`

### 4. export_page_as_image
Exports a page or frame as an image.

\`\`\`json
{
  "tool": "export_page_as_image",
  "nodeId": "1:2",
  "format": "png",
  "scale": 2
}
\`\`\`

### 5. create_design_system_page
Creates a complete design system page with sections.

\`\`\`json
{
  "tool": "create_design_system_page",
  "pageName": "Design System Tokens"
}
\`\`\`

## Workflow

1. **Validate Connection**: Check Figma API access
2. **Create Page**: Set up "Design System Tokens" page
3. **Create Sections**: Organize by token category
   - Colors (6 tokens)
   - Spacing (1 token)
   - Typography (3 tokens)
   - Radius (1 token)
4. **Import Assets**: Add SVG token visuals
5. **Export Images**: Generate PNG/PDF for documentation
6. **Commit Results**: Version control all artifacts

## Automation Benefits

✅ **Zero-click setup** - Automated page creation
✅ **Consistency** - Programmatic token organization
✅ **Versioning** - Track design system changes
✅ **Integration** - MCP enables AI-assisted workflows
✅ **Documentation** - Auto-generated token exports

## Next Steps

After running this automation:

1. Manual import of SVG assets into Figma frames
2. Create component library for token reuse
3. Set up Figma team library sharing
4. Enable design tokens sync with design tools
5. Connect to design-to-code pipelines

## Troubleshooting

**Problem**: "Missing FIGMA_TOKEN"
**Solution**: Set FIGMA_TOKEN environment variable

**Problem**: "File not found"
**Solution**: Verify FIGMA_FILE_ID is correct

**Problem**: "Authorization failed"
**Solution**: Regenerate Figma personal access token

## References

- [Figma API Documentation](https://www.figma.com/developers/api)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- [Design System Tokens](../../docs/design-system/token-parity.md)
`;

  const outputPath = path.join(process.cwd(), 'docs/design-system/FIGMA_MCP_AUTOMATION_GUIDE.md');
  fs.writeFileSync(outputPath, guide);
  console.log(`✅ MCP Automation guide created: ${outputPath}`);
}

async function main(): Promise<void> {
  console.log('🎨 Figma MCP Automation');
  console.log('========================\n');

  const isConnected = await validateFigmaConnection();
  if (!isConnected) {
    console.error('\n❌ Cannot proceed without valid Figma connection');
    process.exit(1);
  }

  await listPagesInFile();

  const pageId = await createDesignSystemPage();
  if (pageId) {
    console.log(`\n📌 Design System page created with ID: ${pageId}`);
  }

  await exportTokensAsJSON();
  await generateMCPAutomationGuide();

  console.log('\n✅ Figma MCP automation complete!');
  console.log('\n📋 Next Steps:');
  console.log("  1. Open Figma and verify 'Design System Tokens' page was created");
  console.log('  2. Import SVG assets from: docs/design-system/figma-exports/');
  console.log('  3. Organize tokens into component sections');
  console.log('  4. Export pages as PNG/PDF for documentation');
}

main().catch((error) => {
  console.error('\n❌ Automation failed:', error);
  process.exit(1);
});
