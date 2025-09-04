## Quote CLI

A simple command-line application that prints inspirational quotes from a local `quotes.json` file.

### Prerequisites

- Node.js 14+ installed

### Installation

No installation required. The CLI runs directly with Node from the repository.

### Usage

Run from the repository root.

#### Random Quote

Get a random inspirational quote:

```bash
node quote/bin/quote.js
```

Example output:
```bash
$ node quote/bin/quote.js
The only limit to our realization of tomorrow is our doubts of today. - Franklin D. Roosevelt
```

#### Filter by Author

Get a random quote from a specific author (case-insensitive):

```bash
node quote/bin/quote.js --by="Albert Einstein"
```

Or using separate arguments:

```bash
node quote/bin/quote.js --by "Albert Einstein"
```

Example output:
```bash
$ node quote/bin/quote.js --by="albert einstein"
In the middle of difficulty lies opportunity. - Albert Einstein
```

#### Case-Insensitive Author Matching

Author matching is case-insensitive. All of these will work:

```bash
node quote/bin/quote.js --by="mark twain"
node quote/bin/quote.js --by="MARK TWAIN"
node quote/bin/quote.js --by="Mark Twain"
```

#### Help

Display usage information:

```bash
node quote/bin/quote.js --help
```

Or:

```bash
node quote/bin/quote.js -h
```

Example output:
```bash
$ node quote/bin/quote.js --help
Usage: node quote/src/index.js [--by=<author>]
```

### Exit Codes

The CLI returns different exit codes based on the operation result:

- **0 (Success)**: Quote displayed successfully
- **1 (Error)**: Various error conditions including:
  - Missing or empty `quotes.json` file
  - Invalid JSON in `quotes.json`
  - Unknown author specified with `--by` flag
  - No valid quotes found after sanitization
  - Unexpected runtime errors

### Error Handling

- **Missing or empty quotes file**: Returns exit code 1 with message "Error: No quotes available. Ensure quotes.json exists beside index.js."
- **Unknown author**: Returns exit code 1 with message "Error: No quotes found for author \"[author name]\"."
- **Invalid JSON**: Returns exit code 1 with message "Error: No quotes available. Ensure quotes.json exists beside index.js."
- **File I/O errors**: Returns exit code 1 with descriptive error message
- **Unexpected errors**: Returns exit code 1 with "Unexpected error:" prefix

#### Error Examples

Missing quotes file:
```bash
$ node quote/bin/quote.js
Error: No quotes available. Ensure quotes.json exists beside index.js.
$ echo $?
1
```

Unknown author:
```bash
$ node quote/bin/quote.js --by="Unknown Author"
Error: No quotes found for author "Unknown Author".
$ echo $?
1
```

Invalid JSON:
```bash
$ node quote/bin/quote.js
Error: No quotes available. Ensure quotes.json exists beside index.js.
$ echo $?
1
```

### Data

- Quotes are read from `quote/src/quotes.json` and must be an array of objects with `text` and `author` fields.

### Development

- CLI entrypoint: `quote/src/index.js`
- Core library: `quote/src/core.js`
- Test coverage: **74.4% statements, 75% branches, 84.21% functions**

### Running Tests

From the repository root:

```bash
npm test
```

The comprehensive test suite covers:

- ✅ Random quote selection (deterministic for testing)
- ✅ Author filtering (case-insensitive)
- ✅ Edge cases: missing files, empty files, BOM handling
- ✅ Error handling: unknown authors, invalid JSON, I/O errors
- ✅ Argument parsing: `--by=value`, `--by value`, `--help`
- ✅ Core functions: sanitization, file reading, random selection
- ✅ Exit codes: 0 for success, 1 for errors


