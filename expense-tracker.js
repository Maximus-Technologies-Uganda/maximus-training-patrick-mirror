const fs = require('fs');
const expensesFilePath = './expenses.json';

// --- Helper Functions ---

// Function to read expenses from the JSON file
function readExpenses() {
  if (!fs.existsSync(expensesFilePath)) {
    return [];
  }
  const fileContent = fs.readFileSync(expensesFilePath);
  if (fileContent.length === 0) {
    return [];
  }
  return JSON.parse(fileContent);
}

// Function to write expenses to the JSON file
function writeExpenses(expenses) {
  fs.writeFileSync(expensesFilePath, JSON.stringify(expenses, null, 2));
}

// --- Command Handling ---

// Get the user's command and arguments
const command = process.argv[2];
const args = process.argv.slice(3);

// Load the current expenses
let expenses = readExpenses();

if (command === 'add') {
  const description = args[0];
  const amount = parseFloat(args[1]);

  const newExpense = {
    description: description,
    amount: amount,
    date: new Date().toISOString()
  };

  expenses.push(newExpense);
  writeExpenses(expenses);
  console.log('Expense added successfully.');

} else if (command === 'list') {
  if (expenses.length === 0) {
    console.log('No expenses recorded.');
  } else {
    console.log('--- Your Expenses ---');
    expenses.forEach(expense => {
      const displayDate = new Date(expense.date).toLocaleDateString();
      console.log(`- ${expense.description}: $${expense.amount.toFixed(2)} on ${displayDate}`);
    });
    console.log('---------------------');
  }

} else if (command === 'total') {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  console.log(`Total expenses: $${total.toFixed(2)}`);

} else {
  console.log('Unknown command. Use: add, list, or total.');
}module.exports = { readExpenses };