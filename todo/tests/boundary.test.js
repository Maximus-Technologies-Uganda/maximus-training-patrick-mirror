const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const CLI = path.resolve(__dirname, '../src/index.js');
const DATA = path.resolve(__dirname, '../todos.json');

function run(args) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', cwd: path.resolve(__dirname, '..') });
}

function writeTodos(todos) {
  fs.writeFileSync(DATA, JSON.stringify(todos, null, 2) + '\n', 'utf8');
}

describe('--dueToday boundaries and highPriority/duplicate rules', () => {
  beforeEach(() => {
    writeTodos([]);
  });

  test('highPriority filters only high priority items', () => {
    writeTodos([
      { id: 1, text: 'a', priority: 'low', completed: false },
      { id: 2, text: 'b', priority: 'high', completed: false },
      { id: 3, text: 'c', priority: 'HIGH', completed: false },
      { id: 4, text: 'd', priority: 'medium', completed: false },
    ]);
    const res = run(['list', '--highPriority']);
    expect(res.status).toBe(0);
    const lines = (res.stdout || '').trim().split(/\r?\n/).filter(Boolean);
    expect(lines.every(l => /\[.*\]\s+#\d+\s+/.test(l))).toBe(true);
    expect(lines.length).toBe(2);
  });

  test('duplicate guard prevents adding identical task text (case-insensitive, trimmed)', () => {
    let r1 = run(['add', ' Pay Bill ']);
    expect(r1.status).toBe(0);
    let r2 = run(['add', 'pay bill']);
    expect(r2.status).not.toBe(0);
    expect((r2.stderr || '').toLowerCase()).toContain('duplicate');
  });

  test('--dueToday includes only tasks due exactly today', () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayISO = `${y}-${m}-${d}`;
    const yesterday = new Date(today.getTime() - 86400000);
    const y2 = yesterday.getFullYear();
    const m2 = String(yesterday.getMonth() + 1).padStart(2, '0');
    const d2 = String(yesterday.getDate()).padStart(2, '0');
    const yesterdayISO = `${y2}-${m2}-${d2}`;
    const tomorrow = new Date(today.getTime() + 86400000);
    const y3 = tomorrow.getFullYear();
    const m3 = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d3 = String(tomorrow.getDate()).padStart(2, '0');
    const tomorrowISO = `${y3}-${m3}-${d3}`;

    writeTodos([
      { id: 1, text: 'yesterday', due: yesterdayISO, priority: 'medium', completed: false },
      { id: 2, text: 'today',     due: todayISO,     priority: 'medium', completed: false },
      { id: 3, text: 'tomorrow',  due: tomorrowISO,  priority: 'medium', completed: false },
    ]);

    const res = run(['list', '--dueToday']);
    expect(res.status).toBe(0);
    const lines = (res.stdout || '').trim().split(/\r?\n/).filter(Boolean);
    expect(lines.length).toBe(1);
    expect(lines[0]).toContain('today');
  });
});


