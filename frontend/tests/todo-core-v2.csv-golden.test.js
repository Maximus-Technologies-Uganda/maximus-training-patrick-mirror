import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { exportCsv } from '../src/todo-core-v2.js';

function mk(id, title, { due = null, priority = 'med', done = false } = {}) {
  return { id, title, due, priority, done };
}

describe('exportCsv() matches golden with complex fields', () => {
  it('quotes commas, quotes, and newlines and prefixes BOM', async () => {
    const state = [
      mk('1', 'Simple', { due: new Date('2025-01-01T12:00:00'), priority: 'low' }),
      mk('2,3', 'Has, comma', { due: new Date('2025-01-02T00:00:00'), priority: 'med' }),
      mk('3', 'Line1\n"Quote", and, commas', {
        due: null,
        priority: 'high',
        done: true,
      }),
    ];
    const csv = exportCsv(state);
    const goldenPath = path.join(process.cwd(), 'tests/todos-golden.csv');
    const golden = (await fs.promises.readFile(goldenPath, 'utf-8')).replace(/\r\n/g, '\n');
    const normalize = (s) => s.replace(/\r\n/g, '\n').replace(/^\uFEFF/, '').trim();
    expect(normalize(csv)).toBe(normalize(golden));
  });
});


