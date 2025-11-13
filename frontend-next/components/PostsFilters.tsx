/**
 * PostsFilters Component – T040 [US2]
 * Filter controls for Posts page with accessible form inputs
 * Supports query text, author filter, and sort order selection
 * FR-004, FR-005, FR-007: Query validation, accessible states, design system primitives
 */

"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { querySchema, type QueryParams } from "../../packages/contract/src/index";

interface PostsFiltersProps {
  /**
   * Initial filter values from URL or SSR
   */
  initialValues?: Partial<QueryParams>;

  /**
   * Callback when filters are applied
   */
  onFilter?: (params: QueryParams) => void;

  /**
   * Whether filters are currently loading
   */
  isLoading?: boolean;

  /**
   * Accessible error message if validation fails
   */
  errorMessage?: string;

  /**
   * Callback to announce status messages to screen readers
   * Should be connected to a LiveRegion with role="status"
   */
  onAnnounceStatus?: (message: string) => void;

  /**
   * Callback to announce error/alert messages to screen readers
   * Should be connected to a LiveRegion with role="alert"
   */
  onAnnounceAlert?: (message: string) => void;
}

/**
 * PostsFilters component
 * Provides accessible form for filtering posts by query, author, and sort order
 */
export const PostsFilters: React.FC<PostsFiltersProps> = ({
  initialValues = {},
  onFilter,
  isLoading = false,
  errorMessage,
  onAnnounceStatus,
  onAnnounceAlert,
}) => {
  const router = useRouter();
  const [formValues, setFormValues] = useState({
    q: initialValues.q || "",
    author: initialValues.author || "",
    sort: initialValues.sort || "new",
  });
  const [validationError, setValidationError] = useState<string | null>(null);

  /**
   * Handle input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setFormValues((prev) => ({ ...prev, [name]: value }));
      // Clear error on input change
      setValidationError(null);
    },
    []
  );

  /**
   * Handle form submission
   * Validates, builds canonical key, and updates URL
   */
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();

      try {
        // Validate through Zod schema
        const validated = querySchema.parse({
          q: formValues.q || undefined,
          author: formValues.author || undefined,
          sort: formValues.sort,
        });

        // Clear error on successful validation
        setValidationError(null);

        // Call callback if provided
        if (onFilter) {
          onFilter(validated);
        }

        // Build query string for URL update
        const params = new URLSearchParams();
        if (validated.q) {
          params.set("q", validated.q);
        }
        if (validated.author) {
          params.set("author", validated.author);
        }
        if (validated.sort && validated.sort !== "new") {
          params.set("sort", validated.sort);
        }

        // Update URL
        const newUrl = params.toString() ? `/posts?${params.toString()}` : "/posts";
        router.push(newUrl);

        // Announce to screen readers via callback
        if (onAnnounceStatus) {
          const statusMessage = `Filters applied: ${
            validated.q ? `query "${validated.q}"` : "all posts"
          }${validated.author ? `, author ${validated.author}` : ""}${
            validated.sort !== "new" ? `, sorted ${validated.sort}` : ""
          }`;
          onAnnounceStatus(statusMessage);
        }
      } catch (error) {
        // Handle validation error
        const message =
          error instanceof Error
            ? error.message
            : "Invalid filter values. Please check your input.";
        setValidationError(message);

        // Announce error via callback
        if (onAnnounceAlert) {
          onAnnounceAlert(`Filter error: ${message}`);
        }
      }
    },
    [formValues, onFilter, router, onAnnounceStatus, onAnnounceAlert]
  );

  /**
   * Handle clear filters
   */
  const handleClear = useCallback(() => {
    setFormValues({ q: "", author: "", sort: "new" });
    setValidationError(null);
    router.push("/posts");

    // Announce clear action via callback
    if (onAnnounceStatus) {
      onAnnounceStatus("Filters cleared. Showing all posts.");
    }
  }, [router, onAnnounceStatus]);

  const displayError = errorMessage || validationError;

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
      aria-label="Posts filter form"
    >
      <fieldset disabled={isLoading} className="space-y-4">
        {/* Query input */}
        <div>
          <label htmlFor="q" className="block text-sm font-medium text-gray-700 mb-1">
            Search posts
          </label>
          <input
            id="q"
            type="text"
            name="q"
            value={formValues.q}
            onChange={handleInputChange}
            placeholder="e.g., react, typescript"
            maxLength={64}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-describedby={displayError ? "filter-error" : undefined}
          />
          <p className="mt-1 text-xs text-gray-500">
            Search by title or content (max 64 characters)
          </p>
        </div>

        {/* Author filter */}
        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            Filter by author
          </label>
          <input
            id="author"
            type="text"
            name="author"
            value={formValues.author}
            onChange={handleInputChange}
            placeholder="e.g., alice, bob-smith"
            pattern="[a-z0-9-]*"
            maxLength={32}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-describedby={displayError ? "filter-error" : undefined}
          />
          <p className="mt-1 text-xs text-gray-500">
            Lowercase letters, numbers, and hyphens only (2-32 characters)
          </p>
        </div>

        {/* Sort order */}
        <div>
          <label htmlFor="sort" className="block text-sm font-medium text-gray-700 mb-1">
            Sort by
          </label>
          <select
            id="sort"
            name="sort"
            value={formValues.sort}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            aria-describedby={displayError ? "filter-error" : undefined}
          >
            <option value="new">Newest first</option>
            <option value="old">Oldest first</option>
          </select>
        </div>

        {/* Error message */}
        {displayError && (
          <div
            id="filter-error"
            role="alert"
            className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700"
          >
            {displayError}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            aria-busy={isLoading}
          >
            {isLoading ? "Applying filters..." : "Apply filters"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-medium hover:bg-gray-300 disabled:bg-gray-400 transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Accessibility: Loading announcement */}
        {isLoading && <p className="text-sm text-gray-600">Filters are being applied...</p>}
      </fieldset>
    </form>
  );
};

export default PostsFilters;
