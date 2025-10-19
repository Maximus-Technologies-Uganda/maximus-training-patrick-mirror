import useSWR, { mutate } from "swr";
// zod imported elsewhere; no direct use here

import { getBaseUrl } from "./config";
import { PostListSchema, type PostList } from "./schemas";

// Removed unused fetchJson helper

// SWR key builder
function postsListKey(page: number, pageSize: number): string {
  // Route Handler serves at /api/posts to avoid exposing service endpoints to the client
  const base = typeof window === "undefined" ? getBaseUrl() : "";
  const path = "/api/posts"; // client uses relative URL; server can still compute absolute
  const url = new URL(path, base || "http://localhost");
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));
  // If base is empty (browser), return relative path; otherwise absolute for SSR
  return base ? url.toString() : `${path}?${url.searchParams.toString()}`;
}

export function usePostsList(params?: {
  page?: number;
  pageSize?: number;
}): { data: PostList | undefined; isLoading: boolean; error: unknown } {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const key = postsListKey(page, pageSize);
  const { data, isLoading, error } = useSWR<PostList>(
    key,
    async (url) => {
      const res = await fetch(url);
      if (res.status === 401) {
        // Treat unauthorized as an empty list for guests
        return { page, pageSize, hasNextPage: false, items: [] } as PostList;
      }
      if (!res.ok) {
        const message = `Request failed with ${res.status}`;
        throw new Error(message);
      }
      const json = (await res.json()) as unknown;
      const parsed = PostListSchema.safeParse(json);
      if (!parsed.success) {
        throw new Error("Response validation failed");
      }
      return parsed.data;
    },
    {
      revalidateOnMount: true,
      revalidateIfStale: false,
      dedupingInterval: 0,
      shouldRetryOnError: false,
    },
  );
  return { data, isLoading, error };
}

// Helper to refresh the first page after creating a new post
export async function mutatePostsPage1(pageSize: number = 10): Promise<void> {
  await mutate(postsListKey(1, pageSize));
}


