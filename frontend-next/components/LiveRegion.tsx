"use client";

import React from "react";

export default function LiveRegion({
  message,
}: {
  message: string;
}): JSX.Element {
  return (
    <div role="status" aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}


