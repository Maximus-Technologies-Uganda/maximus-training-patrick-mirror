/**
 * Sort Utilities Tests
 * Basic unit tests for sortUtils to increase coverage
 */

import { describe, it, expect } from "vitest";
import {
  validateSortOrder,
  sortPosts,
  getSortLabel,
  getPostComparator,
  parseSortFromQuery,
  buildSortParam,
  isReverseChronological,
  getNextSortOrder,
  validateUrlSort,
  type SortablePost,
} from "../../src/lib/sortUtils";

describe("sortUtils", () => {
  describe("validateSortOrder", () => {
    it("should return new for undefined sort", () => {
      expect(validateSortOrder(undefined)).toBe("new");
    });

    it("should accept valid sort orders", () => {
      expect(validateSortOrder("new")).toBe("new");
      expect(validateSortOrder("old")).toBe("old");
      expect(validateSortOrder("relevance")).toBe("relevance");
    });

    it("should default to new for invalid sort", () => {
      expect(validateSortOrder("invalid")).toBe("new");
      expect(validateSortOrder("popular")).toBe("new");
    });
  });

  describe("sortPosts", () => {
    const posts: SortablePost[] = [
      { id: "1", title: "First", author: "alice", createdAt: "2025-01-01T00:00:00Z" },
      { id: "2", title: "Second", author: "bob", createdAt: "2025-01-02T00:00:00Z" },
      { id: "3", title: "Third", author: "charlie", createdAt: "2025-01-03T00:00:00Z" },
    ];

    it("should sort new (descending)", () => {
      const sorted = sortPosts(posts, "new");
      expect(sorted[0].id).toBe("3");
      expect(sorted[1].id).toBe("2");
      expect(sorted[2].id).toBe("1");
    });

    it("should sort old (ascending)", () => {
      const sorted = sortPosts(posts, "old");
      expect(sorted[0].id).toBe("1");
      expect(sorted[1].id).toBe("2");
      expect(sorted[2].id).toBe("3");
    });

    it("should not mutate original array", () => {
      const original = [...posts];
      sortPosts(posts, "new");
      expect(posts).toEqual(original);
    });
  });

  describe("getSortLabel", () => {
    it("should return human-readable labels", () => {
      expect(getSortLabel("new")).toBe("Newest first");
      expect(getSortLabel("old")).toBe("Oldest first");
      expect(getSortLabel("relevance")).toBe("Most relevant");
    });
  });

  describe("getPostComparator", () => {
    it("should return a function", () => {
      const comparator = getPostComparator("new");
      expect(typeof comparator).toBe("function");
    });

    it("should compare posts correctly", () => {
      const post1: SortablePost = {
        id: "1",
        title: "Old",
        author: "alice",
        createdAt: "2025-01-01T00:00:00Z",
      };
      const post2: SortablePost = {
        id: "2",
        title: "New",
        author: "bob",
        createdAt: "2025-01-02T00:00:00Z",
      };

      const comparator = getPostComparator("new");
      expect(comparator(post1, post2)).toBeGreaterThan(0);
    });
  });

  describe("parseSortFromQuery", () => {
    it("should parse sort from query params", () => {
      expect(parseSortFromQuery({ sort: "old" })).toBe("old");
      expect(parseSortFromQuery({ sort: "new" })).toBe("new");
    });

    it("should default to new", () => {
      expect(parseSortFromQuery({})).toBe("new");
    });
  });

  describe("buildSortParam", () => {
    it("should return empty string for default new", () => {
      expect(buildSortParam("new")).toBe("");
    });

    it("should return encoded param for non-default", () => {
      expect(buildSortParam("old")).toContain("sort=");
    });
  });

  describe("isReverseChronological", () => {
    it("should identify reverse chronological orders", () => {
      expect(isReverseChronological("new")).toBe(true);
      expect(isReverseChronological("relevance")).toBe(true);
      expect(isReverseChronological("old")).toBe(false);
    });
  });

  describe("getNextSortOrder", () => {
    it("should rotate sort orders", () => {
      expect(getNextSortOrder("new")).toBe("old");
      expect(getNextSortOrder("old")).toBe("new");
      expect(getNextSortOrder("relevance")).toBe("new");
    });
  });

  describe("validateUrlSort", () => {
    it("should validate URL sort parameters", () => {
      const result = validateUrlSort("old");
      expect(result.valid).toBe(true);
      expect(result.value).toBe("old");
    });

    it("should handle invalid values", () => {
      const result = validateUrlSort("invalid");
      expect(result.valid).toBe(true);
      expect(result.value).toBe("new");
    });

    it("should reject array values", () => {
      const result = validateUrlSort(["new", "old"]);
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
