const { formatDuration, buildExportLines } = require('../src/exporter');

describe('exporter', () => {
  test('formatDuration formats ms correctly', () => {
    expect(formatDuration(0)).toBe('00:00:00.000');
    expect(formatDuration(1234)).toBe('00:00:01.234');
    expect(formatDuration(62_345)).toBe('00:01:02.345');
    expect(formatDuration(-5)).toBe('00:00:00.000');
  });

  test('buildExportLines returns empty for no laps', () => {
    const lines = buildExportLines(0, []);
    expect(lines).toEqual([]);
  });

  test('buildExportLines builds total and laps from mixed lap shapes', () => {
    const elapsed = 62_345;
    const laps = [30_000, { duration: 20_500 }, { time: 11_111 }, { elapsedTime: 9 }];
    const lines = buildExportLines(elapsed, laps);
    expect(lines[0]).toBe('Total: 00:01:02.345');
    expect(lines[1]).toBe('Lap 1: 00:00:30.000');
    expect(lines[2]).toBe('Lap 2: 00:00:20.500');
    expect(lines[3]).toBe('Lap 3: 00:00:11.111');
    expect(lines[4]).toBe('Lap 4: 00:00:00.009');
  });
});


