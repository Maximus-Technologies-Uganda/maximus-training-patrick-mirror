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
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstPage}
        aria-label="Previous page"
        className="px-3 py-2 text-sm font-medium text-text bg-surface border border-text-muted/40 rounded-md hover:bg-surface/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      <span aria-current="page" className="text-sm text-text font-medium px-2">
        Page {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={isLastPage}
        aria-label="Next page"
        className="px-3 py-2 text-sm font-medium text-text bg-surface border border-text-muted/40 rounded-md hover:bg-surface/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </nav>
  );
}
