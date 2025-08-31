const assert = require('assert');
const fs = require('fs');
const { execSync, spawnSync } = require('child_process');

// --- Helper function for testing ---
function calculateTotal(expenses) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

console.log('Running tests...');

// Test 1: Simple case with multiple expenses
const expenses1 = [ { description: 'Coffee', amount: 5 }, { description: 'Lunch', amount: 15 } ];
const total1 = calculateTotal(expenses1);
assert.strictEqual(total1, 20, 'Test 1 Failed: Total should be 20');

// Test 2: Case with an empty list
const expenses2 = [];
const total2 = calculateTotal(expenses2);
assert.strictEqual(total2, 0, 'Test 2 Failed: Total should be 0');

// Test 3: Case with decimal numbers
const expenses3 = [ { description: 'Tea', amount: 2.50 }, { description: 'Snack', amount: 3.75 } ];
const total3 = calculateTotal(expenses3);
assert.strictEqual(total3, 6.25, 'Test 3 Failed: Total should be 6.25');

// Test 4: Case with a single expense
const expenses4 = [{ description: 'Ticket', amount: 50.00 }];
const total4 = calculateTotal(expenses4);
assert.strictEqual(total4, 50.00, 'Test 4 Failed: Total should be 50.00');

// Test 5: Case with non-numeric amounts
const expenses5 = [ { description: 'Valid', amount: 10 }, { description: 'Invalid', amount: 'abc' } ];
const total5 = calculateTotal(expenses5);
assert.ok(isNaN(total5), 'Test 5 Failed: Total should be NaN with invalid data');

console.log('All existing tests passed!');

// Test 6: TDD test for report command using an isolated temp file
console.log('\nRunning TDD test for report command...');
const tmpReportFile = './tmp-expenses-report.json';
const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();

// One recent expense ($10), one old (ignored)
fs.writeFileSync(
  tmpReportFile,
  JSON.stringify(
    [
      { description: 'Coffee', amount: 10, category: 'food', date: twoDaysAgo },
      { description: 'Old', amount: 999, category: 'misc', date: eightDaysAgo }
    ],
    null,
    2
  )
);

try {
  const result = spawnSync('node', ['expense-tracker.js', '--test-file', tmpReportFile, 'report'], { encoding: 'utf-8' });
  const output = (result.stdout + result.stderr).trim();

  // Expect a clear header and the correct total for the last 7 days
  assert.ok(output.includes('Weekly Expense Report'), 'Test 6 Failed: Output should include the report header');
  assert.ok(output.includes('Total for the last 7 days: $10.00'), 'Test 6 Failed: Output should include the correct weekly total');
} catch (error) {
  console.error('❌ Test 6 failed: report command not working as expected.');
  throw error;
} finally {
  try { fs.unlinkSync(tmpReportFile); } catch (_) {}
}