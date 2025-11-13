import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import Header from "@/components/Header";

describe("Header", () => {
  it("renders header element", () => {
    const { container } = render(<Header />);
    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("renders site title link", () => {
    render(<Header />);
    const titleLink = screen.getByRole("link", { name: /Frontend Foundations/i });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute("href", "/");
  });

  it("renders navigation with Posts link", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: /Primary/i });
    expect(nav).toBeInTheDocument();

    const postsLink = screen.getByRole("link", { name: /Posts/i });
    expect(postsLink).toBeInTheDocument();
    expect(postsLink).toHaveAttribute("href", "/posts");
  });

  it("renders About link", () => {
    render(<Header />);
    const aboutLink = screen.getByRole("link", { name: /About/i });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  it("has proper accessibility attributes", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: /Primary/i });
    expect(nav).toHaveAttribute("aria-label", "Primary");
  });
});
