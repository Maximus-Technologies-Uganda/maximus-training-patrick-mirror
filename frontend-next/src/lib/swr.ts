import useSWR, { mutate, type KeyedMutator } from "swr";
// zod imported elsewhere; no direct use here

import { getBaseUrl } from "./config";
import { DEFAULT_POST_SORT, PostListSchema, type PostList, type PostSort } from "./schemas";

// Removed unused fetchJson helper

function normalizeQuery(value: string | undefined): string {
  return value ? value.trim() : "";
}

// SWR key builder
function postsListKey(page: number, pageSize: number, sort: PostSort, query: string): string {
  // Route Handler serves at /api/posts to avoid exposing service endpoints to the client
  const base = typeof window === "undefined" ? getBaseUrl() : "";
  const path = "/api/posts"; // client uses relative URL; server can still compute absolute
  const url = new URL(path, base || "http://localhost");
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("sort", sort);
  if (query) {
    url.searchParams.set("q", query);
  }
  // If base is empty (browser), return relative path; otherwise absolute for SSR
  return base ? url.toString() : `${path}?${url.searchParams.toString()}`;
}

export function usePostsList(params?: {
  page?: number;
  pageSize?: number;
  sort?: PostSort;
  q?: string;
  fallbackData?: PostList;
  revalidateOnMount?: boolean;
}): {
  data: PostList | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  mutate: KeyedMutator<PostList>;
} {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const sort = params?.sort ?? DEFAULT_POST_SORT;
  const query = normalizeQuery(params?.q);
  const key = postsListKey(page, pageSize, sort, query);
  const {
    data,
    isLoading,
    isValidating,
    error,
    mutate: mutateList,
  } = useSWR<PostList>(
    key,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) {
        const message = res.status === 401 ? "Unauthorized" : `Request failed with ${res.status}`;
        const error = new Error(message) as Error & { status?: number };
        error.status = res.status;
        throw error;
      }
      const json = (await res.json()) as unknown;
      const normalizedJson: unknown = Array.isArray(json)
        ? {
            page,
            pageSize,
            hasNextPage: json.length >= pageSize,
            items: json,
            sort,
          }
        : json;
      const parsed = PostListSchema.safeParse(normalizedJson);
      if (!parsed.success) {
        throw new Error("Response validation failed");
      }
      return parsed.data;
    },
    {
      fallbackData: params?.fallbackData,
      revalidateOnMount: params?.revalidateOnMount ?? (params?.fallbackData ? false : true),
      revalidateIfStale: false,
      dedupingInterval: 0,
      shouldRetryOnError: false,
    }
  );
  return { data, isLoading, isValidating: Boolean(isValidating), error, mutate: mutateList };
}

/**
 * Refresh the first page of posts using the active pagination cache key.
 *
 * The parameters must match the key generated inside `usePostsList`; otherwise
 * the mutation will target the default sort/query and leave the visible list
 * stale when a user is filtering.
 */
export async function mutatePostsPage1(
  pageSize: number = 10,
  sort: PostSort = DEFAULT_POST_SORT,
  q: string = ""
): Promise<void> {
  await mutate(postsListKey(1, pageSize, sort, normalizeQuery(q)));
}
