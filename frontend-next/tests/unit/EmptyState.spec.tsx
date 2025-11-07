import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { EmptyState } from "../../src/components/EmptyState";

describe("EmptyState", () => {
  it("renders provided title and message", () => {
    render(<EmptyState title="No posts" message="There are no posts yet." />);

    expect(screen.getByRole("heading", { level: 2, name: "No posts" })).toBeInTheDocument();
    expect(screen.getByText("There are no posts yet.")).toBeInTheDocument();
  });

  it("invokes action callback when provided", async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <EmptyState
        title="No posts"
        message="There are no posts yet."
        action={{ label: "Create post", onClick: handleClick }}
      />
    );

    const button = screen.getByRole("button", { name: "Create post" });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("omits action button when no action is provided", () => {
    render(<EmptyState title="No posts" message="There are no posts yet." />);

    expect(screen.queryByRole("button", { name: /create post/i })).toBeNull();
  });
});
