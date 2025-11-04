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
    <Card className={className}>
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <svg
          className="w-12 h-12 mb-4 text-text-muted"
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
        {title && <h2 className="text-lg font-semibold text-text mb-2">{title}</h2>}
        {message && <p className="text-sm text-text-muted mb-4">{message}</p>}
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
