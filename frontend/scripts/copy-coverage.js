import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = resolve(rootDir, 'coverage');
const targetDir = resolve(rootDir, 'dist', 'coverage');

if (!existsSync(sourceDir)) {
  console.log('[copy-coverage] coverage directory not found; skipping copy.');
  process.exit(0);
}

mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });
console.log(`[copy-coverage] Copied coverage assets to ${targetDir}`);
