import React from "react";

import { z } from "zod";

import PostsPageClient from "@/components/PostsPageClient";
import { fetchApi } from "@/server/fetchApi";
import { fetchLocalPostsFallback } from "@/server/fetchPostsFallback";
import {
  DEFAULT_POST_SORT,
  PostSortSchema,
  type Post as SsrPost,
  type PostSort,
} from "@/lib/schemas";

export const dynamic = "force-dynamic";

type SearchParams = Record<string, string | string[] | undefined> | undefined;
type SearchParamsInput = SearchParams | Promise<SearchParams>;

const SortSchema = PostSortSchema.catch(DEFAULT_POST_SORT);

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  q: z.union([z.string(), z.array(z.string())]).optional(),
  sort: SortSchema.default(DEFAULT_POST_SORT),
});

type ParsedQuery = {
  page: number;
  pageSize: number;
  q: string;
  sort: PostSort;
};

type PostsPayload =
  | Array<Record<string, unknown>>
  | {
      items?: Array<Record<string, unknown>>;
      hasNextPage?: boolean;
    };

function toScalar(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[value.length - 1];
  }
  return value;
}

async function parseQuery(paramsInput: SearchParamsInput): Promise<ParsedQuery> {
  const params = await paramsInput;
  const parsed = QuerySchema.parse({
    page: params?.page,
    pageSize: params?.pageSize,
    q: params?.q,
    sort: params?.sort,
  });
  const q = toScalar(parsed.q)?.trim() ?? "";
  return {
    page: parsed.page,
    pageSize: parsed.pageSize,
    q,
    sort: parsed.sort,
  };
}

function ensureContent(value: Record<string, unknown>): SsrPost {
  const content =
    typeof value.content === "string"
      ? value.content
      : typeof value.body === "string"
        ? value.body
        : "";
  return { ...(value as SsrPost), content };
}

function normalizePayload(
  payload: unknown,
  pageSize: number
): {
  items?: SsrPost[];
  hasNextPage?: boolean;
} {
  if (Array.isArray(payload)) {
    const normalized = payload.map((item) => ensureContent(item ?? {}));
    return {
      items: normalized.slice(0, pageSize),
      hasNextPage: normalized.length > pageSize,
    };
  }
  if (payload && typeof payload === "object" && !Array.isArray(payload)) {
    const objectPayload = payload as {
      items?: Array<Record<string, unknown>>;
      hasNextPage?: boolean;
    };
    if (Array.isArray(objectPayload.items)) {
      const normalized = objectPayload.items.map((item) => ensureContent(item ?? {}));
      return {
        items: normalized.slice(0, pageSize),
        hasNextPage:
          typeof objectPayload.hasNextPage === "boolean"
            ? objectPayload.hasNextPage
            : normalized.length > pageSize,
      };
    }
  }
  return {};
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams?: SearchParamsInput;
}): Promise<React.ReactElement> {
  const query = await parseQuery(searchParams);
  const upstreamParams = new URLSearchParams();
  upstreamParams.set("page", String(query.page));
  const upstreamPageSize = Math.min(query.pageSize + 1, 100);
  upstreamParams.set("pageSize", String(upstreamPageSize));
  upstreamParams.set("sort", query.sort);
  if (query.q) {
    upstreamParams.set("q", query.q);
  }
  const fallbackParams = new URLSearchParams(upstreamParams);
  fallbackParams.set("pageSize", String(query.pageSize));

  let initialData: SsrPost[] | undefined;
  let initialHasNextPage: boolean | undefined;
  let initialDataSource: "upstream" | "local-fallback" | undefined;
  try {
    const data = await fetchApi<PostsPayload>(`/posts?${upstreamParams.toString()}`);
    const normalized = normalizePayload(data, query.pageSize);
    initialData = normalized.items;
    initialHasNextPage = normalized.hasNextPage;
    initialDataSource = "upstream";
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[posts] SSR fetch failed", error);
    }
    const fallback = await fetchLocalPostsFallback(fallbackParams, query.pageSize);
    if (fallback) {
      initialData = fallback.items;
      initialHasNextPage = fallback.hasNextPage;
      initialDataSource = fallback.source === "local-fallback" ? "local-fallback" : "upstream";
    }
  }

  return (
    <PostsPageClient
      page={query.page}
      pageSize={query.pageSize}
      q={query.q}
      sort={query.sort}
      initialData={initialData}
      initialHasNextPage={initialHasNextPage}
      initialDataSource={initialDataSource}
    />
  );
}
