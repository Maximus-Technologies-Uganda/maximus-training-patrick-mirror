import React from "react";

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
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Error",
  message = "Something went wrong",
  onRetry,
  className,
}) => {
  // TODO: Implement with Card and Button components
  // Use aria-live="assertive" for error announcements
  return (
    <div role="alert" aria-live="assertive" className={className}>
      {title && <h2>{title}</h2>}
      <p>{message}</p>
      {onRetry && <button onClick={onRetry}>Retry</button>}
    </div>
  );
};

ErrorState.displayName = "ErrorState";
