/* c8 ignore start */
const assert = require('assert');
const path = require('path');
const { spawnSync } = require('child_process');
const { validateMonth, getExpenseMonth, filterExpenses, sumExpenses, totalsByCategoryForMonth } = require('../src/core');

const CLI = path.resolve(__dirname, '../src/index.js');

function runCli(args) {
  const res = spawnSync(process.execPath, [CLI, ...args], {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
    windowsHide: true,
  });
  return res;
}

(function run() {
  let failures = 0;

  function step(name, fn) {
    try {
      fn();
      console.log(`PASS ${name}`);
    } catch (err) {
      failures++;
      console.error(`FAIL ${name}`);
      console.error(err && err.stack ? err.stack : String(err));
    }
  }

  step('validateMonth basic invalids', () => {
    assert.strictEqual(validateMonth('2025-13'), false);
    assert.strictEqual(validateMonth('2025/01'), false);
    assert.strictEqual(validateMonth('1969-12'), false);
    assert.strictEqual(validateMonth('1970-01'), true);
  });

  step('getExpenseMonth parses both formats', () => {
    assert.strictEqual(getExpenseMonth({ date: '2025-04-30' }), '2025-04');
    assert.strictEqual(getExpenseMonth({ date: '2025-04' }), '2025-04');
    assert.strictEqual(getExpenseMonth({ date: 'bad' }), null);
  });

  step('filterExpenses: category/month/both/no flags', () => {
    const expenses = [
      { id: 1, amount: 10, category: 'food', date: '2025-04-01' },
      { id: 2, amount: 5, category: 'travel', date: '2025-04-30' },
      { id: 3, amount: 7, category: 'food', date: '2025-05-01' },
    ];
    assert.deepStrictEqual(filterExpenses(expenses, { category: 'food' }).map(e => e.id), [1, 3]);
    assert.deepStrictEqual(filterExpenses(expenses, { month: '2025-04' }).map(e => e.id), [1, 2]);
    assert.deepStrictEqual(filterExpenses(expenses, { month: '2025-04', category: 'food' }).map(e => e.id), [1]);
    assert.strictEqual(filterExpenses(expenses, {}).length, 3);
  });

  step('sumExpenses and totalsByCategoryForMonth', () => {
    const expenses = [
      { amount: 10, category: 'food', date: '2025-04-01' },
      { amount: 'x', category: 'food', date: '2025-04-02' },
      { amount: 2, category: null, date: '2025-04-03' },
      { amount: 1, category: 'misc', date: '2025-05-01' },
    ];
    assert.strictEqual(sumExpenses(expenses), 13);
    const totals = totalsByCategoryForMonth(expenses, '2025-04');
    assert.strictEqual(totals.food, 10);
    assert.strictEqual(totals.uncategorized, 2);
  });

  step('CLI smoke: report prints no data for old month', () => {
    const r = runCli(['report', '--month=1970-01']);
    assert.strictEqual(r.status, 0);
    assert.ok((r.stdout || '').toLowerCase().includes('no expenses'));
  });

  process.exitCode = failures ? 1 : 0;
})();

/* c8 ignore stop */

