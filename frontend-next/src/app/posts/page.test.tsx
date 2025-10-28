import { render, screen } from "@testing-library/react";
import * as nextHeaders from "next/headers";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PostsPage from "./page";

vi.mock("next/headers", () => ({ cookies: vi.fn() }));

describe("SSR PostsPage (server component)", () => {
  beforeEach(() => {
    (nextHeaders as unknown as { cookies: { mockReturnValue: (v: unknown) => void } }).cookies.mockReturnValue({
      get: vi.fn(() => undefined),
    });
    process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
  });
  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  it("renders SSR posts without spinner and shows post title", async () => {
    const testPost = { id: "1", title: "My Test Post", content: "Test content", published: true, createdAt: "2024-01-01T00:00:00Z", updatedAt: "2024-01-01T00:00:00Z" };
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [testPost],
        hasNextPage: false,
      }),
    } as unknown as Response);

    // Mock SWR to return the test post data
    const { usePostsList } = await import("../../lib/swr");
    vi.mocked(usePostsList).mockReturnValue({
      data: { items: [testPost], hasNextPage: false },
      isLoading: false,
      error: null,
    } as unknown as ReturnType<typeof usePostsList>);

    const el = await PostsPage({ searchParams: Promise.resolve({}) });
    render(el);
    expect(await screen.findByText("My Test Post")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      "https://example.test/api/posts?page=1&pageSize=11",
      expect.objectContaining({ headers: {}, cache: "no-store" }),
    );
  });
});


