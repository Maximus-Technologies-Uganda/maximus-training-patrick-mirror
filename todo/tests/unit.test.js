const { validateDue, parseAddArgs, generateId, parseListArgs, getLocalISODate } = require('../src/index.js');

describe('Todo App Unit Tests', () => {
  describe('validateDue', () => {
    test('accepts valid YYYY-MM-DD format', () => {
      expect(validateDue('2024-01-15')).toBe(true);
      expect(validateDue('2024-12-31')).toBe(true);
    });

    test('accepts null or empty due date', () => {
      expect(validateDue(null)).toBe(true);
      expect(validateDue('')).toBe(true);
    });

    test('rejects invalid formats', () => {
      expect(validateDue('2024-1-15')).toBe(false);
      expect(validateDue('24-01-15')).toBe(false);
      expect(validateDue('2024/01/15')).toBe(false);
      expect(validateDue('invalid')).toBe(false);
    });
  });

  describe('parseAddArgs', () => {
    test('parses text tokens correctly', () => {
      const result = parseAddArgs(['Buy', 'milk', '--due=2024-01-15', '--priority=high']);
      expect(result.text).toBe('Buy milk');
      expect(result.due).toBe('2024-01-15');
      expect(result.priority).toBe('high');
    });

    test('handles --due= format', () => {
      const result = parseAddArgs(['Task', '--due=2024-02-01']);
      expect(result.text).toBe('Task');
      expect(result.due).toBe('2024-02-01');
    });

    test('handles --priority= format', () => {
      const result = parseAddArgs(['Task', '--priority=medium']);
      expect(result.text).toBe('Task');
      expect(result.priority).toBe('medium');
    });

    test('handles no flags', () => {
      const result = parseAddArgs(['Simple', 'task']);
      expect(result.text).toBe('Simple task');
      expect(result.due).toBe(null);
      expect(result.priority).toBe('medium');
    });
  });

  describe('generateId', () => {
    test('returns 1 for empty array', () => {
      expect(generateId([])).toBe(1);
    });

    test('returns max id + 1', () => {
      const todos = [
        { id: 1, text: 'Task 1' },
        { id: 5, text: 'Task 5' },
        { id: 3, text: 'Task 3' }
      ];
      expect(generateId(todos)).toBe(6);
    });

    test('handles single item', () => {
      const todos = [{ id: 10, text: 'Task' }];
      expect(generateId(todos)).toBe(11);
    });
  });

  describe('parseListArgs', () => {
    test('parses --dueToday flag', () => {
      const result = parseListArgs(['--dueToday']);
      expect(result.dueToday).toBe(true);
      expect(result.highPriority).toBe(false);
    });

    test('parses --highPriority flag', () => {
      const result = parseListArgs(['--highPriority']);
      expect(result.dueToday).toBe(false);
      expect(result.highPriority).toBe(true);
    });

    test('handles no flags', () => {
      const result = parseListArgs([]);
      expect(result.dueToday).toBe(false);
      expect(result.highPriority).toBe(false);
    });
  });

  describe('getLocalISODate', () => {
    test('returns YYYY-MM-DD format', () => {
      const result = getLocalISODate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    test('returns current date', () => {
      const result = getLocalISODate();
      const now = new Date();
      const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      expect(result).toBe(expected);
    });
  });
});
