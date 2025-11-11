/**
 * Canonical SWR/SSR cache key builder
 * Ensures identical results for same URL/query across server and client
 * FR-006: URL state synchronization
 * FR-017: SWR/SSR parity
 * FR-023: Canonical cache key with stable ordering and encoding
 */

export interface FilterState {
  q?: string;
  author?: string;
  sort?: string;
}

/**
 * Build canonical cache key from filter state
 * Rules:
 * 1. Remove empty/undefined query params
 * 2. Stable sort remaining param keys lexicographically
 * 3. Encode keys & values with standard URL encoding
 * 4. Assemble as: path?key=value&key2=value2
 *
 * Ensures different original orderings yield identical canonical key
 * Example: {sort:'new', q:''} and {q:'', sort:'new'} both produce '/posts?sort=new'
 */
export function buildPostsKey(filter: FilterState, basePath: string = "/posts"): string {
  // 1. Filter out empty/undefined params
  const filtered: Record<string, string> = {};

  for (const [key, value] of Object.entries(filter)) {
    if (value !== undefined && value !== null && value !== "") {
      filtered[key] = String(value);
    }
  }

  // 2. Get sorted keys for stable ordering
  const sortedKeys = Object.keys(filtered).sort();

  // 3. Build query string with standard URL encoding
  const queryParts = sortedKeys.map((key) => {
    const encodedKey = encodeURIComponent(key);
    const encodedValue = encodeURIComponent(filtered[key]);
    return `${encodedKey}=${encodedValue}`;
  });

  // 4. Assemble final URL
  return queryParts.length > 0 ? `${basePath}?${queryParts.join("&")}` : basePath;
}

/**
 * Parse query params from URL string into FilterState
 * Inverse of buildPostsKey
 */
export function parseFilterState(url: string): FilterState {
  const urlObj = new URL(url, "http://localhost"); // Base URL for relative parsing
  const params = urlObj.searchParams;

  return {
    q: params.get("q") || undefined,
    author: params.get("author") || undefined,
    sort: params.get("sort") || undefined,
  };
}

/**
 * Validate filter state against allowed values
 * Prevents invalid combinations and malformed input
 * FR-004: Query parameter validation
 */
const ALLOWED_SORTS = ["new", "old"];

export function validateFilterState(filter: FilterState): { valid: boolean; error?: string } {
  // Validate sort parameter
  if (filter.sort && !ALLOWED_SORTS.includes(filter.sort)) {
    return {
      valid: false,
      error: `Invalid sort value: ${filter.sort}. Allowed: ${ALLOWED_SORTS.join(", ")}`,
    };
  }

  // Validate author (must be non-empty if provided)
  if (filter.author !== undefined && filter.author.length === 0) {
    return {
      valid: false,
      error: "Author filter must be non-empty",
    };
  }

  // Validate query (must be non-empty if provided)
  if (filter.q !== undefined && filter.q.length === 0) {
    return {
      valid: false,
      error: "Query must be non-empty",
    };
  }

  return { valid: true };
}

/**
 * Normalize filter state to canonical form
 * Used during SSR and client-side to ensure consistency
 */
export function normalizeFilterState(filter: FilterState): FilterState {
  return {
    q: filter.q ? filter.q.trim() : undefined,
    author: filter.author ? filter.author.trim() : undefined,
    sort: filter.sort ? filter.sort.toLowerCase() : undefined,
  };
}

/**
 * Compare two cache keys for equality
 * Used in tests to verify SSR/SWR parity
 */
export function cacheKeyEquals(key1: string, key2: string): boolean {
  // Parse both keys and compare canonical form
  const filter1 = parseFilterState(key1);
  const filter2 = parseFilterState(key2);

  const canonical1 = buildPostsKey(filter1);
  const canonical2 = buildPostsKey(filter2);

  return canonical1 === canonical2;
}
