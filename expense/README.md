## Expense Tracker CLI

### Overview
Command-line tool to track personal expenses. Add entries, list them with filters, compute totals, and generate monthly reports. Data is stored in `expense/expenses.json`.

### Supported commands
- **add**: Add a new expense entry (amount, category, date, and optional note).
- **list**: List expenses, optionally filtered by month or category.
- **total**: Show the total amount, optionally filtered by month or category.
- **report**: Output a summary report for a specific month (`--month=YYYY-MM`).

### Usage examples

#### add
```bash
node expense/src/index.js add --amount=23.50 --category=groceries --date=2025-01-05 --note="milk and bread"
```

#### list
```bash
# list all
node expense/src/index.js list

# list for a category
node expense/src/index.js list --category=transport

# list for a month (YYYY-MM)
node expense/src/index.js list --month=2025-01
```

#### total
```bash
# total for all expenses
node expense/src/index.js total

# total for a category
node expense/src/index.js total --category=groceries

# total for a month
node expense/src/index.js total --month=2025-01
```

#### report
```bash
# monthly report (required flag)
node expense/src/index.js report --month=2025-01
```

### Running tests
```bash
node expense/tests/test.js
```

### Demo
![Expense Tracker demo](../docs/expense-demo.gif)


