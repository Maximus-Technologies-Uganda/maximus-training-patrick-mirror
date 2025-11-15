import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Stub next/headers.cookies to control session decoding in the server component
let token = "";
let headerBag: Headers;
const mockFetch = vi.fn();
vi.mock("next/headers", () => {
  return {
    cookies: () => ({
      get: (name: string) => (name === "session" ? { value: token } : undefined),
    }),
    headers: () => headerBag,
  };
});

import PostsPage from "./page";

function makeUnsignedJwt(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }), "utf8").toString(
    "base64url"
  );
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${header}.${body}.`;
}

describe("SSR Posts page (server component)", () => {
  beforeEach(() => {
    token = "";
    headerBag = new Headers();
    mockFetch.mockReset();
    (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch =
      mockFetch as unknown as typeof fetch;
    mockFetch.mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
  });

  afterEach(() => {
    mockFetch.mockReset();
  });

  it("returns a React element with numeric props and no user when no session", async () => {
    const el = await PostsPage({
      searchParams: Promise.resolve({ page: "2", pageSize: "3", q: "hello" }),
    });
    expect(el).toBeTruthy();
    // Element props should be normalized as numbers/strings
    expect(el.props.page).toBe(2);
    expect(el.props.pageSize).toBe(3);
    expect(el.props.q).toBe("hello");
    expect(el.props.currentUserId).toBeUndefined();
  });

  it("does not pass currentUserId since authentication is now client-side", async () => {
    token = makeUnsignedJwt({ userId: "u123" });
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    );
    const el = await PostsPage({ searchParams: Promise.resolve({}) });
    expect(el.props.currentUserId).toBeUndefined();
  });

  it("derives SSR origin from forwarded headers when env origin is unset", async () => {
    delete process.env.APP_ORIGIN;
    delete process.env.NEXT_PUBLIC_APP_URL;
    headerBag.set(
      "x-forwarded-host",
      "maximus-training-frontend-673209018655.africa-south1.run.app"
    );
    headerBag.set("x-forwarded-proto", "https");
    const now = new Date().toISOString();
    mockFetch.mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            id: "post-1",
            title: "Hello",
            content: "World",
            tags: [],
            published: true,
            createdAt: now,
            updatedAt: now,
          },
        ]),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        }
      )
    );
    const el = await PostsPage({ searchParams: Promise.resolve({ q: "hello" }) });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining(
        "https://maximus-training-frontend-673209018655.africa-south1.run.app/api/posts"
      ),
      expect.objectContaining({ headers: expect.any(Object) })
    );
    expect(el.props.initialData).toHaveLength(1);
    expect(el.props.initialData?.[0].title).toBe("Hello");
  });
});
