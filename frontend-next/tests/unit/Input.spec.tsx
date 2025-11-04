import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Input } from "../../src/components/Input";

describe("Input", () => {
  it("renders with label", () => {
    const { getByLabelText } = render(<Input label="Name" />);
    expect(getByLabelText("Name")).toBeInTheDocument();
  });
});
