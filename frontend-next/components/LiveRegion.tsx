"use client";

/**
 * LiveRegion: Accessible status announcement component
 *
 * Uses role="status" + aria-live="polite" to announce state changes
 * to screen readers without interrupting user focus.
 *
 * Features:
 * - Polite aria-live (waits for pause in speech)
 * - Atomic updates (announces full message, not incremental)
 * - Visual hiding (sr-only) to avoid duplicate announcements
 *
 * Usage:
 * <LiveRegion message="Loading posts..." />
 */

interface LiveRegionProps {
  message: string;
}

export function LiveRegion({ message }: LiveRegionProps) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
      {message}
    </div>
  );
}
