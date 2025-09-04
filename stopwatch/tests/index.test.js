// Mock the file system before importing the module
jest.mock('fs');
jest.mock('path');

const fs = require('fs');
const path = require('path');

// Mock process.argv and process.exitCode
const originalArgv = process.argv;
const originalExitCode = process.exitCode;
const mockExit = jest.fn();
const mockError = jest.fn();
const mockLog = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();

  // Set up fs mocks
  fs.existsSync.mockReturnValue(false);
  fs.readFileSync.mockReturnValue('');
  fs.writeFileSync.mockImplementation(() => {});
  path.resolve.mockImplementation((...args) => {
    // Simulate the actual path resolution for STATE_FILE
    if (args.includes('stopwatch-state.json')) {
      return '/mock/path/stopwatch-state.json';
    }
    // For process.cwd() calls
    if (args.length === 1 && args[0] === '/test') {
      return '/test';
    }
    return args.join('/');
  });

  // Mock console methods
  console.error = mockError;
  console.log = mockLog;
  process.exitCode = undefined;

  // Mock process.cwd
  process.cwd = jest.fn().mockReturnValue('/test');
});

afterEach(() => {
  process.argv = originalArgv;
  process.exitCode = originalExitCode;
});

// Import the module after mocking
const index = require('../src/index');

