/**
 * Figma MCP Server
 * Exposes Figma API operations as MCP tools
 *
 * Usage:
 *   FIGMA_TOKEN=figd_xxx FIGMA_FILE_ID=xxx node mcp/figma/server.js
 */

import axios from 'axios';
import * as fs from 'fs';

const FIGMA_API_BASE = 'https://api.figma.com/v1';
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;

// MCP Tools Definition
const tools = [
  {
    name: 'figma_validate',
    description: 'Validate Figma credentials and file access',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'figma_create_page',
    description: 'Create a new page in the Figma file',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the page to create',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'figma_export_frame',
    description: 'Export a frame as PNG or PDF',
    input_schema: {
      type: 'object',
      properties: {
        frameId: {
          type: 'string',
          description: 'ID of the frame to export',
        },
        format: {
          type: 'string',
          enum: ['PNG', 'PDF', 'SVG'],
          description: 'Export format',
        },
      },
      required: ['frameId', 'format'],
    },
  },
  {
    name: 'figma_get_file_nodes',
    description: 'Get all nodes/pages in the Figma file',
    input_schema: {
      type: 'object',
      properties: {},
    },
  },
];

// Tool Implementations
async function figmaValidate() {
  try {
    const headers = {
      'X-Figma-Token': FIGMA_TOKEN,
    };

    const response = await axios.get(`${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}`, { headers });

    return {
      success: true,
      file: response.data.name,
      pages: response.data.document.children.length,
      message: `✅ Connected to Figma file: "${response.data.name}"`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function figmaCreatePage(name: string) {
  try {
    // Note: Figma REST API doesn't have direct page creation
    // We'll use file update operations
    console.log(`📄 Creating page: "${name}"`);
    console.log('⚠️ Note: REST API limitation - page creation via plugin required');

    return {
      success: false,
      note: 'Page creation requires Figma Plugin API, not REST API',
      alternative: 'Use Figma UI or plugin to create page manually',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function figmaGetFileNodes() {
  try {
    const headers = {
      'X-Figma-Token': FIGMA_TOKEN,
    };

    const response = await axios.get(`${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}?depth=1`, {
      headers,
    });

    const pages = response.data.document.children.map((page: Record<string, unknown>) => ({
      id: page.id,
      name: page.name,
      frameCount: (page.children as unknown[])?.length || 0,
    }));

    return {
      success: true,
      pages,
      message: `Found ${pages.length} pages`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function figmaExportFrame(frameId: string, format: 'PNG' | 'PDF' | 'SVG') {
  try {
    const headers = {
      'X-Figma-Token': FIGMA_TOKEN,
    };

    const response = await axios.get(
      `${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}/export/${frameId}/${format.toLowerCase()}`,
      {
        headers,
      },
    );

    const exportPath = `docs/design-system/figma-exports/export.${format.toLowerCase()}`;
    fs.writeFileSync(exportPath, response.data);

    return {
      success: true,
      file: exportPath,
      message: `✅ Exported as ${format}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Process Tool Calls
async function _processTool(
  toolName: string,
  toolInput: Record<string, string>,
): Promise<Record<string, unknown>> {
  switch (toolName) {
    case 'figma_validate':
      return await figmaValidate();
    case 'figma_create_page':
      return await figmaCreatePage(toolInput.name);
    case 'figma_get_file_nodes':
      return await figmaGetFileNodes();
    case 'figma_export_frame': {
      const format = (toolInput.format || 'PNG') as 'PNG' | 'PDF' | 'SVG';
      return await figmaExportFrame(toolInput.frameId, format);
    }
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

// Main MCP Handler
async function main() {
  console.log('🎨 Figma MCP Server Starting...\n');

  // Validate credentials
  console.log('🔐 Validating Figma credentials...');
  const validation = await figmaValidate();
  console.log(validation.message || validation.error);

  if (!validation.success) {
    process.exit(1);
  }

  console.log('\n✅ Figma MCP Ready');
  console.log('📋 Available tools:');
  tools.forEach((tool) => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });

  console.log('\n🚀 Figma MCP Server listening...');
  console.log('Use with: claude --mcp file://$(pwd)/mcp/figma/server.js');
}

main().catch(console.error);
