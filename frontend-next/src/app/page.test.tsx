import React from "react";
import { render } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
}));

import Home from "./page";

describe("Home page", () => {
  it("renders without crashing", () => {
    render(<Home />);
  });
});
