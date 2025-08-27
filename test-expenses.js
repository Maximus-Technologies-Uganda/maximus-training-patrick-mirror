const assert = require('assert');

// --- Helper function for testing ---
function calculateTotal(expenses) {
  return expenses.reduce((sum, expense) => sum + expense.amount, 0);
}

console.log('Running tests...');

// Test 1: Simple case with multiple expenses
const expenses1 = [
  { description: 'Coffee', amount: 5 },
  { description: 'Lunch', amount: 15 }
];
const total1 = calculateTotal(expenses1);
assert.strictEqual(total1, 20, 'Test 1 Failed: Total should be 20');

// Test 2: Case with an empty list
const expenses2 = [];
const total2 = calculateTotal(expenses2);
assert.strictEqual(total2, 0, 'Test 2 Failed: Total should be 0');

console.log('All tests passed! 🎉');