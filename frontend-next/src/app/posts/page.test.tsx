import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import PostsPage from "./page";
import { DEFAULT_POST_SORT } from "../../lib/schemas";

const fetchApiMock = vi.hoisted(() => vi.fn());
const fetchLocalPostsFallbackMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/fetchApi", () => ({
  fetchApi: fetchApiMock,
}));

vi.mock("@/server/fetchPostsFallback", () => ({
  fetchLocalPostsFallback: fetchLocalPostsFallbackMock,
}));

vi.mock("../../lib/swr", async () => {
  const actual = await vi.importActual<typeof import("../../lib/swr")>("../../lib/swr");
  return {
    ...actual,
    usePostsList: vi.fn(),
  };
});

describe("SSR PostsPage (server component)", () => {
  beforeEach(() => {
    fetchApiMock.mockReset();
    fetchLocalPostsFallbackMock.mockReset();
  });

  function expectLatestRequestUrl(): string {
    const lastCall = fetchApiMock.mock.calls.at(-1);
    expect(lastCall?.[0]).toBeTruthy();
    return String(lastCall?.[0]);
  }

  async function mockSWR(data: ReturnType<typeof import("../../lib/swr").usePostsList>["data"]) {
    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data,
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);
  }

  it("renders SSR posts without spinner and shows post title", async () => {
    const testPost = {
      id: "1",
      title: "My Test Post",
      content: "Test content",
      published: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };
    fetchApiMock.mockResolvedValue({
      items: [testPost],
      hasNextPage: false,
      page: 1,
      pageSize: 11,
      sort: DEFAULT_POST_SORT,
    });
    await mockSWR({
      items: [testPost],
      hasNextPage: false,
      page: 1,
      pageSize: 10,
      sort: DEFAULT_POST_SORT,
    });

    const el = await PostsPage({ searchParams: {} });
    render(el);
    expect(await screen.findByText("My Test Post")).toBeTruthy();
    const requestUrl = expectLatestRequestUrl();
    expect(requestUrl).toContain("pageSize=11");
    expect(requestUrl).toContain(`sort=${DEFAULT_POST_SORT}`);
  });

  it("handles pagination params correctly", async () => {
    fetchApiMock.mockResolvedValue({ items: [], hasNextPage: false });
    await mockSWR({
      items: [],
      hasNextPage: false,
      page: 2,
      pageSize: 20,
      sort: DEFAULT_POST_SORT,
    });

    const el = await PostsPage({
      searchParams: { page: "2", pageSize: "20" },
    });
    render(el);
    const requestUrl = expectLatestRequestUrl();
    expect(requestUrl).toContain("page=2");
    expect(requestUrl).toContain("pageSize=21");
  });

  it("handles search query param", async () => {
    fetchApiMock.mockResolvedValue({ items: [], hasNextPage: false });
    await mockSWR({
      items: [],
      hasNextPage: false,
      page: 1,
      pageSize: 10,
      sort: DEFAULT_POST_SORT,
    });

    const el = await PostsPage({
      searchParams: { q: "test query" },
    });
    render(el);
    const requestUrl = expectLatestRequestUrl();
    expect(requestUrl).toContain("q=test+query");
  });

  it("handles sort param", async () => {
    fetchApiMock.mockResolvedValue({ items: [], hasNextPage: false });
    await mockSWR({
      items: [],
      hasNextPage: false,
      page: 1,
      pageSize: 10,
      sort: "title-asc",
    });

    const el = await PostsPage({
      searchParams: { sort: "title-asc" },
    });
    render(el);
    const requestUrl = expectLatestRequestUrl();
    expect(requestUrl).toContain("sort=title-asc");
  });

  it("handles invalid sort param by using default", async () => {
    fetchApiMock.mockResolvedValue({ items: [], hasNextPage: false });
    await mockSWR({
      items: [],
      hasNextPage: false,
      page: 1,
      pageSize: 10,
      sort: DEFAULT_POST_SORT,
    });

    const el = await PostsPage({
      searchParams: { sort: "invalid-sort" },
    });
    render(el);
    const requestUrl = expectLatestRequestUrl();
    expect(requestUrl).toContain(`sort=${DEFAULT_POST_SORT}`);
  });

  it("handles fetch error gracefully", async () => {
    fetchApiMock.mockRejectedValue(new Error("Network error"));
    fetchLocalPostsFallbackMock.mockResolvedValue(null);
    await mockSWR({
      items: undefined,
      hasNextPage: false,
      page: 1,
      pageSize: 10,
      sort: DEFAULT_POST_SORT,
    });

    const el = await PostsPage({ searchParams: {} });
    render(el);
    expect(el).toBeTruthy();
  });

  it("handles non-ok response", async () => {
    fetchApiMock.mockRejectedValue(new Error("Upstream 500"));
    fetchLocalPostsFallbackMock.mockResolvedValue(null);
    await mockSWR({
      items: undefined,
      hasNextPage: false,
      page: 1,
      pageSize: 10,
      sort: DEFAULT_POST_SORT,
    });

    const el = await PostsPage({ searchParams: {} });
    render(el);
    expect(el).toBeTruthy();
  });

  it("handles array response format", async () => {
    const testPost = {
      id: "1",
      title: "Test Post",
      content: "Content",
      published: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };
    fetchApiMock.mockResolvedValue([testPost, testPost]);
    await mockSWR({
      items: [testPost],
      hasNextPage: true,
      page: 1,
      pageSize: 10,
      sort: DEFAULT_POST_SORT,
    });

    const el = await PostsPage({ searchParams: {} });
    render(el);
    expect(el).toBeTruthy();
  });

  it("handles object response with items array", async () => {
    const testPost = {
      id: "1",
      title: "Test Post",
      content: "Content",
      published: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };
    fetchApiMock.mockResolvedValue({
      items: [testPost],
      hasNextPage: true,
    });
    await mockSWR({
      items: [testPost],
      hasNextPage: true,
      page: 1,
      pageSize: 10,
      sort: DEFAULT_POST_SORT,
    });

    const el = await PostsPage({ searchParams: {} });
    render(el);
    expect(el).toBeTruthy();
  });

  it("handles missing searchParams", async () => {
    fetchApiMock.mockResolvedValue({ items: [], hasNextPage: false });
    await mockSWR({
      items: [],
      hasNextPage: false,
      page: 1,
      pageSize: 10,
      sort: DEFAULT_POST_SORT,
    });

    const el = await PostsPage({});
    render(el);
    expect(el).toBeTruthy();
  });
});
