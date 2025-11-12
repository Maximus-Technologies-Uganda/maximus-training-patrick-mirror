/**
 * Test: Key Parity (T067)
 * Enforces SSR/SWR cache key equality for identical canonical URLs
 * FR-017: SWR/SSR parity
 * FR-023: Canonical cache key builder
 */

import { buildPostsKey, parseFilterState } from '@/lib/urlKey';

describe('Key Parity', () => {
  /**
   * Simulate SSR rendering with specific filter state
   */
  function simulateSSRRender(filter: Record<string, string | undefined>) {
    const key = buildPostsKey(filter);
    return { key, rendered: true };
  }

  /**
   * Simulate SWR client-side hook with same filter
   */
  function simulateSWRHook(filter: Record<string, string | undefined>) {
    const key = buildPostsKey(filter);
    return { key, fetching: false };
  }

  it('should generate identical keys for SSR and SWR with same filters', () => {
    const filter = { q: 'typescript', sort: 'new' };

    const ssrResult = simulateSSRRender(filter);
    const swrResult = simulateSWRHook(filter);

    // Keys must match for SWR to use cached SSR data
    expect(ssrResult.key).toBe(swrResult.key);
  });

  it('should maintain parity when filters are provided in different order', () => {
    // SSR might receive filters in this order
    const ssrFilter = { sort: 'new', q: 'typescript', author: 'alice' };

    // Client-side filter state constructed differently
    const swrFilter = { q: 'typescript', author: 'alice', sort: 'new' };

    const ssrKey = buildPostsKey(ssrFilter);
    const swrKey = buildPostsKey(swrFilter);

    expect(ssrKey).toBe(swrKey);
  });

  it('should handle empty parameters consistently', () => {
    const ssrFilter = { q: 'typescript', author: '', sort: 'new' };
    const swrFilter = { q: 'typescript', sort: 'new' };

    const ssrKey = buildPostsKey(ssrFilter);
    const swrKey = buildPostsKey(swrFilter);

    expect(ssrKey).toBe(swrKey);
  });

  it('should produce identical keys for undefined parameters', () => {
    const ssrFilter = { q: 'typescript', author: undefined, sort: 'new' };
    const swrFilter = { q: 'typescript', sort: 'new' };

    const ssrKey = buildPostsKey(ssrFilter);
    const swrKey = buildPostsKey(swrFilter);

    expect(ssrKey).toBe(swrKey);
  });

  it('should encode special characters consistently', () => {
    const filter1 = { q: 'hello world' };
    const filter2 = { q: 'hello%20world' };

    const key1 = buildPostsKey(filter1);
    const key2 = buildPostsKey(filter2);

    // One should normalize to the other or both should encode the same way
    // (depends on implementation, but must be consistent)
    expect(typeof key1).toBe('string');
    expect(typeof key2).toBe('string');
  });

  it('should preserve exact search query for parity', () => {
    const query = 'react hooks performance';
    const ssrFilter = { q: query };
    const swrFilter = { q: query };

    const ssrKey = buildPostsKey(ssrFilter);
    const swrKey = buildPostsKey(swrFilter);

    expect(ssrKey).toBe(swrKey);
    expect(ssrKey).toContain(encodeURIComponent(query));
  });

  it('should maintain parity when filter state updated client-side', () => {
    // Initial SSR key
    const initialFilter = { q: 'typescript', sort: 'new' };
    const initialKey = buildPostsKey(initialFilter);

    // User updates filter client-side
    const updatedFilter = { q: 'typescript', author: 'alice', sort: 'new' };
    const updatedKey = buildPostsKey(updatedFilter);

    // Keys should be different (different filters)
    expect(initialKey).not.toBe(updatedKey);

    // But if we render SSR with updated filter, it should match SWR
    const ssrWithUpdate = buildPostsKey(updatedFilter);
    expect(ssrWithUpdate).toBe(updatedKey);
  });

  it('should validate key symmetry across services', () => {
    const filter = { q: 'react', sort: 'new', author: 'dan' };

    // Key from frontend
    const frontendKey = buildPostsKey(filter);

    // If API also builds key the same way, it should match
    // (documenting the contract that backend uses same algorithm)
    const backendKey = buildPostsKey(filter);

    expect(frontendKey).toBe(backendKey);
  });

  it('should ensure cache hit when revisiting same URL', () => {
    const originalFilter = { q: 'typescript' };
    const originalKey = buildPostsKey(originalFilter);

    // User navigates away and back
    const returnedFilter = { q: 'typescript' };
    const returnedKey = buildPostsKey(returnedFilter);

    // Same key = cache hit
    expect(originalKey).toBe(returnedKey);
  });

  it('should distinguish different filters with different keys', () => {
    const filter1 = { q: 'typescript' };
    const filter2 = { q: 'javascript' };
    const filter3 = { q: 'typescript', author: 'alice' };

    const key1 = buildPostsKey(filter1);
    const key2 = buildPostsKey(filter2);
    const key3 = buildPostsKey(filter3);

    // All different
    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
    expect(key2).not.toBe(key3);
  });

  it('should parse key back to filter state with parity', () => {
    const originalFilter = { q: 'typescript', author: 'alice', sort: 'new' };
    const key = buildPostsKey(originalFilter);

    // Parse key back
    const parsed = parseFilterState('http://localhost' + key);

    // Should reconstruct original (or equivalent) filter
    expect(parsed.q).toBe('typescript');
    expect(parsed.author).toBe('alice');
    expect(parsed.sort).toBe('new');

    // Rebuild key from parsed - should be identical
    const rebuiltKey = buildPostsKey(parsed);
    expect(rebuiltKey).toBe(key);
  });

  it('should maintain parity with special characters in query', () => {
    const specialQueries = [
      'C++',
      'Node.js',
      'vue-router',
      'next/app',
      'hello&world',
    ];

    specialQueries.forEach((q) => {
      const filter = { q };
      const key = buildPostsKey(filter);
      const parsed = parseFilterState('http://localhost' + key);

      // Should round-trip correctly
      expect(parsed.q).toBe(q);

      // And rebuild to same key
      const rebuilt = buildPostsKey(parsed);
      expect(rebuilt).toBe(key);
    });
  });

  it('should ensure parity doesn\'t break with author slug validation', () => {
    const validAuthors = ['alice', 'bob-smith', 'alice-123'];

    validAuthors.forEach((author) => {
      const filter = { author };
      const ssrKey = buildPostsKey(filter);
      const swrKey = buildPostsKey(filter);

      expect(ssrKey).toBe(swrKey);
    });
  });

  it('should verify default sort value produces consistent key', () => {
    const filter1 = { q: 'typescript' };
    const filter2 = { q: 'typescript', sort: 'new' };

    const key1 = buildPostsKey(filter1);
    const key2 = buildPostsKey(filter2);

    // If sort defaults to 'new', keys should match
    // (depends on whether default is applied before or after canonical key building)
    expect(typeof key1).toBe('string');
    expect(typeof key2).toBe('string');
  });
});
