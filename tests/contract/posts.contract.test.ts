import { describe, it, expect } from 'vitest';
import { querySchema } from '../../packages/contract/src/index';

describe('Posts Contract Tests (T028)', () => {
  describe('Valid Query Parameters', () => {
    it('should accept valid q parameter', () => {
      const query = { q: 'design' };
      expect(() => querySchema.parse(query)).not.toThrow();
    });

    it('should accept valid author parameter (slug format)', () => {
      const query = { author: 'alice' };
      expect(() => querySchema.parse(query)).not.toThrow();
    });

    it('should accept valid sort parameter (new)', () => {
      const query = { sort: 'new' };
      expect(() => querySchema.parse(query)).not.toThrow();
    });

    it('should accept valid sort parameter (old)', () => {
      const query = { sort: 'old' };
      expect(() => querySchema.parse(query)).not.toThrow();
    });

    it('should accept empty query (all params optional)', () => {
      const query = {};
      expect(() => querySchema.parse(query)).not.toThrow();
    });

    it('should accept q + author + sort combination', () => {
      const query = { q: 'design', author: 'alice', sort: 'new' };
      expect(() => querySchema.parse(query)).not.toThrow();
    });

    it('should trim whitespace from q parameter', () => {
      const query = { q: '  design  ' };
      const parsed = querySchema.parse(query);
      expect(parsed.q).toBe('design');
    });

    it('should reject empty string q (convert to undefined)', () => {
      const query = { q: '' };
      const parsed = querySchema.parse(query);
      expect(parsed.q).toBeUndefined();
    });
  });

  describe('Invalid Query Parameters', () => {
    it('should reject invalid sort value', () => {
      const query = { sort: 'invalid' };
      expect(() => querySchema.parse(query)).toThrow();
    });

    it('should reject sort with uppercase', () => {
      const query = { sort: 'New' };
      expect(() => querySchema.parse(query)).toThrow();
    });

    it('should reject malformed author (uppercase not allowed)', () => {
      const query = { author: 'Alice' };
      expect(() => querySchema.parse(query)).toThrow();
    });

    it('should reject author with spaces', () => {
      const query = { author: 'alice smith' };
      expect(() => querySchema.parse(query)).toThrow();
    });

    it('should reject author too short (min 2 chars)', () => {
      const query = { author: 'a' };
      expect(() => querySchema.parse(query)).toThrow();
    });

    it('should reject author too long (max 32 chars)', () => {
      const query = { author: 'a'.repeat(33) };
      expect(() => querySchema.parse(query)).toThrow();
    });

    it('should reject q parameter too long (max 64 chars)', () => {
      const query = { q: 'a'.repeat(65) };
      expect(() => querySchema.parse(query)).toThrow();
    });

    it('should reject non-string sort parameter', () => {
      const query = { sort: 123 as unknown as Record<string, unknown> };
      expect(() => querySchema.parse(query)).toThrow();
    });
  });

  describe('Query Parameter Combinations', () => {
    it('should accept q + author', () => {
      const query = { q: 'design', author: 'alice' };
      expect(() => querySchema.parse(query)).not.toThrow();
    });

    it('should accept q + sort', () => {
      const query = { q: 'design', sort: 'old' };
      expect(() => querySchema.parse(query)).not.toThrow();
    });

    it('should accept author + sort', () => {
      const query = { author: 'alice', sort: 'old' };
      expect(() => querySchema.parse(query)).not.toThrow();
    });

    it('should handle multiple invalid params gracefully', () => {
      const query = { sort: 'invalid', author: 'Alice' };
      expect(() => querySchema.parse(query)).toThrow();
    });
  });

  describe('Default Values', () => {
    it('should default sort to new when not provided', () => {
      const query = {};
      const parsed = querySchema.parse(query);
      expect(parsed.sort).toBe('new');
    });

    it('should preserve sort value when provided', () => {
      const query = { sort: 'old' };
      const parsed = querySchema.parse(query);
      expect(parsed.sort).toBe('old');
    });
  });

  describe('Error Message Consistency', () => {
    it('should provide consistent error for validation failures', () => {
      try {
        querySchema.parse({ sort: 'invalid' });
        expect.fail('Should have thrown');
      } catch (error) {
        // Error should be a ZodError with message
        expect((error as Record<string, unknown>).errors).toBeDefined();
        expect(Array.isArray((error as Record<string, unknown>).errors)).toBe(true);
      }
    });
  });
});
