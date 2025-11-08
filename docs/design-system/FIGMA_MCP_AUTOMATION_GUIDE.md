# Figma MCP Automation Guide

This guide explains how to use the Figma MCP server to automate design system setup.

## Architecture

```
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
```

## Environment Setup

Set these environment variables before running:

```bash
export FIGMA_TOKEN="your-figma-token-here"
export FIGMA_FILE_ID="MGlfufUnqRLzy4wRwgA4r5"
```

## MCP Tools Available

### 1. create_page

Creates a new page in the Figma file.

```json
{
  "tool": "create_page",
  "pageName": "Design System Tokens"
}
```

### 2. list_pages

Lists all pages in the Figma file.

```json
{
  "tool": "list_pages"
}
```

### 3. create_frame

Creates a frame with custom dimensions and label.

```json
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
```

### 4. export_page_as_image

Exports a page or frame as an image.

```json
{
  "tool": "export_page_as_image",
  "nodeId": "1:2",
  "format": "png",
  "scale": 2
}
```

### 5. create_design_system_page

Creates a complete design system page with sections.

```json
{
  "tool": "create_design_system_page",
  "pageName": "Design System Tokens"
}
```

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
