const fs = require('fs');
 const path = require('path');
const core = require('./core');
const DATA_FILE = path.resolve(__dirname, '..', 'expenses.json');

const { validateMonth, filterExpenses, getExpenseMonth } = core;

function parseArgs(argv) {
  const args = { command: argv[2] || '', rest: argv.slice(3) };
  return args;
}

function parseCommonFlags(tokens) {
  let month = null;
  let category = null;
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i] || '';
    if (t === '--') break; // stop flag parsing
    if (t.startsWith('--month=')) {
      month = t.slice('--month='.length);
    } else if (t === '--month') {
      const v = tokens[++i];
      if (!v || v.startsWith('--')) return { month: '__INVALID__', category };
      month = v;
    } else if (t.startsWith('--category=')) {
      category = t.slice('--category='.length);
    } else if (t === '--category') {
      const v = tokens[++i];
      if (!v || v.startsWith('--')) return { month, category: '__INVALID__' };
      category = v;
    } else if (t.startsWith('-')) {
      // unknown or malformed flag
      return { month: '__INVALID__', category: '__INVALID__' };
    }
  }
  if (typeof category === 'string' && category.trim() === '') {
    category = '__INVALID__';
  }
  return { month, category };
}

function parseReportArgs(tokens) {
  const { month } = parseCommonFlags(tokens);
  return { month };
}

// filterExpenses and getExpenseMonth are provided by core

function handleReport(tokens) {
  const { month } = parseReportArgs(tokens);
  if (!month || !validateMonth(month)) {
    console.error('Error: --month must be in YYYY-MM format with a valid month (01-12).');
    process.exitCode = 1;
    return;
  }
  try {
    const expenses = readExpenses();
    const scoped = filterExpenses(expenses, { month });
    if (!scoped.length) {
      console.log(`No expenses found for ${month}.`);
      return;
    }
    const totals = Object.create(null);
    for (const e of scoped) {
      const key = typeof (e && e.category) === 'string' && e.category ? e.category : 'uncategorized';
      const n = Number(e && e.amount);
      if (Number.isFinite(n)) {
        totals[key] = (totals[key] || 0) + n;
      }
    }
    const categories = Object.keys(totals).sort((a, b) => a.localeCompare(b));
    console.log(`Report for ${month}`);
    for (const c of categories) {
      console.log(`${c}: ${totals[c]}`);
    }
  } catch (e) {
    console.error('Error: failed to generate report:', e.message);
    process.exitCode = 1;
  }
}

(function ensureDataFile() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2) + '\n', 'utf8');
    }
  } catch {}
})();

function readExpenses() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw.trim()) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

(function main() {
  const { command, rest } = parseArgs(process.argv);
  if (command === 'report') {
    handleReport(rest);
    return;
  }
  if (command === 'list') {
    try {
      const { month, category } = parseCommonFlags(rest);
      if (month === '__INVALID__' || category === '__INVALID__') {
        console.error('Error: malformed flags. Use --month=YYYY-MM and non-empty --category.');
        process.exitCode = 1;
        return;
      }
      if (month && !validateMonth(month)) {
        console.error('Error: --month must be in YYYY-MM format with a valid month (01-12).');
        process.exitCode = 1;
        return;
      }
      const expenses = readExpenses();
      const filtered = filterExpenses(expenses, { month, category });
      if (!filtered.length) {
        console.log('No expenses to list.');
        return;
      }
      for (const e of filtered) {
        console.log(JSON.stringify(e));
      }
    } catch (e) {
      console.error('Error: failed to list expenses:', e.message);
      process.exitCode = 1;
    }
    return;
  }
  if (command === 'total') {
    try {
      const { month, category } = parseCommonFlags(rest);
      if (month === '__INVALID__' || category === '__INVALID__') {
        console.error('Error: malformed flags. Use --month=YYYY-MM and non-empty --category.');
        process.exitCode = 1;
        return;
      }
      if (month && !validateMonth(month)) {
        console.error('Error: --month must be in YYYY-MM format with a valid month (01-12).');
        process.exitCode = 1;
        return;
      }
      const expenses = readExpenses();
      const filtered = filterExpenses(expenses, { month, category });
      const sum = filtered.reduce((acc, e) => {
        const n = Number(e && e.amount);
        return Number.isFinite(n) ? acc + n : acc;
      }, 0);
      console.log(`Total expenses: ${sum}`);
    } catch (e) {
      console.error('Error: failed to compute total:', e.message);
      process.exitCode = 1;
    }
    return;
  }
  if (command === 'clear') {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2) + '\n', 'utf8');
      console.log('Cleared expenses.');
    } catch (e) {
      console.error('Error: failed to clear expenses:', e.message);
      process.exitCode = 1;
    }
    return;
  }
  console.error('Error: unknown command.');
  console.error('Usage:');
  console.error('  node expense/src/index.js list [--month=YYYY-MM] [--category=<name>]');
  console.error('  node expense/src/index.js total [--month=YYYY-MM] [--category=<name>]');
  console.error('  node expense/src/index.js report --month=YYYY-MM');
  console.error('  node expense/src/index.js clear');
  process.exitCode = 1;
})();
