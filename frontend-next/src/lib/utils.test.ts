import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges multiple class names", () => {
    expect(cn("class1", "class2", "class3")).toBe("class1 class2 class3");
  });

  it("filters out falsy values", () => {
    expect(cn("class1", false, "class2", null, "class3", undefined)).toBe("class1 class2 class3");
  });

  it("handles empty array", () => {
    expect(cn()).toBe("");
  });

  it("handles all falsy values", () => {
    expect(cn(false, null, undefined)).toBe("");
  });

  it("handles single class name", () => {
    expect(cn("single")).toBe("single");
  });

  it("handles conditional classes", () => {
    const condition = true;
    expect(cn("base", condition ? "conditional" : "", "other")).toBe("base conditional other");
  });

  it("handles conditional classes with false condition", () => {
    const condition = false;
    expect(cn("base", condition ? "conditional" : "", "other")).toBe("base other");
  });

  it("handles empty strings", () => {
    expect(cn("class1", "", "class2")).toBe("class1 class2");
  });

  it("handles mixed truthy and falsy", () => {
    const shouldIncludeB = false;
    const shouldIncludeD = null;
    expect(cn("a", shouldIncludeB ? "b" : "", "c", shouldIncludeD ? "d" : "", "e")).toBe("a c e");
  });
});
