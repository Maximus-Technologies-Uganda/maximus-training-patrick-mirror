import type { LocalPost } from "./localFallbackTypes";

/**
 * Deterministic dataset that keeps local/E2E environments working when the real
 * API is unavailable. The values intentionally mirror the expectations in
 * Playwright tests (20 posts, Post 20 newest) so SSR + client hydration behave
 * consistently without seeding an external backend.
 */
export function buildLocalPostsSeed(count: number = 20): Array<LocalPost> {
  return Array.from({ length: count }, (_, index) => {
    const createdAt = new Date(Date.UTC(2024, 0, index + 1, 12, 0, 0)).toISOString();
    const paddedIndex = String(index + 1).padStart(2, "0");
    return {
      id: `seed-post-${paddedIndex}`,
      ownerId: `owner-${((index % 5) + 1).toString().padStart(2, "0")}`,
      title: `Post ${paddedIndex}`,
      content: `Seeded fallback post #${index + 1} for local development and E2E flows.`,
      tags: index % 3 === 0 ? ["demo", "local"] : ["local"],
      published: true,
      createdAt,
      updatedAt: createdAt,
    };
  }).reverse();
}
