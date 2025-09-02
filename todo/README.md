## To-Do CLI

### Overview
Command-line To-Do application to add tasks, list them with useful filters, and generate summaries. Tasks are stored in `todo/todos.json`.

### Supported commands
- **add**: Add a new to-do item with optional due date and priority. Prevents duplicates (same text + due date).
- **list**: List to-dos, with optional filters for due today or high priority.
- **toggle**: Toggle completion by ID.
- **remove**: Remove a to-do by ID.
- **filter**: Show items by simple criteria (e.g., high priority). [If not implemented, use list flags instead.]

### Usage

Run from the repository root.

#### add
```bash
# basic add
node todo/src/index.js add "Buy milk"

# add with due date and priority (low|medium|high)
node todo/src/index.js add "Pay electricity bill" --due=2025-10-31 --priority=high

# duplicate protection example (same text + due date is rejected)
node todo/src/index.js add "Pay electricity bill" --due=2025-10-31 --priority=medium
```

#### list
```bash
# all items
node todo/src/index.js list

# items due today
node todo/src/index.js list --dueToday

# only high-priority items
node todo/src/index.js list --highPriority
```

#### toggle
```bash
# toggle completion by numeric ID
node todo/src/index.js toggle 3
```

#### remove
```bash
# remove by numeric ID
node todo/src/index.js remove 2
```

#### filter
```bash
# if implemented, show high-priority items (otherwise use list --highPriority)
node todo/src/index.js filter --highPriority
```

### Running tests
```bash
node todo/tests/test.js
```

### Demo
![To-Do demo](../docs/todo-demo.gif)


<!-- touch: ensure this README is explicitly included in a follow-up commit -->
