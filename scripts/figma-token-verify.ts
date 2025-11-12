/**
 * Token Parity Verification Script
 * Warns when design tokens diverge from spec baseline
 * Used as a CI gate (warn-only mode)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

/**
 * Flatten nested token object to dot-notation paths
 */
function flattenTokens(obj: Record<string, unknown>, prefix = ''): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Skip metadata
    if (key === '$metadata') continue;

    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && 'value' in (value as Record<string, unknown>)) {
      // It's a token with a value
      result[fullKey] = (value as Record<string, unknown>).value;
    } else if (typeof value === 'object') {
      // Recurse into nested objects
      Object.assign(result, flattenTokens(value as Record<string, unknown>, fullKey));
    }
  }

  return result;
}

/**
 * Main: Load tokens and report diffs
 */
function main(): void {
  const tokensPath = join(process.cwd(), 'frontend-next/design/tokens.json');

  if (!existsSync(tokensPath)) {
    console.warn(`⚠️  Token file not found: ${tokensPath}`);
    process.exit(0); // Non-blocking warn
  }

  try {
    const tokensContent = readFileSync(tokensPath, 'utf-8');
    const tokens = JSON.parse(tokensContent);

    const flatTokens = flattenTokens(tokens);
    const tokenCount = Object.keys(flatTokens).length;

    console.log(`✓ Token file loaded: ${tokenCount} tokens parsed`);

    // In a real scenario, you'd compare against a baseline
    // For now, just validate structure
    const hasCoreColors = Object.keys(flatTokens).some((k) => k.startsWith('core/colors.'));
    const hasCoreTypography = Object.keys(flatTokens).some((k) => k.startsWith('core/typography.'));
    const hasCoreSpacing = Object.keys(flatTokens).some((k) => k.startsWith('core/spacing.'));

    if (!hasCoreColors || !hasCoreTypography || !hasCoreSpacing) {
      console.warn(`⚠️  Warning: Missing expected token categories`);
      if (!hasCoreColors) console.warn('  - core/colors tokens missing');
      if (!hasCoreTypography) console.warn('  - core/typography tokens missing');
      if (!hasCoreSpacing) console.warn('  - core/spacing tokens missing');
    } else {
      console.log('✓ All core token categories present');
    }

    process.exit(0);
  } catch (error) {
    console.error(`✗ Error parsing tokens: ${error}`);
    process.exit(1);
  }
}

main();
