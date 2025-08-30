## Changelog

### 2025-08-30

### Added
- **Expense Tracker**:
  - `report` command with `--month=YYYY-MM` filter.
  - `list` command with filtering support (e.g., by month/category).
  - `total` command with filters (e.g., by month/category).

- **To-Do App**:
  - `add` command supporting `--due=YYYY-MM-DD` and `--priority=low|medium|high` flags.
  - Duplicate guard preventing addition of a task with the same text and due date.

- **Stopwatch**:
  - Core commands: `start`, `stop`, `lap`, and `status`.
  - `export` command with `--out=<filename>` flag and empty-state handling (prints a message and avoids file creation when there are no laps).

- **Testing**:
  - Added comprehensive test suites across Expense Tracker, To-Do App, and Stopwatch to ensure functionality and robustness, including edge cases and CLI error handling.


