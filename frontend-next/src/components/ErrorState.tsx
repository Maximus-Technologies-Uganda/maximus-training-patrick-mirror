import React from "react";
import { Card } from "./Card";
import { Button } from "./Button";

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorState Component
 *
 * Displays an error message with an optional retry button.
 * Uses aria-live="assertive" for immediate notification.
 * Uses design system tokens for consistent styling.
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Error",
  message = "Something went wrong",
  onRetry,
  className = "",
}) => {
  return (
    <Card className={className} id="error-message">
      <div
        role="alert"
        aria-live="assertive"
        className="flex flex-col items-center justify-center py-12 text-center"
      >
        <div className="mb-6 rounded-full bg-gradient-to-br from-red-100 via-pink-100 to-orange-100 p-4">
          <svg
            className="w-12 h-12 text-red-600"
            width="48"
            height="48"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        {title && <h2 className="text-xl font-bold text-red-600 mb-3">{title}</h2>}
        <p className="text-sm text-gray-700 mb-6 max-w-md">{message}</p>
        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
};

ErrorState.displayName = "ErrorState";
