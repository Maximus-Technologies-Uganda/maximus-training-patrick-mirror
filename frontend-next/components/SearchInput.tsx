"use client";

import React, { useEffect, useRef, useState } from "react";

export default function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}): JSX.Element {
  const [input, setInput] = useState<string>(value);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    setInput(value);
  }, [value]);

  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      onChange(input);
    }, 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [input, onChange]);

  return (
    <label className="block text-sm text-gray-700">
      Search
      <input
        aria-label="Search"
        className="mt-1 w-full rounded border border-gray-300 px-2 py-1"
        type="search"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Filter current page…"
      />
    </label>
  );
}


