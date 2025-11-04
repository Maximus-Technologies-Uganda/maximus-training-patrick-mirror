import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Card } from "../../src/components/Card";

describe("Card", () => {
  it("renders children", () => {
    const { getByText } = render(<Card>Content</Card>);
    expect(getByText("Content")).toBeInTheDocument();
  });
});
