## Expense Tracker CLI

### Overview
Command-line tool to track personal expenses. Add entries, list them with filters, compute totals, and generate monthly reports. Data is stored in `expense/expenses.json`.

### Supported commands
- **add**: Add a new expense entry (amount, category, date, and an optional note).
- **list**: List expenses, optionally filtered by month or category.
- **total**: Show the total amount, optionally filtered by month or category.
- **report**: Output a summary report for a specific month (`--month=YYYY-MM`).

### Usage

Run from the repository root.

#### list
List expenses with optional filters.
```bash
# all expenses
node expense/src/index.js list

# by category (non-empty name)
node expense/src/index.js list --category=transport

# by month (YYYY-MM)
node expense/src/index.js list --month=2025-01

# by category and month
node expense/src/index.js list --category=groceries --month=2025-01
```

#### total
Show the total amount, with the same optional filters.
```bash
# total for all expenses
node expense/src/index.js total

# total for a category (non-empty name)
node expense/src/index.js total --category=groceries

# total for a month (YYYY-MM)
node expense/src/index.js total --month=2025-01

# total for a category in a month
node expense/src/index.js total --category=food --month=2025-02
```

#### report
Generate a summary report for a specific month.
```bash
# month is required and must be YYYY-MM
node expense/src/index.js report --month=2025-01
```

#### Help
On unknown commands or malformed flags, the CLI prints usage:
```
Usage:
  node expense/src/index.js list [--month=YYYY-MM] [--category=<name>]
  node expense/src/index.js total [--month=YYYY-MM] [--category=<name>]
  node expense/src/index.js report --month=YYYY-MM
  node expense/src/index.js clear
```

### Running tests
```bash
node expense/tests/test.js
```

### Demo
![Expense Tracker demo](../docs/expense-demo.gif)


<!-- touch: ensure this README is explicitly included in a follow-up commit -->
