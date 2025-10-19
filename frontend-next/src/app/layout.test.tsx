import React from "react";
import { render, screen } from "@testing-library/react";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" })
}));
vi.mock("../../components/Header", () => ({ default: () => <div>Header</div> }));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("renders children", () => {
    render(<RootLayout><div>hello</div></RootLayout> as any);
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
