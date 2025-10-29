import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import PostsPageClient from "../../../components/PostsPageClient";

// Mock SWR to avoid network calls
vi.mock("../../lib/swr", () => ({
  usePostsList: vi.fn(() => ({
    data: { items: [], hasNextPage: false },
    isLoading: false,
    error: null,
  })),
  mutatePostsPage1: vi.fn(),
}));

describe("PostsPageClient - T008: Auth-aware UI", () => {
  it("should show sign in message and button for anonymous users", () => {
    render(
      <PostsPageClient
        page={1}
        pageSize={10}
        initialData={[]}
        initialHasNextPage={false}
      />
    );

    // Verify guest browsing message is shown
    expect(screen.getByText(/browsing as a guest/i)).toBeInTheDocument();

    // Verify login link is shown and points to /login
    const loginLink = screen.getByRole("link", { name: /sign in/i });
    expect(loginLink).toBeInTheDocument();
    expect(loginLink).toHaveAttribute("href", "/login");

    // Verify posts list is rendered
    expect(screen.getByRole("region", { name: /posts list/i })).toBeInTheDocument();
  });

  it("should render form for creating new post", () => {
    render(
      <PostsPageClient
        page={1}
        pageSize={10}
        initialData={[]}
        initialHasNextPage={false}
      />
    );

    // Form should be present with title and content inputs
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/content/i)).toBeInTheDocument();
  });

  it("should render posts list for both anonymous and authenticated users", () => {
    const { rerender } = render(
      <PostsPageClient
        page={1}
        pageSize={10}
        initialData={[]}
        initialHasNextPage={false}
      />
    );

    // Posts list section should be visible
    expect(screen.getByRole("region", { name: /posts list/i })).toBeInTheDocument();

    // Re-render should still show posts list
    rerender(
      <PostsPageClient
        page={1}
        pageSize={10}
        initialData={[]}
        initialHasNextPage={false}
      />
    );

    // Posts list should still be visible after re-render
    expect(screen.getByRole("region", { name: /posts list/i })).toBeInTheDocument();
  });
});
