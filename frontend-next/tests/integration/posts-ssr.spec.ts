import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import PostsPage from "../../src/app/posts/page";
import { DEFAULT_POST_SORT, type Post } from "../../src/lib/schemas";

function buildPost(id: number, overrides: Partial<Post> = {}): Post {
  return {
    id: `post-${id}`,
    title: `Server Rendered Post ${id}`,
    content: `Server-rendered content ${id}`,
    published: true,
    createdAt: new Date(2024, 0, id).toISOString(),
    updatedAt: new Date(2024, 0, id, 1).toISOString(),
    ownerId: `owner-${id}`,
    tags: [],
    ...overrides,
  };
}

function createJsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function withServerEnv<T>(callback: () => Promise<T>): Promise<T> {
  const globalRef = globalThis as { window?: unknown };
  const originalWindow = globalRef.window;
  try {
    delete globalRef.window;
    return await callback();
  } finally {
    if (originalWindow !== undefined) {
      globalRef.window = originalWindow;
    } else {
      delete globalRef.window;
    }
  }
}

describe("Posts SSR Integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders posts in the server HTML without showing the loading state", async () => {
    const serverPosts = [
      buildPost(1, { title: "Alpha Post" }),
      buildPost(2, { title: "Beta Post" }),
    ];
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      createJsonResponse({
        items: serverPosts,
        hasNextPage: false,
        sort: "title-asc",
      })
    );

    const { html, initialData } = await withServerEnv(async () => {
      const element = await PostsPage({ searchParams: Promise.resolve({ sort: "title-asc" }) });
      const clientProps = element.props as { initialData?: Post[] };
      return { html: renderToStaticMarkup(element), initialData: clientProps.initialData };
    });

    expect(initialData?.length).toBe(serverPosts.length);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("sort=title-asc"),
      expect.objectContaining({ cache: "no-store" })
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("pageSize=11"),
      expect.any(Object)
    );

    expect(html).toContain("Alpha Post");
    expect(html).toContain("Beta Post");
    expect(html).not.toContain("Loading…");
    expect(html).toMatchInlineSnapshot(
      `"<main class="mx-auto max-w-3xl bg-surface p-4 text-text"><div role="status" aria-live="polite" class="sr-only"></div><h1 tabindex="-1" class="text-2xl font-bold text-text">Posts</h1><div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><label class="text-sm text-gray-700">Page size<select aria-label="Page size" class="ml-2 rounded border border-gray-300 px-2 py-1"><option value="5">5</option><option value="10" selected="">10</option><option value="20">20</option><option value="50">50</option></select></label><label class="text-sm text-text">Sort by<select class="ml-2 rounded border border-text-muted/40 px-2 py-1 text-sm text-text" aria-label="Sort posts"><option value="date-desc">Newest First</option><option value="date-asc">Oldest First</option><option value="title-desc">Title (Z-A)</option><option value="title-asc" selected="">Title (A-Z)</option></select></label><label class="block text-sm text-gray-700">Search<input aria-label="Search" class="mt-1 w-full rounded border border-gray-300 px-2 py-1" type="search" placeholder="Filter current page…" value=""/></label></div><div class="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" aria-live="polite"><p class="text-sm text-text-muted">You are browsing as a guest. Sign in to manage your posts.</p><a class="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1 text-sm font-medium text-surface transition hover:bg-primary/90" href="/login">Sign in</a></div><div class="mt-4"><form class="rounded border border-gray-200 p-4"><div class="grid gap-3 sm:grid-cols-2"><label class="block text-sm text-gray-700">Title<input aria-label="Title" class="mt-1 w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2" value=""/></label><label class="block text-sm text-gray-700 sm:col-span-2">Content<textarea aria-label="Content" class="mt-1 w-full rounded border border-gray-300 px-2 py-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"></textarea></label></div><div class="mt-3 flex justify-end"><button type="submit" class="rounded bg-blue-600 px-3 py-1 text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-600">Create</button></div></form></div><section class="mt-4" aria-label="Posts list"><ul role="list" class="space-y-4"><li class="rounded border border-gray-200 p-4 shadow-sm bg-white"><h3 class="text-lg font-semibold text-gray-900">Alpha Post</h3><p class="mt-2 text-gray-700">Server-rendered content 1</p><p class="mt-2 text-sm text-gray-500">Owned by Unknown</p><p class="mt-3 text-sm text-gray-500">You do not have permission to edit or delete this post.</p></li><li class="rounded border border-gray-200 p-4 shadow-sm bg-white"><h3 class="text-lg font-semibold text-gray-900">Beta Post</h3><p class="mt-2 text-gray-700">Server-rendered content 2</p><p class="mt-2 text-sm text-gray-500">Owned by Unknown</p><p class="mt-3 text-sm text-gray-500">You do not have permission to edit or delete this post.</p></li></ul></section><div class="mt-6 flex items-center gap-2"><button type="button" class="rounded bg-gray-100 px-3 py-1 text-gray-800 disabled:opacity-50" disabled="" aria-label="Previous page">Prev</button><span aria-live="polite" class="text-sm text-gray-600">Page 1</span><button type="button" class="rounded bg-gray-100 px-3 py-1 text-gray-800 disabled:opacity-50" disabled="" aria-label="Next page">Next</button></div></main>"`
    );
  });

  it("falls back to the default sort when the query parameter is invalid", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        createJsonResponse({ items: [], page: 1, pageSize: 11, hasNextPage: false })
      );

    await withServerEnv(async () => {
      await PostsPage({ searchParams: Promise.resolve({ sort: "not-a-real-sort" }) });
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining(`sort=${DEFAULT_POST_SORT}`),
      expect.any(Object)
    );
  });
});
