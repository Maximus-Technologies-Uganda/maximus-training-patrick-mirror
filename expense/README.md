## Expense Tracker CLI

### Overview
Command-line tool to track personal expenses. Add entries, list them with filters, compute totals, and generate monthly reports. Data is stored in `expense/expenses.json`.

### Supported commands
- **list**: List expenses, optionally filtered by month or category.
- **total**: Show the total amount, optionally filtered by month or category.
- **report**: Output a summary report for a specific month (`--month=YYYY-MM`).
- **clear**: Clear all expenses (resets `expense/expenses.json` to an empty array).

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
#### clear
Reset the expenses file to an empty list.
```bash
node expense/src/index.js clear
# -> prints: "Cleared expenses."
```
#### Help
On unknown commands or malformed flags, the CLI prints usage and exits with code 1:
```
Usage:
  node expense/src/index.js list [--month=YYYY-MM] [--category=<name>]
  node expense/src/index.js total [--month=YYYY-MM] [--category=<name>]
  node expense/src/index.js report --month=YYYY-MM
  node expense/src/index.js clear
```

### Exit Codes
- **0**: Success - Command executed successfully.
- **1**: Error - Invalid arguments, malformed flags, missing files, or other runtime errors.

### Running tests
```bash
node expense/tests/test.js
```

### How to run the UI

The Expense Tracker now includes a modern web interface for visualizing and managing expenses.

#### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

#### Setup
1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

#### Running the UI
1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to `http://localhost:5173/expense.html`

Alternatively, you can open the HTML file directly in your browser:
```bash
# From the repository root
open frontend/expense.html
```

#### UI Features
- **Expense Table**: View all expenses in a clean, sortable table format
- **Month Filter**: Filter expenses by specific months using the date picker
- **Category Filter**: Filter expenses by category using the dropdown menu
- **Total Display**: See the total amount of filtered expenses
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Filtering**: Filters apply instantly as you make selections

#### UI Testing
The frontend includes comprehensive test coverage:

1. **Unit Tests** (Vitest):
```bash
npm run test:run
```

2. **End-to-End Tests** (Playwright):
```bash
npm run test:e2e
```

3. **UI Test Runner**:
```bash
npm run test:ui
```

#### Development
- **Linting**: Check code quality with ESLint
```bash
npm run lint
```

- **Code Formatting**: Format code with Prettier
```bash
npm run format
```

#### File Structure
```
frontend/
├── expense.html          # Main UI page
├── expense.js            # Frontend logic and API calls
├── expense.test.js       # Unit tests for filter logic
├── tests/
│   └── expense.spec.js   # E2E smoke tests
└── package.json          # Frontend dependencies and scripts
```

#### Browser Support
- Chrome/Edge (recommended)
- Firefox
- Safari
- Mobile browsers (iOS Safari, Chrome Mobile)

### Demo
![Expense Tracker demo](../docs/expense-demo.gif)


<!-- touch: ensure this README is explicitly included in a follow-up commit -->
