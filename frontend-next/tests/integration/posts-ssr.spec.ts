import { afterEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_POST_SORT, type Post } from "../../src/lib/schemas";

const fetchApiMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/fetchApi", () => ({
  fetchApi: fetchApiMock,
}));

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

describe("Posts SSR Integration", () => {
  afterEach(() => {
    fetchApiMock.mockReset();
  });

  it("renders posts in the server HTML without showing the loading state", async () => {
    const serverPosts = [
      buildPost(1, { title: "Alpha Post" }),
      buildPost(2, { title: "Beta Post" }),
    ];
    fetchApiMock.mockResolvedValueOnce({
      items: serverPosts,
      page: 1,
      pageSize: 10,
      hasNextPage: false,
      sort: "title-asc",
    });

    const PostsPage = (await import("../../src/app/posts/page")).default;
    const element = await PostsPage({ searchParams: { sort: "title-asc" } });
    const clientProps = element.props as {
      initialData?: Post[];
      page?: number;
      sort?: string;
      pageSize?: number;
      initialHasNextPage?: boolean;
    };

    const [[requestUrl]] = fetchApiMock.mock.calls;
    expect(requestUrl).toContain("sort=title-asc");
    expect(requestUrl).toContain("pageSize=11");

    expect(clientProps.initialData).toEqual(serverPosts);
    expect(clientProps.page).toBe(1);
    expect(clientProps.sort).toBe("title-asc");
    expect(clientProps.pageSize).toBe(10);
    expect(clientProps.initialHasNextPage).toBe(false);
  });

  it("falls back to the default sort when the query parameter is invalid", async () => {
    fetchApiMock.mockResolvedValueOnce({ items: [], hasNextPage: false });

    const PostsPage2 = (await import("../../src/app/posts/page")).default;
    await PostsPage2({ searchParams: { sort: "not-a-real-sort" } });

    const [[requestUrl]] = fetchApiMock.mock.calls;
    expect(requestUrl).toContain(`sort=${DEFAULT_POST_SORT}`);
  });
});
