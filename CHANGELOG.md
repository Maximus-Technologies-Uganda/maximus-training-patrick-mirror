## Changelog

### 2025-09-03

### Added
- **Stopwatch**:
  - Golden-file tests for `export` output (populated and empty states) with newline normalization for cross-OS stability. (DEV-13)
- **Repo Hygiene**:
  - Enforced EOL normalization via `.gitattributes` (`* text=auto eol=lf`). (DEV-14)
  - Ensured each app has Jest coverage reporters (`json`, `lcov`, `text-summary`); updated `stopwatch/jest.config.js`. (DEV-15)
  - Added Quality Gate workflow to post coverage percentage table on PRs. (DEV-16)

### Changed
- **Stopwatch**:
  - Tests refactored to use golden files and stable normalization; added empty-state golden to assert headers-only output. (DEV-13)

### Notes
- These changes improve test determinism across platforms and provide fast feedback on PRs via coverage summary comments. (DEV-14–DEV-16)

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


