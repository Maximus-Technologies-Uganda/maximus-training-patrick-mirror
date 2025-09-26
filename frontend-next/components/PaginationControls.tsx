"use client";

import React from "react";

export default function PaginationControls({
  page,
  hasNextPage,
  onChangePage,
}: {
  page: number;
  hasNextPage: boolean;
  onChangePage: (nextPage: number) => void;
}): React.ReactElement {
  const onPrev = (): void => {
    if (page > 1) onChangePage(page - 1);
  };
  const onNext = (): void => {
    if (hasNextPage) onChangePage(page + 1);
  };

  return (
    <div className="mt-6 flex items-center gap-2">
      <button
        type="button"
        className="rounded bg-gray-100 px-3 py-1 text-gray-800 disabled:opacity-50"
        onClick={onPrev}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        Prev
      </button>
      <span aria-live="polite" className="text-sm text-gray-600">
        Page {page}
      </span>
      <button
        type="button"
        className="rounded bg-gray-100 px-3 py-1 text-gray-800 disabled:opacity-50"
        onClick={onNext}
        disabled={!hasNextPage}
        aria-label="Next page"
      >
        Next
      </button>
    </div>
  );
}


