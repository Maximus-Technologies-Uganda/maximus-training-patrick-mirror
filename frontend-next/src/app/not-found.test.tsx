import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import NotFound from "./not-found";

describe("NotFound", () => {
  it("renders 404 heading", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: /404/i })).toBeInTheDocument();
  });

  it("renders not found message", () => {
    render(<NotFound />);
    expect(screen.getByText(/The page you are looking for does not exist/i)).toBeInTheDocument();
  });

  it("renders link to posts page", () => {
    render(<NotFound />);
    const link = screen.getByRole("link", { name: /\/posts/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/posts");
  });

  it("renders main element with padding", () => {
    const { container } = render(<NotFound />);
    const main = container.querySelector("main");
    expect(main).toBeInTheDocument();
    expect(main).toHaveStyle({ padding: "2rem" });
  });
});
