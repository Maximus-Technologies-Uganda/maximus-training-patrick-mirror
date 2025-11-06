import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";

vi.mock("../../src/lib/swr", async () => {
  const actual = await vi.importActual<typeof import("../../src/lib/swr")>("../../src/lib/swr");
  return actual;
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PostsPageClient from "../../src/components/PostsPageClient";
import {
  DEFAULT_POST_SORT,
  POST_SORT_VALUES,
  type Post,
  type PostSort,
} from "../../src/lib/schemas";

const ALL_SORTS = new Set<PostSort>(POST_SORT_VALUES);

function buildPost(index: number): Post {
  const createdAt = new Date(2024, 0, index).toISOString();
  return {
    id: `post-${index}`,
    title: `Post ${String(index).padStart(2, "0")}`,
    content: `Post content ${index}`,
    published: true,
    createdAt,
    updatedAt: createdAt,
    ownerId: `owner-${index}`,
    tags: [],
  };
}

const ALL_POSTS: Post[] = Array.from({ length: 20 }, (_, idx) => buildPost(idx + 1));
const PAGE_SIZE = 10;

function sortPosts(posts: Post[], sort: PostSort): Post[] {
  const copy = posts.slice();
  switch (sort) {
    case "date-asc":
      copy.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case "title-asc":
      copy.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
      break;
    case "title-desc":
      copy.sort((a, b) => b.title.localeCompare(a.title, undefined, { sensitivity: "base" }));
      break;
    case "date-desc":
    default:
      copy.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
  }
  return copy;
}

const DEFAULT_ITEMS = sortPosts(ALL_POSTS, DEFAULT_POST_SORT).slice(0, PAGE_SIZE);

function createJsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Posts Pagination Integration", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalFetch: typeof window.fetch | undefined;

  beforeEach(() => {
    originalFetch = window.fetch;
    fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(requestUrl, "http://localhost");
      const pageParam = Number(url.searchParams.get("page") ?? "1");
      const pageSizeParam = Number(url.searchParams.get("pageSize") ?? String(PAGE_SIZE));
      const sortParam = url.searchParams.get("sort");
      const sort =
        sortParam && ALL_SORTS.has(sortParam as PostSort)
          ? (sortParam as PostSort)
          : DEFAULT_POST_SORT;

      const sorted = sortPosts(ALL_POSTS, sort);
      const start = Math.max(0, (pageParam - 1) * pageSizeParam);
      const items = sorted.slice(start, start + pageSizeParam);
      const hasNextPage = start + items.length < sorted.length;

      return createJsonResponse({
        page: pageParam,
        pageSize: pageSizeParam,
        hasNextPage,
        items,
        total: sorted.length,
        sort,
      });
    });

    vi.stubGlobal("fetch", fetchMock);
    // Ensure both global and window fetch references point to the stub for jsdom
    Object.defineProperty(window, "fetch", { value: fetchMock, configurable: true });
    window.history.replaceState({}, "", "/posts");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalFetch) {
      Object.defineProperty(window, "fetch", { value: originalFetch, configurable: true });
    } else {
      delete (window as { fetch?: typeof window.fetch }).fetch;
    }
    originalFetch = undefined;
    window.history.replaceState({}, "", "/posts");
  });

  const defaultProps = {
    page: 1,
    pageSize: PAGE_SIZE,
    sort: DEFAULT_POST_SORT,
  } satisfies Parameters<typeof PostsPageClient>[0];

  const renderComponent = async (override?: Partial<typeof defaultProps>): Promise<void> => {
    await act(async () => {
      render(<PostsPageClient {...defaultProps} {...override} />);
    });
  };

  it("navigates between pages with URL updates", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await screen.findByText(DEFAULT_ITEMS[0].title);

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /next/i }));
    });
    await waitFor(() => expect(window.location.search).toContain("page=2"));

    const secondPagePosts = sortPosts(ALL_POSTS, DEFAULT_POST_SORT).slice(PAGE_SIZE, PAGE_SIZE * 2);
    await waitFor(() => {
      expect(screen.getByText(secondPagePosts[0].title)).toBeInTheDocument();
    });

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /previous/i }));
    });
    await waitFor(() => expect(window.location.search).toContain("page=1"));
    await waitFor(() => {
      expect(screen.getByText(DEFAULT_ITEMS[0].title)).toBeInTheDocument();
    });
  });

  it("supports sort parameter in URL", async () => {
    const user = userEvent.setup();
    await renderComponent();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    await screen.findByText(DEFAULT_ITEMS[0].title);
    const sortSelect = screen.getByLabelText("Sort posts");

    await act(async () => {
      await user.selectOptions(sortSelect, "title-asc");
    });

    await waitFor(() => expect(window.location.search).toContain("sort=title-asc"));
    const sortedByTitle = sortPosts(ALL_POSTS, "title-asc");
    await waitFor(() => {
      expect(screen.getByText(sortedByTitle[0].title)).toBeInTheDocument();
    });
  });

  it("hydrates shared pagination and sort parameters from the URL", async () => {
    const user = userEvent.setup();
    const sortedByTitle = sortPosts(ALL_POSTS, "title-asc");
    const secondPage = sortedByTitle.slice(PAGE_SIZE, PAGE_SIZE * 2);

    window.history.replaceState({}, "", "/posts?page=2&sort=title-asc");

    await renderComponent();

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const sortSelect = await screen.findByLabelText("Sort posts");
    await waitFor(() => expect(sortSelect).toHaveValue("title-asc"));

    await waitFor(() => {
      expect(screen.getByText(secondPage[0].title)).toBeInTheDocument();
    });

    // Find the status region containing the page announcement (handles multiple status regions)
    await waitFor(() => {
      expect(screen.getByText(/Showing page 2 of/)).toBeInTheDocument();
    });

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /previous/i }));
    });
    await waitFor(() => expect(window.location.search).toContain("page=1"));
  });
});
