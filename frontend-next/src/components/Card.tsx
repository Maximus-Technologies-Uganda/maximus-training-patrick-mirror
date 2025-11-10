import React from "react";

export interface CardProps {
  header?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  id?: string;
}

/**
 * Card Component
 *
 * A flexible container component for grouping related content.
 * Supports optional header and footer sections.
 * Uses design system tokens for consistent styling.
 */
export const Card: React.FC<CardProps> = ({ header, children, footer, className = "", id }) => {
  // Card base styles using design tokens
  const cardBaseStyles = [
    "bg-surface",
    "border-2",
    "border-purple-200",
    "rounded-lg",
    "shadow-md",
    "overflow-hidden",
    "hover:shadow-lg",
    "hover:border-purple-300",
    "transition-all",
    "duration-300",
    "ease-in-out",
    "transform",
    "hover:scale-[1.01]",
  ].join(" ");

  const cardClassName = [cardBaseStyles, className].filter(Boolean).join(" ");

  return (
    <div className={cardClassName} id={id}>
      {header && (
        <div className="px-3 py-2 border-b-2 border-purple-200 bg-gradient-to-r from-blue-50 to-purple-50">
          {header}
        </div>
      )}
      <div className="px-3 py-2">{children}</div>
      {footer && (
        <div className="px-3 py-2 border-t-2 border-purple-200 bg-gradient-to-r from-blue-50 to-purple-50">
          {footer}
        </div>
      )}
    </div>
  );
};

Card.displayName = "Card";
