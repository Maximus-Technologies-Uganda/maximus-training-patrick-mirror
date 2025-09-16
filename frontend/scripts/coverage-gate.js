#!/usr/bin/env node
// Enforces per-file coverage thresholds using coverage/coverage-summary.json
// Thresholds:
// - src/todo-core*.{js,ts}: statements >= 55
// - other src/**/*.js|ts: statements >= 40

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

function toPosix(filePath) {
  return filePath.replace(/\\/g, '/');
}

function isSrcFile(posixPath) {
  return posixPath.startsWith('src/');
}

function isJsOrTs(posixPath) {
  return /\.(js|ts)$/.test(posixPath);
}

function isCoreModule(posixPath) {
  return /^src\/todo-core[^/]*\.(js|ts)$/.test(posixPath);
}

function isExplicitlyIgnored(posixPath) {
  // Skip DOM glue and storage adapter; validated via E2E
  const fileName = path.basename(posixPath).toLowerCase();
  return fileName === 'todo-dom.js' || fileName === 'todo-storage.js';
}

async function main() {
  try {
    const summaryPath = path.resolve(process.cwd(), 'coverage', 'coverage-summary.json');
    const raw = await readFile(summaryPath, 'utf-8');
    const summary = JSON.parse(raw);

    const results = [];
    for (const [key, metrics] of Object.entries(summary)) {
      if (key === 'total') continue;

      // Normalize to project-relative POSIX path
      const absoluteOrRelative = key;
      const absolutePath = path.isAbsolute(absoluteOrRelative)
        ? absoluteOrRelative
        : path.resolve(process.cwd(), absoluteOrRelative);
      const relativePath = toPosix(path.relative(process.cwd(), absolutePath));

      if (!isSrcFile(relativePath) || !isJsOrTs(relativePath)) continue;
      const ignoredByName = isExplicitlyIgnored(relativePath) || isExplicitlyIgnored(toPosix(absoluteOrRelative));
      if (ignoredByName) {
        // Skip DOM glue and storage adapter entirely from per-file gating
        continue;
      }

      const statementsTotal = metrics?.statements?.total ?? 0;
      const statementsPct = metrics?.statements?.pct ?? 0;
      if (statementsTotal === 0) continue; // skip files with no statements counted
      let threshold = isCoreModule(relativePath) ? 55 : 40;
      const passed = statementsPct >= threshold;
      results.push({ file: relativePath, pct: statementsPct, threshold, passed });
    }

    // Sort for stable output
    results.sort((a, b) => a.file.localeCompare(b.file));

    const totalPct = summary?.total?.statements?.pct ?? 0;
    console.log(`Coverage summary (statements): total ${totalPct.toFixed(2)}%`);
    for (const r of results) {
      const status = r.passed ? 'PASS' : 'FAIL';
      console.log(`${status} ${r.file}: ${r.pct.toFixed(2)}% >= ${r.threshold}%`);
    }

    const failed = results.filter(r => !r.passed);
    if (failed.length > 0) {
      console.error(`\nCoverage gate failed for ${failed.length} file(s). Thresholds: core >=55%, others >=40%.`);
      process.exit(1);
    }

    console.log('\nCoverage gate passed.');
  } catch (err) {
    console.error('Error while enforcing coverage gate:', err?.message || err);
    process.exit(1);
  }
}

await main();


