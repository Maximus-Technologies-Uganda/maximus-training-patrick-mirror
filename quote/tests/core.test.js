const fs = require('fs');
const path = require('path');
const {
  sanitizeQuotes,
  readQuotesFromFile,
  getDefaultQuotesPath,
  selectRandom,
  filterByAuthor,
  formatQuote,
  getRandomQuote,
} = require('../src/core');

describe('core functions', () => {
  describe('sanitizeQuotes', () => {
    test('returns empty array for non-array input', () => {
      expect(sanitizeQuotes(null)).toEqual([]);
      expect(sanitizeQuotes(undefined)).toEqual([]);
      expect(sanitizeQuotes('string')).toEqual([]);
      expect(sanitizeQuotes(123)).toEqual([]);
    });

    test('filters out invalid quotes', () => {
      const quotes = [
        { text: 'Valid quote', author: 'Valid Author' },
        { text: '', author: 'Valid Author' },
        { text: '   ', author: 'Valid Author' },
        { text: 'Valid quote', author: '' },
        { text: 'Valid quote', author: '   ' },
        { text: 'Valid quote', author: null },
        { text: null, author: 'Valid Author' },
        { text: undefined, author: 'Valid Author' },
        null,
        undefined,
        'string',
        123
      ];

      const result = sanitizeQuotes(quotes);
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ text: 'Valid quote', author: 'Valid Author' });
    });

    test('returns valid quotes as-is', () => {
      const quotes = [
        { text: 'Quote 1', author: 'Author 1' },
        { text: 'Quote 2', author: 'Author 2' },
        { text: '  Quote 3  ', author: '  Author 3  ' }
      ];

      const result = sanitizeQuotes(quotes);
      expect(result).toEqual(quotes);
    });

    test('handles empty array', () => {
      expect(sanitizeQuotes([])).toEqual([]);
    });
  });

  describe('readQuotesFromFile', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('returns empty array when file does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = readQuotesFromFile('/nonexistent/path.json');
      expect(result).toEqual([]);
      expect(fs.existsSync).toHaveBeenCalledWith('/nonexistent/path.json');
    });

    test('reads and parses valid JSON file', () => {
      const mockQuotes = [
        { text: 'Quote 1', author: 'Author 1' },
        { text: 'Quote 2', author: 'Author 2' }
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockQuotes));

      const result = readQuotesFromFile('/path/to/quotes.json');
      expect(result).toEqual(mockQuotes);
      expect(fs.readFileSync).toHaveBeenCalledWith('/path/to/quotes.json', 'utf8');
    });

    test('handles BOM in JSON file', () => {
      const mockQuotes = [{ text: 'Quote 1', author: 'Author 1' }];
      const jsonWithBOM = '\uFEFF' + JSON.stringify(mockQuotes);

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(jsonWithBOM);

      const result = readQuotesFromFile('/path/to/quotes.json');
      expect(result).toEqual(mockQuotes);
    });

    test('handles empty file', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('');

      const result = readQuotesFromFile('/path/to/quotes.json');
      expect(result).toEqual([]);
    });

    test('handles invalid JSON', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('{invalid json');

      expect(() => readQuotesFromFile('/path/to/quotes.json')).toThrow();
    });

    test('sanitizes quotes after parsing', () => {
      const mockData = [
        { text: 'Valid quote', author: 'Valid Author' },
        { text: '', author: 'Invalid Author' },
        null
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockData));

      const result = readQuotesFromFile('/path/to/quotes.json');
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ text: 'Valid quote', author: 'Valid Author' });
    });
  });

  describe('getDefaultQuotesPath', () => {
    test('returns path to quotes.json in src directory', () => {
      const result = getDefaultQuotesPath();
      const expected = path.resolve(__dirname, '..', 'src', 'quotes.json');
      expect(result).toBe(expected);
    });
  });

  describe('selectRandom', () => {
    test('returns undefined for empty array', () => {
      const result = selectRandom([]);
      expect(result).toBeUndefined();
    });

    test('returns the only item for single item array', () => {
      const item = { text: 'Quote', author: 'Author' };
      const result = selectRandom([item]);
      expect(result).toBe(item);
    });

    test('returns an item from the array', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const result = selectRandom(items);
      expect(items).toContain(result);
    });

    test('is deterministic when Math.random is mocked', () => {
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
      const items = ['a', 'b', 'c', 'd', 'e'];
      const result = selectRandom(items);
      expect(result).toBe('c'); // Math.floor(0.5 * 5) = 2, so items[2] = 'c'
    });

    test('selectRandom is deterministic with seed', () => {
      const items = ['a', 'b', 'c', 'd', 'e'];
      const result1 = selectRandom(items, 42);
      const result2 = selectRandom(items, 42);
      expect(result1).toBe(result2); // Same seed produces same result
      const result3 = selectRandom(items, 43);
      expect(result1).not.toBe(result3); // Different seed produces different result
    });
  });

  describe('filterByAuthor', () => {
    const quotes = [
      { text: 'Quote 1', author: 'Albert Einstein' },
      { text: 'Quote 2', author: 'Mark Twain' },
      { text: 'Quote 3', author: 'BUDDHA' },
      { text: 'Quote 4', author: 'albert einstein' },
      { text: 'Quote 5', author: '  Steve Jobs  ' },
      { text: 'Quote 6', author: 'Unknown Author' }
    ];

    test('returns original array when author is falsy', () => {
      expect(filterByAuthor(quotes, null)).toBe(quotes);
      expect(filterByAuthor(quotes, undefined)).toBe(quotes);
      expect(filterByAuthor(quotes, '')).toBe(quotes);
    });

    test('filters by author case-insensitively', () => {
      const result = filterByAuthor(quotes, 'ALBERT EINSTEIN');
      expect(result).toHaveLength(2);
      expect(result[0].author).toBe('Albert Einstein');
      expect(result[1].author).toBe('albert einstein');
    });

    test('filters by author with different cases', () => {
      const result = filterByAuthor(quotes, 'mark twain');
      expect(result).toHaveLength(1);
      expect(result[0].author).toBe('Mark Twain');
    });

    test('filters by author with uppercase', () => {
      const result = filterByAuthor(quotes, 'BUDDHA');
      expect(result).toHaveLength(1);
      expect(result[0].author).toBe('BUDDHA');
    });

    test('trims whitespace from input author', () => {
      const result = filterByAuthor(quotes, '  steve jobs  ');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Quote 5');
    });

    test('returns empty array when no matches found', () => {
      const result = filterByAuthor(quotes, 'Nonexistent Author');
      expect(result).toEqual([]);
    });

    test('returns empty array for whitespace-only author', () => {
      const result = filterByAuthor(quotes, '   ');
      expect(result).toEqual([]);
    });

    test('handles quotes with non-string authors', () => {
      const mixedQuotes = quotes.concat([
        { text: 'Quote 7', author: 123 },
        { text: 'Quote 8', author: null },
        { text: 'Quote 9' }
      ]);

      const result = filterByAuthor(mixedQuotes, 'albert einstein');
      expect(result).toHaveLength(2);
      expect(result.every(q => typeof q.author === 'string')).toBe(true);
    });
  });

  describe('formatQuote', () => {
    test('formats quote correctly', () => {
      const quote = { text: 'This is a quote', author: 'Author Name' };
      const result = formatQuote(quote);
      expect(result).toBe('This is a quote - Author Name');
    });

    test('handles quotes with special characters', () => {
      const quote = { text: 'Quote with "quotes" and \'apostrophes\'', author: 'Author' };
      const result = formatQuote(quote);
      expect(result).toBe('Quote with "quotes" and \'apostrophes\' - Author');
    });

    test('handles empty text and author', () => {
      const quote = { text: '', author: '' };
      const result = formatQuote(quote);
      expect(result).toBe(' - ');
    });
  });

  describe('getRandomQuote', () => {
    const mockQuotes = [
      { text: 'Quote 1', author: 'Author 1' },
      { text: 'Quote 2', author: 'Author 2' },
      { text: 'Quote 3', author: 'Author 3' }
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      jest.spyOn(Math, 'random').mockReturnValue(0.5);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('returns error when file does not exist', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = getRandomQuote();
      expect(result.ok).toBe(false);
      expect(result.error).toContain('No quotes available');
    });

    test('returns error when file exists but is empty', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('[]');

      const result = getRandomQuote();
      expect(result.ok).toBe(false);
      expect(result.error).toContain('No quotes available');
    });

    test('returns error when JSON parsing fails', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('{invalid json');

      const result = getRandomQuote();
      expect(result.ok).toBe(false);
      expect(result.error).toContain('No quotes available');
    });

    test('returns error when sanitization yields empty array', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify([
        { text: '', author: 'Author' },
        null
      ]));

      const result = getRandomQuote();
      expect(result.ok).toBe(false);
      expect(result.error).toContain('No quotes available');
    });

    test('returns random quote when no author filter', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockQuotes));

      const result = getRandomQuote();
      expect(result.ok).toBe(true);
      expect(result.value).toEqual(mockQuotes[1]); // Math.floor(0.5 * 3) = 1
    });

    test('filters by author and returns random quote', () => {
      const filteredQuotes = [
        { text: 'Quote 1', author: 'Albert Einstein' },
        { text: 'Quote 2', author: 'Albert Einstein' }
      ];

      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify([
        ...filteredQuotes,
        { text: 'Quote 3', author: 'Other Author' }
      ]));

      const result = getRandomQuote({ by: 'albert einstein' });
      expect(result.ok).toBe(true);
      expect(result.value.author.toLowerCase()).toBe('albert einstein');
      expect(filteredQuotes).toContainEqual(result.value);
    });

    test('returns error when author not found', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockQuotes));

      const result = getRandomQuote({ by: 'Nonexistent Author' });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('No quotes found for author "Nonexistent Author"');
    });

    test('uses custom quotesPath when provided', () => {
      const customPath = '/custom/path/quotes.json';
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(mockQuotes));

      const result = getRandomQuote({}, { quotesPath: customPath });
      expect(result.ok).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(customPath);
      expect(fs.readFileSync).toHaveBeenCalledWith(customPath, 'utf8');
    });
  });
});
