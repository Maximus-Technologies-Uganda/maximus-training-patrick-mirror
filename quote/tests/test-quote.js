const { run } = require('../src/cli');
const { readQuotesFromFile, getDefaultQuotesPath } = require('../src/core');

describe('quote CLI (refactored)', () => {
  let logSpy;
  let errSpy;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('prints a random quote and returns 0 by default', () => {
    const code = run(['node', 'index.js']);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const line = (logSpy.mock.calls[0][0] || '').trim();
    expect(line).toMatch(/ - /);

    const [text, author] = line.split(' - ');
    const quotes = readQuotesFromFile(getDefaultQuotesPath());
    expect(quotes.some(q => q.text === text && q.author === author)).toBe(true);
  });

  test('filters by an existing author and returns 0', () => {
    const code = run(['node', 'index.js', '--by=Albert Einstein']);
    expect(code).toBe(0);
    expect(logSpy).toHaveBeenCalled();
    const line = (logSpy.mock.calls[0][0] || '').trim();
    expect(line.endsWith('- Albert Einstein')).toBe(true);
  });

  test('non-existent author returns 1 and logs an error', () => {
    const code = run(['node', 'index.js', '--by=Unknown Author 12345']);
    expect(code).toBe(1);
    expect(errSpy).toHaveBeenCalled();
    const msg = (errSpy.mock.calls[0][0] || '').toString();
    expect(msg).toContain('No quotes found for author');
  });
});

