#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

const THRESHOLDS = { statements: 60, branches: 50, functions: 55 };

function readCoverageSummary(baseDir) {
  const summaryPath = path.join(baseDir, 'coverage', 'coverage-summary.json');
  if (!fs.existsSync(summaryPath)) {
    console.error(`Coverage summary not found at ${summaryPath}`);
    process.exit(1);
  }
  try {
    return JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  } catch (e) {
    console.error(`Failed to parse ${summaryPath}: ${e.message}`);
    process.exit(1);
  }
}

function toTable(summary) {
  const total = summary.total || {};
  const metrics = [
    { key: 'statements', label: 'Statements' },
    { key: 'branches', label: 'Branches' },
    { key: 'functions', label: 'Functions' },
    { key: 'lines', label: 'Lines' },
  ];
  const rows = [['Metric', 'Covered', 'Total', '%', 'Threshold', 'Status']];
  for (const m of metrics) {
    const s = total[m.key] || {};
    const covered = s.covered ?? 0;
    const totalCount = s.total ?? 0;
    const pct = typeof s.pct === 'number' ? `${s.pct.toFixed(2)}%` : 'n/a';
    const threshold = THRESHOLDS[m.key] != null ? `≥${THRESHOLDS[m.key]}%` : 'n/a';
    const status = THRESHOLDS[m.key] != null && typeof s.pct === 'number'
      ? (s.pct >= THRESHOLDS[m.key] ? '✅' : '❌')
      : '—';
    rows.push([m.label, covered, totalCount, pct, threshold, status]);
  }
  const widths = rows[0].map((_, i) => Math.max(...rows.map(r => String(r[i]).length)));
  const pad = arr => arr.map((c, i) => String(c).padEnd(widths[i])).join(' | ');
  let table = `| ${pad(rows[0])} |\n| ${widths.map(w => '-'.repeat(w)).join(' | ')} |\n`;
  for (let i = 1; i < rows.length; i++) table += `| ${pad(rows[i])} |\n`;
  return table;
}

function main() {
  const base = process.argv[2] && process.argv[2] !== '.' ? process.argv[2] : process.cwd();
  const summary = readCoverageSummary(base);
  const table = toTable(summary);
  const heading = '### frontend-next Coverage (with thresholds)';
  process.stdout.write(`${heading}\n\n${table}`);
}

main();


