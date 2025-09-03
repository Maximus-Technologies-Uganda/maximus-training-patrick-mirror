## Quote CLI

A simple command-line application that prints inspirational quotes from a local `quotes.json` file.

### Prerequisites

- Node.js 14+ installed

### Installation

No installation required. The CLI runs directly with Node from the repository.

### Usage

Run from the repository root.

- Random quote:

```
node quote/bin/quote.js
```

Example output:

```
The only limit to our realization of tomorrow is our doubts of today. - Franklin D. Roosevelt
```

- Filter by author:

```
node quote/bin/quote.js --by="Albert Einstein"
```

Example output:

```
In the middle of difficulty lies opportunity. - Albert Einstein
```

You can also pass the author as two arguments:

```
node quote/bin/quote.js --by "Albert Einstein"
```

### Error Handling

- Missing or empty `quotes.json` results in a non-zero exit code and an error message.
- Unknown author passed to `--by` results in a non-zero exit code and an error message.

### Data

- Quotes are read from `quote/src/quotes.json` and must be an array of objects with `text` and `author` fields.

### Development

- CLI entrypoint: `quote/src/index.js`
- Core library: `quote/src/core.js`

### Running Tests

From the repository root:

```
node quote/tests/test.js
```

The suite covers:

- Random quote output
- Filtering by author
- Unknown author error
- Missing quotes file error


