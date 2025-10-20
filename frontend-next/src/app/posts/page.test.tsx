import { render, screen } from "@testing-library/react";
import * as nextHeaders from "next/headers";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PostsPage from "./page";

vi.mock("next/headers", () => ({ cookies: vi.fn(), headers: vi.fn() }));

describe("SSR PostsPage (server component)", () => {
  beforeEach(() => {
    (nextHeaders as unknown as { cookies: { mockReturnValue: (v: unknown) => void } }).cookies.mockReturnValue({
      get: vi.fn(() => undefined),
    });
    (nextHeaders as unknown as { headers: { mockReturnValue: (v: unknown) => void } }).headers.mockReturnValue({
      get: (key: string) => {
        if (key.toLowerCase() === "x-forwarded-proto") return "https";
        if (key.toLowerCase() === "x-forwarded-host") return "example.test";
        if (key.toLowerCase() === "host") return "example.test";
        return null;
      },
    });
    process.env.API_BASE_URL = "http://example.test";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.API_BASE_URL;
  });

  it("renders SSR posts without spinner and shows post title", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => [{ id: "1", title: "My Test Post", body: "..." }],
    } as unknown as Response);

    const el = await PostsPage({ searchParams: Promise.resolve({}) });
    render(el);
    expect(await screen.findByText("My Test Post")).toBeInTheDocument();
  });
});


