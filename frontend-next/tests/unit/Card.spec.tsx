import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card } from "../../src/components/Card";

describe("Card", () => {
  describe("Rendering", () => {
    it("renders children", () => {
      render(<Card>Content</Card>);
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<Card className="custom-card">Content</Card>);
      const card = screen.getByText("Content").closest("div");
      expect(card?.parentElement).toHaveClass("custom-card");
    });

    it("applies base styles", () => {
      render(<Card>Content</Card>);
      const card = screen.getByText("Content").closest("div")?.parentElement;
      expect(card).toHaveClass("bg-surface");
      expect(card).toHaveClass("border-2");
      expect(card).toHaveClass("rounded-lg");
    });
  });

  describe("Header", () => {
    it("renders header when provided", () => {
      render(<Card header={<h2>Card Title</h2>}>Content</Card>);
      expect(screen.getByText("Card Title")).toBeInTheDocument();
    });

    it("does not render header section when not provided", () => {
      const { container } = render(<Card>Content</Card>);
      const headerSections = container.querySelectorAll(".border-b");
      expect(headerSections.length).toBe(0);
    });

    it("renders header with string", () => {
      render(<Card header="Simple Header">Content</Card>);
      expect(screen.getByText("Simple Header")).toBeInTheDocument();
    });

    it("renders header with complex content", () => {
      render(
        <Card
          header={
            <div>
              <h2>Title</h2>
              <p>Subtitle</p>
            </div>
          }
        >
          Content
        </Card>
      );
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Subtitle")).toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("renders footer when provided", () => {
      render(<Card footer={<button>Action</button>}>Content</Card>);
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("does not render footer section when not provided", () => {
      const { container } = render(<Card>Content</Card>);
      const footerSections = container.querySelectorAll(".border-t");
      expect(footerSections.length).toBe(0);
    });

    it("renders footer with string", () => {
      render(<Card footer="Footer text">Content</Card>);
      expect(screen.getByText("Footer text")).toBeInTheDocument();
    });

    it("renders footer with complex content", () => {
      render(
        <Card
          footer={
            <div>
              <button>Save</button>
              <button>Cancel</button>
            </div>
          }
        >
          Content
        </Card>
      );
      expect(screen.getByText("Save")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  describe("Complete Card", () => {
    it("renders header, body, and footer together", () => {
      render(
        <Card header="Header" footer="Footer">
          Body Content
        </Card>
      );
      expect(screen.getByText("Header")).toBeInTheDocument();
      expect(screen.getByText("Body Content")).toBeInTheDocument();
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("maintains correct section order", () => {
      const { container } = render(
        <Card header="Header" footer="Footer">
          Body
        </Card>
      );
      // Get the card's direct children
      const card = container.firstChild as HTMLElement;
      const sections = Array.from(card.children);
      expect(sections[0]).toHaveTextContent("Header");
      expect(sections[1]).toHaveTextContent("Body");
      expect(sections[2]).toHaveTextContent("Footer");
    });
  });

  describe("Styling", () => {
    it("header has bottom border", () => {
      const { container } = render(<Card header="Header">Content</Card>);
      const header = container.querySelector('[class*="border-b"]');
      expect(header).toBeInTheDocument();
      // Header now has gradient background instead of bg-surface
      expect(header).toHaveClass("bg-gradient-to-r");
    });

    it("footer has top border", () => {
      const { container } = render(<Card footer="Footer">Content</Card>);
      const footer = container.querySelector('[class*="border-t"]');
      expect(footer).toBeInTheDocument();
      // Footer now has gradient background instead of bg-surface
      expect(footer).toHaveClass("bg-gradient-to-r");
    });

    it("body section has proper padding", () => {
      const { container } = render(<Card>Content</Card>);
      // Get the body div (second child of card, or first if no header)
      const card = container.firstChild as HTMLElement;
      const bodyDiv = Array.from(card.children).find(
        (child) => child.textContent === "Content"
      ) as HTMLElement;
      expect(bodyDiv).toHaveClass("px-3");
      expect(bodyDiv).toHaveClass("py-2");
    });
  });

  describe("Accessibility", () => {
    it("renders as a div by default", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.firstChild;
      expect(card?.nodeName).toBe("DIV");
    });

    it("supports nested interactive elements", () => {
      render(
        <Card header="Form">
          <label htmlFor="test-input">Label</label>
          <input id="test-input" />
        </Card>
      );
      expect(screen.getByLabelText("Label")).toBeInTheDocument();
    });
  });

  describe("Content Types", () => {
    it("renders with text content", () => {
      render(<Card>Simple text</Card>);
      expect(screen.getByText("Simple text")).toBeInTheDocument();
    });

    it("renders with JSX content", () => {
      render(
        <Card>
          <p>Paragraph</p>
          <button>Button</button>
        </Card>
      );
      expect(screen.getByText("Paragraph")).toBeInTheDocument();
      expect(screen.getByText("Button")).toBeInTheDocument();
    });

    it("renders with nested Cards", () => {
      render(
        <Card header="Outer">
          <Card header="Inner">Nested content</Card>
        </Card>
      );
      expect(screen.getByText("Outer")).toBeInTheDocument();
      expect(screen.getByText("Inner")).toBeInTheDocument();
      expect(screen.getByText("Nested content")).toBeInTheDocument();
    });
  });
});
