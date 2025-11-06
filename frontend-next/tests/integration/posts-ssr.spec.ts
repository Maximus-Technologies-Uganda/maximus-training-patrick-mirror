import { afterEach, describe, expect, it, vi } from "vitest";

// PostsPage imports must be lazy inside tests so we can spy on global fetch
// before the module captures the runtime fetch implementation.
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

describe("Posts SSR Integration", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders posts in the server HTML without showing the loading state", async () => {
    const serverPosts = [
      buildPost(1, { title: "Alpha Post" }),
      buildPost(2, { title: "Beta Post" }),
    ];
    console.debug('[diag][posts-ssr] globalThis.fetch before spy ->', globalThis.fetch);
    console.debug('[diag][posts-ssr] typeof fetch ->', typeof globalThis.fetch);

    const fetchStub = vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      createJsonResponse({
        items: serverPosts,
        page: 1,
        pageSize: 10,
        hasNextPage: false,
        sort: "title-asc",
      })
    ));

  // Import PostsPage after spying on fetch so the module doesn't capture
  // a different fetch implementation at import-time.
  const PostsPage = (await import("../../src/app/posts/page")).default;
  const element = await PostsPage({ searchParams: Promise.resolve({ sort: "title-asc" }) });
    const clientProps = element.props as {
      initialData?: Post[];
      page?: number;
      sort?: string;
      pageSize?: number;
      initialHasNextPage?: boolean;
    };

    // Verify SSR data fetching
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("sort=title-asc"),
      expect.objectContaining({ cache: "no-store" })
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("pageSize=11"),
      expect.any(Object)
    );

    // Verify initialData is passed to client component
    expect(clientProps.initialData).toEqual(serverPosts);
    expect(clientProps.page).toBe(1);
    expect(clientProps.sort).toBe("title-asc");
    expect(clientProps.pageSize).toBe(10);
  });

  it("falls back to the default sort when the query parameter is invalid", async () => {
    const fetchStub2 = vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      createJsonResponse({ items: [], page: 1, pageSize: 11, hasNextPage: false })
    ));

    const PostsPage2 = (await import("../../src/app/posts/page")).default;
    await PostsPage2({ searchParams: Promise.resolve({ sort: "not-a-real-sort" }) });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining(`sort=${DEFAULT_POST_SORT}`),
      expect.any(Object)
    );
  });
});
