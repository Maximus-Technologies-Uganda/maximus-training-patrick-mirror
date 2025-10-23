#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

const specPath = path.resolve('specs/008-identity-platform/contracts/openapi.yaml');
const outDir = path.resolve('specs/008-identity-platform/contracts');
const outPath = path.join(outDir, 'spectral-report.json');

if (!fs.existsSync(specPath)) {
  console.error(`[ERROR] Spec not found: ${specPath}`);
  process.exit(1);
}

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const spectralPkg = '@stoplight/spectral-cli';
const lintArgs = ['lint', specPath, '--format', 'json', '--fail-severity=off'];

function run(cmd, args) {
  return spawnSync(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' });
}

const isWin = process.platform === 'win32';
const exts = isWin ? ['.cmd', '.CMD', ''] : [''];
const binBaseNames = ['spectral'];

function findLocalSpectral() {
  for (const base of binBaseNames) {
    for (const ext of exts) {
      const candidateApi = path.resolve('api', 'node_modules', '.bin', base + ext);
      if (fs.existsSync(candidateApi)) return candidateApi;
      const candidateRoot = path.resolve('node_modules', '.bin', base + ext);
      if (fs.existsSync(candidateRoot)) return candidateRoot;
    }
  }
  return null;
}

let result;
// Try running the CLI JS directly via node for cross-platform reliability
try {
  const { createRequire } = await import('node:module');
  const req = createRequire(import.meta.url);
  const pkgPath = req.resolve(`${spectralPkg}/package.json`, { paths: [ path.resolve('api'), process.cwd() ] });
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  const binRel = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin && pkg.bin.spectral ? pkg.bin.spectral : 'dist/cli.js';
  const cliPath = path.resolve(path.dirname(pkgPath), binRel);
  const nodeCmd = isWin ? 'node.exe' : 'node';
  result = run(nodeCmd, [cliPath, ...lintArgs]);
} catch (_e) {
  // Fallback to using spectral binary if resolve failed
  const localSpectral = findLocalSpectral();
  if (localSpectral) {
    result = run(localSpectral, lintArgs);
  } else {
    const npxCmd = isWin ? 'npx.cmd' : 'npx';
    const pnpmCmd = isWin ? 'pnpm.cmd' : 'pnpm';
    result = run(npxCmd, ['-y', `${spectralPkg}@6.11.0`, ...lintArgs]);
    if (result.error || result.status !== 0) {
      // Fallback to pnpm dlx if available
      const dlx = run(pnpmCmd, ['dlx', `${spectralPkg}@6.11.0`, ...lintArgs]);
      result = dlx;
    }
  }
}

if (result.error) {
  console.error(result.error.stack || String(result.error));
  if (result.stderr) console.error(result.stderr);
  process.exit(1);
}

// Spectral writes JSON to stdout when --format json is used
const stdout = result.stdout?.trim() || '[]';

try {
  // Validate JSON output before writing
  JSON.parse(stdout);
  fs.writeFileSync(outPath, stdout + '\n', 'utf-8');
  console.log(`[OK] Wrote Spectral report → ${outPath}`);
} catch (e) {
  console.error('[ERROR] Failed to parse spectral JSON output');
  console.error(stdout);
  process.exit(0);
}

// Always exit 0; downstream gates should parse report JSON
process.exit(0);


