#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

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
  const pct = key => (total[key] && typeof total[key].pct === 'number') ? `${total[key].pct}%` : 'n/a';
  const rows = [
    ['Metric', 'Percent'],
    ['Statements', pct('statements')],
    ['Branches', pct('branches')],
    ['Functions', pct('functions')],
    ['Lines', pct('lines')],
  ];
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
  const heading = '### frontend-next Coverage Totals (Statements/Branches/Functions/Lines)\n';
  process.stdout.write(`${heading}\n${table}`);
}

main();


