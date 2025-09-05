const { parseArgs, selectRandom, filterQuotesByAuthor } = require('../src/index.js');

describe('Quote App Unit Tests', () => {
  describe('parseArgs', () => {
    test('parses --by flag correctly', () => {
      const result = parseArgs(['node', 'index.js', '--by', 'Einstein']);
      expect(result.by).toBe('Einstein');
      expect(result.help).toBe(false);
    });

    test('parses --by=value format', () => {
      const result = parseArgs(['node', 'index.js', '--by=Shakespeare']);
      expect(result.by).toBe('Shakespeare');
    });

    test('parses help flag', () => {
      const result = parseArgs(['node', 'index.js', '--help']);
      expect(result.help).toBe(true);
    });

    test('handles no arguments', () => {
      const result = parseArgs(['node', 'index.js']);
      expect(result.by).toBe(null);
      expect(result.help).toBe(false);
    });
  });

  describe('selectRandom', () => {
    test('returns item from single-item array', () => {
      const items = ['only item'];
      const result = selectRandom(items);
      expect(result).toBe('only item');
    });

    test('returns item from array', () => {
      const items = ['a', 'b', 'c'];
      const result = selectRandom(items);
      expect(items).toContain(result);
    });
  });

  describe('filterQuotesByAuthor', () => {
    const testQuotes = [
      { text: 'Quote 1', author: 'Albert Einstein' },
      { text: 'Quote 2', author: 'Shakespeare' },
      { text: 'Quote 3', author: 'Albert Einstein' }
    ];

    test('filters by exact author match', () => {
      const result = filterQuotesByAuthor(testQuotes, 'Albert Einstein');
      expect(result).toHaveLength(2);
      expect(result.every(q => q.author === 'Albert Einstein')).toBe(true);
    });

    test('is case insensitive', () => {
      const result = filterQuotesByAuthor(testQuotes, 'albert einstein');
      expect(result).toHaveLength(2);
    });

    test('returns all quotes when no author specified', () => {
      const result = filterQuotesByAuthor(testQuotes, null);
      expect(result).toEqual(testQuotes);
    });

    test('returns empty array for unknown author', () => {
      const result = filterQuotesByAuthor(testQuotes, 'Unknown Author');
      expect(result).toHaveLength(0);
    });
  });
});
