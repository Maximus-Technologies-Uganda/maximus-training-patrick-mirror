/**
 * usePosts Hook – T041 [US2]
 * SWR hook for client-side posts revalidation with canonical URL key
 * Ensures parity with SSR by using canonical cache keys
 * FR-017: SWR parity with SSR
 * FR-023: Canonical cache key usage
 */

"use client";

import useSWR from "swr";
import { querySchema, type QueryParams } from "../../../packages/contract/src/index";
import { buildPostsKey } from "../lib/urlKey";

/**
 * Post entity interface
 */
interface Post {
  id: string;
  title: string;
  author: string;
  createdAt: string; // ISO date string
  // Add other fields as needed, e.g. content, tags, etc.
}

/**
 * Posts response contract
 */
interface PostsResponse {
  posts: Post[]; // Post entity
  meta: {
    total: number;
    key: string;
    traceId?: string;
  };
}

/**
 * Error response shape
 */
interface FetchError {
  message: string;
  status?: number;
  code?: string;
}

/**
 * Hook options
 */
interface UsePostsOptions {
  /**
   * Manual revalidation trigger
   */
  shouldFetch?: boolean;

  /**
   * SWR revalidation interval in ms
   */
  revalidateInterval?: number;

  /**
   * Dedupe interval in ms
   */
  dedupingInterval?: number;

  /**
   * Focus revalidation
   */
  revalidateOnFocus?: boolean;
}

/**
 * Fetcher function for SWR
 * Calls the API endpoint to fetch filtered posts
 */
async function postsFetcher(url: string): Promise<PostsResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    const error: FetchError = {
      message: `Failed to fetch posts: ${response.statusText}`,
      status: response.status,
    };
    throw error;
  }

  const data = await response.json();

  // Validate response shape
  if (!Array.isArray(data.posts) || typeof data.meta !== "object") {
    throw new Error("Invalid posts response format");
  }

  return data as PostsResponse;
}

/**
 * usePosts hook
 * Provides client-side post fetching with SWR, using canonical cache keys
 *
 * @param params - Query parameters for filtering
 * @param options - SWR options
 * @returns SWR result with posts data, error, and utilities
 *
 * @example
 * const { data, error, isLoading, mutate } = usePosts({
 *   q: 'react',
 *   author: 'alice',
 *   sort: 'new'
 * });
 */
export function usePosts(
  params?: Partial<QueryParams>,
  options: UsePostsOptions = {}
): {
  data?: PostsResponse;
  error?: FetchError;
  isLoading: boolean;
  isValidating: boolean;
  mutate: (data?: PostsResponse | Promise<PostsResponse>) => Promise<PostsResponse | undefined>;
} {
  const {
    shouldFetch = true,
    revalidateInterval: _revalidateInterval = 0, // No automatic revalidation by default
    dedupingInterval = 60000, // 60s dedup window
    revalidateOnFocus = true,
  } = options;

  // Validate and normalize query parameters
  let validatedParams: QueryParams = { sort: "new" };
  if (params) {
    try {
      validatedParams = querySchema.parse(params);
    } catch (error) {
      console.error("Invalid query parameters:", error);
      // Fall back to defaults
    }
  }

  // Build canonical URL key
  const key = shouldFetch ? buildPostsKey(validatedParams) : null;

  // Fetch data using SWR with canonical key
  const { data, error, isLoading, isValidating, mutate } = useSWR<PostsResponse, FetchError>(
    key,
    postsFetcher,
    {
      revalidateIfStale: true,
      revalidateOnFocus: revalidateOnFocus,
      dedupingInterval,
      // Error retry strategy (bounded to respect latency budget)
      errorRetryCount: 2,
      errorRetryInterval: 500,
      // Keep previous data while revalidating
      keepPreviousData: true,
    }
  );

  return {
    data,
    error,
    isLoading: isLoading && !data,
    isValidating,
    mutate,
  };
}

/**
 * Hook to manually trigger posts refresh
 */
export function usePostsRefresh(params?: Partial<QueryParams>): {
  refresh: () => Promise<void>;
  isRefreshing: boolean;
} {
  const key = buildPostsKey(querySchema.parse(params || {}));
  const { mutate } = useSWR<PostsResponse>(key, postsFetcher);

  return {
    refresh: async () => {
      await mutate();
    },
    isRefreshing: false, // Would track via SWR's isValidating in real impl
  };
}

/**
 * Hook to verify SSR/SWR parity
 * Compares SSR-rendered data with SWR-fetched data for consistency
 */
export function useSSRSWRParity(
  ssrData: PostsResponse | undefined,
  params?: Partial<QueryParams>
): {
  isParity: boolean;
  swrData?: PostsResponse;
  mismatch?: string;
} {
  const { data: swrData } = usePosts(params, { shouldFetch: !!ssrData });

  if (!ssrData || !swrData) {
    return { isParity: true }; // No data to compare
  }

  // Simple comparison: same post count and first post matches
  const countMatch = ssrData.posts.length === swrData.posts.length;
  const dataMatch =
    countMatch && (ssrData.posts.length === 0 || ssrData.posts[0]?.id === swrData.posts[0]?.id);

  if (!dataMatch) {
    return {
      isParity: false,
      swrData,
      mismatch: `SSR posts (${ssrData.posts.length}) don't match SWR posts (${swrData.posts.length})`,
    };
  }

  return { isParity: true, swrData };
}

export default usePosts;
