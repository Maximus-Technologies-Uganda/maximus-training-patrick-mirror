import { describe, it, expect, vi } from "vitest";

vi.mock("google-auth-library", () => ({
  GoogleAuth: vi.fn().mockImplementation(() => ({
    getIdTokenClient: vi.fn().mockResolvedValue({
      getRequestHeaders: vi.fn().mockResolvedValue({ Authorization: "Bearer token-123" }),
    }),
  })),
}));

import { getIdToken } from "./getIdToken";

describe("getIdToken", () => {
  it("returns token on success", async () => {
    const token = await getIdToken("aud");
    expect(token).toBe("token-123");
  });

  it("throws when missing bearer", async () => {
    // Override mock to return bad headers
    const { GoogleAuth } = await import("google-auth-library");
    // @ts-ignore
    GoogleAuth.mockImplementation(() => ({
      getIdTokenClient: vi.fn().mockResolvedValue({
        getRequestHeaders: vi.fn().mockResolvedValue({}),
      }),
    }));
    await expect(getIdToken("aud"))
      .rejects.toThrow(/Failed to obtain ID token/);
  });
});
