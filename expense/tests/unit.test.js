const { validateMonth, parseArgs, parseReportArgs } = require('../src/index.js');

describe('Expense App Unit Tests', () => {
  describe('validateMonth', () => {
    test('accepts valid YYYY-MM format', () => {
      expect(validateMonth('2024-01')).toBe(true);
      expect(validateMonth('2024-12')).toBe(true);
      expect(validateMonth('1970-06')).toBe(true);
    });

    test('rejects invalid formats', () => {
      expect(validateMonth('2024')).toBe(false);
      expect(validateMonth('24-01')).toBe(false);
      expect(validateMonth('2024-1')).toBe(false);
      expect(validateMonth('2024-13')).toBe(false);
      expect(validateMonth('2024-00')).toBe(false);
      expect(validateMonth('')).toBe(false);
      expect(validateMonth(null)).toBe(false);
    });

    test('rejects years before 1970', () => {
      expect(validateMonth('1969-12')).toBe(false);
    });
  });

  describe('parseArgs', () => {
    test('parses command correctly', () => {
      const result = parseArgs(['node', 'index.js', 'report', '--month=2024-01']);
      expect(result.command).toBe('report');
      expect(result.rest).toEqual(['--month=2024-01']);
    });

    test('handles no command', () => {
      const result = parseArgs(['node', 'index.js']);
      expect(result.command).toBe('');
      expect(result.rest).toEqual([]);
    });

    test('handles multiple arguments', () => {
      const result = parseArgs(['node', 'index.js', 'total', 'arg1', 'arg2']);
      expect(result.command).toBe('total');
      expect(result.rest).toEqual(['arg1', 'arg2']);
    });
  });

  describe('parseReportArgs', () => {
    test('parses --month= format', () => {
      const result = parseReportArgs(['--month=2024-01']);
      expect(result.month).toBe('2024-01');
    });

    test('parses --month flag with value', () => {
      const result = parseReportArgs(['--month', '2024-02']);
      expect(result.month).toBe('2024-02');
    });

    test('handles no month argument', () => {
      const result = parseReportArgs(['other', 'args']);
      expect(result.month).toBe(null);
    });

    test('handles empty arguments', () => {
      const result = parseReportArgs([]);
      expect(result.month).toBe(null);
    });
  });
});
