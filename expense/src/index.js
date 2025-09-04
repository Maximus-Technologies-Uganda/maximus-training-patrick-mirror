const fs = require('fs');
const path = require('path');
const core = require('./core');
const argsHelper = require('../../helpers/args');

const DATA_FILE = path.resolve(__dirname, '..', 'expenses.json');
const { validateMonth, filterExpenses, getExpenseMonth } = core;

function parseReportArgs(tokens) {
  const { month } = argsHelper.parseCommonFlags(tokens);
  return { month };
}

// filterExpenses and getExpenseMonth are provided by core

function handleReport(tokens) {
  const { month } = parseReportArgs(tokens);
  if (!month || !validateMonth(month)) {
    argsHelper.exitWithError('Error: --month must be in YYYY-MM format with a valid month (01-12).');
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
    argsHelper.exitWithError(`Error: failed to generate report: ${e.message}`);
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
  const { command, rest } = argsHelper.parseArgs(process.argv);
  if (command === 'report') {
    handleReport(rest);
    return;
  }
  if (command === 'list') {
    try {
      const { month, category } = argsHelper.parseCommonFlags(rest);
      if (month === '__INVALID__' || category === '__INVALID__') {
        argsHelper.exitWithError('Error: malformed flags. Use --month=YYYY-MM and non-empty --category.');
      }
      if (month && !validateMonth(month)) {
        argsHelper.exitWithError('Error: --month must be in YYYY-MM format with a valid month (01-12).');
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
      argsHelper.exitWithError(`Error: failed to list expenses: ${e.message}`);
    }
    return;
  }
  if (command === 'total') {
    try {
      const { month, category } = argsHelper.parseCommonFlags(rest);
      if (month === '__INVALID__' || category === '__INVALID__') {
        argsHelper.exitWithError('Error: malformed flags. Use --month=YYYY-MM and non-empty --category.');
      }
      if (month && !validateMonth(month)) {
        argsHelper.exitWithError('Error: --month must be in YYYY-MM format with a valid month (01-12).');
      }
      const expenses = readExpenses();
      const filtered = filterExpenses(expenses, { month, category });
      const sum = filtered.reduce((acc, e) => {
        const n = Number(e && e.amount);
        return Number.isFinite(n) ? acc + n : acc;
      }, 0);
      console.log(`Total expenses: ${sum}`);
    } catch (e) {
      argsHelper.exitWithError(`Error: failed to compute total: ${e.message}`);
    }
    return;
  }
  if (command === 'clear') {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2) + '\n', 'utf8');
      console.log('Cleared expenses.');
    } catch (e) {
      argsHelper.exitWithError(`Error: failed to clear expenses: ${e.message}`);
    }
    return;
  }
  argsHelper.exitWithError(`Error: unknown command '${command}'.
Usage:
  node expense/src/index.js list [--month=YYYY-MM] [--category=<name>]
  node expense/src/index.js total [--month=YYYY-MM] [--category=<name>]
  node expense/src/index.js report --month=YYYY-MM
  node expense/src/index.js clear`);
})();
