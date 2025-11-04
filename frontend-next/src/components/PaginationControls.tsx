import React from "react";

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
 */
export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  className,
}) => {
  // TODO: Implement with Button components
  // Disable previous button on page 1
  // Disable next button on last page
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div className={className}>
      <button onClick={onPrevious} disabled={isFirstPage}>
        Previous
      </button>
      <span>Page {currentPage} of {totalPages}</span>
      <button onClick={onNext} disabled={isLastPage}>
        Next
      </button>
    </div>
  );
};

PaginationControls.displayName = "PaginationControls";
