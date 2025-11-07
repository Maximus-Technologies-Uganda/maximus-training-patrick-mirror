import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";

vi.mock("../../src/lib/swr", async () => {
  const actual = await vi.importActual<typeof import("../../src/lib/swr")>("../../src/lib/swr");
  return actual;
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import PostsPageClient from "../../src/components/PostsPageClient";
import { DEFAULT_POST_SORT, type Post } from "../../src/lib/schemas";

function buildPost(index: number): Post {
  const createdAt = new Date(2024, 0, index).toISOString();
  return {
    id: `post-${index}`,
    title: `Post ${index}`,
    content: `Post content ${index}`,
    published: true,
    createdAt,
    updatedAt: createdAt,
    ownerId: `owner-${index}`,
    tags: [],
  };
}

function createJsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

describe("Posts state transitions", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  let originalFetch: typeof window.fetch | undefined;

  const defaultProps = {
    page: 1,
    pageSize: 10,
    sort: DEFAULT_POST_SORT,
  } satisfies Parameters<typeof PostsPageClient>[0];

  const renderComponent = async (override?: Partial<typeof defaultProps>): Promise<void> => {
    await act(async () => {
      render(<PostsPageClient {...defaultProps} {...override} />);
    });
  };

  beforeEach(() => {
    originalFetch = window.fetch;
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
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

  it("shows loading state before rendering empty state with polite live announcement", async () => {
    let resolveFetch: ((value: Response) => void) | undefined;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        })
    );

    await renderComponent();

    await waitFor(() => {
      expect(screen.getAllByText(/Loading posts/)).toHaveLength(2);
    });

    await act(async () => {
      resolveFetch?.(
        createJsonResponse({
          page: 1,
          pageSize: 10,
          hasNextPage: false,
          items: [],
          total: 0,
          sort: DEFAULT_POST_SORT,
        })
      );
    });

    await waitFor(() => expect(screen.getByText("No posts yet")).toBeInTheDocument());

    const [politeRegion, assertiveRegion] = screen.getAllByRole("status");
    expect(politeRegion).toHaveAttribute("aria-live", "polite");
    expect(politeRegion).toHaveTextContent("No posts available");
    expect(assertiveRegion).toBeEmptyDOMElement();
  });

  it("renders error state with assertive announcement and retries successfully", async () => {
    const user = userEvent.setup();
    const post = buildPost(1);

    fetchMock.mockResolvedValueOnce(
      new Response("Server error", {
        status: 500,
        headers: { "Content-Type": "text/plain" },
      })
    );

    let resolveRetry: ((value: Response) => void) | undefined;
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveRetry = resolve;
        })
    );

    await renderComponent();

    const errorHeading = await screen.findByRole("heading", {
      level: 2,
      name: "Error loading posts",
    });
    expect(errorHeading).toBeInTheDocument();

    const [politeRegion, assertiveRegion] = screen.getAllByRole("status");
    expect(assertiveRegion).toHaveAttribute("aria-live", "assertive");
    expect(assertiveRegion).toHaveTextContent("Error loading posts");
    expect(politeRegion).toBeEmptyDOMElement();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /retry/i }));
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    await waitFor(() => {
      expect(screen.getAllByText(/Loading posts/)).toHaveLength(2);
    });

    await act(async () => {
      resolveRetry?.(
        createJsonResponse({
          page: 1,
          pageSize: 10,
          hasNextPage: false,
          items: [post],
          total: 1,
          sort: DEFAULT_POST_SORT,
        })
      );
    });

    await waitFor(() => expect(screen.getByText(post.title)).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());

    await waitFor(() => {
      const regions = screen.getAllByRole("status");
      expect(regions[1]).toBeEmptyDOMElement();
      expect(regions[0]).toHaveTextContent(/Showing page 1 of/);
    });
  });
});
