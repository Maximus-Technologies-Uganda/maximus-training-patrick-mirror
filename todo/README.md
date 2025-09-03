## To-Do CLI

### Overview
Command-line To-Do application to add tasks, list them with useful filters, and generate summaries. Tasks are stored in `todo/todos.json`.

### Supported commands
- **add**: Add a new to-do item with optional due date and priority. Prevents duplicates by text.
- **list**: List to-dos, with optional filters for due today or high priority.
- **complete**: Mark a to-do as completed by ID.
- **remove**: Remove a to-do by ID.

### Usage

Run from the repository root.

#### add
```bash
# basic add
node todo/src/index.js add "Buy milk"

# add with due date and priority (low|medium|high)
node todo/src/index.js add "Pay electricity bill" --due=2025-10-31 --priority=high

# duplicate protection (same text is rejected regardless of due date)
node todo/src/index.js add "Pay electricity bill" --due=2025-11-01 --priority=medium
```

#### list
```bash
# all items
node todo/src/index.js list

# items due today (local date)
node todo/src/index.js list --dueToday

# only high-priority items
node todo/src/index.js list --highPriority
```

#### complete
```bash
# mark completion by numeric ID
node todo/src/index.js complete 3
```

#### remove
```bash
# remove by numeric ID
node todo/src/index.js remove 2
```

Note: Filtering by high priority uses `list --highPriority`.

### Running tests
```bash
node todo/tests/test.js
```

### Demo
![To-Do demo](../docs/todo-demo.gif)


<!-- touch: ensure this README is explicitly included in a follow-up commit -->
