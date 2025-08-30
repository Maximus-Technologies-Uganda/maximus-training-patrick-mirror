const fs = require('fs');
const path = require('path');
const assert = require('assert');

(function main() {
  const tmpDir = path.resolve(__dirname);
  const filePath = path.join(tmpDir, 'io-sample.txt');
  const contents = ['line 1', 'line 2', 'line 3'].join('\n') + '\n';

  fs.writeFileSync(filePath, contents, 'utf8');
  //

  const readBack = fs.readFileSync(filePath, 'utf8');
  //

  assert.strictEqual(readBack, contents, 'file contents should match');

  // Append and re-read
  fs.appendFileSync(filePath, 'appended\n', 'utf8');
  const appended = fs.readFileSync(filePath, 'utf8');
  assert.ok(appended.endsWith('appended\n'), 'file should end with appended line');

  console.log('hello');
})();
