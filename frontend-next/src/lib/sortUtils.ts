/**
 * Sort Utilities – T043 [US2]
 * Sorting logic for Posts with configurable orders and validation
 * FR-012: Support for 'new' and 'old' sort orders with sensible defaults
 */

import { QueryParams } from "../../../packages/contract/src/index";

/**
 * Supported sort orders
 */
export type SortOrder = "new" | "old" | "relevance";

/**
 * Post entity for sorting
 */
export interface SortablePost {
  id: string;
  title: string;
  author: string;
  createdAt: string;
  [key: string]: unknown;
}

/**
 * Validate sort order parameter
 * @param sort - Sort parameter value
 * @returns Valid sort order or default 'new'
 */
export function validateSortOrder(sort: string | undefined): SortOrder {
  if (!sort) {
    return "new";
  }

  // Only allow valid enum values
  const validOrders: SortOrder[] = ["new", "old", "relevance"];
  if (validOrders.includes(sort as SortOrder)) {
    return sort as SortOrder;
  }

  // Default to 'new' for invalid values
  console.warn(`Invalid sort order: ${sort}, defaulting to 'new'`);
  return "new";
}

/**
 * Sort posts by the specified order
 * @param posts - Array of posts to sort
 * @param order - Sort order (new, old, relevance)
 * @returns Sorted posts array
 */
export function sortPosts(posts: SortablePost[], order: SortOrder = "new"): SortablePost[] {
  // Create a copy to avoid mutating original
  const sorted = [...posts];

  switch (order) {
    case "new":
      // Sort by createdAt descending (newest first)
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

    case "old":
      // Sort by createdAt ascending (oldest first)
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateA - dateB;
      });

    case "relevance":
      // For now, treat as 'new' (would need search context for true relevance)
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

    default:
      // Fallback to 'new'
      return sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
  }
}

/**
 * Get sort order label for display
 * @param order - Sort order
 * @returns Human-readable label
 */
export function getSortLabel(order: SortOrder): string {
  switch (order) {
    case "new":
      return "Newest first";
    case "old":
      return "Oldest first";
    case "relevance":
      return "Most relevant";
    default:
      return "Sort";
  }
}

/**
 * Comparator function for sorting posts
 * Can be used with Array.prototype.sort()
 * @param order - Sort order
 * @returns Comparator function
 */
export function getPostComparator(
  order: SortOrder = "new"
): (a: SortablePost, b: SortablePost) => number {
  return (a: SortablePost, b: SortablePost) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();

    switch (order) {
      case "new":
        return dateB - dateA; // Descending
      case "old":
        return dateA - dateB; // Ascending
      case "relevance":
        return dateB - dateA; // Default to newest
      default:
        return dateB - dateA;
    }
  };
}

/**
 * Parse sort from query parameters
 * @param queryParams - Query parameters
 * @returns Validated sort order
 */
export function parseSortFromQuery(queryParams: Partial<QueryParams>): SortOrder {
  const sort = queryParams.sort || "new";
  return validateSortOrder(sort);
}

/**
 * Build sort URL parameter
 * Only includes sort if it's not the default 'new'
 * @param order - Sort order
 * @returns Query string parameter or empty string
 */
export function buildSortParam(order: SortOrder): string {
  if (order === "new") {
    return ""; // Omit default value
  }
  return `sort=${encodeURIComponent(order)}`;
}

/**
 * Determine if a sort order represents reverse chronological
 * @param order - Sort order
 * @returns true if descending by date (newest first)
 */
export function isReverseChronological(order: SortOrder): boolean {
  return order === "new" || order === "relevance";
}

/**
 * Get next sort order in rotation
 * Useful for toggle buttons
 * @param currentOrder - Current sort order
 * @returns Next sort order in cycle
 */
export function getNextSortOrder(currentOrder: SortOrder): SortOrder {
  switch (currentOrder) {
    case "new":
      return "old";
    case "old":
      return "new";
    case "relevance":
      return "new";
    default:
      return "new";
  }
}

/**
 * Validate sort order from URL query
 * @param sort - Raw sort value from URL
 * @returns Validated sort order with metadata
 */
export function validateUrlSort(sort: string | string[] | undefined): {
  valid: boolean;
  value: SortOrder;
  error?: string;
} {
  if (Array.isArray(sort)) {
    return {
      valid: false,
      value: "new",
      error: "Sort parameter must be a single value",
    };
  }

  const validated = validateSortOrder(sort);
  return {
    valid: true,
    value: validated,
  };
}

export default {
  validateSortOrder,
  sortPosts,
  getSortLabel,
  getPostComparator,
  parseSortFromQuery,
  buildSortParam,
  isReverseChronological,
  getNextSortOrder,
  validateUrlSort,
};
