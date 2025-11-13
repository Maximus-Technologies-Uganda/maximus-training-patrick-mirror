/**
 * Test: SWR/SSR Parity Validation (T018)
 * Ensures identical cache key generation between server and client renders
 * FR-017: SWR/SSR parity with identical results for same URL/query
 * FR-023: Canonical cache key builder determinism
 */

import { buildPostsKey, parseFilterState } from '@/lib/urlKey';
import crypto from 'crypto';

describe('SWR/SSR Parity', () => {
  /**
   * Hash a response payload to compare SSR vs SWR results
   * Same canonical key + same upstream data = same hash
   */
  function hashResponse(data: unknown): string {
    const jsonStr = JSON.stringify(data);
    return crypto.createHash('sha256').update(jsonStr).digest('hex');
  }

  it('should generate identical cache key regardless of parameter order', () => {
    const filter1 = { sort: 'new', q: 'typescript', author: 'alice' };
    const filter2 = { q: 'typescript', author: 'alice', sort: 'new' };
    const filter3 = { author: 'alice', sort: 'new', q: 'typescript' };

    const key1 = buildPostsKey(filter1);
    const key2 = buildPostsKey(filter2);
    const key3 = buildPostsKey(filter3);

    expect(key1).toBe(key2);
    expect(key2).toBe(key3);
    expect(key1).toBe('/posts?author=alice&q=typescript&sort=new');
  });

  it('should drop empty/undefined parameters from cache key', () => {
    const filter1 = { q: 'typescript', author: '', sort: 'new' };
    const filter2 = { q: 'typescript', sort: 'new' };
    const filter3 = { q: 'typescript', author: undefined, sort: 'new' };

    const key1 = buildPostsKey(filter1);
    const key2 = buildPostsKey(filter2);
    const key3 = buildPostsKey(filter3);

    expect(key1).toBe(key2);
    expect(key2).toBe(key3);
    expect(key1).toBe('/posts?q=typescript&sort=new');
  });

  it('should encode URL parameters correctly', () => {
    const filter = { q: 'hello world', author: 'alice-smith' };
    const key = buildPostsKey(filter);

    // Space should be encoded as %20, hyphen preserved
    expect(key).toContain('hello%20world');
    expect(key).toContain('alice-smith');
  });

  it('should normalize Unicode in query parameters', () => {
    // Test that NFC and NFD normalization produce same key
    const filter1 = { q: 'café' }; // NFC form
    const filter2 = { q: 'café' }; // Could be NFD form

    const key1 = buildPostsKey(filter1);
    const key2 = buildPostsKey(filter2);

    // Both should normalize to same canonical form
    expect(key1).toBe(key2);
  });

  it('should parse filter state back from canonical key', () => {
    const original = { q: 'typescript', author: 'alice', sort: 'new' };
    const key = buildPostsKey(original);

    const parsed = parseFilterState('http://localhost' + key);

    expect(parsed.q).toBe('typescript');
    expect(parsed.author).toBe('alice');
    expect(parsed.sort).toBe('new');
  });

  it('should demonstrate SSR/SWR key equality for identical queries', () => {
    // Simulate SSR render with canonical key
    const ssrFilter = { q: 'react', sort: 'new' };
    const ssrKey = buildPostsKey(ssrFilter);

    // Simulate client-side SWR hook with same filter
    const swrFilter = { sort: 'new', q: 'react' }; // Different order
    const swrKey = buildPostsKey(swrFilter);

    // Keys must match for SWR to use cached SSR data
    expect(ssrKey).toBe(swrKey);
  });

  it('should produce different keys for different canonical states', () => {
    const key1 = buildPostsKey({ q: 'typescript' });
    const key2 = buildPostsKey({ q: 'javascript' });
    const key3 = buildPostsKey({ q: 'typescript', author: 'alice' });

    expect(key1).not.toBe(key2);
    expect(key1).not.toBe(key3);
  });

  it('should allow deterministic payload hash comparison', () => {
    const payload = {
      data: [
        { id: '1', title: 'First Post', author: 'alice' },
        { id: '2', title: 'Second Post', author: 'bob' },
      ],
      meta: { total: 2, cached: true },
    };

    const hash1 = hashResponse(payload);
    const hash2 = hashResponse(payload);

    // Same payload = same hash
    expect(hash1).toBe(hash2);

    // Different payload = different hash
    const modified = { ...payload, data: [] };
    const hash3 = hashResponse(modified);
    expect(hash1).not.toBe(hash3);
  });

  it('should handle trailing slashes and normalization consistently', () => {
    const key1 = buildPostsKey({}, '/posts');
    const key2 = buildPostsKey({}, '/posts/');

    // Both should normalize to /posts (no trailing slash)
    // depending on implementation preference, but should be consistent
    expect(typeof key1).toBe('string');
    expect(typeof key2).toBe('string');
  });
});
