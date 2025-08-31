# My First Week CLI Projects

This repository contains the projects I built during the first week of my developer journey. It includes a stopwatch, an expense tracker, and a to-do list app.

## Installation

You need Node.js installed on your computer. No other installation is required.

## Usage

### Stopwatch
- `node stopwatch.js start` - Starts the timer.
- `node stopwatch.js stop` - Stops the timer and shows elapsed time.
- `node stopwatch.js reset` - Resets the timer.

### Expense Tracker
- `node expense-tracker.js add "description" amount` - Adds an expense.
- `node expense-tracker.js list` - Lists all expenses.
- `node expense-tracker.js total` - Shows the total of all expenses.

### To-Do App
- `node todo-app.js add "your task"` - Adds a new to-do.
- `node todo-app.js list` - Lists all to-dos.
- `node todo-app.js toggle <index>` - Toggles the completed status of a to-do.
- `node todo-app.js remove <index>` - Removes a to-do.

## Running Tests

Run the test suites using Node.js:
```bash
node test-expenses.js
node test-todo-app.js