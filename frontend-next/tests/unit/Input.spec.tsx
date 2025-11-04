import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "../../src/components/Input";

describe("Input", () => {
  describe("Rendering", () => {
    it("renders without label", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("renders with label", () => {
      render(<Input label="Name" />);
      expect(screen.getByLabelText("Name")).toBeInTheDocument();
    });

    it("renders with placeholder", () => {
      render(<Input placeholder="Enter your name" />);
      expect(screen.getByPlaceholderText("Enter your name")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      render(<Input className="custom-wrapper" />);
      const wrapper = screen.getByRole("textbox").parentElement;
      expect(wrapper).toHaveClass("custom-wrapper");
    });
  });

  describe("Description", () => {
    it("renders description text", () => {
      render(<Input description="Enter your full name" />);
      expect(screen.getByText("Enter your full name")).toBeInTheDocument();
    });

    it("associates description with input via aria-describedby", () => {
      render(<Input label="Name" description="Enter your full name" />);
      const input = screen.getByLabelText("Name");
      const descriptionId = input.getAttribute("aria-describedby");
      expect(descriptionId).toBeTruthy();
      expect(screen.getByText("Enter your full name")).toHaveAttribute("id", descriptionId?.split(" ")[0]);
    });
  });

  describe("Error State", () => {
    it("renders error message", () => {
      render(<Input error="Name is required" />);
      expect(screen.getByText("Name is required")).toBeInTheDocument();
    });

    it("sets aria-invalid to true when error is present", () => {
      render(<Input label="Name" error="Name is required" />);
      expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
    });

    it("sets aria-invalid to false when no error", () => {
      render(<Input label="Name" />);
      expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "false");
    });

    it("associates error with input via aria-describedby", () => {
      render(<Input label="Name" error="Name is required" />);
      const input = screen.getByLabelText("Name");
      const describedBy = input.getAttribute("aria-describedby");
      expect(describedBy).toBeTruthy();

      const errorElement = screen.getByText("Name is required");
      expect(errorElement).toHaveAttribute("id");
      expect(describedBy).toContain(errorElement.getAttribute("id")!);
    });

    it("error message has role alert", () => {
      render(<Input error="Name is required" />);
      expect(screen.getByRole("alert")).toHaveTextContent("Name is required");
    });

    it("applies error styling", () => {
      render(<Input label="Name" error="Name is required" />);
      const input = screen.getByLabelText("Name");
      expect(input).toHaveClass("border-error");
      expect(input).toHaveClass("focus:ring-error");
    });
  });

  describe("Accessibility", () => {
    it("generates unique ID when not provided", () => {
      render(
        <>
          <Input label="First" />
          <Input label="Second" />
        </>
      );
      const first = screen.getByLabelText("First");
      const second = screen.getByLabelText("Second");
      expect(first.id).toBeTruthy();
      expect(second.id).toBeTruthy();
      expect(first.id).not.toBe(second.id);
    });

    it("uses provided ID", () => {
      render(<Input id="custom-id" label="Name" />);
      expect(screen.getByLabelText("Name")).toHaveAttribute("id", "custom-id");
    });

    it("combines aria-describedby with description and error", () => {
      render(
        <Input
          label="Name"
          description="Enter your full name"
          error="Name is required"
          aria-describedby="external-description"
        />
      );
      const input = screen.getByLabelText("Name");
      const describedBy = input.getAttribute("aria-describedby");

      expect(describedBy).toContain("external-description");
      expect(describedBy).toContain(screen.getByText("Enter your full name").id);
      expect(describedBy).toContain(screen.getByText("Name is required").id);
    });

    it("has proper focus styles", () => {
      render(<Input label="Name" />);
      const input = screen.getByLabelText("Name");
      expect(input).toHaveClass("focus:outline-none");
      expect(input).toHaveClass("focus:ring-2");
    });
  });

  describe("Interactions", () => {
    it("handles user input", async () => {
      const user = userEvent.setup();
      render(<Input label="Name" />);
      const input = screen.getByLabelText("Name") as HTMLInputElement;

      await user.type(input, "John Doe");
      expect(input.value).toBe("John Doe");
    });

    it("calls onChange handler", async () => {
      const handleChange = vi.fn();
      const user = userEvent.setup();
      render(<Input label="Name" onChange={handleChange} />);

      await user.type(screen.getByLabelText("Name"), "J");
      expect(handleChange).toHaveBeenCalled();
    });

    it("calls onFocus handler", async () => {
      const handleFocus = vi.fn();
      const user = userEvent.setup();
      render(<Input label="Name" onFocus={handleFocus} />);

      await user.click(screen.getByLabelText("Name"));
      expect(handleFocus).toHaveBeenCalledTimes(1);
    });

    it("calls onBlur handler", async () => {
      const handleBlur = vi.fn();
      const user = userEvent.setup();
      render(<Input label="Name" onBlur={handleBlur} />);

      const input = screen.getByLabelText("Name");
      await user.click(input);
      await user.tab();
      expect(handleBlur).toHaveBeenCalledTimes(1);
    });
  });

  describe("HTML Attributes", () => {
    it("supports disabled state", () => {
      render(<Input label="Name" disabled />);
      expect(screen.getByLabelText("Name")).toBeDisabled();
    });

    it("supports type attribute", () => {
      render(<Input label="Email" type="email" />);
      expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    });

    it("supports required attribute", () => {
      render(<Input label="Name" required />);
      expect(screen.getByLabelText("Name")).toBeRequired();
    });

    it("supports maxLength attribute", () => {
      render(<Input label="Name" maxLength={50} />);
      expect(screen.getByLabelText("Name")).toHaveAttribute("maxLength", "50");
    });

    it("supports name attribute", () => {
      render(<Input label="Username" name="username" />);
      expect(screen.getByLabelText("Username")).toHaveAttribute("name", "username");
    });

    it("forwards ref correctly", () => {
      const ref = vi.fn();
      render(<Input ref={ref} label="Name" />);
      expect(ref).toHaveBeenCalled();
    });
  });
});
