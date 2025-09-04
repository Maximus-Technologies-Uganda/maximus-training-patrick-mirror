const fs = require('fs');
const { run } = require('../src/index');
const { readQuotesFromFile, filterByAuthor } = require('../src/core');

describe('DEV-69: Edge Cases and Error Paths', () => {
  let logSpy;
  let errSpy;
  let originalRandom;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    originalRandom = Math.random;
    Math.random = jest.fn().mockReturnValue(0.5); // Consistent random for testing
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Math.random = originalRandom;
  });

  describe('Missing/Empty quotes file handling', () => {
    test('gracefully handles missing quotes file', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const code = run(['node', 'index.js']);
      expect(code).toBe(1);
      expect(errSpy).toHaveBeenCalledWith('Error: No quotes available. Ensure quotes.json exists beside index.js.');
    });

    test('gracefully handles empty quotes file', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('');

      const code = run(['node', 'index.js']);
      expect(code).toBe(1);
      expect(errSpy).toHaveBeenCalledWith('Error: No quotes available. Ensure quotes.json exists beside index.js.');
    });

    test('gracefully handles quotes file with only whitespace', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('   \n\t   ');

      const code = run(['node', 'index.js']);
      expect(code).toBe(1);
      expect(errSpy).toHaveBeenCalledWith('Error: No quotes available. Ensure quotes.json exists beside index.js.');
    });

    test('gracefully handles empty JSON array', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('[]');

      const code = run(['node', 'index.js']);
      expect(code).toBe(1);
      expect(errSpy).toHaveBeenCalledWith('Error: No quotes available. Ensure quotes.json exists beside index.js.');
    });
  });

  describe('BOM (Byte Order Mark) handling', () => {
    test('correctly reads UTF-8 file with BOM', () => {
      const quotesWithBOM = '\uFEFF' + JSON.stringify([
        { text: 'Quote with BOM', author: 'Test Author' },
        { text: 'Another quote', author: 'Another Author' }
      ]);

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(quotesWithBOM);

      // Override Math.random to select first quote (index 0)
      const originalRandom = Math.random;
      Math.random = jest.fn().mockReturnValue(0);

      const code = run(['node', 'index.js']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalled();
      const output = logSpy.mock.calls[0][0];
      expect(output).toContain('Quote with BOM - Test Author');

      Math.random = originalRandom;
    });

    test('readQuotesFromFile handles BOM correctly', () => {
      const quotesWithBOM = '\uFEFF' + JSON.stringify([
        { text: 'BOM Test Quote', author: 'BOM Author' }
      ]);

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(quotesWithBOM);

      const result = readQuotesFromFile('/test/path.json');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ text: 'BOM Test Quote', author: 'BOM Author' });
    });
  });

  describe('Case-insensitive author matching', () => {
    beforeEach(() => {
      const testQuotes = [
        { text: 'Quote 1', author: 'Mark Twain' },
        { text: 'Quote 2', author: 'MARK TWAIN' },
        { text: 'Quote 3', author: 'mark twain' },
        { text: 'Quote 4', author: 'Albert Einstein' },
        { text: 'Quote 5', author: 'STEVE JOBS' }
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testQuotes));
    });

    test('matches author with uppercase input', () => {
      const code = run(['node', 'index.js', '--by=MARK TWAIN']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalled();
      const output = logSpy.mock.calls[0][0];
      expect(output.toLowerCase()).toContain('mark twain');
    });

    test('matches author with lowercase input', () => {
      const code = run(['node', 'index.js', '--by=mark twain']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalled();
      const output = logSpy.mock.calls[0][0];
      expect(output.toLowerCase()).toContain('mark twain');
    });

    test('matches author with mixed case input', () => {
      const code = run(['node', 'index.js', '--by=Mark Twain']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalled();
      const output = logSpy.mock.calls[0][0];
      expect(output.toLowerCase()).toContain('mark twain');
    });

    test('matches author with all caps in data', () => {
      const code = run(['node', 'index.js', '--by=steve jobs']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalled();
      const output = logSpy.mock.calls[0][0];
      expect(output.toLowerCase()).toContain('steve jobs');
    });

    test('filterByAuthor handles case insensitivity correctly', () => {
      const quotes = [
        { text: 'Quote 1', author: 'Mark Twain' },
        { text: 'Quote 2', author: 'MARK TWAIN' },
        { text: 'Quote 3', author: 'mark twain' },
        { text: 'Quote 4', author: 'Albert Einstein' }
      ];

      const result = filterByAuthor(quotes, 'MARK TWAIN');
      expect(result).toHaveLength(3);
      expect(result.every(q => q.author.toLowerCase() === 'mark twain')).toBe(true);
    });
  });

  describe('Author not found exit code', () => {
    test('returns non-zero exit code when author not found', () => {
      const testQuotes = [
        { text: 'Quote 1', author: 'Albert Einstein' },
        { text: 'Quote 2', author: 'Mark Twain' }
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testQuotes));

      const code = run(['node', 'index.js', '--by=Nonexistent Author']);
      expect(code).toBe(1);
      expect(errSpy).toHaveBeenCalledWith('Error: No quotes found for author "Nonexistent Author".');
    });

    test('returns non-zero exit code for empty author filter result', () => {
      const testQuotes = [
        { text: 'Quote 1', author: 'Albert Einstein' }
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testQuotes));

      const code = run(['node', 'index.js', '--by=Mark Twain']);
      expect(code).toBe(1);
      expect(errSpy).toHaveBeenCalledWith('Error: No quotes found for author "Mark Twain".');
    });

    test('returns non-zero exit code for whitespace-only author', () => {
      const testQuotes = [
        { text: 'Quote 1', author: 'Albert Einstein' }
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testQuotes));

      const code = run(['node', 'index.js', '--by=   ']);
      expect(code).toBe(1);
      expect(errSpy).toHaveBeenCalledWith('Error: No quotes found for author "   ".');
    });
  });

  describe('Additional edge cases', () => {
    test('handles malformed quotes data gracefully', () => {
      const malformedQuotes = [
        { text: 'Valid quote', author: 'Valid Author' },
        { text: '', author: 'Invalid Author' },
        { text: 'Valid quote', author: '' },
        null,
        { text: 'Valid quote' },
        { author: 'Valid Author' }
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(malformedQuotes));

      const code = run(['node', 'index.js']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalled();
      const output = logSpy.mock.calls[0][0];
      expect(output).toContain('Valid quote - Valid Author');
    });

    test('handles quotes with special characters', () => {
      const specialQuotes = [
        { text: 'Quote with "quotes" and \'apostrophes\'', author: 'Author' },
        { text: 'Quote with émojis 😀', author: 'Emoji Author' },
        { text: 'Quote with newlines\nand tabs\t', author: 'Multiline Author' }
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(specialQuotes));

      const code = run(['node', 'index.js']);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalled();
    });

    test('handles very long author names', () => {
      const longAuthor = 'A Very Long Author Name That Might Cause Issues With String Processing';
      const testQuotes = [
        { text: 'Quote with long author', author: longAuthor }
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(testQuotes));

      const code = run(['node', 'index.js', `--by=${longAuthor}`]);
      expect(code).toBe(0);
      expect(logSpy).toHaveBeenCalled();
      const output = logSpy.mock.calls[0][0];
      expect(output).toContain(longAuthor);
    });
  });
});
