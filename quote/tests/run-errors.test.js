const fs = require('fs');
const { run } = require('../src/index');

describe('run() error paths', () => {
  let logSpy;
  let errSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('invalid JSON returns 1 with "No quotes available" message', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('{');
    const code = run(['node', 'index.js']);
    expect(code).toBe(1);
    expect(errSpy).toHaveBeenCalled();
    const msg = (errSpy.mock.calls[0] || [])[0] || '';
    expect(msg).toContain('No quotes available');
  });

  test('empty quotes array returns 1 with "No quotes available" message', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue('[]');
    const code = run(['node', 'index.js']);
    expect(code).toBe(1);
    const msg = (errSpy.mock.calls[0] || [])[0] || '';
    expect(msg).toContain('No quotes available');
  });

  test('sanitization yields empty set returns 1 with "No quotes available"', () => {
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify([{ text: '   ', author: '   ' }, null]));
    const code = run(['node', 'index.js']);
    expect(code).toBe(1);
    const msg = (errSpy.mock.calls[0] || [])[0] || '';
    expect(msg).toContain('No quotes available');
  });

  test('unexpected error path returns 1 and logs "Unexpected error:"', () => {
    // Cause failure after data load by making console.log throw
    logSpy.mockImplementation(() => { throw new Error('boom'); });
    const code = run(['node', 'index.js']);
    expect(code).toBe(1);
    expect(errSpy).toHaveBeenCalled();
    const firstArg = (errSpy.mock.calls[0] || [])[0] || '';
    expect(firstArg).toContain('Unexpected error');
  });
});


