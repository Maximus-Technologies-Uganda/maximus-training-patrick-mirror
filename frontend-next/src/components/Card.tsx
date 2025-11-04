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
    "border-gray-200",
    "rounded-md",
    "shadow-sm",
    "overflow-hidden",
  ].join(" ");

  const cardClassName = [cardBaseStyles, className].filter(Boolean).join(" ");

  return (
    <div className={cardClassName}>
      {header && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          {header}
        </div>
      )}
      <div className="px-4 py-3">
        {children}
      </div>
      {footer && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.displayName = "Card";
