import React from "react";

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
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No items",
  message,
  action,
  className,
}) => {
  // TODO: Implement with Card and Button components
  // Use token-based styling for consistency
  return (
    <div className={className}>
      {title && <h2>{title}</h2>}
      {message && <p>{message}</p>}
      {action && <button onClick={action.onClick}>{action.label}</button>}
    </div>
  );
};

EmptyState.displayName = "EmptyState";
