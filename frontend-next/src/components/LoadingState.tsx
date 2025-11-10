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
 * Uses design system tokens for consistent styling.
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  className = "",
}) => {
  const containerStyles = [
    "flex",
    "flex-col",
    "items-center",
    "justify-center",
    "p-4",
    "text-text-muted",
  ].join(" ");

  const combinedClassName = [containerStyles, className].filter(Boolean).join(" ");

  return (
    <div className={combinedClassName} role="status" aria-live="polite">
      <div className="mb-4 rounded-full bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-3">
        <svg
          className="animate-spin h-8 w-8 text-purple-600"
          width="32"
          height="32"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <span className="text-sm font-medium text-gray-700">{message}</span>
    </div>
  );
};

LoadingState.displayName = "LoadingState";
