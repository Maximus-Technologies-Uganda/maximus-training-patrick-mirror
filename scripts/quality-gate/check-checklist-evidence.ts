#!/usr/bin/env node

/**
 * Checklist-to-Evidence Validation (T106/DEV-707)
 *
 * Maps checked items in PR description to tasks and evidence artifacts.
 * Ensures every checked item has corresponding evidence before release.
 *
 * Checklist Format (PR body):
 *  - [x] Item 1 (DEV-123)
 *  - [x] Item 2
 *  - [ ] Unchecked item
 *
 * Validation:
 *  - Extracts checked items
 *  - Maps to task IDs (Linear keys or explicit references)
 *  - Verifies packet contains related artifacts
 *
 * Usage: npm run gate:checklists [--pr-body <body>]
 */

import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

interface ChecklistItem {
  index: number;
  text: string;
  checked: boolean;
  taskId?: string;
  artifacts?: string[];
}

interface ChecklistValidationResult {
  totalItems: number;
  checkedItems: number;
  validatedItems: ChecklistItem[];
  missingEvidence: {
    itemIndex: number;
    text: string;
    missingArtifacts: string[];
  }[];
  passed: boolean;
}

const REPO_ROOT = process.cwd();
const PACKET_DIR = path.join(REPO_ROOT, 'packet');

/**
 * Parse PR body markdown checklist
 */
function parseChecklist(body: string): ChecklistItem[] {
  const lines = body.split('\n');
  const items: ChecklistItem[] = [];
  let itemIndex = 0;

  for (const line of lines) {
    // Match: - [x] or - [ ] followed by text
    const match = /^[\s]*[-*]\s+\[([ xX])\]\s+(.+)$/m.exec(line);

    if (match) {
      const checked = match[1].toLowerCase() === 'x';
      const text = match[2].trim();

      // Extract task ID if present (e.g., "DEV-123", "T028")
      const taskIdMatch = /(?:DEV-\d+|T\d+)/i.exec(text);
      const taskId = taskIdMatch ? taskIdMatch[0] : undefined;

      items.push({
        index: itemIndex,
        text,
        checked,
        taskId,
      });

      itemIndex++;
    }
  }

  return items;
}

/**
 * Map checklist item to required artifacts
 */
function mapItemToArtifacts(item: ChecklistItem): string[] {
  const artifacts: string[] = [];

  // Common patterns
  if (item.text.toLowerCase().includes('coverage')) {
    artifacts.push('coverage-report');
  }
  if (
    item.text.toLowerCase().includes('a11y') ||
    item.text.toLowerCase().includes('accessibility')
  ) {
    artifacts.push('a11y', 'a11y-report');
  }
  if (item.text.toLowerCase().includes('contract') || item.text.toLowerCase().includes('openapi')) {
    artifacts.push('contracts');
  }
  if (item.text.toLowerCase().includes('security') || item.text.toLowerCase().includes('audit')) {
    artifacts.push('security');
  }
  if (
    item.text.toLowerCase().includes('performance') ||
    item.text.toLowerCase().includes('benchmark')
  ) {
    artifacts.push('benchmarks');
  }

  // Fallback: require contracts for all items (API changes)
  if (artifacts.length === 0) {
    artifacts.push('contracts');
  }

  return [...new Set(artifacts)]; // Remove duplicates
}

/**
 * Read packet manifest
 */
function readPacketManifest(): Record<string, boolean> {
  const manifestPath = path.join(PACKET_DIR, 'manifest.json');

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const artifacts: Record<string, boolean> = {};

    if (manifest.artifacts && Array.isArray(manifest.artifacts)) {
      for (const artifact of manifest.artifacts) {
        artifacts[artifact.name] = artifact.exists;
      }
    }

    return artifacts;
  } catch {
    return {};
  }
}

/**
 * Validate checklist against available artifacts
 */
function validateChecklist(prBody: string): ChecklistValidationResult {
  const items = parseChecklist(prBody);
  const packetArtifacts = readPacketManifest();
  const missingEvidence: ChecklistValidationResult['missingEvidence'] = [];

  const checkedItems = items.filter((item) => item.checked);

  for (const item of checkedItems) {
    const requiredArtifacts = mapItemToArtifacts(item);
    const missing = requiredArtifacts.filter((artifact) => !packetArtifacts[artifact]);

    if (missing.length > 0) {
      missingEvidence.push({
        itemIndex: item.index,
        text: item.text,
        missingArtifacts: missing,
      });
    }
  }

  const passed = missingEvidence.length === 0;

  return {
    totalItems: items.length,
    checkedItems: checkedItems.length,
    validatedItems: checkedItems,
    missingEvidence,
    passed,
  };
}

/**
 * Main validation flow
 */
function main(): void {
  const args = process.argv.slice(2);
  let prBody = '';

  // Parse --pr-body argument
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pr-body' && i + 1 < args.length) {
      prBody = args[i + 1];
      i++;
    }
  }

  // Fallback: read from stdin or environment
  if (!prBody && process.env.PR_BODY) {
    prBody = process.env.PR_BODY;
  }

  if (!prBody) {
    console.log("Usage: npm run gate:checklists -- --pr-body '<markdown-body>'");
    console.log('No PR body provided, exiting with success (non-blocking)');
    process.exit(0);
  }

  const result = validateChecklist(prBody);

  console.log(`\nChecklist Validation Report`);
  console.log(`Total items: ${result.totalItems}`);
  console.log(`Checked items: ${result.checkedItems}`);

  if (result.validatedItems.length > 0) {
    console.log('\nValidated items:');
    for (const item of result.validatedItems) {
      const requiredArtifacts = mapItemToArtifacts(item);
      console.log(`  [${item.index}] ${item.text}${item.taskId ? ` (${item.taskId})` : ''}`);
      console.log(`      Requires: ${requiredArtifacts.join(', ')}`);
    }
  }

  if (result.missingEvidence.length > 0) {
    console.error('\nMissing evidence:');
    for (const missing of result.missingEvidence) {
      console.error(`  [${missing.itemIndex}] ${missing.text}`);
      console.error(`      Missing artifacts: ${missing.missingArtifacts.join(', ')}`);
    }
  }

  if (result.passed) {
    console.log('\n✓ All checked items have required evidence');
    process.exit(0);
  } else {
    console.error('\n✗ Some checked items are missing evidence artifacts');
    process.exit(1);
  }
}

const invokedPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : null;

if (invokedPath && import.meta.url === invokedPath) {
  main();
}

export { parseChecklist, validateChecklist, mapItemToArtifacts };
