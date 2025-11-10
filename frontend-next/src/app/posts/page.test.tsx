import { render, screen } from "@testing-library/react";
import * as nextHeaders from "next/headers";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PostsPage from "./page";
import { DEFAULT_POST_SORT } from "../../lib/schemas";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("../../lib/swr", async () => {
  const actual = await vi.importActual<typeof import("../../lib/swr")>("../../lib/swr");
  return {
    ...actual,
    usePostsList: vi.fn(),
  };
});

describe("SSR PostsPage (server component)", () => {
  beforeEach(() => {
    (
      nextHeaders as unknown as { cookies: { mockReturnValue: (v: unknown) => void } }
    ).cookies.mockReturnValue({
      get: vi.fn(() => undefined),
    });
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("renders SSR posts without spinner and shows post title", async () => {
    const testPost = {
      id: "1",
      title: "My Test Post",
      content: "Test content",
      published: true,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };
    console.debug("[diag][page.test] globalThis.fetch before stub ->", globalThis.fetch);
    console.debug("[diag][page.test] typeof fetch ->", typeof globalThis.fetch);

    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [testPost],
        hasNextPage: false,
        page: 1,
        pageSize: 11,
        sort: DEFAULT_POST_SORT,
      }),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    // Mock SWR to return the test post data
    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: {
        items: [testPost],
        hasNextPage: false,
        page: 1,
        pageSize: 10,
        sort: DEFAULT_POST_SORT,
      },
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({ searchParams: Promise.resolve({}) });
    render(el);
    expect(await screen.findByText("My Test Post")).toBeInTheDocument();
    expect(fetchFn).toHaveBeenCalledWith(
      `https://example.test/api/posts?page=1&pageSize=11&sort=${DEFAULT_POST_SORT}`,
      expect.objectContaining({ headers: {}, cache: "no-store" })
    );
  });

  it("handles pagination params correctly", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: { items: [], hasNextPage: false, page: 2, pageSize: 20, sort: DEFAULT_POST_SORT },
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({
      searchParams: Promise.resolve({ page: "2", pageSize: "20" }),
    });
    render(el);

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining("page=2&pageSize=21"),
      expect.any(Object)
    );
  });

  it("handles search query param", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: { items: [], hasNextPage: false, page: 1, pageSize: 10, sort: DEFAULT_POST_SORT },
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({
      searchParams: Promise.resolve({ q: "test query" }),
    });
    render(el);

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining("q=test+query"),
      expect.any(Object)
    );
  });

  it("handles sort param", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: { items: [], hasNextPage: false, page: 1, pageSize: 10, sort: "title-asc" },
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({
      searchParams: Promise.resolve({ sort: "title-asc" }),
    });
    render(el);

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining("sort=title-asc"),
      expect.any(Object)
    );
  });

  it("handles invalid sort param by using default", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: { items: [], hasNextPage: false, page: 1, pageSize: 10, sort: DEFAULT_POST_SORT },
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({
      searchParams: Promise.resolve({ sort: "invalid-sort" }),
    });
    render(el);

    expect(fetchFn).toHaveBeenCalledWith(
      expect.stringContaining(`sort=${DEFAULT_POST_SORT}`),
      expect.any(Object)
    );
  });

  it("handles fetch error gracefully", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("Network error"));
    vi.stubGlobal("fetch", fetchFn);

    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: undefined,
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({ searchParams: Promise.resolve({}) });
    render(el);
    // Should render without crashing
    expect(el).toBeTruthy();
  });

  it("handles non-ok response", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: undefined,
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({ searchParams: Promise.resolve({}) });
    render(el);
    // Should render without crashing
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

    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [testPost, testPost], // Array format
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: {
        items: [testPost],
        hasNextPage: true,
        page: 1,
        pageSize: 10,
        sort: DEFAULT_POST_SORT,
      },
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({ searchParams: Promise.resolve({}) });
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

    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [testPost],
        hasNextPage: true,
      }),
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: {
        items: [testPost],
        hasNextPage: true,
        page: 1,
        pageSize: 10,
        sort: DEFAULT_POST_SORT,
      },
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({ searchParams: Promise.resolve({}) });
    render(el);
    expect(el).toBeTruthy();
  });

  it("handles missing searchParams", async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [],
    } as unknown as Response);
    vi.stubGlobal("fetch", fetchFn);

    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: { items: [], hasNextPage: false, page: 1, pageSize: 10, sort: DEFAULT_POST_SORT },
      isLoading: false,
      isValidating: false,
      error: null,
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({});
    render(el);
    expect(el).toBeTruthy();
  });
});
