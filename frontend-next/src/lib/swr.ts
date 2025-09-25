import useSWR, { mutate } from "swr";
import { z } from "zod";

import { getBaseUrl } from "./config";
import { PostListSchema, type PostList } from "./schemas";

// Generic JSON fetcher with Zod validation
async function fetchJson<T>(url: string, schema: z.ZodType<T>): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const message = `Request failed with ${res.status}`;
    throw new Error(message);
  }
  const json = (await res.json()) as unknown;
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new Error("Response validation failed");
  }
  return parsed.data;
}

// SWR key builder
function postsListKey(page: number, pageSize: number): string {
  const base = getBaseUrl();
  return `${base}/posts?page=${page}&pageSize=${pageSize}`;
}

export function usePostsList(params?: {
  page?: number;
  pageSize?: number;
}): { data: PostList | undefined; isLoading: boolean; error: unknown } {
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 10;
  const key = postsListKey(page, pageSize);
  const { data, isLoading, error } = useSWR<PostList>(key, (url) =>
    fetchJson(url, PostListSchema),
  );
  return { data, isLoading, error };
}

// Helper to refresh the first page after creating a new post
export async function mutatePostsPage1(pageSize: number = 10): Promise<void> {
  await mutate(postsListKey(1, pageSize));
}


