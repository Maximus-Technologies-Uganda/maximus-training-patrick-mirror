import React from "react";
import { render, screen } from "@testing-library/react";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "--font-geist-sans" }),
  Geist_Mono: () => ({ variable: "--font-geist-mono" }),
}));
vi.mock("../../components/Header", () => ({
  default: async () => <div>Header</div>,
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("renders children", async () => {
    render(await RootLayout({ children: <div>hello</div> }));
    expect(screen.getByText("hello")).toBeInTheDocument();
  });
});
