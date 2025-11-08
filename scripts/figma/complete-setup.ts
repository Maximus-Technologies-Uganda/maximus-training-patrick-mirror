/**
 * Complete Figma Design System Automation
 * Creates "Week 9 Tokens & Primitives" page programmatically via REST API + manual steps
 *
 * This script:
 * 1. Validates Figma credentials
 * 2. Fetches existing file structure
 * 3. Generates SVG representations of tokens
 * 4. Creates a comprehensive design system summary
 *
 * Usage:
 *   FIGMA_TOKEN=figd_xxx FIGMA_FILE_ID=xxx pnpm exec ts-node scripts/figma/complete-setup.ts
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
  value: string;
  cssVar: string;
  category: 'Color' | 'Typography' | 'Spacing' | 'Radius';
}

const TOKENS: Token[] = [
  // Colors
  {
    id: 'primary',
    name: 'Primary',
    value: '#0066CC',
    cssVar: '--color-primary',
    category: 'Color',
  },
  {
    id: 'secondary',
    name: 'Secondary',
    value: '#6B7280',
    cssVar: '--color-secondary',
    category: 'Color',
  },
  {
    id: 'success',
    name: 'Success',
    value: '#10B981',
    cssVar: '--color-success',
    category: 'Color',
  },
  {
    id: 'warning',
    name: 'Warning',
    value: '#F59E0B',
    cssVar: '--color-warning',
    category: 'Color',
  },
  {
    id: 'error',
    name: 'Error',
    value: '#EF4444',
    cssVar: '--color-error',
    category: 'Color',
  },
  {
    id: 'neutral',
    name: 'Neutral',
    value: '#F3F4F6',
    cssVar: '--color-neutral',
    category: 'Color',
  },
  // Typography
  {
    id: 'font-heading',
    name: 'Heading Font',
    value: 'Inter',
    cssVar: '--font-heading',
    category: 'Typography',
  },
  {
    id: 'font-body',
    name: 'Body Font',
    value: 'Inter',
    cssVar: '--font-body',
    category: 'Typography',
  },
  {
    id: 'font-mono',
    name: 'Mono Font',
    value: 'IBM Plex Mono',
    cssVar: '--font-mono',
    category: 'Typography',
  },
  // Spacing
  {
    id: 'spacing-unit',
    name: 'Spacing Unit',
    value: '8px',
    cssVar: '--spacing-unit',
    category: 'Spacing',
  },
  // Radius
  {
    id: 'radius-base',
    name: 'Radius Base',
    value: '4px',
    cssVar: '--radius-base',
    category: 'Radius',
  },
];

const headers = {
  'X-Figma-Token': FIGMA_TOKEN,
  'Content-Type': 'application/json',
};

async function validateCredentials(): Promise<boolean> {
  try {
    console.log('🔐 Validating Figma credentials...');
    const response = await axios.get(`${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}`, {
      headers,
    });
    console.log(`✅ Connected to: "${response.data.name}"`);
    console.log(`📄 Pages: ${response.data.document.children.length}`);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`❌ Figma API Error: ${error.response?.status}`);
    }
    return false;
  }
}

function generateColorSVG(token: Token): string {
  const x = 50;
  const y = 50;
  const size = 100;

  return `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <!-- Color swatch -->
      <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${token.value}" stroke="#ccc" stroke-width="2" rx="4"/>
      
      <!-- Label -->
      <text x="100" y="170" text-anchor="middle" font-family="Inter" font-size="12" fill="#000">
        ${token.name}
      </text>
      <text x="100" y="185" text-anchor="middle" font-family="monospace" font-size="10" fill="#666">
        ${token.value}
      </text>
    </svg>
  `;
}

function generateSpacingSVG(_token: Token): string {
  const sizes = [4, 8, 16, 24, 32, 48, 64];
  let rects = '';

  sizes.forEach((size, index) => {
    const yOffset = index * 40;
    rects += `
      <rect x="20" y="${yOffset}" width="${size * 2}" height="30" fill="#0066CC" opacity="0.7" rx="2"/>
      <text x="200" y="${yOffset + 20}" font-family="Inter" font-size="12" fill="#000">
        ${size}px (${size / 8}x)
      </text>
    `;
  });

  return `
    <svg width="350" height="400" xmlns="http://www.w3.org/2000/svg">
      <text x="10" y="25" font-family="Inter" font-weight="bold" font-size="14" fill="#000">
        Spacing Scale (Base: 8px)
      </text>
      ${rects}
    </svg>
  `;
}

function generateTypographySVG(): string {
  return `
    <svg width="600" height="300" xmlns="http://www.w3.org/2000/svg">
      <!-- Heading Font -->
      <text x="20" y="40" font-family="Inter" font-weight="bold" font-size="28" fill="#000">
        Heading Font (Inter)
      </text>
      
      <!-- Body Font -->
      <text x="20" y="90" font-family="Inter" font-size="16" fill="#333">
        Body Font (Inter) - This is how body text looks in the design system
      </text>
      
      <!-- Mono Font -->
      <text x="20" y="150" font-family="'IBM Plex Mono', monospace" font-size="13" fill="#666">
        const token = value;  // Mono Font (IBM Plex Mono)
      </text>
    </svg>
  `;
}

function generateRadiusSVG(): string {
  const radiusValues = [
    { r: 4, name: 'Base (4px)' },
    { r: 8, name: 'Medium (8px)' },
    { r: 12, name: 'Large (12px)' },
    { r: 50, name: 'Full (999px)' },
  ];

  let rects = '';
  radiusValues.forEach((item, index) => {
    const x = 20 + index * 140;
    const y = 40;
    const size = 80;

    rects += `
      <rect x="${x}" y="${y}" width="${size}" height="${size}" fill="#0066CC" opacity="0.7" rx="${item.r}"/>
      <text x="${x + size / 2}" y="${y + size + 25}" text-anchor="middle" font-family="Inter" font-size="12" fill="#000">
        ${item.name}
      </text>
    `;
  });

  return `
    <svg width="600" height="150" xmlns="http://www.w3.org/2000/svg">
      <text x="300" y="25" text-anchor="middle" font-family="Inter" font-weight="bold" font-size="14" fill="#000">
        Border Radius Examples
      </text>
      ${rects}
    </svg>
  `;
}

async function generateSVGAssets(): Promise<void> {
  console.log('\n📊 Generating SVG token visuals...');

  const exportDir = path.join(__dirname, '..', '..', 'docs', 'design-system', 'figma-exports');

  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Generate color SVGs
  const colorTokens = TOKENS.filter((t) => t.category === 'Color');
  colorTokens.forEach((_token) => {
    const svg = generateColorSVG(_token);
    const filename = path.join(exportDir, `token-${_token.id}.svg`);
    fs.writeFileSync(filename, svg, 'utf-8');
  });

  // Generate spacing SVG
  const spacingToken = TOKENS.find((t) => t.id === 'spacing-unit');
  if (spacingToken) {
    const svg = generateSpacingSVG(spacingToken);
    fs.writeFileSync(path.join(exportDir, 'token-spacing-scale.svg'), svg, 'utf-8');
  }

  // Generate typography SVG
  const typographySvg = generateTypographySVG();
  fs.writeFileSync(path.join(exportDir, 'token-typography.svg'), typographySvg, 'utf-8');

  // Generate radius SVG
  const radiusSvg = generateRadiusSVG();
  fs.writeFileSync(path.join(exportDir, 'token-radius.svg'), radiusSvg, 'utf-8');

  console.log(`✅ Generated ${colorTokens.length + 3} SVG assets`);
}

function generateDesignSystemHTML(): void {
  console.log('\n📄 Generating design system HTML documentation...');

  const exportDir = path.join(__dirname, '..', '..', 'docs', 'design-system');

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Week 9 Tokens & Primitives</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #f5f5f5;
      padding: 40px;
    }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; }
    h1 { font-size: 32px; margin-bottom: 10px; color: #0066CC; }
    h2 { font-size: 24px; margin-top: 40px; margin-bottom: 20px; color: #333; border-bottom: 2px solid #0066CC; padding-bottom: 10px; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
    .token-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 20px;
      background: #fafafa;
    }
    .color-swatch { width: 100%; height: 80px; border-radius: 4px; margin-bottom: 10px; border: 1px solid #ddd; }
    .token-name { font-weight: bold; font-size: 14px; margin-bottom: 5px; }
    .token-value { font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #666; word-break: break-all; }
    .section { margin-bottom: 40px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 Week 9 Tokens & Primitives</h1>
    <p>Complete design system documentation with all 11 tokens</p>

    <div class="section">
      <h2>🎯 Colors (6 tokens)</h2>
      <div class="grid">
`;

  // Add color tokens
  TOKENS.filter((t) => t.category === 'Color').forEach((token) => {
    html += `
        <div class="token-card">
          <div class="color-swatch" style="background-color: ${token.value};"></div>
          <div class="token-name">${token.name}</div>
          <div class="token-value">${token.value}</div>
          <div class="token-value">${token.cssVar}</div>
        </div>
`;
  });

  html += `
      </div>
    </div>

    <div class="section">
      <h2>✏️ Typography (3 tokens)</h2>
`;

  TOKENS.filter((t) => t.category === 'Typography').forEach((token) => {
    html += `
      <div class="token-card">
        <div class="token-name">${token.name}</div>
        <div class="token-value">Font: ${token.value}</div>
        <div class="token-value">${token.cssVar}</div>
      </div>
`;
  });

  html += `
    </div>

    <div class="section">
      <h2>📏 Spacing (1 token)</h2>
`;

  TOKENS.filter((t) => t.category === 'Spacing').forEach((token) => {
    html += `
      <div class="token-card">
        <div class="token-name">${token.name}</div>
        <div class="token-value">Base: ${token.value}</div>
        <div class="token-value">Multiples: 4px, 8px, 16px, 24px, 32px, 48px, 64px</div>
        <div class="token-value">${token.cssVar}</div>
      </div>
`;
  });

  html += `
    </div>

    <div class="section">
      <h2>🔲 Radius (1 token)</h2>
`;

  TOKENS.filter((t) => t.category === 'Radius').forEach((token) => {
    html += `
      <div class="token-card">
        <div class="token-name">${token.name}</div>
        <div class="token-value">Base: ${token.value}</div>
        <div class="token-value">Multiples: 4px, 8px, 12px, 999px</div>
        <div class="token-value">${token.cssVar}</div>
      </div>
`;
  });

  html += `
    </div>

    <div class="section" style="margin-top: 60px; padding-top: 40px; border-top: 2px solid #f0f0f0;">
      <p style="color: #999; font-size: 12px;">
        Generated: ${new Date().toISOString()}
        <br/>
        Figma File: <a href="https://www.figma.com/design/${FIGMA_FILE_ID}" style="color: #0066CC;">Open in Figma</a>
      </p>
    </div>
  </div>
</body>
</html>
`;

  fs.writeFileSync(path.join(exportDir, 'design-system-preview.html'), html, 'utf-8');
  console.log('✅ Generated design-system-preview.html');
}

async function main(): Promise<void> {
  console.log('🎨 Complete Figma Design System Setup\n');

  if (!FIGMA_TOKEN || !FIGMA_FILE_ID) {
    console.error('❌ Missing FIGMA_TOKEN or FIGMA_FILE_ID');
    process.exit(1);
  }

  // Validate
  const isValid = await validateCredentials();
  if (!isValid) {
    process.exit(1);
  }

  // Generate assets
  await generateSVGAssets();
  generateDesignSystemHTML();

  console.log('\n✅ Complete setup finished!');
  console.log('\n📋 Generated files:');
  console.log('  ✅ 6 color token SVGs');
  console.log('  ✅ Spacing scale SVG');
  console.log('  ✅ Typography examples SVG');
  console.log('  ✅ Radius examples SVG');
  console.log('  ✅ design-system-preview.html (interactive preview)');

  console.log('\n📍 Next steps:');
  console.log('  1. Open: docs/design-system/design-system-preview.html');
  console.log('  2. Review the interactive preview');
  console.log('  3. Optional: Manually create Figma page with these assets');
  console.log('  4. Export PNG/PDF from Figma');
}

main().catch(console.error);
