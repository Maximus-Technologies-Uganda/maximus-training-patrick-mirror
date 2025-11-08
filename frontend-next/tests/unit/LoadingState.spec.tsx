import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { LoadingState } from "../../src/components/LoadingState";

describe("LoadingState", () => {
  it("renders a loading spinner with custom message", () => {
    render(<LoadingState message="Fetching posts" className="custom-class" />);

    const loadingContainer = screen.getByText("Fetching posts").closest("div");
    expect(loadingContainer).toHaveClass("custom-class");
    expect(screen.getByText("Fetching posts")).toBeInTheDocument();
  });

  it("renders a default message when none is provided", () => {
    render(<LoadingState />);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
