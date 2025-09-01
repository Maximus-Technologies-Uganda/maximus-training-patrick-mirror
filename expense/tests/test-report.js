const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawn } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../src/index.js');
const DATA_FILE = path.resolve(__dirname, '../expenses.json');

function runCli(args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI_PATH, ...args], {
      cwd: options.cwd || path.resolve(__dirname, '..')
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

async function testSuccessfulMonthlyReport() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([
    { id: 1, amount: 12.5, category: 'groceries', date: '2025-01-02' },
    { id: 2, amount: 20, category: 'groceries', date: '2025-01-15' },
    { id: 3, amount: 7.5, category: 'transport', date: '2025-01-03' },
    { id: 4, amount: 5, category: 'transport', date: '2025-02-01' }
  ], null, 2) + '\n', 'utf8');

  const res = await runCli(['report', '--month=2025-01']);
  assert.strictEqual(res.code, 0, 'report should exit with code 0');
  const out = res.stdout.trim();
  assert.ok(/Report for 2025-01/.test(out), 'report header should include the month');
  // Totals per category
  assert.ok(/groceries:\s*32\.5\b/.test(out), 'groceries total should be 32.5');
  assert.ok(/transport:\s*7\.5\b/.test(out), 'transport total should be 7.5');
}

async function testMonthWithNoData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([
    { id: 1, amount: 10, category: 'misc', date: '2025-03-01' }
  ], null, 2) + '\n', 'utf8');

  const res = await runCli(['report', '--month=2025-01']);
  assert.strictEqual(res.code, 0, 'report should exit 0 even if no data');
  assert.ok(/No expenses found for 2025-01\./.test(res.stdout), 'should print no data message');
}

async function testTotalingByCategoryFilters() {
  fs.writeFileSync(DATA_FILE, JSON.stringify([
    { id: 1, amount: 10, category: 'food', date: '2025-01-05' },
    { id: 2, amount: 15, category: 'food', date: '2025-01-10' },
    { id: 3, amount: 5, category: 'transport', date: '2025-01-07' },
    { id: 4, amount: 8, category: 'transport', date: '2025-02-01' }
  ], null, 2) + '\n', 'utf8');

  // Total with category only
  let res = await runCli(['total', '--category=food']);
  assert.strictEqual(res.code, 0, 'total should exit with code 0');
  let match = res.stdout.trim().match(/([0-9]+(?:\.[0-9]+)?)(?!.*[0-9])/);
  assert.ok(match, `expected numeric total in output, got: ${res.stdout}`);
  let total = parseFloat(match[1]);
  assert.ok(Math.abs(total - 25) < 1e-9, `expected total 25, got ${total}`);

  // Total with month and category
  res = await runCli(['total', '--month=2025-01', '--category=transport']);
  assert.strictEqual(res.code, 0);
  match = res.stdout.trim().match(/([0-9]+(?:\.[0-9]+)?)(?!.*[0-9])/);
  total = parseFloat(match[1]);
  assert.ok(Math.abs(total - 5) < 1e-9, `expected total 5, got ${total}`);
}

async function testInvalidMonthFormat() {
  const res = await runCli(['list', '--month=2025-13']);
  assert.notStrictEqual(res.code, 0, 'invalid month should exit non-zero');
  assert.ok(/Error:.*month.*YYYY-MM.*valid month/i.test(res.stderr), 'should print a clear month format error');
}

(async function run() {
  let failures = 0;
  try {
    await testSuccessfulMonthlyReport();
    console.log('PASS monthly report shows totals per category');
  } catch (err) {
    failures++;
    console.error('FAIL monthly report shows totals per category');
    console.error(err && err.stack ? err.stack : err);
  }

  try {
    await testMonthWithNoData();
    console.log('PASS report shows message for month with no data');
  } catch (err) {
    failures++;
    console.error('FAIL report shows message for month with no data');
    console.error(err && err.stack ? err.stack : err);
  }

  try {
    await testTotalingByCategoryFilters();
    console.log('PASS total supports category and month filters');
  } catch (err) {
    failures++;
    console.error('FAIL total supports category and month filters');
    console.error(err && err.stack ? err.stack : err);
  }

  try {
    await testInvalidMonthFormat();
    console.log('PASS invalid month format is rejected with error');
  } catch (err) {
    failures++;
    console.error('FAIL invalid month format is rejected with error');
    console.error(err && err.stack ? err.stack : err);
  }

  process.exitCode = failures ? 1 : 0;
})();


