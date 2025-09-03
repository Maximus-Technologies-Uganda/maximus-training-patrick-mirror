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

### 2025-09-03 (Docs & Hygiene - DEV-12)

### Added
- **Docs**:
  - Updated per-app READMEs to reflect current flags and outputs for `expense`, `todo`, `stopwatch`, and `quote`. (DEV-18)
  - Root README now includes instructions to access the CI coverage artifact and PR coverage table. (DEV-19)
- **CI**:
  - Coverage report HTML is uploaded as an artifact with an index page across apps. (DEV-19)
- **Process**:
  - Added PR template enforcing links to Linear issues and required artifacts/snippets. (DEV-21)

### Changed
- **Docs**:
  - `todo` README uses `complete` instead of `toggle`; removed unsupported `filter` command in favor of list flags. (DEV-18)
  - `quote` README updated to use `quote/src/index.js` entry point. (DEV-18)
  - `expense` README now documents `clear` command and tightened usage notes. (DEV-18)


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


