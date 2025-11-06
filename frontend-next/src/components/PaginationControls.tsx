import React from "react";

export interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPrevious?: () => void;
  onNext?: () => void;
  className?: string;
}

export function PaginationControls({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  className = "",
}: PaginationControlsProps): React.ReactElement {
  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <nav aria-label="Pagination" className={className}>
      <button type="button" onClick={onPrevious} disabled={isFirstPage} aria-label="Previous page">
        Previous
      </button>
      <span aria-current="page">
        Page {currentPage} of {totalPages}
      </span>
      <button type="button" onClick={onNext} disabled={isLastPage} aria-label="Next page">
        Next
      </button>
    </nav>
  );
}
