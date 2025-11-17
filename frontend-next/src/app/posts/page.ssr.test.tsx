import { describe, it, expect, vi, beforeEach } from "vitest";

import PostsPage from "./page";
import { DEFAULT_POST_SORT } from "@/lib/schemas";

const fetchApiMock = vi.hoisted(() => vi.fn());

vi.mock("@/server/fetchApi", () => ({
  fetchApi: fetchApiMock,
}));

describe("SSR Posts page (server component)", () => {
  beforeEach(() => {
    fetchApiMock.mockReset();
    fetchApiMock.mockResolvedValue({ items: [], hasNextPage: false });
  });

  it("returns a React element with normalized props", async () => {
    const el = await PostsPage({
      searchParams: { page: "2", pageSize: "3", q: " hello ", sort: "title-asc" },
    });

    expect(el).toBeTruthy();
    expect(el.props.page).toBe(2);
    expect(el.props.pageSize).toBe(3);
    expect(el.props.q).toBe("hello");
    expect(el.props.sort).toBe("title-asc");

    const [[requestUrl]] = fetchApiMock.mock.calls;
    expect(requestUrl).toContain("page=2");
    expect(requestUrl).toContain("pageSize=4");
    expect(requestUrl).toContain("sort=title-asc");
    expect(requestUrl).toContain("q=hello");
  });

  it("falls back to default sort when value is invalid", async () => {
    await PostsPage({ searchParams: { sort: "invalid-sort" } });
    const [[requestUrl]] = fetchApiMock.mock.calls;
    expect(requestUrl).toContain(`sort=${DEFAULT_POST_SORT}`);
  });

  it("normalizes array payloads into SWR props", async () => {
    const now = new Date().toISOString();
    fetchApiMock.mockResolvedValueOnce([
      { id: "1", title: "Hello", body: "World", createdAt: now, updatedAt: now },
      { id: "2", title: "Hello 2", content: "World 2", createdAt: now, updatedAt: now },
    ]);

    const el = await PostsPage({ searchParams: { pageSize: "1" } });
    expect(el.props.initialData).toHaveLength(1);
    expect(el.props.initialData?.[0].content).toBe("World");
    expect(el.props.initialHasNextPage).toBe(true);
  });

  it("uses hasNextPage metadata when provided", async () => {
    const now = new Date().toISOString();
    fetchApiMock.mockResolvedValueOnce({
      items: [{ id: "1", title: "Hello", content: "World", createdAt: now, updatedAt: now }],
      hasNextPage: false,
    });

    const el = await PostsPage({ searchParams: {} });
    expect(el.props.initialData).toHaveLength(1);
    expect(el.props.initialHasNextPage).toBe(false);
  });

  it("handles fetch errors gracefully", async () => {
    fetchApiMock.mockRejectedValueOnce(new Error("boom"));

    const el = await PostsPage({ searchParams: {} });
    expect(el.props.initialData).toBeUndefined();
    expect(el.props.initialHasNextPage).toBeUndefined();
  });
});
