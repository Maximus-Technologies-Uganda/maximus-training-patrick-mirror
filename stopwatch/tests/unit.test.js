const { pad, formatDuration, parseExportArgs } = require('../src/index.js');

describe('Stopwatch App Unit Tests', () => {
  describe('pad', () => {
    test('pads numbers to specified width', () => {
      expect(pad(5, 2)).toBe('05');
      expect(pad(123, 5)).toBe('00123');
      expect(pad(42, 3)).toBe('042');
    });

    test('does not truncate numbers longer than width', () => {
      expect(pad(1234, 2)).toBe('1234');
    });

    test('handles zero', () => {
      expect(pad(0, 3)).toBe('000');
    });
  });

  describe('formatDuration', () => {
    test('formats milliseconds to HH:MM:SS.mmm', () => {
      expect(formatDuration(0)).toBe('00:00:00.000');
      expect(formatDuration(1000)).toBe('00:00:01.000');
      expect(formatDuration(61000)).toBe('00:01:01.000');
      expect(formatDuration(3661000)).toBe('01:01:01.000');
    });

    test('formats with milliseconds', () => {
      expect(formatDuration(1234)).toBe('00:00:01.234');
      expect(formatDuration(62345)).toBe('00:01:02.345');
    });

    test('handles large durations', () => {
      expect(formatDuration(7323456)).toBe('02:02:03.456');
    });

    test('handles negative or invalid input', () => {
      expect(formatDuration(-1000)).toBe('00:00:00.000');
      expect(formatDuration(NaN)).toBe('00:00:00.000');
      expect(formatDuration(Infinity)).toBe('00:00:00.000');
    });
  });

  describe('parseExportArgs', () => {
    test('parses --out= format', () => {
      const result = parseExportArgs(['--out=report.txt']);
      expect(result.out).toBe('report.txt');
    });

    test('parses --out flag with value', () => {
      const result = parseExportArgs(['--out', 'output.txt']);
      expect(result.out).toBe('output.txt');
    });

    test('handles no --out argument', () => {
      const result = parseExportArgs(['other', 'args']);
      expect(result.out).toBe(null);
    });

    test('handles empty arguments', () => {
      const result = parseExportArgs([]);
      expect(result.out).toBe(null);
    });

    test('takes last --out if multiple provided', () => {
      const result = parseExportArgs(['--out=first.txt', '--out=second.txt']);
      expect(result.out).toBe('second.txt');
    });
  });
});
