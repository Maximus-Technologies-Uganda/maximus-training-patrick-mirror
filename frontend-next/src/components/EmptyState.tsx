import React from "react";
import { Card } from "./Card";
import { Button } from "./Button";

export interface EmptyStateProps {
  title?: string;
  message?: string;
  action?: { label: string; onClick: () => void };
  className?: string;
}

/**
 * EmptyState Component
 *
 * Displays a message when no data is available.
 * Optionally provides a call-to-action button.
 * Uses design system tokens for consistent styling.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No items",
  message,
  action,
  className = "",
}) => {
  return (
    <Card className={className} id="empty-state">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 rounded-full bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4 transition-all duration-300 hover:scale-110 hover:shadow-lg">
          <svg
            className="w-12 h-12 text-purple-600 transition-transform duration-300"
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
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
        {title && (
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            {title}
          </h2>
        )}
        {message && <p className="text-sm text-text-muted mb-6 max-w-md">{message}</p>}
        {action && (
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        )}
      </div>
    </Card>
  );
};

EmptyState.displayName = "EmptyState";
