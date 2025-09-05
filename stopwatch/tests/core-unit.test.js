const fs = require('fs');
const path = require('path');
const { loadState, saveState, parseExportArgs, handleExport } = require('../src/index.js');
const { formatDuration, buildExportLines } = require('../src/exporter.js');

// Mock console methods to avoid noise in tests
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  jest.restoreAllMocks();
});

describe('Stopwatch Core Functions', () => {
  describe('loadState', () => {
    test('returns default state when file does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      const state = loadState();
      expect(state).toEqual({
        startTime: null,
        isRunning: false,
        elapsedTime: 0,
        laps: []
      });
    });

    test('returns default state when file is empty', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('');
      
      const state = loadState();
      expect(state).toEqual({
        startTime: null,
        isRunning: false,
        elapsedTime: 0,
        laps: []
      });
    });

    test('parses valid state from file', () => {
      const mockState = {
        startTime: 1234567890,
        isRunning: true,
        elapsedTime: 5000,
        laps: [1000, 2000]
      };
      
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockState));
      
      const state = loadState();
      expect(state).toEqual(mockState);
    });

    test('handles invalid JSON gracefully', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('invalid json');
      
      const state = loadState();
      expect(state).toEqual({
        startTime: null,
        isRunning: false,
        elapsedTime: 0,
        laps: []
      });
    });
  });

  describe('saveState', () => {
    test('writes state to file with proper formatting', () => {
      const mockState = {
        startTime: 1234567890,
        isRunning: true,
        elapsedTime: 5000,
        laps: [1000, 2000]
      };
      
      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      saveState(mockState);
      
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        expect.stringContaining('stopwatch-state.json'),
        JSON.stringify(mockState, null, 2) + '\n',
        'utf8'
      );
    });

    test('sanitizes invalid state values', () => {
      const invalidState = {
        startTime: 'invalid',
        isRunning: 'true',
        elapsedTime: 'not a number',
        laps: 'not an array'
      };
      
      const writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      saveState(invalidState);
      
      const expectedState = {
        startTime: null,
        isRunning: false, // 'true' string becomes false in strict comparison
        elapsedTime: 0,
        laps: []
      };
      
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        expect.stringContaining('stopwatch-state.json'),
        JSON.stringify(expectedState, null, 2) + '\n',
        'utf8'
      );
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

    test('returns null when no --out provided', () => {
      const result = parseExportArgs(['other', 'args']);
      expect(result.out).toBe(null);
    });

    test('handles empty args', () => {
      const result = parseExportArgs([]);
      expect(result.out).toBe(null);
    });
  });

  describe('formatDuration', () => {
    test('formats zero duration', () => {
      expect(formatDuration(0)).toBe('00:00:00.000');
    });

    test('formats milliseconds only', () => {
      expect(formatDuration(123)).toBe('00:00:00.123');
    });

    test('formats seconds and milliseconds', () => {
      expect(formatDuration(5123)).toBe('00:00:05.123');
    });

    test('formats minutes, seconds, and milliseconds', () => {
      expect(formatDuration(65123)).toBe('00:01:05.123');
    });

    test('formats hours, minutes, seconds, and milliseconds', () => {
      expect(formatDuration(3665123)).toBe('01:01:05.123');
    });

    test('handles negative values', () => {
      expect(formatDuration(-1000)).toBe('00:00:00.000');
    });

    test('handles non-finite values', () => {
      expect(formatDuration(NaN)).toBe('00:00:00.000');
      expect(formatDuration(Infinity)).toBe('00:00:00.000');
    });
  });

  describe('buildExportLines', () => {
    test('returns empty array for zero elapsed time and no laps', () => {
      const lines = buildExportLines(0, []);
      expect(lines).toEqual([]);
    });

    test('returns empty array when no laps', () => {
      const lines = buildExportLines(5000, []);
      expect(lines).toEqual([]); // Function returns empty array when no laps
    });

    test('returns total and lap lines', () => {
      const lines = buildExportLines(5000, [1000, 2000, 2000]);
      expect(lines).toEqual([
        'Total: 00:00:05.000',
        'Lap 1: 00:00:01.000',
        'Lap 2: 00:00:02.000',
        'Lap 3: 00:00:02.000'
      ]);
    });

    test('handles lap objects with duration property', () => {
      const laps = [
        { duration: 1000 },
        { duration: 2000 }
      ];
      const lines = buildExportLines(3000, laps);
      expect(lines).toEqual([
        'Total: 00:00:03.000',
        'Lap 1: 00:00:01.000',
        'Lap 2: 00:00:02.000'
      ]);
    });

    test('skips invalid lap entries', () => {
      const laps = [1000, null, { invalid: true }, 2000];
      const lines = buildExportLines(3000, laps);
      expect(lines).toEqual([
        'Total: 00:00:03.000',
        'Lap 1: 00:00:01.000',
        'Lap 2: 00:00:02.000'
      ]);
    });
  });
});
