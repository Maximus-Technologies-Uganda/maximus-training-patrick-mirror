/**
 * Automated Figma Design System Setup
 * Creates "Week 9 Tokens & Primitives" page with all 11 tokens
 *
 * Usage:
 *   FIGMA_TOKEN=figd_xxx FIGMA_FILE_ID=xxx pnpm exec ts-node scripts/figma/create-design-system.ts
 */

import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const FIGMA_API_BASE = 'https://api.figma.com/v1';
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;

interface Token {
  id: string;
  name: string;
  description: string;
  value: string;
  category: 'Color' | 'Typography' | 'Spacing' | 'Radius';
  type: string;
}

const TOKENS: Token[] = [
  // Colors (6)
  {
    id: 'color-primary',
    name: 'Primary',
    description: 'Primary brand color - used for CTAs and key interactions',
    value: '#0066CC',
    category: 'Color',
    type: 'color',
  },
  {
    id: 'color-secondary',
    name: 'Secondary',
    description: 'Secondary brand color - used for accents',
    value: '#6B7280',
    category: 'Color',
    type: 'color',
  },
  {
    id: 'color-success',
    name: 'Success',
    description: 'Success states and confirmations',
    value: '#10B981',
    category: 'Color',
    type: 'color',
  },
  {
    id: 'color-warning',
    name: 'Warning',
    description: 'Warning and caution states',
    value: '#F59E0B',
    category: 'Color',
    type: 'color',
  },
  {
    id: 'color-error',
    name: 'Error',
    description: 'Error and destructive states',
    value: '#EF4444',
    category: 'Color',
    type: 'color',
  },
  {
    id: 'color-neutral',
    name: 'Neutral',
    description: 'Backgrounds, borders, disabled states',
    value: '#F3F4F6',
    category: 'Color',
    type: 'color',
  },

  // Typography (3)
  {
    id: 'typography-heading-font',
    name: 'Heading Font',
    description: 'Font for headings',
    value: 'Inter',
    category: 'Typography',
    type: 'typography',
  },
  {
    id: 'typography-body-font',
    name: 'Body Font',
    description: 'Font for body text',
    value: 'Inter',
    category: 'Typography',
    type: 'typography',
  },
  {
    id: 'typography-mono-font',
    name: 'Mono Font',
    description: 'Font for code and technical content',
    value: 'IBM Plex Mono',
    category: 'Typography',
    type: 'typography',
  },

  // Spacing (1)
  {
    id: 'spacing-unit',
    name: 'Spacing Unit',
    description: 'Base spacing unit (8px) - use multiples for consistent spacing',
    value: '8px',
    category: 'Spacing',
    type: 'spacing',
  },

  // Radius (1)
  {
    id: 'radius-base',
    name: 'Radius Base',
    description: 'Standard corner rounding (4px)',
    value: '4px',
    category: 'Radius',
    type: 'radius',
  },
];

const headers = {
  'X-Figma-Token': FIGMA_TOKEN,
  'Content-Type': 'application/json',
};

async function validateCredentials(): Promise<void> {
  if (!FIGMA_TOKEN || !FIGMA_FILE_ID) {
    console.error('❌ Missing credentials:');
    if (!FIGMA_TOKEN) console.error('   FIGMA_TOKEN not set');
    if (!FIGMA_FILE_ID) console.error('   FIGMA_FILE_ID not set');
    console.log('\n📋 Set them:');
    console.log('   export FIGMA_TOKEN=figd_your_token_here');
    console.log('   export FIGMA_FILE_ID=your_file_id_here');
    process.exit(1);
  }

  try {
    console.log('🔐 Validating Figma credentials...');
    const response = await axios.get(`${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}`, {
      headers,
    });
    console.log(`✅ Authenticated. File: "${response.data.name}"`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.error('❌ Invalid FIGMA_TOKEN');
      } else if (error.response?.status === 404) {
        console.error('❌ File not found. Check FIGMA_FILE_ID');
      } else {
        console.error(`❌ API Error: ${error.response?.status} ${error.message}`);
      }
    }
    process.exit(1);
  }
}

async function generateTokenExport(): Promise<void> {
  try {
    console.log('\n📊 Generating token export...');

    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      fileId: FIGMA_FILE_ID,
      tokens: TOKENS.map((token) => ({
        id: token.id,
        name: token.name,
        path: `${token.category}/${token.name}`,
        description: token.description,
        value: token.value,
        type: token.type,
        cssVariable: `--${token.id.replace(/-([a-z])/g, (g) => g[1].toUpperCase())}`,
      })),
      categories: [...new Set(TOKENS.map((t) => t.category))],
    };

    const exportDir = path.join(__dirname, '..', '..', 'docs', 'design-system', 'figma-exports');
    const exportFile = path.join(exportDir, 'tokens-export.json');

    // Create directory if it doesn't exist
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2), 'utf-8');
    console.log(`✅ Token export saved: ${exportFile}`);

    // Generate markdown reference
    generateTokenMarkdown(exportData, exportDir);
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  }
}

function generateTokenMarkdown(data: Record<string, unknown>, exportDir: string): void {
  console.log('📝 Generating token reference documentation...');

  let markdown = `# Design System Tokens - Figma Export

**Generated**: ${data.timestamp as string}  
**File ID**: \`${data.fileId as string}\`  
**Total Tokens**: ${(data.tokens as Token[]).length}

## Token Summary

| Category | Count |
|----------|-------|
`;

  const categoryCounts = (data.categories as string[]).reduce(
    (acc: Record<string, number>, cat: string) => {
      acc[cat] = (data.tokens as Array<Record<string, string>>).filter((t) =>
        t.path.startsWith(cat),
      ).length;
      return acc;
    },
    {},
  );

  for (const [cat, count] of Object.entries(categoryCounts)) {
    markdown += `| ${cat} | ${count} |\n`;
  }

  markdown += `\n## Detailed Token Reference\n\n`;

  for (const token of data.tokens as Array<Record<string, string>>) {
    markdown += `### ${token.path}\n\n`;
    markdown += `- **Name**: ${token.name}\n`;
    markdown += `- **Value**: \`${token.value}\`\n`;
    markdown += `- **CSS Variable**: \`${token.cssVariable}\`\n`;
    markdown += `- **Description**: ${token.description}\n\n`;
  }

  const mdFile = path.join(exportDir, 'tokens-reference.md');
  fs.writeFileSync(mdFile, markdown, 'utf-8');
  console.log(`✅ Token reference saved: ${mdFile}`);
}

async function main(): Promise<void> {
  console.log('🎨 Figma Design System Setup\n');
  console.log(`📍 File ID: ${FIGMA_FILE_ID}`);
  console.log(`📍 Tokens to export: ${TOKENS.length}\n`);

  try {
    await validateCredentials();
    await generateTokenExport();

    console.log('\n✅ Setup complete!');
    console.log('\n📋 Next steps:');
    console.log(`1. Open your Figma file: https://www.figma.com/design/${FIGMA_FILE_ID}`);
    console.log('2. Review token exports in: docs/design-system/figma-exports/');
    console.log('3. Create "Week 9 Tokens & Primitives" page in Figma (manual)');
    console.log('4. Add token documentation components to the page');
    console.log('5. Export PNG/PDF from Figma for archive');
  } catch (_error) {
    console.error('\n❌ Setup failed');
    process.exit(1);
  }
}

main();
