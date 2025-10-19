import React from "react";
import * as nextHeaders from "next/headers";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PostsPage from "./page";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

describe("SSR PostsPage (server component)", () => {
  beforeEach(() => {
    (nextHeaders as unknown as { cookies: { mockReturnValue: (v: unknown) => void } }).cookies.mockReturnValue({
      get: vi.fn(() => undefined),
    });
  });

  it("renders without throwing and returns a React element", async () => {
    const el = await PostsPage({ searchParams: Promise.resolve({}) });
    expect(React.isValidElement(el)).toBe(true);
  });
});


