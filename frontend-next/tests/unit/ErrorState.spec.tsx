import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ErrorState } from "../../src/components/ErrorState";

describe("ErrorState", () => {
  it("announces errors assertively", () => {
    render(<ErrorState title="Error loading posts" message="Request failed" />);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent("Error loading posts");
    expect(alert).toHaveTextContent("Request failed");
  });

  it("calls onRetry when provided", async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    render(
      <ErrorState title="Error loading posts" message="Request failed" onRetry={handleRetry} />
    );

    await user.click(screen.getByRole("button", { name: /retry/i }));

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it("omits retry button when callback is not provided", () => {
    render(<ErrorState title="Error loading posts" message="Request failed" />);

    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
  });
});
