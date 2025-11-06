import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PaginationControls } from "../../src/components/PaginationControls";

describe("PaginationControls", () => {
  it("renders the current page indicator", () => {
    render(
      <PaginationControls currentPage={3} totalPages={7} onPrevious={vi.fn()} onNext={vi.fn()} />
    );

    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByText("Page 3 of 7")).toHaveAttribute("aria-current", "page");
  });

  it("disables Previous button on the first page", async () => {
    const user = userEvent.setup();
    const handlePrevious = vi.fn();
    render(
      <PaginationControls
        currentPage={1}
        totalPages={4}
        onPrevious={handlePrevious}
        onNext={vi.fn()}
      />
    );

    const previousButton = screen.getByRole("button", { name: /previous/i });
    expect(previousButton).toBeDisabled();

    await user.click(previousButton);
    expect(handlePrevious).not.toHaveBeenCalled();
  });

  it("disables Next button on the last page", async () => {
    const user = userEvent.setup();
    const handleNext = vi.fn();
    render(
      <PaginationControls currentPage={5} totalPages={5} onPrevious={vi.fn()} onNext={handleNext} />
    );

    const nextButton = screen.getByRole("button", { name: /next/i });
    expect(nextButton).toBeDisabled();

    await user.click(nextButton);
    expect(handleNext).not.toHaveBeenCalled();
  });

  it("invokes callbacks when navigation buttons are pressed", async () => {
    const user = userEvent.setup();
    const handlePrevious = vi.fn();
    const handleNext = vi.fn();

    render(
      <PaginationControls
        currentPage={2}
        totalPages={3}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    );

    await user.click(screen.getByRole("button", { name: /previous/i }));
    await user.click(screen.getByRole("button", { name: /next/i }));

    expect(handlePrevious).toHaveBeenCalledTimes(1);
    expect(handleNext).toHaveBeenCalledTimes(1);
  });

  it("merges provided className", () => {
    render(
      <PaginationControls
        currentPage={1}
        totalPages={2}
        onPrevious={vi.fn()}
        onNext={vi.fn()}
        className="test-class"
      />
    );

    expect(screen.getByRole("navigation", { name: "Pagination" })).toHaveClass("test-class");
  });

  it("disables navigation when currentPage exceeds totalPages", () => {
    render(
      <PaginationControls currentPage={10} totalPages={5} onPrevious={vi.fn()} onNext={vi.fn()} />
    );

    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });
});
