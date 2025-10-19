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
    // Reset and override mock to return bad headers using vi.doMock
    vi.resetModules();
    vi.doMock("google-auth-library", () => ({
      GoogleAuth: vi.fn().mockImplementation(() => ({
        getIdTokenClient: vi.fn().mockResolvedValue({
          getRequestHeaders: vi.fn().mockResolvedValue({}),
        }),
      })),
    }));
    // Re-import getIdToken to pick up new mock
    const { getIdToken: getIdTokenRemocked } = await import("./getIdToken");
    await expect(getIdTokenRemocked("aud")).rejects.toThrow(/Failed to obtain ID token/);
  });
});
