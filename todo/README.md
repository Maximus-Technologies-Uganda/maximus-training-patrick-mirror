## To-Do CLI

### Overview
Command-line To-Do application to add tasks, list them with useful filters, and generate summaries. Tasks are stored in `todo/todos.json`.

### Supported commands
- **add**: Add a new to-do item with optional due date and priority.
- **list**: List to-dos, with optional filters for due today or high priority.
- **total**: Show a summary count of to-dos (e.g., total, completed, pending).
- **report**: Generate a human-readable summary of to-dos for quick review.

### Usage examples

#### add
- Add a basic to-do:
```bash
node todo/src/index.js add "Buy milk"
```
- Add with due date and priority:
```bash
node todo/src/index.js add "Pay electricity bill" --due=2025-10-31 --priority=high
```

#### list
- List all to-dos:
```bash
node todo/src/index.js list
```
- Only items due today:
```bash
node todo/src/index.js list --dueToday
```
- Only high-priority items:
```bash
node todo/src/index.js list --highPriority
```

#### total
- Overall summary counts:
```bash
node todo/src/index.js total
```
- Example with a filter (if supported):
```bash
node todo/src/index.js total --highPriority
```

#### report
- Quick report of items due today:
```bash
node todo/src/index.js report --dueToday
```
- Quick report of high-priority items:
```bash
node todo/src/index.js report --highPriority
```

### Running tests
```bash
node todo/tests/test.js
```

### Demo
![To-Do demo](../docs/todo-demo.gif)


