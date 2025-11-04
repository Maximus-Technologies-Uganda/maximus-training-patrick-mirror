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
    <Card className={className}>
      <div role="alert" aria-live="assertive" className="flex flex-col items-center justify-center py-8 text-center">
        <svg
          className="w-12 h-12 mb-4 text-error"
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
        {title && <h2 className="text-lg font-semibold text-error mb-2">{title}</h2>}
        <p className="text-sm text-text-muted mb-4">{message}</p>
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
