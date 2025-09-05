const fs = require('fs');
const { run, parseArgs } = require('../src/index.js');
const { getRandomQuote, readQuotesFromFile } = require('../src/core.js');

// Mock console methods
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Quote App Missing Paths', () => {
  describe('Error handling paths', () => {
    test('handles missing quotes file gracefully', () => {
      // Mock file not existing
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      
      const result = getRandomQuote('nonexistent-file.json');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('No quotes available');
    });

    test('handles empty quotes file', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('');
      
      const result = readQuotesFromFile('empty.json');
      expect(result).toEqual([]);
    });

    test('handles invalid JSON in quotes file gracefully', () => {
      // getRandomQuote catches JSON parse errors
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue('invalid json');
      
      const result = getRandomQuote('invalid.json');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('No quotes available');
    });

    test('handles file with only invalid quotes', () => {
      const invalidQuotes = [
        { text: '', author: 'Someone' }, // empty text
        { text: 'Quote', author: '' },   // empty author
        { author: 'No text' },           // missing text
        { text: 'No author' },           // missing author
        null,                            // null entry
        'not an object'                  // invalid type
      ];
      
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(invalidQuotes));
      
      const result = getRandomQuote('invalid-quotes.json');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('No quotes available');
    });
  });

  describe('Author filtering edge cases', () => {
    const validQuotes = [
      { text: 'Quote 1', author: 'Albert Einstein' },
      { text: 'Quote 2', author: 'ALBERT EINSTEIN' }, // different case
      { text: 'Quote 3', author: '  Albert Einstein  ' }, // with whitespace
      { text: 'Quote 4', author: 'Shakespeare' }
    ];

    beforeEach(() => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(validQuotes));
    });

    test('filters by author case-insensitively', () => {
      const result = getRandomQuote('quotes.json', 'albert einstein');
      expect(result.ok).toBe(true);
      expect(['Quote 1', 'Quote 2', 'Quote 3']).toContain(result.value.text);
    });

    test('handles author with extra whitespace', () => {
      const result = getRandomQuote('quotes.json', '  ALBERT EINSTEIN  ');
      expect(result.ok).toBe(true);
      expect(['Quote 1', 'Quote 2', 'Quote 3']).toContain(result.value.text);
    });

    // Note: This test is covered by existing core.test.js

    test('handles empty author filter', () => {
      const result = getRandomQuote('quotes.json', '');
      expect(result.ok).toBe(true);
      expect(result.value).toBeDefined();
    });

    test('handles whitespace-only author filter', () => {
      const result = getRandomQuote('quotes.json', '   ');
      expect(result.ok).toBe(true);
      expect(result.value).toBeDefined();
    });
  });

  describe('parseArgs edge cases', () => {
    test('handles multiple --by flags (last one wins)', () => {
      const result = parseArgs(['node', 'index.js', '--by=First', '--by=Second']);
      expect(result.by).toBe('Second');
    });

    test('handles --by with empty value', () => {
      const result = parseArgs(['node', 'index.js', '--by=']);
      expect(result.by).toBe('');
    });

    test('handles mixed help flags', () => {
      const result = parseArgs(['node', 'index.js', '-h', '--help']);
      expect(result.help).toBe(true);
    });

    test('handles --by flag at end without value', () => {
      const result = parseArgs(['node', 'index.js', '--by']);
      expect(result.by).toBe(null); // No value provided
    });
  });

  describe('File path handling', () => {
    test('handles BOM in JSON file', () => {
      const quotesWithBOM = '\uFEFF[{"text":"Quote","author":"Author"}]';
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(quotesWithBOM);
      
      const result = readQuotesFromFile('bom.json');
      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('Quote');
    });

    test('handles quotes with special characters', () => {
      const specialQuotes = [
        { text: 'Quote with "quotes" and \'apostrophes\'', author: 'Test Author' },
        { text: 'Quote with émojis 🚀 and ñ', author: 'International Author' }
      ];
      
      jest.spyOn(fs, 'existsSync').mockReturnValue(true);
      jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(specialQuotes));
      
      const result = readQuotesFromFile('special.json');
      expect(result).toHaveLength(2);
      expect(result[0].text).toContain('"quotes"');
      expect(result[1].text).toContain('🚀');
    });
  });
});
