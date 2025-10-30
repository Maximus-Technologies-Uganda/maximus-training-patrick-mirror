# Playwright MCP Server

This repo includes the official Playwright MCP server for local tooling and agent integrations.

## Install

Already installed at workspace root as a devDependency: `@playwright/mcp`.

If you need to (re)install:

```
pnpm add -w -D @playwright/mcp
```

On Windows, we set `pnpm config set node-linker hoisted` to avoid symlink issues.

## Run

Start the MCP server over stdio:

```
pnpm mcp:playwright
```

This exposes tools over MCP for clients like Claude Desktop, Cursor, or other MCP-compatible IDEs.

## Claude Desktop (example)

Add to your Claude Desktop config (Windows path: `%AppData%/Claude/claude_desktop_config.json`). Adjust `command`/`args` to your environment.

```
{
  "mcpServers": {
    "playwright": {
      "command": "pnpm",
      "args": ["mcp:playwright"],
      "cwd": "C:/Users/LENOVO/Training"
    }
  }
}
```

If your client does not support `cwd`, use `npx` instead (will download if not present):

```
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest", "mcp-server-playwright", "--stdio"]
    }
  }
}
```

## Validate

You can validate with the MCP Inspector:

```
npx @modelcontextprotocol/inspector pnpm mcp:playwright
```

If not available, install locally:

```
pnpm add -w -D @modelcontextprotocol/inspector
pnpm exec mcp-inspector pnpm mcp:playwright
```

## Notes

- The server bundles Playwright and may download browsers on first run.
- For CI, prefer running from a dedicated workspace or container with caches pre-warmed.
