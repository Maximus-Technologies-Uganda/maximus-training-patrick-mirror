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

### How to Run the UI

A modern web interface is available for browsing quotes interactively.

#### Prerequisites

- Node.js 16+ installed
- Modern web browser (Chrome, Firefox, Safari, Edge)

#### Installation and Setup

1. **Install dependencies** (from repository root):
   ```bash
   cd frontend
   npm install
   ```

2. **Start the development server**:
   ```bash
   npm run dev
   ```

3. **Open your browser** and navigate to:
   ```
   http://localhost:5173
   ```

#### UI Features

- **Random Quote Display**: Automatically shows a random inspirational quote on page load
- **Author Search**: Filter quotes by entering an author name in the search box
- **Case-Insensitive Search**: Author matching works regardless of capitalization
- **Responsive Design**: Optimized for desktop and mobile devices
- **Error Handling**: Clear error messages for invalid searches or connection issues

#### Usage Examples

1. **View Random Quotes**:
   - Refresh the page or click "Search Quotes" with an empty input field
   - Each refresh shows a different random quote

2. **Search by Author**:
   - Enter "Steve Jobs" in the search field
   - Click "Search Quotes" or press Enter
   - Shows a random quote from that author

3. **Search Examples**:
   - "albert einstein" → Shows Einstein quotes
   - "STEVE JOBS" → Shows Jobs quotes (case-insensitive)
   - "Confucius" → Shows Confucius quotes
   - "Unknown Author" → Shows error message

#### Running Tests

The frontend includes comprehensive test suites:

**Unit Tests** (Vitest):
```bash
cd frontend
npm run test:run
```

**End-to-End Tests** (Playwright):
```bash
npm run test:e2e
```

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


