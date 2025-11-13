/**
 * Filter Schema Unit Tests – T037
 * Validates query parameter parsing and normalization per FR-004, FR-011, FR-023
 * Tests cover accepted and rejected query combinations
 */

import { querySchema, type QueryParams } from '../../packages/contract/src/index';

describe('FilterState Schema (T037)', () => {
  describe('Valid inputs', () => {
    it('should accept empty query (all defaults)', () => {
      const result = querySchema.parse({});
      expect(result).toEqual({ sort: 'new' });
    });

    it('should accept query text only', () => {
      const result = querySchema.parse({ q: 'design patterns' });
      expect(result).toEqual({ q: 'design patterns', sort: 'new' });
    });

    it('should accept author filter only', () => {
      const result = querySchema.parse({ author: 'alice' });
      expect(result).toEqual({ author: 'alice', sort: 'new' });
    });

    it('should accept sort parameter only', () => {
      const result = querySchema.parse({ sort: 'old' });
      expect(result).toEqual({ sort: 'old' });
    });

    it('should accept all three parameters combined', () => {
      const result = querySchema.parse({
        q: 'typescript',
        author: 'bob-smith',
        sort: 'old',
      });
      expect(result).toEqual({
        q: 'typescript',
        author: 'bob-smith',
        sort: 'old',
      });
    });

    it('should trim whitespace from query text', () => {
      const result = querySchema.parse({ q: '  hello world  ' });
      expect(result.q).toBe('hello world');
    });

    it('should accept author with hyphens and numbers', () => {
      const result = querySchema.parse({ author: 'alice-smith-123' });
      expect(result.author).toBe('alice-smith-123');
    });

    it('should reject empty query string (omit from result)', () => {
      const result = querySchema.parse({ q: '   ' });
      // Empty after trim should be omitted
      expect(result.q).toBeUndefined();
    });

    it('should accept 1-character query', () => {
      const result = querySchema.parse({ q: 'a' });
      expect(result.q).toBe('a');
    });

    it('should accept 64-character query (max)', () => {
      const maxQuery = 'a'.repeat(64);
      const result = querySchema.parse({ q: maxQuery });
      expect(result.q).toBe(maxQuery);
    });

    it('should accept 2-character author (min)', () => {
      const result = querySchema.parse({ author: 'ab' });
      expect(result.author).toBe('ab');
    });

    it('should accept 32-character author (max)', () => {
      const maxAuthor = 'a'.repeat(32);
      const result = querySchema.parse({ author: maxAuthor });
      expect(result.author).toBe(maxAuthor);
    });
  });

  describe('Invalid inputs and rejections', () => {
    it('should reject query longer than 64 characters', () => {
      expect(() => {
        querySchema.parse({ q: 'a'.repeat(65) });
      }).toThrow();
    });

    it('should reject author shorter than 2 characters', () => {
      expect(() => {
        querySchema.parse({ author: 'a' });
      }).toThrow();
    });

    it('should reject author longer than 32 characters', () => {
      expect(() => {
        querySchema.parse({ author: 'a'.repeat(33) });
      }).toThrow();
    });

    it('should reject author with uppercase letters', () => {
      expect(() => {
        querySchema.parse({ author: 'Alice' });
      }).toThrow();
    });

    it('should reject author with special characters', () => {
      expect(() => {
        querySchema.parse({ author: 'alice@domain' });
      }).toThrow();
    });

    it('should reject author with spaces', () => {
      expect(() => {
        querySchema.parse({ author: 'alice smith' });
      }).toThrow();
    });

    it('should reject invalid sort value', () => {
      expect(() => {
        querySchema.parse({ sort: 'popular' });
      }).toThrow();
    });

    it('should reject sort value with incorrect case', () => {
      expect(() => {
        querySchema.parse({ sort: 'New' });
      }).toThrow();
    });

    it('should reject null values', () => {
      expect(() => {
        querySchema.parse({ q: null });
      }).toThrow();
    });

    it('should reject undefined query as empty (not an error)', () => {
      const result = querySchema.parse({ q: undefined });
      expect(result.q).toBeUndefined();
    });
  });

  describe('Canonical key behavior', () => {
    it('should produce consistent output for identical inputs', () => {
      const input = { q: 'test', author: 'alice', sort: 'old' };
      const result1 = querySchema.parse(input);
      const result2 = querySchema.parse(input);
      expect(result1).toEqual(result2);
    });

    it('should omit empty/undefined fields from result', () => {
      const result = querySchema.parse({ q: undefined, author: undefined, sort: 'new' });
      expect(Object.keys(result)).not.toContain('q');
      expect(Object.keys(result)).not.toContain('author');
      expect(result).toEqual({ sort: 'new' });
    });

    it('should normalize whitespace-only query to undefined', () => {
      const result = querySchema.parse({ q: '   \t\n   ' });
      expect(result.q).toBeUndefined();
    });
  });

  describe('Edge cases and special characters', () => {
    it('should accept query with special characters (except newlines)', () => {
      const result = querySchema.parse({ q: 'hello@#$%^&*()' });
      expect(result.q).toBe('hello@#$%^&*()');
    });

    it('should accept query with unicode characters', () => {
      const result = querySchema.parse({ q: '测试中文' });
      expect(result.q).toBe('测试中文');
    });

    it('should accept query with emoji', () => {
      const result = querySchema.parse({ q: 'hello🚀world' });
      expect(result.q).toBe('hello🚀world');
    });

    it('should accept author with all lowercase letters and numbers', () => {
      const result = querySchema.parse({ author: 'user123' });
      expect(result.author).toBe('user123');
    });

    it('should accept consecutive hyphens in author', () => {
      const result = querySchema.parse({ author: 'alice--bob' });
      expect(result.author).toBe('alice--bob');
    });

    it('should reject author starting with hyphen', () => {
      expect(() => {
        querySchema.parse({ author: '-alice' });
      }).toThrow();
    });

    it('should reject author ending with hyphen', () => {
      expect(() => {
        querySchema.parse({ author: 'alice-' });
      }).toThrow();
    });
  });

  describe('Type inference', () => {
    it('should correctly infer QueryParams type', () => {
      const result: QueryParams = querySchema.parse({
        q: 'test',
        author: 'alice',
        sort: 'old',
      });
      expect(typeof result.q).toBe('string');
      expect(typeof result.author).toBe('string');
      expect(typeof result.sort).toBe('string');
    });

    it('should allow optional fields as undefined in typed result', () => {
      const result: QueryParams = querySchema.parse({ sort: 'new' });
      expect(result.q).toBeUndefined();
      expect(result.author).toBeUndefined();
    });
  });

  describe('Comparison for parity testing', () => {
    it('should produce identical results for parameter reordering', () => {
      const set1 = querySchema.parse({ q: 'test', author: 'alice', sort: 'old' });
      const set2 = querySchema.parse({ author: 'alice', sort: 'old', q: 'test' });
      const set3 = querySchema.parse({ sort: 'old', q: 'test', author: 'alice' });
      expect(set1).toEqual(set2);
      expect(set2).toEqual(set3);
    });

    it('should provide consistent JSON representation for canonical key', () => {
      const parsed = querySchema.parse({ q: 'test', author: 'alice', sort: 'old' });
      const json = JSON.stringify(parsed);
      expect(json).toContain('test');
      expect(json).toContain('alice');
      expect(json).toContain('old');
    });
  });
});
