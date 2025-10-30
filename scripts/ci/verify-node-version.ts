#!/usr/bin/env node

/**
 * Verify Node.js version matches LTS requirements.
 * Enforces Node 20.x across CI/CD and development environments.
 *
 * Usage:
 *   node --input-type=module verify-node-version.ts [--range 20.x] [--major 20]
 *
 * Environment variables:
 *   NODE_VERSION_RANGE: Override the expected version range (default: "20.x")
 */

interface NodeVersionParts {
  raw: string;
  major: number;
  minor: number;
  patch: number;
}

interface VerificationResult {
  passed: boolean;
  actual: NodeVersionParts;
  expected: string;
  message: string;
}

/**
 * Parse a Node.js version string into components.
 * Handles formats: "v20", "v20.11", "v20.11.0", "20.11.0"
 */
export function parseNodeVersion(input: string): NodeVersionParts {
  const raw = input.trim();
  const match = /^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(raw);

  if (!match) {
    throw new Error(`Invalid Node.js version format: ${raw}`);
  }

  const [, majorRaw, minorRaw = '0', patchRaw = '0'] = match;
  const major = Number.parseInt(majorRaw, 10);
  const minor = Number.parseInt(minorRaw, 10);
  const patch = Number.parseInt(patchRaw, 10);

  return { raw, major, minor, patch };
}

/**
 * Verify Node.js version against expected range.
 * Supports patterns: "20.x", "20", ">=20.11.0"
 */
export function verifyNodeVersion(
  actual: NodeVersionParts,
  expectedRange: string = '20.x',
): VerificationResult {
  const normalizedRange = expectedRange.trim();

  // Handle "20.x" or "20" patterns
  if (normalizedRange.includes('.x') || normalizedRange === '20') {
    const expectedMajor = Number.parseInt(normalizedRange, 10);
    const passed = actual.major === expectedMajor;

    return {
      passed,
      actual,
      expected: normalizedRange,
      message: passed
        ? `✓ Node.js v${actual.major}.${actual.minor}.${actual.patch} matches required LTS ${expectedMajor}.x`
        : `✗ Node.js v${actual.major}.${actual.minor}.${actual.patch} does not match required LTS ${expectedMajor}.x`,
    };
  }

  // Handle ">=20.11.0" patterns
  if (normalizedRange.startsWith('>=')) {
    const minVersion = parseNodeVersion(normalizedRange.replace('>=', ''));
    const passed =
      actual.major > minVersion.major ||
      (actual.major === minVersion.major && actual.minor > minVersion.minor) ||
      (actual.major === minVersion.major &&
        actual.minor === minVersion.minor &&
        actual.patch >= minVersion.patch);

    return {
      passed,
      actual,
      expected: normalizedRange,
      message: passed
        ? `✓ Node.js v${actual.major}.${actual.minor}.${actual.patch} meets minimum ${normalizedRange}`
        : `✗ Node.js v${actual.major}.${actual.minor}.${actual.patch} below minimum ${normalizedRange}`,
    };
  }

  throw new Error(`Unsupported version range format: ${normalizedRange}`);
}

/**
 * Main entry point for CLI usage.
 * Parses process.version and validates against environment/CLI args.
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const nodeVersion = process.version; // e.g., "v20.11.0"

  // Parse CLI arguments
  let expectedRange = '20.x';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--range' && i + 1 < args.length) {
      expectedRange = args[i + 1];
      i++;
    }
    if (args[i] === '--major' && i + 1 < args.length) {
      expectedRange = args[i + 1];
      i++;
    }
  }

  // Override with environment variable if set
  if (process.env.NODE_VERSION_RANGE) {
    expectedRange = process.env.NODE_VERSION_RANGE;
  }

  try {
    const actual = parseNodeVersion(nodeVersion);
    const result = verifyNodeVersion(actual, expectedRange);

    console.log(result.message);

    if (!result.passed) {
      process.exit(1);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ Node.js version verification failed: ${message}`);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
}
