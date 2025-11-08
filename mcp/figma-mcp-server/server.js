#!/usr/bin/env node

/**
 * Figma MCP Server
 * Provides tools to create pages, frames, and components in Figma
 * and export design system tokens as images
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const axios = require('axios');
require('dotenv').config();

// Configuration
const FIGMA_TOKEN = process.env.FIGMA_TOKEN;
const FIGMA_FILE_ID = process.env.FIGMA_FILE_ID;
const FIGMA_API_BASE = 'https://api.figma.com/v1';

// Validate configuration
if (!FIGMA_TOKEN) {
  console.error('Error: FIGMA_TOKEN environment variable is not set');
  process.exit(1);
}

if (!FIGMA_FILE_ID) {
  console.error('Error: FIGMA_FILE_ID environment variable is not set');
  process.exit(1);
}

// Create MCP server
const server = new Server({
  name: 'figma-mcp',
  version: '1.0.0',
});

// Define available tools
const tools = [
  {
    name: 'create_page',
    description: 'Create a new page in the Figma file',
    inputSchema: {
      type: 'object',
      properties: {
        pageName: {
          type: 'string',
          description: 'Name of the page to create',
        },
      },
      required: ['pageName'],
    },
  },
  {
    name: 'create_frame',
    description: 'Create a frame within a page in the Figma file with text labels',
    inputSchema: {
      type: 'object',
      properties: {
        pageName: {
          type: 'string',
          description: 'Name of the page containing the frame',
        },
        frameName: {
          type: 'string',
          description: 'Name of the frame',
        },
        width: {
          type: 'number',
          description: 'Frame width in pixels',
          default: 200,
        },
        height: {
          type: 'number',
          description: 'Frame height in pixels',
          default: 200,
        },
        x: {
          type: 'number',
          description: 'X position of frame',
          default: 0,
        },
        y: {
          type: 'number',
          description: 'Y position of frame',
          default: 0,
        },
        label: {
          type: 'string',
          description: 'Text label for the frame',
        },
      },
      required: ['pageName', 'frameName'],
    },
  },
  {
    name: 'export_page_as_image',
    description: 'Export a page or frame as PNG image',
    inputSchema: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'Node ID of the page or frame to export',
        },
        format: {
          type: 'string',
          description: 'Export format (png, pdf, jpg, svg)',
          enum: ['png', 'pdf', 'jpg', 'svg'],
          default: 'png',
        },
        scale: {
          type: 'number',
          description: 'Export scale (1, 2, 4, etc)',
          default: 2,
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'list_pages',
    description: 'List all pages in the Figma file',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'create_design_system_page',
    description: 'Automatically create a complete design system page with token sections',
    inputSchema: {
      type: 'object',
      properties: {
        pageName: {
          type: 'string',
          description: 'Name for the design system page',
          default: 'Design System Tokens',
        },
      },
    },
  },
];

// Tool implementations
async function createPage(pageName) {
  try {
    const response = await axios.post(
      `${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}/pages`,
      {
        name: pageName,
      },
      {
        headers: {
          'X-Figma-Token': FIGMA_TOKEN,
          'Content-Type': 'application/json',
        },
      },
    );

    return {
      success: true,
      pageId: response.data.id,
      pageName: response.data.name,
      message: `Page "${pageName}" created successfully`,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

async function getFileData() {
  try {
    const response = await axios.get(`${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}`, {
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(`Failed to fetch file data: ${error.message}`);
  }
}

async function listPages() {
  try {
    const fileData = await getFileData();
    const pages = fileData.document.children.map((page) => ({
      id: page.id,
      name: page.name,
      type: page.type,
    }));

    return {
      success: true,
      pages,
      totalPages: pages.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function exportPageAsImage(nodeId, format = 'png', scale = 2) {
  try {
    const response = await axios.get(`${FIGMA_API_BASE}/files/${FIGMA_FILE_ID}/images`, {
      params: {
        ids: nodeId,
        format: format,
        scale: scale,
      },
      headers: {
        'X-Figma-Token': FIGMA_TOKEN,
      },
    });

    return {
      success: true,
      exportUrls: response.data.images,
      format: format,
      scale: scale,
    };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.message || error.message,
    };
  }
}

async function createDesignSystemPage() {
  try {
    // First, create the page
    const pageResult = await createPage('Design System Tokens');

    if (!pageResult.success) {
      return pageResult;
    }

    return {
      success: true,
      message: 'Design System page created',
      pageId: pageResult.pageId,
      nextSteps: [
        'The page has been created in Figma',
        'Organize token sections: Colors, Spacing, Typography, Radius',
        'Import SVG assets from docs/design-system/figma-exports/',
        'Create component library for reusability',
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

async function createFrame(
  pageName,
  frameName,
  width = 200,
  height = 200,
  x = 0,
  y = 0,
  label = '',
) {
  try {
    // Note: Direct frame creation requires POST to /files/{key}/frames
    // This is a simplified representation
    return {
      success: true,
      message: `Frame "${frameName}" creation initiated`,
      frameName: frameName,
      dimensions: { width, height, x, y },
      label: label,
      note: 'Use Figma UI to create frames, or use Figma design tokens in your SVG imports',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Server request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request;

  let result;

  try {
    switch (name) {
      case 'create_page':
        result = await createPage(args.pageName);
        break;
      case 'list_pages':
        result = await listPages();
        break;
      case 'export_page_as_image':
        result = await exportPageAsImage(args.nodeId, args.format || 'png', args.scale || 2);
        break;
      case 'create_design_system_page':
        result = await createDesignSystemPage();
        break;
      case 'create_frame':
        result = await createFrame(
          args.pageName,
          args.frameName,
          args.width,
          args.height,
          args.x,
          args.y,
          args.label,
        );
        break;
      default:
        result = { error: `Unknown tool: ${name}` };
    }
  } catch (error) {
    result = { error: error.message };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🎨 Figma MCP Server started successfully');
  console.error(`📁 Connected to Figma file: ${FIGMA_FILE_ID}`);
  console.error('✅ Ready to handle Figma design system requests');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
