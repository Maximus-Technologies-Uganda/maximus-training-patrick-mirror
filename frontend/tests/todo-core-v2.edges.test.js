import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  add,
  toggle,
  remove,
  filter,
  serialize,
  deserialize,
} from '../src/todo-core-v2.js';

describe('todo-core-v2 edge cases', () => {
  let mockIdgen;
  let mockClock;

  beforeEach(() => {
    mockIdgen = vi.fn(() => 'test-id-123');
    mockClock = vi.fn(() => new Date('2024-01-15T10:00:00Z'));
  });

  describe('add edge cases', () => {
    it('should reject empty title', () => {
      const state = [];
      const input = { title: '' };
      const deps = { idgen: mockIdgen, clock: mockClock };

      expect(() => add(state, input, deps)).toThrow('Title is required');
    });

    it('should reject whitespace-only title', () => {
      const state = [];
      const input = { title: '   \t\n  ' };
      const deps = { idgen: mockIdgen, clock: mockClock };

      expect(() => add(state, input, deps)).toThrow('Title is required');
    });

    it('should reject duplicate title (case insensitive)', () => {
      const state = [
        { id: '1', title: 'Pay Rent', due: null, priority: 'med', done: false },
      ];
      const input = { title: 'pay rent' };
      const deps = { idgen: mockIdgen, clock: mockClock };

      expect(() => add(state, input, deps)).toThrow('Duplicate title');
    });

    it('should reject duplicate title (whitespace normalized)', () => {
      const state = [
        { id: '1', title: 'Pay Rent', due: null, priority: 'med', done: false },
      ];
      const input = { title: '  Pay   Rent  ' };
      const deps = { idgen: mockIdgen, clock: mockClock };

      expect(() => add(state, input, deps)).toThrow('Duplicate title');
    });

    it('should accept long titles', () => {
      const state = [];
      const longTitle = 'A'.repeat(1000);
      const input = { title: longTitle };
      const deps = { idgen: mockIdgen, clock: mockClock };

      const result = add(state, input, deps);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe(longTitle);
    });

    it('should trim title but preserve internal whitespace', () => {
      const state = [];
      const input = { title: '  Pay   the   rent  ' };
      const deps = { idgen: mockIdgen, clock: mockClock };

      const result = add(state, input, deps);
      expect(result[0].title).toBe('Pay   the   rent');
    });

    it('should handle null title gracefully', () => {
      const state = [];
      const input = { title: null };
      const deps = { idgen: mockIdgen, clock: mockClock };

      expect(() => add(state, input, deps)).toThrow('Title is required');
    });

    it('should handle undefined title gracefully', () => {
      const state = [];
      const input = { title: undefined };
      const deps = { idgen: mockIdgen, clock: mockClock };

      expect(() => add(state, input, deps)).toThrow('Title is required');
    });

    it('should handle missing title property', () => {
      const state = [];
      const input = {};
      const deps = { idgen: mockIdgen, clock: mockClock };

      expect(() => add(state, input, deps)).toThrow('Title is required');
    });

    it('should handle null input', () => {
      const state = [];
      const deps = { idgen: mockIdgen, clock: mockClock };

      expect(() => add(state, null, deps)).toThrow('Title is required');
    });

    it('should handle undefined input', () => {
      const state = [];
      const deps = { idgen: mockIdgen, clock: mockClock };

      expect(() => add(state, undefined, deps)).toThrow('Title is required');
    });
  });

  describe('toggle edge cases', () => {
    it('should be no-op for unknown id', () => {
      const state = [
        { id: '1', title: 'Task 1', due: null, priority: 'med', done: false },
      ];
      const originalState = state;

      const result = toggle(state, 'unknown-id');
      expect(result).toBe(originalState); // Same reference
    });

    it('should be no-op for null id', () => {
      const state = [
        { id: '1', title: 'Task 1', due: null, priority: 'med', done: false },
      ];
      const originalState = state;

      const result = toggle(state, null);
      expect(result).toBe(originalState); // Same reference
    });

    it('should be no-op for undefined id', () => {
      const state = [
        { id: '1', title: 'Task 1', due: null, priority: 'med', done: false },
      ];
      const originalState = state;

      const result = toggle(state, undefined);
      expect(result).toBe(originalState); // Same reference
    });

    it('should toggle done state correctly', () => {
      const state = [
        { id: '1', title: 'Task 1', due: null, priority: 'med', done: false },
      ];

      const result1 = toggle(state, '1');
      expect(result1[0].done).toBe(true);
      expect(result1).not.toBe(state); // New reference

      const result2 = toggle(result1, '1');
      expect(result2[0].done).toBe(false);
      expect(result2).not.toBe(result1); // New reference
    });
  });

  describe('remove edge cases', () => {
    it('should be no-op for unknown id', () => {
      const state = [
        { id: '1', title: 'Task 1', due: null, priority: 'med', done: false },
      ];
      const originalState = state;

      const result = remove(state, 'unknown-id');
      expect(result).toBe(originalState); // Same reference
    });

    it('should be no-op for null id', () => {
      const state = [
        { id: '1', title: 'Task 1', due: null, priority: 'med', done: false },
      ];
      const originalState = state;

      const result = remove(state, null);
      expect(result).toBe(originalState); // Same reference
    });

    it('should be no-op for undefined id', () => {
      const state = [
        { id: '1', title: 'Task 1', due: null, priority: 'med', done: false },
      ];
      const originalState = state;

      const result = remove(state, undefined);
      expect(result).toBe(originalState); // Same reference
    });

    it('should remove correct item', () => {
      const state = [
        { id: '1', title: 'Task 1', due: null, priority: 'med', done: false },
        { id: '2', title: 'Task 2', due: null, priority: 'high', done: true },
      ];

      const result = remove(state, '1');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
      expect(result).not.toBe(state); // New reference
    });
  });

  describe('filter edge cases', () => {
    const testState = [
      {
        id: '1',
        title: 'Pay Rent',
        due: new Date('2024-01-15T00:00:00Z'),
        priority: 'high',
        done: false,
      },
      {
        id: '2',
        title: 'Buy Groceries',
        due: new Date('2024-01-16T00:00:00Z'),
        priority: 'med',
        done: true,
      },
      { id: '3', title: 'Call Mom', due: null, priority: 'low', done: false },
      {
        id: '4',
        title: 'Clean House',
        due: new Date('2024-01-14T00:00:00Z'),
        priority: 'med',
        done: false,
      },
    ];

    it('should handle null query', () => {
      expect(() => filter(testState, null)).toThrow();
    });

    it('should handle undefined query', () => {
      const result = filter(testState, undefined);
      expect(result).toEqual(testState);
    });

    it('should handle empty query object', () => {
      const result = filter(testState, {});
      expect(result).toEqual(testState);
    });

    it('should handle null text filter', () => {
      const result = filter(testState, { text: null });
      expect(result).toEqual(testState);
    });

    it('should handle empty text filter', () => {
      const result = filter(testState, { text: '' });
      expect(result).toEqual(testState);
    });

    it('should handle whitespace-only text filter', () => {
      const result = filter(testState, { text: '   ' });
      expect(result).toEqual(testState);
    });

    it('should handle invalid dueType', () => {
      const result = filter(testState, { dueType: 'invalid' });
      // Invalid dueType should return all items with non-null due dates
      const expected = testState.filter((t) => t.due != null);
      expect(result).toEqual(expected);
    });

    it('should handle invalid priority', () => {
      const result = filter(testState, { priority: 'invalid' });
      // Invalid priority should return empty array (no matches)
      expect(result).toEqual([]);
    });

    it('should handle null dueType', () => {
      const result = filter(testState, { dueType: null });
      expect(result).toEqual(testState);
    });

    it('should handle null priority', () => {
      const result = filter(testState, { priority: null });
      expect(result).toEqual(testState);
    });
  });

  describe('serialize/deserialize edge cases', () => {
    it('should handle empty array', () => {
      const state = [];
      const serialized = serialize(state);
      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual([]);
    });

    it('should handle null input to deserialize', () => {
      const result = deserialize(null);
      expect(result).toEqual([]);
    });

    it('should handle undefined input to deserialize', () => {
      const result = deserialize(undefined);
      expect(result).toEqual([]);
    });

    it('should handle empty string input to deserialize', () => {
      const result = deserialize('');
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON input to deserialize', () => {
      const result = deserialize('invalid json');
      expect(result).toEqual([]);
    });

    it('should handle non-array JSON input to deserialize', () => {
      const result = deserialize('{"not": "an array"}');
      expect(result).toEqual([]);
    });

    it('should handle null in array input to deserialize', () => {
      const result = deserialize('[null]');
      expect(result).toEqual([]);
    });

    it('should handle todos with null due dates', () => {
      const state = [
        { id: '1', title: 'Task 1', due: null, priority: 'med', done: false },
      ];
      const serialized = serialize(state);
      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual(state);
    });

    it('should handle todos with missing properties', () => {
      const state = [
        { id: '1', title: 'Task 1', due: null, priority: 'med', done: false },
      ];
      const serialized = serialize(state);
      const deserialized = deserialize(serialized);
      expect(deserialized).toEqual(state);
    });

    it('should normalize priority values during deserialization', () => {
      const invalidData =
        '[{"id":"1","title":"Task 1","due":null,"priority":"invalid","done":false}]';
      const result = deserialize(invalidData);
      expect(result[0].priority).toBe('med');
    });

    it('should handle string due dates', () => {
      const state = [
        {
          id: '1',
          title: 'Task 1',
          due: new Date('2024-01-15T00:00:00Z'),
          priority: 'med',
          done: false,
        },
      ];
      const serialized = serialize(state);
      const deserialized = deserialize(serialized);
      expect(deserialized[0].due).toBeInstanceOf(Date);
      // Check that the date is the same day (accounting for timezone differences)
      expect(deserialized[0].due.getFullYear()).toBe(
        state[0].due.getFullYear()
      );
      expect(deserialized[0].due.getMonth()).toBe(state[0].due.getMonth());
      expect(deserialized[0].due.getDate()).toBe(state[0].due.getDate());
    });
  });
});
