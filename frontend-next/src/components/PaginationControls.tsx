import React from "react";
import { Button } from "./Button";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPrevious?: () => void;
  onNext?: () => void;
  onPageChange?: (page: number) => void;
  className?: string;
}

/**
 * PaginationControls Component
 *
 * Navigation controls for paginated lists.
 * Supports previous/next buttons with proper disabled states.
 * Uses design system tokens for consistent styling.
 */
export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  className = "",
}) => {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  const containerStyles = [
    "flex",
    "items-center",
    "justify-between",
    "gap-4",
    "px-4",
    "py-3",
  ].join(" ");

  const combinedClassName = [containerStyles, className].filter(Boolean).join(" ");

  return (
    <nav aria-label="Pagination" className={combinedClassName}>
      <Button
        onClick={onPrevious}
        disabled={isFirstPage}
        variant="secondary"
        size="sm"
        aria-label="Go to previous page"
      >
        Previous
      </Button>
      <span className="text-sm text-text-muted" aria-current="page">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        onClick={onNext}
        disabled={isLastPage}
        variant="secondary"
        size="sm"
        aria-label="Go to next page"
      >
        Next
      </Button>
    </nav>
  );
};

PaginationControls.displayName = "PaginationControls";
