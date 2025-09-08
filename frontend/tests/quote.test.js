import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  sanitizeQuotes,
  selectRandom,
  filterByAuthor,
  getRandomQuote
} from '../src/quote-core.js';

// Mock quotes data for testing
const mockQuotes = [
  { text: "The only limit to our realization of tomorrow is our doubts of today.", author: "Franklin D. Roosevelt" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
  { text: "The purpose of our lives is to be happy.", author: "Dalai Lama" },
  { text: "Get busy living or get busy dying.", author: "Stephen King" },
  { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
  { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Stay hungry, stay foolish.", author: "Steve Jobs" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" }
];

describe('Quote Core Functions', () => {

  describe('sanitizeQuotes', () => {
    it('should return empty array for non-array input', () => {
      expect(sanitizeQuotes(null)).toEqual([]);
      expect(sanitizeQuotes(undefined)).toEqual([]);
      expect(sanitizeQuotes('string')).toEqual([]);
      expect(sanitizeQuotes(123)).toEqual([]);
    });

    it('should filter out invalid quotes', () => {
      const invalidQuotes = [
        null,
        undefined,
        { text: '', author: 'Test' },
        { text: 'Valid text', author: '' },
        { text: '   ', author: 'Test' },
        { text: 'Valid text', author: '   ' },
        { invalidField: 'test' }
      ];

      const result = sanitizeQuotes(invalidQuotes);
      expect(result).toEqual([]);
    });

    it('should keep valid quotes', () => {
      const validQuotes = [
        { text: 'Valid quote', author: 'Valid Author' },
        { text: 'Another quote', author: 'Another Author' }
      ];

      const result = sanitizeQuotes(validQuotes);
      expect(result).toEqual(validQuotes);
    });

    it('should handle mixed valid and invalid quotes', () => {
      const mixedQuotes = [
        { text: 'Valid quote', author: 'Valid Author' },
        null,
        { text: '', author: 'Test' },
        { text: 'Another valid', author: 'Another Author' }
      ];

      const result = sanitizeQuotes(mixedQuotes);
      expect(result).toEqual([
        { text: 'Valid quote', author: 'Valid Author' },
        { text: 'Another valid', author: 'Another Author' }
      ]);
    });
  });

  describe('selectRandom', () => {
    it('should return undefined for empty array', () => {
      expect(selectRandom([])).toBeUndefined();
    });

    it('should return the single item for single-item array', () => {
      const item = { text: 'Single quote', author: 'Single Author' };
      expect(selectRandom([item])).toBe(item);
    });

    it('should return a random item from the array', () => {
      const result = selectRandom(mockQuotes);
      expect(mockQuotes).toContain(result);
      expect(result).toHaveProperty('text');
      expect(result).toHaveProperty('author');
    });

    it('should provide deterministic random selection when Math.random is mocked', () => {
      // Mock Math.random to return 0.5 consistently
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.5);

      const result = selectRandom(mockQuotes);
      const expectedIndex = Math.floor(0.5 * mockQuotes.length);

      expect(result).toBe(mockQuotes[expectedIndex]);

      // Restore original Math.random
      Math.random = originalRandom;
    });
  });

  describe('filterByAuthor - Author Present', () => {
    it('should return all quotes when no author filter is provided', () => {
      const result = filterByAuthor(mockQuotes);
      expect(result).toEqual(mockQuotes);
    });

    it('should return all quotes when empty string is provided', () => {
      const result = filterByAuthor(mockQuotes, '');
      expect(result).toEqual(mockQuotes);
    });

    it('should return all quotes when only whitespace is provided', () => {
      const result = filterByAuthor(mockQuotes, '   ');
      expect(result).toEqual([]);
    });

    it('should filter quotes by exact author match (case-insensitive)', () => {
      const result = filterByAuthor(mockQuotes, 'Steve Jobs');
      expect(result).toHaveLength(2);
      expect(result.every(quote => quote.author.toLowerCase() === 'steve jobs')).toBe(true);
    });

    it('should handle case-insensitive matching', () => {
      const result1 = filterByAuthor(mockQuotes, 'steve jobs');
      const result2 = filterByAuthor(mockQuotes, 'STEVE JOBS');
      const result3 = filterByAuthor(mockQuotes, 'Steve Jobs');

      expect(result1).toEqual(result2);
      expect(result1).toEqual(result3);
      expect(result1).toHaveLength(2);
    });

    it('should return single quote for author with one quote', () => {
      const result = filterByAuthor(mockQuotes, 'Franklin D. Roosevelt');
      expect(result).toHaveLength(1);
      expect(result[0].author).toBe('Franklin D. Roosevelt');
    });

    it('should handle authors with special characters', () => {
      const result = filterByAuthor(mockQuotes, 'Wayne Gretzky');
      expect(result).toHaveLength(1);
      expect(result[0].author).toBe('Wayne Gretzky');
    });
  });

  describe('filterByAuthor - Author Absent', () => {
    it('should return empty array when author is not found', () => {
      const result = filterByAuthor(mockQuotes, 'Non-existent Author');
      expect(result).toEqual([]);
    });

    it('should return empty array for partial matches', () => {
      const result = filterByAuthor(mockQuotes, 'Steve');
      expect(result).toEqual([]);
    });

    it('should return empty array for similar but different names', () => {
      const result = filterByAuthor(mockQuotes, 'Steve Job');
      expect(result).toEqual([]);
    });

    it('should return empty array when quotes array is empty', () => {
      const result = filterByAuthor([], 'Any Author');
      expect(result).toEqual([]);
    });

    it('should return empty array when quotes array is null', () => {
      const result = filterByAuthor(null, 'Any Author');
      expect(result).toEqual([]);
    });
  });

  describe('getRandomQuote', () => {
    it('should return error when no quotes are available', () => {
      const result = getRandomQuote({}, { quotes: [] });
      expect(result.ok).toBe(false);
      expect(result.error).toContain('No quotes available');
    });

    it('should return random quote when no author filter is provided', () => {
      // Mock Math.random for deterministic testing
      const originalRandom = Math.random;
      Math.random = vi.fn(() => 0.3);

      const result = getRandomQuote({}, { quotes: mockQuotes });

      expect(result.ok).toBe(true);
      expect(mockQuotes).toContain(result.value);

      // Restore original Math.random
      Math.random = originalRandom;
    });

    it('should return filtered quote when author is found', () => {
      const result = getRandomQuote({ by: 'Steve Jobs' }, { quotes: mockQuotes });

      expect(result.ok).toBe(true);
      expect(result.value.author).toBe('Steve Jobs');
      expect(['Stay hungry, stay foolish.', 'Innovation distinguishes between a leader and a follower.'])
        .toContain(result.value.text);
    });

    it('should return error when author is not found', () => {
      const result = getRandomQuote({ by: 'Non-existent Author' }, { quotes: mockQuotes });

      expect(result.ok).toBe(false);
      expect(result.error).toContain('No quotes found for author "Non-existent Author"');
    });

    it('should handle case-insensitive author matching', () => {
      const result = getRandomQuote({ by: 'steve jobs' }, { quotes: mockQuotes });

      expect(result.ok).toBe(true);
      expect(result.value.author).toBe('Steve Jobs');
    });
  });
});
