/**
 * PostsFilters Component Tests
 * Basic component rendering and interaction tests for coverage
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";
import PostsFilters from "../../components/PostsFilters";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

describe("PostsFilters Component", () => {
  it("should render the form with all inputs", () => {
    render(<PostsFilters />);

    expect(screen.getByLabelText(/search posts/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/filter by author/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
  });

  it("should render apply and clear buttons", () => {
    render(<PostsFilters />);

    expect(screen.getByRole("button", { name: /apply filters/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /clear/i })).toBeInTheDocument();
  });

  it("should have initial values when provided", () => {
    const initialValues = { q: "test query", author: "alice", sort: "old" };
    render(<PostsFilters initialValues={initialValues} />);

    const queryInput = screen.getByLabelText(/search posts/i) as HTMLInputElement;
    const authorInput = screen.getByLabelText(/filter by author/i) as HTMLInputElement;
    const sortSelect = screen.getByLabelText(/sort by/i) as HTMLSelectElement;

    expect(queryInput.value).toBe("test query");
    expect(authorInput.value).toBe("alice");
    expect(sortSelect.value).toBe("old");
  });

  it("should be disabled when isLoading is true", () => {
    render(<PostsFilters isLoading={true} />);

    const fieldset = screen.getByRole("form", { hidden: true })?.querySelector("fieldset");
    expect(fieldset).toBeDisabled();
  });

  it("should display error message when provided", () => {
    const errorMsg = "Invalid filter values";
    render(<PostsFilters errorMessage={errorMsg} />);

    expect(screen.getByText(errorMsg)).toBeInTheDocument();
  });

  it("should update form values on input change", () => {
    render(<PostsFilters />);

    const queryInput = screen.getByLabelText(/search posts/i);
    fireEvent.change(queryInput, { target: { value: "new search" } });

    expect(queryInput).toHaveValue("new search");
  });

  it("should enforce max length on query input", () => {
    render(<PostsFilters />);

    const queryInput = screen.getByLabelText(/search posts/i) as HTMLInputElement;
    expect(queryInput.maxLength).toBe(64);
  });

  it("should enforce max length on author input", () => {
    render(<PostsFilters />);

    const authorInput = screen.getByLabelText(/filter by author/i) as HTMLInputElement;
    expect(authorInput.maxLength).toBe(32);
  });

  it("should have sort options available", () => {
    render(<PostsFilters />);

    const sortSelect = screen.getByLabelText(/sort by/i) as HTMLSelectElement;
    const options = Array.from(sortSelect.options).map((opt) => opt.value);

    expect(options).toContain("new");
    expect(options).toContain("old");
  });

  it("should call onFilter callback when provided", async () => {
    const mockCallback = vi.fn();
    render(<PostsFilters onFilter={mockCallback} initialValues={{ q: "test" }} />);

    const submitButton = screen.getByRole("button", { name: /apply filters/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  it("should have proper accessibility attributes", () => {
    render(<PostsFilters />);

    const form = screen.getByRole("form", { hidden: true });
    expect(form).toHaveAttribute("aria-label", "Posts filter form");
  });

  it("should display loading state message", () => {
    render(<PostsFilters isLoading={true} />);

    expect(screen.getByText(/filters are being applied/i)).toBeInTheDocument();
  });
});
