const fs = require('fs');
const { run } = require('../src/index');

describe('run()', () => {
  let logSpy;
  let errSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('prints help and returns 0 with --help', () => {
    const code = run(['node', 'index.js', '--help']);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const msg = logSpy.mock.calls[0][0] || '';
    expect(msg.toLowerCase()).toContain('usage');
  });

  test('prints a random quote and returns 0 with no args', () => {
    // Mock Math.random for deterministic behavior
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.3); // Selects index 1

    const code = run(['node', 'index.js']);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const line = (logSpy.mock.calls[0][0] || '').trim();
    expect(line).toMatch(/ - /);

    // Restore original Math.random
    Math.random = originalRandom;
  });

  test('filters by author and returns 0', () => {
    // Mock Math.random for deterministic behavior
    const originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0); // Selects first matching quote

    const code = run(['node', 'index.js', '--by=Albert Einstein']);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const line = (logSpy.mock.calls[0][0] || '').trim();
    expect(line.endsWith('- Albert Einstein')).toBe(true);

    // Restore original Math.random
    Math.random = originalRandom;
  });

  test('unknown author returns 1 with error message', () => {
    const code = run(['node', 'index.js', '--by=Some Unknown Author']);
    expect(code).toBe(1);
    expect(errSpy).toHaveBeenCalled();
    const msg = errSpy.mock.calls[0][0] || '';
    expect(msg).toContain('No quotes found for author');
  });

  test('missing quotes file returns 1 with error message', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    const code = run(['node', 'index.js']);
    expect(code).toBe(1);
    expect(errSpy).toHaveBeenCalled();
    const msg = errSpy.mock.calls[0][0] || '';
    expect(msg).toContain('No quotes available');
  });
});


