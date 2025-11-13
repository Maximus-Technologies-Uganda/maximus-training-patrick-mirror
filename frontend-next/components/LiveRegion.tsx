"use client";

import React, { useEffect, useRef, useCallback } from "react";

/**
 * LiveRegion: Accessible status announcement component – T044 [US2]
 *
 * Uses role="status" + aria-live="polite" to announce state changes
 * to screen readers without interrupting user focus.
 *
 * Enhanced for filter changes with:
 * - Polite aria-live (waits for pause in speech)
 * - Atomic updates (announces full message, not incremental)
 * - Visual hiding (sr-only) to avoid duplicate announcements
 * - Filter-specific announcements (search, author, sort)
 * - Loading, empty, and error state announcements
 * - Toast-style alerts for urgent messages
 *
 * FR-005: Announce loading, empty, and error states via accessible status regions
 * FR-044: Live region update wiring to filter changes
 *
 * Usage:
 * <LiveRegion
 *   message="Loading posts..."
 *   type="status"
 *   priority="polite"
 * />
 */

export type LiveRegionType = "status" | "alert";
export type LiveRegionPriority = "polite" | "assertive";

interface LiveRegionProps {
  /**
   * Message to announce
   */
  message: string;

  /**
   * Type of announcement (status or alert)
   * - 'status': Polite announcements (user can wait)
   * - 'alert': Assertive announcements (urgent, interrupts)
   */
  type?: LiveRegionType;

  /**
   * ARIA live priority
   * - 'polite': Wait for pause in speech
   * - 'assertive': Interrupt current speech
   */
  priority?: LiveRegionPriority;

  /**
   * Callback when announcement is made
   */
  onAnnounce?: (message: string) => void;

  /**
   * Clear message after delay (ms)
   * Set to 0 or undefined to keep message
   */
  clearAfter?: number;

  /**
   * Visual badge for testing
   */
  testId?: string;
}

/**
 * LiveRegion component
 */
export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  type = "status",
  priority = "polite",
  onAnnounce,
  clearAfter,
  testId,
}) => {
  const regionRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  /**
   * Announce message to screen readers
   */
  const announce = useCallback(
    (msg: string) => {
      if (!msg) return;

      if (regionRef.current) {
        regionRef.current.textContent = msg;
      }

      onAnnounce?.(msg);

      // Clear after delay if specified
      if (clearAfter && clearAfter > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          if (regionRef.current) {
            regionRef.current.textContent = "";
          }
        }, clearAfter);
      }
    },
    [clearAfter, onAnnounce]
  );

  /**
   * Announce when message changes
   */
  useEffect(() => {
    announce(message);
  }, [message, announce]);

  /**
   * Cleanup timeout on unmount
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={regionRef}
      role={type}
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      data-testid={testId || `live-region-${type}`}
    >
      {message}
    </div>
  );
};

/**
 * Composable live region announcement builder
 * Creates structured filter announcements for screen readers
 *
 * This function builds accessible, natural-language announcements that describe
 * the active filters and results to assistive technology users.
 *
 * @param query - Optional search query string
 * @param author - Optional author filter slug
 * @param sort - Optional sort order ('new', 'old', or undefined for default)
 * @param resultCount - Optional number of results found
 * @returns A formatted announcement string describing the active filters
 *
 * @example
 * // With query and author filters
 * createFilterAnnouncement("react hooks", "alice", "new", 15)
 * // Returns: 'Search query: "react hooks", Author: alice. 15 posts found.'
 *
 * @example
 * // With only sort order
 * createFilterAnnouncement(undefined, undefined, "old", 42)
 * // Returns: 'Sorted oldest first. 42 posts found.'
 *
 * @example
 * // No filters (cleared state)
 * createFilterAnnouncement()
 * // Returns: 'Filters cleared. Showing all posts.'
 *
 * @example
 * // With filters but no result count
 * createFilterAnnouncement("typescript", "bob-smith")
 * // Returns: 'Search query: "typescript", Author: bob-smith. Filters applied.'
 */
export const createFilterAnnouncement = (
  query?: string,
  author?: string,
  sort?: string,
  resultCount?: number
): string => {
  const parts: string[] = [];

  if (query) {
    parts.push(`Search query: "${query}"`);
  }
  if (author) {
    parts.push(`Author: ${author}`);
  }
  if (sort && sort !== "new") {
    parts.push(`Sorted ${sort === "old" ? "oldest first" : "newest first"}`);
  }

  if (parts.length === 0) {
    return "Filters cleared. Showing all posts.";
  }

  const filterText = parts.join(", ");
  const resultText =
    resultCount !== undefined
      ? `${resultCount} ${resultCount === 1 ? "post" : "posts"} found`
      : "Filters applied";

  return `${filterText}. ${resultText}.`;
};

/**
 * Create loading announcement
 */
export const createLoadingAnnouncement = (): string => {
  return "Loading posts...";
};

/**
 * Create empty state announcement
 */
export const createEmptyStateAnnouncement = (query?: string): string => {
  if (query) {
    return `No posts found matching "${query}". Try adjusting your search.`;
  }
  return "No posts available. Check back later.";
};

/**
 * Create error announcement
 */
export const createErrorAnnouncement = (error?: string): string => {
  if (error) {
    return `Error: ${error}`;
  }
  return "An error occurred while loading posts. Please try again.";
};

export default LiveRegion;
