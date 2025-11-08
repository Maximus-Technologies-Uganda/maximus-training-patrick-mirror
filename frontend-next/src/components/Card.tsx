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
 * Uses design system tokens for consistent styling.
 */
export const Card: React.FC<CardProps> = ({ header, children, footer, className = "" }) => {
  // Card base styles using design tokens
  const cardBaseStyles = [
    "bg-surface",
    "border",
    "border-text-muted/20",
    "rounded-md",
    "shadow-sm",
    "overflow-hidden",
  ].join(" ");

  const cardClassName = [cardBaseStyles, className].filter(Boolean).join(" ");

  return (
    <div className={cardClassName}>
      {header && <div className="px-3 py-2 border-b border-text-muted/20 bg-surface">{header}</div>}
      <div className="px-3 py-2">{children}</div>
      {footer && <div className="px-3 py-2 border-t border-text-muted/20 bg-surface">{footer}</div>}
    </div>
  );
};

Card.displayName = "Card";
