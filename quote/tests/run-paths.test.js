const fs = require('fs');

// Mock args helper to avoid process.exit
jest.mock('../../helpers/args.js', () => {
  return {
    exitWithError: jest.fn((msg) => { throw new Error(`EXIT:${msg}`); }),
    exitWithSuccess: jest.fn(() => { /* no-op for tests */ }),
  };
});

const argsHelper = require('../../helpers/args.js');
const { run } = require('../src/index.js');

describe('run() CLI flows (non-exiting)', () => {
  const originalLog = console.log;
  const originalError = console.error;

  beforeEach(() => {
    console.log = jest.fn();
    console.error = jest.fn();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    console.log = originalLog;
    console.error = originalError;
    jest.restoreAllMocks();
  });

  test('prints help and returns 0 with --help', () => {
    const rc = run(['node', 'index.js', '--help']);
    expect(rc).toBe(0);
    expect(console.log).toHaveBeenCalled();
    expect(argsHelper.exitWithError).not.toHaveBeenCalled();
    expect(argsHelper.exitWithSuccess).not.toHaveBeenCalled();
  });

  test('successful run without flags calls exitWithSuccess', () => {
    const rc = run(['node', 'index.js']);
    expect(rc).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/ - /));
    expect(argsHelper.exitWithSuccess).toHaveBeenCalled();
  });

  test('filters by author successfully when matches exist', () => {
    const rc = run(['node', 'index.js', '--by=Albert Einstein']);
    expect(rc).toBeUndefined();
    expect(console.log).toHaveBeenCalledWith(expect.stringMatching(/ - /));
    expect(argsHelper.exitWithSuccess).toHaveBeenCalled();
  });

  test('unknown author triggers exitWithError', () => {
    expect(() => run(['node', 'index.js', '--by=__Unknown_Author__'])).toThrow(/EXIT:Error: No quotes found for author/);
    expect(argsHelper.exitWithError).toHaveBeenCalled();
  });

  test('missing quotes file triggers exitWithError', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    expect(() => run(['node', 'index.js'])).toThrow(/EXIT:Error: No quotes available/);
  });
});
