const fs = require('fs');

let expensesFilePath = './expenses.json';

// Parse CLI args to support --test-file anywhere
function parseCliArgs(argv) {
  let filePathOverride = null;
  const nonFlagTokens = [];
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token === '--test-file') {
      const next = argv[i + 1];
      if (!next) {
        console.error('Error: --test-file requires a path argument.');
        process.exit(1);
      }
      filePathOverride = next;
      i++;
      continue;
    }
    nonFlagTokens.push(token);
  }
  return { filePathOverride, command: nonFlagTokens[0], args: nonFlagTokens.slice(1) };
}

function readExpenses() {
  if (!fs.existsSync(expensesFilePath)) {
    return [];
  }
  const fileContent = fs.readFileSync(expensesFilePath, 'utf-8');
  if (fileContent.trim().length === 0) {
    return [];
  }
  try {
    const parsed = JSON.parse(fileContent);
    if (!Array.isArray(parsed)) {
      console.error('Warning: expenses file must be a JSON array. Treating as empty.');
      return [];
    }
    // Coerce string amounts to numbers where possible to avoid crashes in list/total/report
    return parsed.map(expense => {
      if (expense && typeof expense.amount !== 'number') {
        const coerced = Number(expense.amount);
        if (Number.isFinite(coerced)) {
          expense.amount = coerced;
        }
      }
      return expense;
    });
  } catch (e) {
    console.error('Warning: invalid or corrupt expenses file. Treating as empty.');
    return [];
  }
}

function writeExpenses(expenses) {
  fs.writeFileSync(expensesFilePath, JSON.stringify(expenses, null, 2));
}

const parsedCli = parseCliArgs(process.argv);
if (parsedCli.filePathOverride) {
  expensesFilePath = parsedCli.filePathOverride;
}
let command = parsedCli.command;
let args = parsedCli.args;
let expenses = readExpenses();

if (command === 'add') {
  const description = args[0];
  const amount = parseFloat(args[1]);
  const category = args[2];

  if (!description || isNaN(amount) || !category) {
    console.error('Error: Please provide a description, amount, and category.');
    console.error('Example: node expense-tracker.js add "Coffee" 4.50 "food"');
    return;
  }

  if (!Number.isFinite(amount)) {
    console.error('Error: Amount must be a finite number.');
    return;
  }

  if (amount < 0) {
    console.error('Error: Amount must be non-negative.');
    return;
  }

  const newExpense = {
    description: description,
    amount: amount,
    category: category,
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
      console.log(`- ${expense.description} (${expense.category}): $${expense.amount.toFixed(2)} on ${displayDate}`);
    });
    console.log('---------------------');
  }

} else if (command === 'total') {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  console.log(`Total expenses: $${total.toFixed(2)}`);

} else if (command === 'report') {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentExpenses = expenses.filter(expense => new Date(expense.date) >= sevenDaysAgo);

  if (recentExpenses.length === 0) {
    console.log('No expenses in the last 7 days.');
  } else {
    console.log('--- Weekly Expense Report ---');
    let total = 0;
    recentExpenses.forEach(expense => {
      total += expense.amount;
      const displayDate = new Date(expense.date).toLocaleDateString();
      console.log(`- ${expense.description} (${expense.category}): $${expense.amount.toFixed(2)} on ${displayDate}`);
    });
    console.log('---------------------------');
    console.log(`Total for the last 7 days: $${total.toFixed(2)}`);
  }

} else {
  console.log('Unknown command. Use: add, list, total, or report.');
}