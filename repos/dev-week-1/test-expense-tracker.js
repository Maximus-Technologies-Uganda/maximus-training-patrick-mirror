const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const testFile = path.join(__dirname, 'tmp-expenses.json');

function cleanup() {
  if (fs.existsSync(testFile)) {
    try { fs.unlinkSync(testFile); } catch (_) {}
  }
}

function run(argsArray) {
  const result = spawnSync('node', ['expense-tracker.js', ...argsArray], { encoding: 'utf-8' });
  return { code: result.status, out: (result.stdout + result.stderr).trim() };
}

console.log('Running expense-tracker edge case tests...');
cleanup();

try {
  // 1) Missing file should behave as empty
  let res = run(['--test-file', testFile, 'list']);
  assert.ok(res.out.includes('No expenses recorded.'), 'Missing file should be treated as empty');

  // 2) Whitespace-only file should be treated as empty, not crash
  fs.writeFileSync(testFile, '   ');
  res = run(['--test-file', testFile, 'list']);
  assert.ok(res.out.includes('No expenses recorded.'), 'Whitespace file should be treated as empty');

  // 3) Invalid JSON should not crash; treated as empty with helpful message
  fs.writeFileSync(testFile, '{bad');
  res = run(['--test-file', testFile, 'list']);
  assert.ok(res.out.toLowerCase().includes('invalid or corrupt expenses file'), 'Invalid JSON should be flagged');
  assert.ok(res.out.includes('No expenses recorded.'), 'Invalid JSON should be treated as empty');

  // 4) Non-array JSON should be handled gracefully
  fs.writeFileSync(testFile, JSON.stringify({ not: 'an array' }));
  res = run(['--test-file', testFile, 'list']);
  assert.ok(res.out.toLowerCase().includes('must be a json array'), 'Non-array JSON should be flagged');
  assert.ok(res.out.includes('No expenses recorded.'), 'Non-array JSON should be treated as empty');

  // 5) --test-file after command should still select path
  cleanup();
  res = run(['add', 'Coffee', '4.50', 'food', '--test-file', testFile]);
  assert.ok(res.out.includes('Expense added successfully.'), 'Add should succeed with --test-file after command');
  const data1 = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
  assert.strictEqual(data1.length, 1, 'One expense should be stored');
  assert.strictEqual(typeof data1[0].amount, 'number', 'Amount should be stored as number');

  // 6) Non-finite amount (Infinity) should be rejected
  res = run(['--test-file', testFile, 'add', 'Weird', 'Infinity', 'misc']);
  assert.ok(res.out.toLowerCase().includes('amount must be a finite number'), 'Infinity should be rejected');
  const data2 = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
  assert.strictEqual(data2.length, 1, 'File should not be modified on invalid add');

  // 7) Negative amount should be rejected
  res = run(['--test-file', testFile, 'add', 'Refund', '-5', 'misc']);
  assert.ok(res.out.toLowerCase().includes('amount must be non-negative'), 'Negative amount should be rejected');
  const data3 = JSON.parse(fs.readFileSync(testFile, 'utf-8'));
  assert.strictEqual(data3.length, 1, 'File should not be modified on invalid add');

  // 8) Amount stored as string in file should not crash list/total; coerced to number
  fs.writeFileSync(testFile, JSON.stringify([
    { description: 'Tea', amount: '2.50', category: 'food', date: new Date().toISOString() },
    { description: 'Snack', amount: '3.75', category: 'food', date: new Date().toISOString() }
  ], null, 2));
  res = run(['--test-file', testFile, 'list']);
  assert.ok(res.out.includes('Tea'), 'List should include Tea');
  res = run(['--test-file', testFile, 'total']);
  assert.ok(res.out.includes('Total expenses: $6.25'), 'Total should coerce string amounts');

  // 9) Report should include only last 7 days
  const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  fs.writeFileSync(testFile, JSON.stringify([
    { description: 'Old', amount: 100, category: 'misc', date: eightDaysAgo },
    { description: 'Recent', amount: 10, category: 'misc', date: twoDaysAgo }
  ], null, 2));
  res = run(['--test-file', testFile, 'report']);
  assert.ok(res.out.includes('Weekly Expense Report'), 'Report header should appear');
  assert.ok(res.out.includes('Total for the last 7 days: $10.00'), 'Report total should include only recent expenses');

  console.log('All expense-tracker edge case tests passed!');
} catch (err) {
  console.error('Test failed:', err.message);
  process.exit(1);
} finally {
  cleanup();
}


