#!/usr/bin/env tsx
/**
 * sync-openapi.ts
 * Syncs canonical OpenAPI YAML spec to api/openapi.json
 * 
 * Usage:
 *   tsx scripts/sync-openapi.ts [--src path] [--out path] [--check]
 * 
 * Flags:
 *   --src    Source YAML file (default: specs/008-identity-platform/contracts/openapi.yaml)
 *   --out    Output JSON file (default: api/openapi.json)
 *   --check  Dry-run mode: check for drift without writing (exits 1 if different)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { parseArgs } from 'node:util';
import yaml from 'yaml';

interface OpenAPIDocument {
  openapi: string;
  info: unknown;
  paths: unknown;
  [key: string]: unknown;
}

function main() {
  const { values } = parseArgs({
    options: {
      src: { type: 'string', default: 'specs/008-identity-platform/contracts/openapi.yaml' },
      out: { type: 'string', default: 'api/openapi.json' },
      check: { type: 'boolean', default: false }
    }
  });

  const srcPath = path.resolve(process.cwd(), values.src!);
  const outPath = path.resolve(process.cwd(), values.out!);

  // Read and parse YAML
  if (!fs.existsSync(srcPath)) {
    console.error(`[ERROR] Source file not found: ${srcPath}`);
    process.exit(1);
  }

  const yamlContent = fs.readFileSync(srcPath, 'utf-8');
  let parsed: OpenAPIDocument;

  try {
    parsed = yaml.parse(yamlContent) as OpenAPIDocument;
  } catch (err) {
    console.error(`[ERROR] Failed to parse YAML: ${err}`);
    process.exit(1);
  }

  // Validate minimal required keys
  if (!parsed.openapi || !parsed.openapi.startsWith('3.')) {
    console.error(`[ERROR] Invalid OpenAPI version: ${parsed.openapi} (expected 3.x)`);
    process.exit(1);
  }

  if (!parsed.info) {
    console.error('[ERROR] Missing required "info" section');
    process.exit(1);
  }

  if (!parsed.paths) {
    console.error('[ERROR] Missing required "paths" section');
    process.exit(1);
  }

  // Pretty-print JSON with stable key order (2-space indent)
  const jsonContent = JSON.stringify(parsed, null, 2) + '\n';

  // Check mode: compare without writing
  if (values.check) {
    if (fs.existsSync(outPath)) {
      const existingContent = fs.readFileSync(outPath, 'utf-8');
      if (existingContent === jsonContent) {
        console.log('[OK] No drift detected - api/openapi.json matches canonical spec');
        process.exit(0);
      } else {
        console.error('[ERROR] Drift detected - api/openapi.json differs from canonical spec');
        console.error('   Run: npm run contracts:sync');
        process.exit(1);
      }
    } else {
      console.error('[ERROR] Output file missing - run: npm run contracts:sync');
      process.exit(1);
    }
  }

  // Write JSON to output
  const outDir = path.dirname(outPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(outPath, jsonContent, 'utf-8');
  console.log(`[OK] Synced ${srcPath} -> ${outPath}`);
  console.log(`  OpenAPI ${parsed.openapi}`);
  console.log(`  Paths: ${Object.keys(parsed.paths).length}`);
}

main();
