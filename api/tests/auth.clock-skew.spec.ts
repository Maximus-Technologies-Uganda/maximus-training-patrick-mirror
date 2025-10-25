import { describe, it, expect } from "@jest/globals";
import { withinClockSkew } from "../src/middleware/firebaseAuth";

describe("Clock skew tolerance", () => {
  it("treats times within ±5m as valid for iat", () => {
    const now = Math.floor(Date.now() / 1000);
    expect(withinClockSkew(now, now + 300, 300)).toBe(true);
    expect(withinClockSkew(now, now - 300, 300)).toBe(true);
    expect(withinClockSkew(now, now + 301, 300)).toBe(false);
  });
});
