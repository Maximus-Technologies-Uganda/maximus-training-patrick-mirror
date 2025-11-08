"use client";

import React from "react";

const PAGE_SIZES = [5, 10, 20, 50];

export default function PageSizeSelect({
  pageSize,
  onChangeAction,
}: {
  pageSize: number;
  onChangeAction: (nextSize: number) => void;
}): React.ReactElement {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const parsed = parseInt(e.target.value, 10);

    // Validate: ensure it's a valid number and one of the allowed page sizes
    if (!isNaN(parsed) && PAGE_SIZES.includes(parsed)) {
      onChangeAction(parsed);
    }
    // If invalid, silently ignore (maintains current pageSize)
  };

  return (
    <label className="text-sm text-gray-700">
      Page size
      <select
        aria-label="Page size"
        className="ml-2 rounded border border-gray-300 px-2 py-1"
        value={pageSize}
        onChange={handleChange}
      >
        {PAGE_SIZES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
    </label>
  );
}
