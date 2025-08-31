const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { spawnSync } = require('child_process');

const cliPath = path.resolve(__dirname, '../src/index.js');
const quotesPath = path.resolve(__dirname, '../src/quotes.json');

function runCLI(args = []) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    encoding: 'utf8',
    windowsHide: true,
  });
}

function readQuotes() {
  let content = fs.readFileSync(quotesPath, 'utf8');
  // Strip UTF-8 BOM if present
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
  }
  return JSON.parse(content);
}

function testRandomQuote() {
  const quotes = readQuotes();
  const res = runCLI();
  assert.strictEqual(res.status, 0, `Expected exit code 0, got ${res.status}. stderr=${res.stderr}`);
  const line = (res.stdout || '').trim();
  assert.ok(line.includes(' - '), `Expected output to contain " - ", got: ${line}`);
  const [text, author] = line.split(' - ');
  assert.ok(text && author, `Expected text and author in output, got: ${line}`);
  assert.ok(
    quotes.some(q => q.text === text && q.author === author),
    'Output quote not found in quotes.json'
  );
}

function testByAuthorValid() {
  const targetAuthor = 'Albert Einstein';
  const quotes = readQuotes();
  const expectedFromAuthor = quotes.filter(q => q.author === targetAuthor);
  assert.ok(expectedFromAuthor.length > 0, `No quotes by ${targetAuthor} in fixture`);
  const res = runCLI([`--by=${targetAuthor}`]);
  assert.strictEqual(res.status, 0, `Expected exit code 0, got ${res.status}. stderr=${res.stderr}`);
  const line = (res.stdout || '').trim();
  const [text, author] = line.split(' - ');
  assert.strictEqual(author, targetAuthor, `Expected author ${targetAuthor}, got ${author}`);
  assert.ok(expectedFromAuthor.some(q => q.text === text), 'Returned text not among author quotes');
}

function testByAuthorUnknown() {
  const res = runCLI([`--by=Some Unknown Author`]);
  assert.notStrictEqual(res.status, 0, 'Expected non-zero exit code for unknown author');
  assert.ok((res.stderr || '').includes('No quotes found for author'), 'Expected unknown author error');
}

function testMissingQuotesFile() {
  if (!fs.existsSync(quotesPath)) throw new Error('Fixture quotes.json missing');
  const bakPath = quotesPath + '.bak';
  fs.renameSync(quotesPath, bakPath);
  try {
    const res = runCLI();
    assert.notStrictEqual(res.status, 0, 'Expected non-zero exit code when quotes file is missing');
    assert.ok((res.stderr || '').includes('No quotes available'), 'Expected missing file error message');
  } finally {
    fs.renameSync(bakPath, quotesPath);
  }
}

function runAll() {
  const tests = [
    ['random quote prints with no flags', testRandomQuote],
    ['filter by valid author prints a quote', testByAuthorValid],
    ['unknown author handled gracefully', testByAuthorUnknown],
    ['missing quotes file handled gracefully', testMissingQuotesFile],
  ];
  let passed = 0;
  for (const [name, fn] of tests) {
    try {
      fn();
      console.log(`ok - ${name}`);
      passed++;
    } catch (err) {
      console.error(`not ok - ${name}`);
      console.error(err && err.stack ? err.stack : String(err));
    }
  }
  const failed = tests.length - passed;
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

runAll();


