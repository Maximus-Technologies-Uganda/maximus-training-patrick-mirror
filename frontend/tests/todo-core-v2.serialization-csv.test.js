import { exportCsv, serialize, deserialize } from '../src/todo-core-v2.js';

function mk(id, title, { due = null, priority = 'med', done = false } = {}) {
  return { id, title, due, priority, done };
}

function ymdLocal(d) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

describe('todo-core-v2.serialization & CSV', () => {
  it('exportCsv() emits stable header and normalized newlines', () => {
    const state = [
      mk('1', 'Simple', { due: new Date('2025-01-01T12:00:00'), priority: 'low' }),
      mk('2', 'Needs, quoting "here"', {
        due: new Date('2025-01-02T06:00:00'),
        priority: 'high',
        done: true,
      }),
      mk('3', 'No due', { due: null, priority: 'med' }),
    ];
    const csv = exportCsv(state);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('id,title,due,priority,done');
    expect(lines).toHaveLength(1 + state.length);
    expect(csv).not.toContain('\r\n');
    // spot-check quoting of commas/quotes
    expect(csv).toContain('"Needs, quoting ""here"""');
  });

  it('serialize() outputs versioned envelope and deserialize() round-trips', () => {
    const input = [
      mk('a', 'A', { due: new Date('2025-01-01T03:04:05'), priority: 'high' }),
      mk('b', 'B', { due: null, priority: 'med', done: true }),
    ];
    const raw = serialize(input);
    const parsed = JSON.parse(raw);
    expect(parsed.schemaVersion).toBe(1);
    expect(Array.isArray(parsed.data)).toBe(true);
    // due should be stored as date-only strings for stability
    expect(parsed.data[0].due).toBe('2025-01-01');

    const out = deserialize(raw);
    expect(out).toHaveLength(2);
    expect(out[0].id).toBe('a');
    expect(ymdLocal(out[0].due)).toBe('2025-01-01');
    expect(out[1].due).toBeNull();
    expect(out[1].done).toBe(true);
  });

  it('deserialize() handles corrupted JSON by returning an empty list', () => {
    const out = deserialize('{ this is not valid JSON }');
    expect(out).toEqual([]);
  });
});


