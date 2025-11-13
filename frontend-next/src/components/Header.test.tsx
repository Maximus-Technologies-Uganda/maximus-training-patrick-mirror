import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Header } from "./Header";

describe("Header", () => {
  it("renders the header element", () => {
    const { container } = render(<Header />);
    const header = container.querySelector("header");
    expect(header).toBeInTheDocument();
  });

  it("renders the site title link", () => {
    render(<Header />);
    const titleLink = screen.getByRole("link", { name: /Frontend Foundations/i });
    expect(titleLink).toBeInTheDocument();
    expect(titleLink).toHaveAttribute("href", "/");
  });

  it("renders navigation with aria-label", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: /Primary/i });
    expect(nav).toBeInTheDocument();
  });

  it("renders Posts link", () => {
    render(<Header />);
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

  it("applies correct CSS classes", () => {
    const { container } = render(<Header />);
    const header = container.querySelector("header");
    expect(header).toHaveClass("border-b", "border-text-muted/20", "bg-surface");
  });

  it("renders navigation list", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation");
    const list = nav.querySelector("ul");
    expect(list).toBeInTheDocument();
  });

  it("has correct structure with max-width container", () => {
    const { container } = render(<Header />);
    const div = container.querySelector("div.mx-auto");
    expect(div).toBeInTheDocument();
    expect(div).toHaveClass("max-w-5xl");
  });
});
