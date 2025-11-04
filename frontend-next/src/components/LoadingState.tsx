import React from "react";

export interface LoadingStateProps {
  message?: string;
  className?: string;
}

/**
 * LoadingState Component
 *
 * Displays a loading indicator with aria-live announcement.
 * Used during data fetching operations.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({ message = "Loading...", className }) => {
  // TODO: Implement with skeleton or spinner
  // Use aria-live="polite" for announcements
  return (
    <div role="status" aria-live="polite" className={className}>
      {message}
    </div>
  );
};

LoadingState.displayName = "LoadingState";
