const fs = require('fs');
const { run } = require('../src/index');
const { getRandomQuote, selectRandom } = require('../src/core');

describe('deterministic behavior tests', () => {
  let originalRandom;
  let logSpy;
  let errSpy;

  beforeEach(() => {
    originalRandom = Math.random;
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock file system to provide consistent test data
    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify([
      { text: 'Quote 1', author: 'Albert Einstein' },
      { text: 'Quote 2', author: 'Mark Twain' },
      { text: 'Quote 3', author: 'Steve Jobs' },
      { text: 'Quote 4', author: 'Albert Einstein' },
      { text: 'Quote 5', author: 'Maya Angelou' }
    ]));
  });

  afterEach(() => {
    Math.random = originalRandom;
    jest.restoreAllMocks();
  });

  describe('selectRandom deterministic behavior', () => {
    test('returns predictable result with mocked random', () => {
      Math.random = jest.fn().mockReturnValue(0.4); // Should select index 1 (Math.floor(0.4 * 3) = 1)
      const items = ['first', 'second', 'third'];
      const result = selectRandom(items);
      expect(result).toBe('second');
    });

    test('returns first item with random = 0', () => {
      Math.random = jest.fn().mockReturnValue(0);
      const items = ['first', 'second', 'third'];
      const result = selectRandom(items);
      expect(result).toBe('first');
    });

    test('returns last item with random approaching 1', () => {
      Math.random = jest.fn().mockReturnValue(0.999);
      const items = ['first', 'second', 'third'];
      const result = selectRandom(items);
      expect(result).toBe('third');
    });
  });

  describe('run() deterministic quote selection', () => {
    test('returns predictable quote with mocked random', () => {
      Math.random = jest.fn().mockReturnValue(0.6); // Should select index 3 (Math.floor(0.6 * 5) = 3)
      const code = run(['node', 'index.js']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith('Quote 4 - Albert Einstein');
    });

    test('returns predictable filtered quote with mocked random', () => {
      Math.random = jest.fn().mockReturnValue(0); // Should select index 0 of filtered results
      const code = run(['node', 'index.js', '--by=Albert Einstein']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith('Quote 1 - Albert Einstein');
    });

    test('returns first quote with random = 0', () => {
      Math.random = jest.fn().mockReturnValue(0);
      const code = run(['node', 'index.js']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith('Quote 1 - Albert Einstein');
    });

    test('returns last quote with random approaching 1', () => {
      Math.random = jest.fn().mockReturnValue(0.999);
      const code = run(['node', 'index.js']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith('Quote 5 - Maya Angelou');
    });
  });

  describe('getRandomQuote deterministic behavior', () => {
    test('returns predictable quote with mocked random', () => {
      Math.random = jest.fn().mockReturnValue(0.4); // Should select index 2
      const result = getRandomQuote();
      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ text: 'Quote 3', author: 'Steve Jobs' });
    });

    test('returns predictable filtered quote with mocked random', () => {
      Math.random = jest.fn().mockReturnValue(0.1); // Should select index 0 of filtered results
      const result = getRandomQuote({ by: 'albert einstein' });
      expect(result.ok).toBe(true);
      expect(result.value).toEqual({ text: 'Quote 1', author: 'Albert Einstein' });
    });
  });

  describe('edge cases with deterministic behavior', () => {
    test('single quote selection is deterministic', () => {
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify([
        { text: 'Only Quote', author: 'Single Author' }
      ]));

      // Random value doesn't matter for single item
      Math.random = jest.fn().mockReturnValue(0.999);
      const code = run(['node', 'index.js']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith('Only Quote - Single Author');
    });

    test('filtered single quote selection is deterministic', () => {
      Math.random = jest.fn().mockReturnValue(0.5);
      const code = run(['node', 'index.js', '--by=Mark Twain']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalledWith('Quote 2 - Mark Twain');
    });
  });
});
