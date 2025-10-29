import { describe, it, expect, vi, beforeEach } from "vitest";

// Stub next/headers.cookies to control session decoding in the server component
let token = "";
vi.mock("next/headers", () => {
  return {
    cookies: () => ({
      get: (name: string) => (name === "session" ? { value: token } : undefined),
    }),
  };
});

import PostsPage from "./page";

function makeUnsignedJwt(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" }), "utf8").toString("base64url");
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${header}.${body}.`;
}

describe("SSR Posts page (server component)", () => {
  beforeEach(() => {
    token = "";
  });

  it("returns a React element with numeric props and no user when no session", async () => {
    const el = await PostsPage({ searchParams: Promise.resolve({ page: "2", pageSize: "3", q: "hello" }) });
    expect(el).toBeTruthy();
    // Element props should be normalized as numbers/strings
    // @ts-expect-error inspecting React element for test purposes
    expect(el.props.page).toBe(2);
    // @ts-expect-error inspecting React element for test purposes
    expect(el.props.pageSize).toBe(3);
    // @ts-expect-error inspecting React element for test purposes
    expect(el.props.q).toBe("hello");
    // @ts-expect-error inspecting React element for test purposes
    expect(el.props.currentUserId).toBeUndefined();
  });

  it("does not pass currentUserId since authentication is now client-side", async () => {
    token = makeUnsignedJwt({ userId: "u123" });
    const el = await PostsPage({ searchParams: Promise.resolve({}) });
    // @ts-expect-error inspecting React element for test purposes
    expect(el.props.currentUserId).toBeUndefined();
  });
});


