#!/usr/bin/env node

/**
 * Release Creation Script
 *
 * Automates release publication with version tagging and artifact upload.
 * Coordinates with evidence packet and governance report.
 *
 * Usage:
 *   npm run release:create -- --version v8.0.0
 *
 * Steps:
 *   1. Validate version format (semver)
 *   2. Verify gate artifacts exist (contracts, a11y, security)
 *   3. Create git tag
 *   4. Build release notes from RELEASE-NOTES.md
 *   5. Upload packet as release artifact
 *   6. Publish GitHub release (when CI env detected)
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

interface ReleaseConfig {
  version: string;
  tagName: string;
  title: string;
  body: string;
  artifacts: string[];
}

const REPO_ROOT = process.cwd();
const PACKET_DIR = path.join(REPO_ROOT, 'packet');
const RELEASE_NOTES_FILE = path.join(REPO_ROOT, 'RELEASE-NOTES.md');

/**
 * Parse and validate semantic version
 */
function parseVersion(input: string): { major: number; minor: number; patch: number; raw: string } {
  const match = /^v?(\d+)\.(\d+)\.(\d+)(?:-[a-zA-Z0-9.]+)?$/.exec(input);

  if (!match) {
    throw new Error(`Invalid semantic version: ${input}. Expected format: v1.0.0 or 1.0.0`);
  }

  return {
    major: Number.parseInt(match[1], 10),
    minor: Number.parseInt(match[2], 10),
    patch: Number.parseInt(match[3], 10),
    raw: input.startsWith('v') ? input : `v${input}`,
  };
}

/**
 * Extract release notes for a specific version
 */
function extractReleaseNotes(version: string): string {
  if (!fs.existsSync(RELEASE_NOTES_FILE)) {
    return `Release ${version}`;
  }

  const content = fs.readFileSync(RELEASE_NOTES_FILE, 'utf8');
  const lines = content.split('\n');
  let inSection = false;
  let notes: string[] = [];
  const versionRegex = new RegExp(`^##\\s+${version}`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (versionRegex.test(line)) {
      inSection = true;
      continue;
    }

    if (inSection && line.match(/^##\s+/)) {
      break; // End of this version's section
    }

    if (inSection) {
      notes.push(line);
    }
  }

  return notes.join('\n').trim() || `Release ${version}`;
}

/**
 * Verify gate artifacts exist
 */
function verifyGateArtifacts(): void {
  const requiredArtifacts = ['contracts', 'a11y', 'security'];
  const missing: string[] = [];

  for (const artifact of requiredArtifacts) {
    const artifactPath = path.join(PACKET_DIR, artifact);
    if (!fs.existsSync(artifactPath)) {
      missing.push(artifact);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing gate artifacts: ${missing.join(', ')}. Run 'npm run gate:packet' first.`,
    );
  }
}

/**
 * Create git tag
 */
function createGitTag(tagName: string): void {
  try {
    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const isMainBranch = currentBranch === 'main' || currentBranch === 'master';

    if (!isMainBranch) {
      console.warn(`⚠ Not on main/master branch (currently on ${currentBranch})`);
    }

    // Create annotated tag
    execSync(`git tag -a ${tagName} -m "Release ${tagName}"`, { stdio: 'inherit' });
    console.log(`✓ Created git tag: ${tagName}`);
  } catch (error) {
    throw new Error(
      `Failed to create git tag: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

/**
 * List packet artifacts for release
 */
function listPacketArtifacts(): string[] {
  const artifacts: string[] = [];

  if (fs.existsSync(PACKET_DIR)) {
    const files = fs.readdirSync(PACKET_DIR);
    for (const file of files) {
      if (file !== 'manifest.json') {
        artifacts.push(path.join(PACKET_DIR, file));
      }
    }
  }

  return artifacts;
}

/**
 * Create release configuration
 */
function createReleaseConfig(versionString: string): ReleaseConfig {
  const version = parseVersion(versionString);
  const tagName = version.raw;
  const releaseNotes = extractReleaseNotes(version.raw);
  const artifacts = listPacketArtifacts();

  return {
    version: version.raw,
    tagName,
    title: `Release ${version.raw}`,
    body: releaseNotes,
    artifacts,
  };
}

/**
 * Main release creation workflow
 */
function main(): void {
  const args = process.argv.slice(2);
  let versionString: string | null = null;

  // Parse --version argument
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--version' && i + 1 < args.length) {
      versionString = args[i + 1];
      i++;
    }
  }

  if (!versionString) {
    console.log('Usage: npm run release:create -- --version v8.0.0');
    process.exit(1);
  }

  try {
    console.log(`Creating release: ${versionString}`);

    // Validate version
    parseVersion(versionString);
    console.log('✓ Version format valid');

    // Verify gate artifacts
    verifyGateArtifacts();
    console.log('✓ Gate artifacts verified');

    // Create config
    const config = createReleaseConfig(versionString);
    console.log(`✓ Release config created (${config.artifacts.length} artifacts)`);

    // Create git tag
    createGitTag(config.tagName);

    // Display summary
    console.log('\nRelease Summary:');
    console.log(`  Version: ${config.version}`);
    console.log(`  Title: ${config.title}`);
    console.log(`  Artifacts: ${config.artifacts.length}`);
    console.log('\nNext steps:');
    console.log('  1. Push tag: git push origin ' + config.tagName);
    console.log('  2. GitHub Actions will publish the release with artifacts');

    process.exit(0);
  } catch (error) {
    console.error(
      'Release creation failed:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createReleaseConfig, parseVersion, extractReleaseNotes };
