import { describe, it, expect } from 'vitest';
import { filter } from '../src/todo-core-v2.js';

function mk(id, title, { due = null, priority = 'med', done = false } = {}) {
  return { id, title, due, priority, done };
}

describe('todo-core-v2.filter timezone windows (Africa/Kampala, UTC+3)', () => {
  const tz = 'Africa/Kampala';

  it('categorizes a midnight Kampala task as tomorrow just before midnight, and today just after', () => {
    // Skip gracefully if this environment lacks ICU timezone support
    let tzSupported = true;
    try {
      // Will throw if tz unsupported
      new Intl.DateTimeFormat('en', { timeZone: tz }).format(new Date());
    } catch (_e) {
      tzSupported = false;
    }
    if (!tzSupported) {
      expect(true).toBe(true);
      return;
    }
    // Task due at Kampala midnight for 2025-03-11 (which is 2025-03-10T21:00:00Z)
    const task = mk('mid', 'Midnight Kampala', {
      due: new Date('2025-03-10T21:00:00Z'),
    });
    const state = [task];

    // Just before midnight in Kampala: 2025-03-10T23:59:00+03:00 => 2025-03-10T20:59:00Z
    const beforeMidnight = new Date('2025-03-10T20:59:00Z');
    const outBeforeToday = filter(
      state,
      { dueType: 'today' },
      { clock: () => beforeMidnight, timeZone: tz }
    );
    const outBeforeTomorrow = filter(
      state,
      { dueType: 'tomorrow' },
      { clock: () => beforeMidnight, timeZone: tz }
    );
    expect(outBeforeToday.map((t) => t.id)).toEqual([]);
    expect(outBeforeTomorrow.map((t) => t.id)).toEqual(['mid']);

    // Just after midnight in Kampala: 2025-03-11T00:01:00+03:00 => 2025-03-10T21:01:00Z
    const afterMidnight = new Date('2025-03-10T21:01:00Z');
    const outAfterToday = filter(
      state,
      { dueType: 'today' },
      { clock: () => afterMidnight, timeZone: tz }
    );
    const outAfterTomorrow = filter(
      state,
      { dueType: 'tomorrow' },
      { clock: () => afterMidnight, timeZone: tz }
    );
    expect(outAfterToday.map((t) => t.id)).toEqual(['mid']);
    expect(outAfterTomorrow.map((t) => t.id)).toEqual([]);
  });
});
