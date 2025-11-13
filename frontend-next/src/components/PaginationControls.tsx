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
    <nav aria-label="Pagination" className={`flex items-center justify-center gap-3 ${className}`}>
      <button
        type="button"
        onClick={onPrevious}
        disabled={isFirstPage}
        aria-label="Previous page"
        className="px-4 py-2 text-sm font-semibold text-purple-700 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:transform-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 shadow-sm hover:shadow-md"
      >
        Previous
      </button>
      <span
        aria-current="page"
        className="text-sm font-bold text-gray-700 px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-purple-200 transition-all duration-200"
      >
        Page {currentPage} of {totalPages}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={isLastPage}
        aria-label="Next page"
        className="px-4 py-2 text-sm font-semibold text-purple-700 bg-white border-2 border-purple-300 rounded-lg hover:bg-purple-50 hover:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-95 disabled:transform-none focus:outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1 shadow-sm hover:shadow-md"
      >
        Next
      </button>
    </nav>
  );
}