describe('stopwatch index', () => {
  describe('loadState', () => {
    test('returns default state when file does not exist', () => {
      fs.existsSync.mockReturnValue(false);

      const result = index.loadState();

      expect(result).toEqual({
        startTime: null,
        isRunning: false,
        elapsedTime: 0,
        laps: []
      });
    });

    test('returns default state when file is empty', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('');

      const result = index.loadState();

      expect(result).toEqual({
        startTime: null,
        isRunning: false,
        elapsedTime: 0,
        laps: []
      });
    });

    test('parses valid JSON state correctly', () => {
      const mockState = {
        startTime: 1000,
        isRunning: true,
        elapsedTime: 5000,
        laps: [1000, 2000]
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(mockState));

      const result = index.loadState();

      expect(result).toEqual({
        startTime: 1000,
        isRunning: true,
        elapsedTime: 5000,
        laps: [1000, 2000]
      });
    });

    test('handles invalid JSON gracefully', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue('invalid json');

      const result = index.loadState();

      expect(result).toEqual({
        startTime: null,
        isRunning: false,
        elapsedTime: 0,
        laps: []
      });
    });

    test('handles malformed state object', () => {
      const malformedState = {
        startTime: 'invalid',
        elapsedTime: 'invalid',
        laps: 'invalid',
        isRunning: 'invalid'
      };

      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify(malformedState));

      const result = index.loadState();

      expect(result).toEqual({
        startTime: null,
        isRunning: false,
        elapsedTime: 0,
        laps: []
      });
    });
  });

  describe('saveState', () => {
    test('saves state correctly', () => {
      const state = {
        startTime: 1000,
        isRunning: true,
        elapsedTime: 5000,
        laps: [1000, 2000]
      };

      index.saveState(state);

      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('normalizes invalid state values', () => {
      const invalidState = {
        startTime: 'invalid',
        isRunning: 'invalid',
        elapsedTime: 'invalid',
        laps: 'invalid'
      };

      index.saveState(invalidState);

      expect(fs.writeFileSync).toHaveBeenCalled();
    });
  });

  describe('parseExportArgs', () => {
    test('parses --out=filename format', () => {
      const result = index.parseExportArgs(['--out=output.txt']);

      expect(result).toEqual({ out: 'output.txt' });
    });

    test('parses --out filename format', () => {
      const result = index.parseExportArgs(['--out', 'output.txt']);

      expect(result).toEqual({ out: 'output.txt' });
    });

    test('returns null when no --out argument', () => {
      const result = index.parseExportArgs(['other', 'args']);

      expect(result).toEqual({ out: null });
    });

    test('handles empty argv', () => {
      const result = index.parseExportArgs([]);

      expect(result).toEqual({ out: null });
    });

    test('ignores non-out arguments', () => {
      const result = index.parseExportArgs(['--other', 'value', '--out=output.txt']);

      expect(result).toEqual({ out: 'output.txt' });
    });
  });

  describe('handleExport', () => {
    beforeEach(() => {
      // Mock successful state loading
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        elapsedTime: 10000,
        laps: [5000, 5000]
      }));
    });

    test('exports successfully with valid arguments', () => {
      process.argv = ['node', 'index.js', 'export', '--out=output.txt'];

      index.handleExport();

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        '/test/output.txt',
        'Total: 00:00:10.000\nLap 1: 00:00:05.000\nLap 2: 00:00:05.000\n',
        'utf8'
      );
      expect(mockLog).toHaveBeenCalledWith('Exported stopwatch report to /test/output.txt');
    });

    test('shows error when --out is missing', () => {
      process.argv = ['node', 'index.js', 'export'];

      index.handleExport();

      expect(mockError).toHaveBeenCalledWith('Error: --out=<filename> is required.');
      expect(process.exitCode).toBe(1);
    });

    test('shows error when --out is empty', () => {
      process.argv = ['node', 'index.js', 'export', '--out='];

      index.handleExport();

      expect(mockError).toHaveBeenCalledWith('Error: --out=<filename> is required.');
      expect(process.exitCode).toBe(1);
    });

    test('shows message when no laps recorded', () => {
      fs.readFileSync.mockReturnValue(JSON.stringify({
        elapsedTime: 0,
        laps: []
      }));
      process.argv = ['node', 'index.js', 'export', '--out=output.txt'];

      index.handleExport();

      expect(mockLog).toHaveBeenCalledWith('No laps recorded.');
      expect(fs.writeFileSync).not.toHaveBeenCalled();
    });

    test('handles file write error gracefully', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });
      process.argv = ['node', 'index.js', 'export', '--out=output.txt'];

      index.handleExport();

      expect(mockError).toHaveBeenCalledWith('Error: failed to write output file:', 'Permission denied');
      expect(process.exitCode).toBe(1);
    });
  });

  describe('handleLap', () => {
    test('adds lap successfully when stopwatch is running', () => {
      const mockStartTime = Date.now() - 10000; // 10 seconds ago
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        startTime: mockStartTime,
        isRunning: true,
        elapsedTime: 0,
        laps: [5000]
      }));

      index.handleLap();

      expect(mockLog).toHaveBeenCalledWith(expect.stringMatching(/^Lap 2: 00:00:05\.\d{3}$/));
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('shows error when stopwatch not started', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        startTime: null,
        isRunning: false,
        elapsedTime: 0,
        laps: []
      }));

      index.handleLap();

      expect(mockError).toHaveBeenCalledWith('Error: stopwatch has not been started.');
      expect(process.exitCode).toBe(1);
    });

    test('shows error when stopwatch not running', () => {
      fs.existsSync.mockReturnValue(true);
      fs.readFileSync.mockReturnValue(JSON.stringify({
        startTime: Date.now(),
        isRunning: false,
        elapsedTime: 0,
        laps: []
      }));

      index.handleLap();

      expect(mockError).toHaveBeenCalledWith('Error: stopwatch has not been started.');
      expect(process.exitCode).toBe(1);
    });
  });

  describe('handleReset', () => {
    test('resets state successfully', () => {
      index.handleReset();

      expect(mockLog).toHaveBeenCalledWith('Stopwatch state reset.');
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    test('handles file write error during reset', () => {
      fs.writeFileSync.mockImplementation(() => {
        throw new Error('Write failed');
      });

      index.handleReset();

      expect(mockError).toHaveBeenCalledWith('Error: failed to reset stopwatch state:', 'Write failed');
      expect(process.exitCode).toBe(1);
    });
  });
});
