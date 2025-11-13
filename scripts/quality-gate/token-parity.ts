#!/usr/bin/env node

/**
 * Token Parity CI Integration (T026)
 * Detects design token drift (unused or missing usage)
 * Runs in CI with warn-only gate (non-blocking)
 * FR-018: Design token drift detection
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const path = require('path');

/**
 * Load design tokens from frontend-next/design/tokens.json
 */
function loadTokens() {
  const tokensPath = path.resolve(
    __dirname,
    '../..',
    'frontend-next/design/tokens.json'
  );

  if (!fs.existsSync(tokensPath)) {
    console.warn(
      `[WARN] Tokens file not found: ${tokensPath}. Skipping parity check.`
    );
    return {};
  }

  try {
    const content = fs.readFileSync(tokensPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`[ERROR] Failed to parse tokens file: ${error}`);
    process.exit(1);
  }
}

/**
 * Find all components using tokens
 */
function findComponentTokenUsage() {
  const srcDir = path.resolve(
    __dirname,
    '../../..',
    'frontend-next/src/components'
  );
  const used: Set<string> = new Set();

  if (!fs.existsSync(srcDir)) {
    return used;
  }

  function scanDirectory(dir: string) {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !file.startsWith('.')) {
        scanDirectory(fullPath);
      } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Simple pattern matching for token references
        // In production, use AST parsing for accuracy
        const tokenPattern = /tokens\[['"]([a-zA-Z0-9._-]+)['"]\]|tokens\.([a-zA-Z0-9._-]+)/g;
        let match;
        while ((match = tokenPattern.exec(content)) !== null) {
          const token = match[1] || match[2];
          if (token) {
            used.add(token);
          }
        }
      }
    });
  }

  scanDirectory(srcDir);
  return used;
}

/**
 * Flatten nested token object to dot notation
 */
function flattenTokens(tokens: Record<string, unknown>, prefix = ''): Map<string, unknown> {
  const flattened = new Map<string, unknown>();

  Object.entries(tokens).forEach(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      // Nested object - recurse
      flattenTokens(value as Record<string, unknown>, fullKey).forEach((v, k) => {
        flattened.set(k, v);
      });
    } else {
      // Leaf value
      flattened.set(fullKey, value);
    }
  });

  return flattened;
}

/**
 * Run parity check
 */
function checkParity() {
  console.log('[INFO] Starting design token parity check...\n');

  const tokens = loadTokens();
  const flattenedTokens = flattenTokens(tokens);
  const usedTokens = findComponentTokenUsage();

  console.log(`[INFO] Found ${flattenedTokens.size} defined tokens`);
  console.log(`[INFO] Found ${usedTokens.size} tokens in use\n`);

  const warnings: string[] = [];

  // Check for unused tokens
  flattenedTokens.forEach((value, tokenKey) => {
    if (!usedTokens.has(tokenKey)) {
      warnings.push(`Unused token: ${tokenKey}`);
    }
  });

  // Check for referenced tokens that don't exist
  usedTokens.forEach((tokenKey) => {
    if (!flattenedTokens.has(tokenKey)) {
      warnings.push(`Undefined token reference: ${tokenKey}`);
    }
  });

  if (warnings.length > 0) {
    console.warn('[WARN] Token parity issues found:\n');
    warnings.forEach((warning, i) => {
      console.warn(`  ${i + 1}. ${warning}`);
    });
    console.warn(
      `\n[WARN] Total issues: ${warnings.length} (non-blocking)\n`
    );
    return { success: true, warningCount: warnings.length };
  } else {
    console.log(
      '[SUCCESS] All tokens are defined and in use. Parity check passed.\n'
    );
    return { success: true, warningCount: 0 };
  }
}

// Run check
const result = checkParity();
process.exit(result.success ? 0 : 1);
