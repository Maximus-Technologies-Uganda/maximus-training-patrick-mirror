import React from "react";

export interface CardProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

/**
 * Card Component
 *
 * A flexible container component for grouping related content.
 * Supports optional header and footer sections.
 */
export const Card: React.FC<CardProps> = ({ header, children, footer, className }) => {
  // TODO: Implement card with token-based styling
  // Use --color-surface, --space-3, --radius-md tokens
  return (
    <div className={className}>
      {header && <div>{header}</div>}
      <div>{children}</div>
      {footer && <div>{footer}</div>}
    </div>
  );
};

Card.displayName = "Card";
