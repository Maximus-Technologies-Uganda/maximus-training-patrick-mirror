import {
  buildPostsKey,
  parseFilterState,
  validateFilterState,
  normalizeFilterState,
  cacheKeyEquals,
} from "../urlKey";

describe("buildPostsKey", () => {
  it("should return base path when no filters provided", () => {
    const key = buildPostsKey({});
    expect(key).toBe("/posts");
  });

  it("should add query param to key", () => {
    const key = buildPostsKey({ q: "design" });
    expect(key).toBe("/posts?q=design");
  });

  it("should add multiple params in sorted order", () => {
    const key = buildPostsKey({ sort: "new", q: "design", author: "alice" });
    expect(key).toBe("/posts?author=alice&q=design&sort=new");
  });

  it("should ignore undefined/null/empty params", () => {
    const key = buildPostsKey({ q: "", author: undefined, sort: "new" });
    expect(key).toBe("/posts?sort=new");
  });

  it("should URL encode special characters", () => {
    const key = buildPostsKey({ q: "hello world" });
    expect(key).toBe("/posts?q=hello%20world");
  });

  it("should produce same key for different param orderings", () => {
    const key1 = buildPostsKey({ q: "design", sort: "new", author: "alice" });
    const key2 = buildPostsKey({ author: "alice", q: "design", sort: "new" });
    const key3 = buildPostsKey({ sort: "new", author: "alice", q: "design" });
    expect(key1).toBe(key2);
    expect(key2).toBe(key3);
  });
});

describe("parseFilterState", () => {
  it("should parse query params from URL", () => {
    const state = parseFilterState("/posts?q=design&author=alice&sort=old");
    expect(state).toEqual({ q: "design", author: "alice", sort: "old" });
  });

  it("should handle missing params as undefined", () => {
    const state = parseFilterState("/posts?q=design");
    expect(state).toEqual({ q: "design", author: undefined, sort: undefined });
  });

  it("should handle empty URL", () => {
    const state = parseFilterState("/posts");
    expect(state).toEqual({ q: undefined, author: undefined, sort: undefined });
  });
});

describe("validateFilterState", () => {
  it("should accept valid sort values", () => {
    expect(validateFilterState({ sort: "new" })).toEqual({ valid: true });
    expect(validateFilterState({ sort: "old" })).toEqual({ valid: true });
  });

  it("should reject invalid sort values", () => {
    const result = validateFilterState({ sort: "invalid" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("Invalid sort value");
  });

  it("should reject empty author", () => {
    const result = validateFilterState({ author: "" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("non-empty");
  });

  it("should reject empty query", () => {
    const result = validateFilterState({ q: "" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("non-empty");
  });
});

describe("normalizeFilterState", () => {
  it("should trim whitespace", () => {
    const normalized = normalizeFilterState({ q: "  design  ", author: " alice " });
    expect(normalized).toEqual({ q: "design", author: "alice", sort: undefined });
  });

  it("should lowercase sort values", () => {
    const normalized = normalizeFilterState({ sort: "NEW" });
    expect(normalized.sort).toBe("new");
  });
});

describe("cacheKeyEquals", () => {
  it("should return true for same canonical keys", () => {
    const key1 = buildPostsKey({ q: "design", sort: "new" });
    const key2 = buildPostsKey({ sort: "new", q: "design" });
    expect(cacheKeyEquals(key1, key2)).toBe(true);
  });

  it("should return false for different params", () => {
    const key1 = buildPostsKey({ q: "design" });
    const key2 = buildPostsKey({ q: "architecture" });
    expect(cacheKeyEquals(key1, key2)).toBe(false);
  });
});
