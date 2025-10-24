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
  it("should hide NewPostForm when currentUserId is undefined (anonymous user)", () => {
    render(
      <PostsPageClient
        page={1}
        pageSize={10}
        currentUserId={undefined}
        initialData={[]}
        initialHasNextPage={false}
      />
    );

    // Verify the NewPostForm is NOT rendered
    expect(screen.queryByRole("region", { name: /create new post/i })).not.toBeInTheDocument();

    // Verify the login link is shown instead
    expect(screen.getByText(/log in/i)).toBeInTheDocument();
    expect(screen.getByText(/to create a post/i)).toBeInTheDocument();
  });

  it("should show NewPostForm when currentUserId is defined (authenticated user)", () => {
    render(
      <PostsPageClient
        page={1}
        pageSize={10}
        currentUserId="user-123"
        initialData={[]}
        initialHasNextPage={false}
      />
    );

    // Verify the NewPostForm IS rendered
    expect(screen.getByRole("region", { name: /create new post/i })).toBeInTheDocument();

    // Verify the login link is NOT shown
    expect(screen.queryByText(/log in/i)).not.toBeInTheDocument();
  });

  it("should render posts list for both anonymous and authenticated users", () => {
    const { rerender } = render(
      <PostsPageClient
        page={1}
        pageSize={10}
        currentUserId={undefined}
        initialData={[]}
        initialHasNextPage={false}
      />
    );

    // Posts list section should be visible for anonymous users
    expect(screen.getByRole("region", { name: /posts list/i })).toBeInTheDocument();

    // Re-render with authenticated user
    rerender(
      <PostsPageClient
        page={1}
        pageSize={10}
        currentUserId="user-123"
        initialData={[]}
        initialHasNextPage={false}
      />
    );

    // Posts list should still be visible for authenticated users
    expect(screen.getByRole("region", { name: /posts list/i })).toBeInTheDocument();
  });
});