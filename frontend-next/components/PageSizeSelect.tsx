"use client";

import React from "react";

const PAGE_SIZES = [5, 10, 20, 50];

export default function PageSizeSelect({
  pageSize,
  onChange,
}: {
  pageSize: number;
  onChange: (nextSize: number) => void;
}): JSX.Element {
  return (
    <label className="text-sm text-gray-700">
      Page size
      <select
        aria-label="Page size"
        className="ml-2 rounded border border-gray-300 px-2 py-1"
        value={pageSize}
        onChange={(e) => onChange(Number(e.target.value))}
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


