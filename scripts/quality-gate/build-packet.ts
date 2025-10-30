#!/usr/bin/env node

/**
 * Evidence Packet Builder (T080/DEV-705)
 *
 * Aggregates release evidence artifacts:
 *  - Contracts: api/openapi.json
 *  - A11y: a11y/results.json
 *  - Benchmarks: k6-results/ (latency snapshots)
 *  - Security: security/audit-summary.json
 *
 * Output:
 *  - packet/manifest.json — metadata about included artifacts
 *  - packet/<artifact> — copied or symlinked artifacts
 *
 * Usage: npm run gate:packet [--force]
 */

import fs from 'fs';
import path from 'path';

interface ArtifactFile {
  name: string;
  path: string;
  required: boolean;
  description: string;
}

interface PacketManifest {
  version: string;
  timestamp: string;
  artifacts: {
    name: string;
    path: string;
    required: boolean;
    exists: boolean;
    description: string;
  }[];
  summary: {
    requiredPresent: number;
    requiredMissing: string[];
    optionalPresent: number;
    totalSize: number;
  };
}

const REPO_ROOT = process.cwd();
const PACKET_DIR = path.join(REPO_ROOT, 'packet');

const REQUIRED_ARTIFACTS: ArtifactFile[] = [
  {
    name: 'contracts',
    path: 'api/openapi.json',
    required: true,
    description: 'OpenAPI 3.1 specification (contract source of truth)',
  },
  {
    name: 'a11y',
    path: 'a11y/results.json',
    required: true,
    description: 'Accessibility audit results (Playwright + axe-core)',
  },
  {
    name: 'security',
    path: 'security/audit-summary.json',
    required: true,
    description: 'Security audit summary (npm audit)',
  },
];

const OPTIONAL_ARTIFACTS: ArtifactFile[] = [
  {
    name: 'benchmarks',
    path: 'k6-results/summary.json',
    required: false,
    description: 'Performance benchmarks (latency snapshots)',
  },
  {
    name: 'coverage-report',
    path: 'docs/ReviewPacket/coverage.html',
    required: false,
    description: 'Coverage report HTML',
  },
  {
    name: 'a11y-report',
    path: 'docs/ReviewPacket/a11y.html',
    required: false,
    description: 'A11y audit report HTML',
  },
];

function fileExists(filePath: string): boolean {
  try {
    return fs.existsSync(filePath);
  } catch {
    return false;
  }
}

function getFileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function copyArtifact(src: string, dest: string): boolean {
  try {
    const destDir = path.dirname(dest);
    ensureDir(destDir);
    fs.copyFileSync(src, dest);
    return true;
  } catch (error) {
    console.warn(
      `Failed to copy ${src}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return false;
  }
}

function buildPacket(force: boolean = false): void {
  console.log('Building evidence packet...');

  ensureDir(PACKET_DIR);

  const allArtifacts = [...REQUIRED_ARTIFACTS, ...OPTIONAL_ARTIFACTS];
  const manifestArtifacts: PacketManifest['artifacts'] = [];
  const missingRequired: string[] = [];
  let totalSize = 0;

  for (const artifact of allArtifacts) {
    const fullPath = path.join(REPO_ROOT, artifact.path);
    const exists = fileExists(fullPath);
    const size = exists ? getFileSize(fullPath) : 0;

    const manifestEntry = {
      name: artifact.name,
      path: artifact.path,
      required: artifact.required,
      exists,
      description: artifact.description,
    };

    manifestArtifacts.push(manifestEntry);

    if (exists) {
      totalSize += size;
      const destName = artifact.name;
      const destPath = path.join(PACKET_DIR, destName);
      const copied = copyArtifact(fullPath, destPath);
      console.log(`  ${artifact.name}: ${copied ? '✓ copied' : '✗ failed'} (${size} bytes)`);
    } else {
      console.warn(`  ${artifact.name}: ✗ missing`);
      if (artifact.required) {
        missingRequired.push(artifact.name);
      }
    }
  }

  const manifest: PacketManifest = {
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    artifacts: manifestArtifacts,
    summary: {
      requiredPresent: manifestArtifacts.filter((a) => a.required && a.exists).length,
      requiredMissing: missingRequired,
      optionalPresent: manifestArtifacts.filter((a) => !a.required && a.exists).length,
      totalSize,
    },
  };

  const manifestPath = path.join(PACKET_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`\nPacket manifest written to ${manifestPath}`);

  // Fail if required artifacts are missing (unless --force)
  if (missingRequired.length > 0 && !force) {
    console.error(`\n✗ Required artifacts missing: ${missingRequired.join(', ')}`);
    console.error('  Use --force to build packet anyway');
    process.exit(1);
  }

  if (missingRequired.length > 0 && force) {
    console.warn(
      `⚠ Building with missing required artifacts (--force): ${missingRequired.join(', ')}`,
    );
  }

  console.log(`✓ Packet built successfully (${(totalSize / 1024).toFixed(2)} KB)`);
}

// CLI entry point
function main(): void {
  const args = process.argv.slice(2);
  const force = args.includes('--force');

  try {
    buildPacket(force);
  } catch (error) {
    console.error(
      'Failed to build packet:',
      error instanceof Error ? error.message : String(error),
    );
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { buildPacket };
