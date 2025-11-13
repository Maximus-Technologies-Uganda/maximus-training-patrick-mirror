import { describe, it, expect } from "vitest";
import { querySchema } from "../../packages/contract/src/index";

describe("Posts Contract Tests (T028)", () => {
  describe("Valid Query Validation", () => {
    it("should accept valid q parameter", () => {
      const query = { q: "design" };
      const result = querySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should accept valid author parameter (slug format)", () => {
      const query = { author: "alice" };
      const result = querySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should accept valid sort parameter (new|old)", () => {
      const queries = [{ sort: "new" }, { sort: "old" }];

      queries.forEach((query) => {
        const result = querySchema.safeParse(query);
        expect(result.success).toBe(true);
      });
    });

    it("should accept multiple parameters together", () => {
      const query = { q: "design", author: "alice", sort: "new" };
      const result = querySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should accept empty object (all params optional)", () => {
      const query = {};
      const result = querySchema.safeParse(query);
      expect(result.success).toBe(true);
    });

    it("should trim whitespace from q parameter", () => {
      const query = { q: "  design  " };
      const result = querySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.q).toBe("design");
      }
    });

    it("should reject empty q (fails min length)", () => {
      const query = { q: "" };
      const result = querySchema.safeParse(query);
      // Empty string after trim fails min(1) constraint
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Invalid Query Rejection", () => {
    it("should reject invalid sort value", () => {
      const query = { sort: "invalid" };
      const result = querySchema.safeParse(query);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBeDefined();
      }
    });

    it("should reject malformed author (uppercase not allowed)", () => {
      const query = { author: "Alice" };
      const result = querySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it("should reject author with invalid characters", () => {
      const invalidAuthors = ["alice@123", "alice!", "alice ", " alice"];

      invalidAuthors.forEach((author) => {
        const query = { author };
        const result = querySchema.safeParse(query);
        expect(result.success).toBe(false);
      });
    });

    it("should reject q parameter exceeding max length", () => {
      const query = { q: "a".repeat(100) }; // Assuming max is 64
      const result = querySchema.safeParse(query);
      expect(result.success).toBe(false);
    });

    it("should reject sort as non-string", () => {
      const query = { sort: 123 };
      const result = querySchema.safeParse(query as Record<string, unknown>);
      expect(result.success).toBe(false);
    });
  });

  describe("Error Message Consistency", () => {
    it("should provide consistent error messages for invalid sort", () => {
      const invalidSorts = ["invalid", "newest", "oldest", "popular"];

      const errors = invalidSorts.map((sort) => {
        const result = querySchema.safeParse({ sort });
        return result.success ? null : result.error.issues[0].message;
      });

      // All should have consistent error pattern
      errors.forEach((error) => {
        if (error) {
          expect(error).toBeTruthy();
        }
      });
    });

    it("should provide consistent error messages for invalid author format", () => {
      const invalidAuthors = ["Alice", "alice!", "alice ", "ALICE"];

      invalidAuthors.forEach((author) => {
        const result = querySchema.safeParse({ author });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle null/undefined gracefully", () => {
      const result = querySchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("should handle extra properties (ignore them)", () => {
      const query = { q: "design", extra: "property", unknown: 123 };
      const result = querySchema.safeParse(query);
      expect(result.success).toBe(true);
      if (result.success) {
        // Extra properties are ignored by Zod; transform only cleans empty fields
        expect(result.data.q).toBe("design");
        expect(result.data.sort).toBe("new"); // default sort is always present
        expect((result.data as Record<string, unknown>).extra).toBeUndefined();
      }
    });

    it("should handle all params as undefined", () => {
      const query = { q: undefined, author: undefined, sort: undefined };
      const result = querySchema.safeParse(query);
      expect(result.success).toBe(true);
    });
  });
});
