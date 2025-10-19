import { describe, it, expect, beforeEach } from "vitest";
import { getBaseUrl } from "./config";

describe("getBaseUrl", () => {
  const orig = process.env.NEXT_PUBLIC_API_URL;
  beforeEach(() => {
    process.env.NEXT_PUBLIC_API_URL = orig;
  });

  it("returns env value when valid URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://localhost:4321";
    expect(getBaseUrl()).toBe("http://localhost:4321");
  });

  it("falls back to default when invalid URL", () => {
    process.env.NEXT_PUBLIC_API_URL = "not a url" as unknown as string;
    const url = getBaseUrl();
    expect(url).toBe("http://localhost:3000");
  });
});


