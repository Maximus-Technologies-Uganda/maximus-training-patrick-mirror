import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import PostsList from "../../../components/PostsList";
import type { Post } from "../../lib/schemas";

const mockPosts: Post[] = [
  {
    id: "post-1",
    title: "Test Post 1",
    content: "This is test post 1 content",
    published: true,
    createdAt: "2025-10-24T10:00:00Z",
    updatedAt: "2025-10-24T10:00:00Z",
    ownerId: "user-123",
    tags: [],
  },
  {
    id: "post-2",
    title: "Test Post 2",
    content: "This is test post 2 content",
    published: true,
    createdAt: "2025-10-24T11:00:00Z",
    updatedAt: "2025-10-24T11:00:00Z",
    ownerId: "user-456",
    tags: [],
  },
];

describe("PostsList - T008: Auth-aware UI", () => {
  it("should hide Edit and Delete buttons when currentUserId is undefined (anonymous user)", () => {
    render(<PostsList items={mockPosts} currentUserId={undefined} />);

    // Verify posts are visible
    expect(screen.getByText("Test Post 1")).toBeInTheDocument();
    expect(screen.getByText("Test Post 2")).toBeInTheDocument();

    // Verify Edit and Delete buttons are NOT in the DOM
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("should show Edit and Delete buttons only for posts owned by currentUserId", () => {
    render(<PostsList items={mockPosts} currentUserId="user-123" />);

    // Get all Edit and Delete buttons
    const editButtons = screen.queryAllByRole("button", { name: /edit/i });
    const deleteButtons = screen.queryAllByRole("button", { name: /delete/i });

    // Should only have 1 Edit and 1 Delete button (for post-1 owned by user-123)
    expect(editButtons).toHaveLength(1);
    expect(deleteButtons).toHaveLength(1);
  });

  it("should hide mutation controls for posts without ownerId", () => {
    const postsWithoutOwner: Post[] = [
      {
        id: "post-3",
        title: "Post Without Owner",
        content: "Legacy post without owner",
        published: true,
        createdAt: "2025-10-24T09:00:00Z",
        updatedAt: "2025-10-24T09:00:00Z",
        ownerId: undefined,
        tags: [],
      },
    ];

    render(<PostsList items={postsWithoutOwner} currentUserId="user-123" />);

    // Post should be visible
    expect(screen.getByText("Post Without Owner")).toBeInTheDocument();

    // But mutation controls should NOT be visible (post has no ownerId)
    expect(screen.queryByRole("button", { name: /edit/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /delete/i })).not.toBeInTheDocument();
  });

  it("should render empty state when items array is empty", () => {
    render(<PostsList items={[]} currentUserId={undefined} />);

    expect(screen.getByText(/no posts yet/i)).toBeInTheDocument();
  });
});