const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const CLI_PATH = path.resolve(__dirname, '../src/index.js');
const DATA_FILE = path.resolve(__dirname, '../expenses.json');

function runCli(args) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [CLI_PATH, ...args], {
      cwd: path.resolve(__dirname, '..'),
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

function writeFixture(expenses) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(expenses, null, 2) + '\n', 'utf8');
}

function parseListOutput(stdout) {
  const lines = stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  return lines.map((l) => {
    try { return JSON.parse(l); } catch { return null; }
  }).filter(Boolean);
}

describe('expense CLI filters (table-driven)', () => {
  beforeEach(() => {
    writeFixture([
      { id: 1, amount: 10, category: 'groceries', date: '2025-01-02' },
      { id: 2, amount: 15, category: 'transport', date: '2025-01-15' },
      { id: 3, amount: 7.5, category: 'groceries', date: '2025-02-03' },
      { id: 4, amount: 20, category: 'utilities', date: '2025-02-20' },
      { id: 5, amount: 5, category: 'transport', date: '2025-01-30' },
    ]);
  });

  const cases = [
    {
      name: 'no filters returns all entries',
      args: ['list'],
      expectIds: [1, 2, 3, 4, 5],
    },
    {
      name: 'filter by category only',
      args: ['list', '--category=groceries'],
      expectIds: [1, 3],
    },
    {
      name: 'filter by month only',
      args: ['list', '--month=2025-01'],
      expectIds: [1, 2, 5],
    },
    {
      name: 'filter by both month and category',
      args: ['list', '--month=2025-01', '--category=transport'],
      expectIds: [2, 5],
    },
  ];

  test.each(cases)('$name', async ({ args, expectIds }) => {
    const res = await runCli(args);
    expect(res.code).toBe(0);
    const items = parseListOutput(res.stdout);
    const gotIds = items.map((e) => e.id).sort((a, b) => a - b);
    expect(gotIds).toEqual(expectIds.slice().sort((a, b) => a - b));
  });

  test('invalid month format exits non-zero and prints error to stderr', async () => {
    const res = await runCli(['list', '--month=2025-13']);
    expect(res.code).not.toBe(0);
    expect(res.stderr.toLowerCase()).toContain('error');
    expect(res.stderr).toMatch(/YYYY-MM/);
  });
});


