## Fundamentals Notes (Week 1)

### File I/O and JSON
- Use `fs.readFileSync(path, 'utf8')` and strip BOM when needed before `JSON.parse`.
- Prefer writing with trailing newline for diffs (`+ '\n'`).

### Labs Snippets
```js
// labs/fs-readwrite.js
const fs = require('fs');
const path = require('path');
const assert = require('assert');

(function main() {
  const tmpDir = path.resolve(__dirname);
  const filePath = path.join(tmpDir, 'io-sample.txt');
  const contents = ['line 1', 'line 2', 'line 3'].join('\n') + '\n';
  fs.writeFileSync(filePath, contents, 'utf8');
  const readBack = fs.readFileSync(filePath, 'utf8');
  assert.strictEqual(readBack, contents);
  fs.appendFileSync(filePath, 'appended\n', 'utf8');
})();
```

```js
// labs/json-roundtrip.js
const assert = require('assert');
function roundtrip(value) {
  const json = JSON.stringify(value);
  const parsed = JSON.parse(json);
  return { json, parsed };
}
```

### CLI Patterns
- Parse flags with minimal helpers; normalize values (trim/lowercase).
- Make errors explicit and exit non-zero; keep messages testable.

### Git Hygiene
- Rebase before pushing; force-push only for tags or agreed cases.
- Use conventional commits for clear history and auto-changelogs.

### CI Tips
- Use block scalars for multiline shell; avoid job-level secret conditions.
- Keep workflows minimal and lint-clean.


