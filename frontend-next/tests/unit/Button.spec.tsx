import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Button } from "../../src/components/Button";

describe("Button", () => {
  it("renders with text", () => {
    const { getByRole } = render(<Button>Click me</Button>);
    expect(getByRole("button")).toBeInTheDocument();
  });
});
