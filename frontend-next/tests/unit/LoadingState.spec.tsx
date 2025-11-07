import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { LoadingState } from "../../src/components/LoadingState";

describe("LoadingState", () => {
  it("announces loading progress politely", () => {
    render(<LoadingState message="Fetching posts" className="custom-class" />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(status).toHaveTextContent("Fetching posts");
    expect(status).toHaveClass("custom-class");
  });

  it("renders a default message when none is provided", () => {
    render(<LoadingState />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
