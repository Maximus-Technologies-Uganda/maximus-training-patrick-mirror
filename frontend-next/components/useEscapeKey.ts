"use client";

import { useEffect } from "react";

/**
 * A11y helper: call `onEscape` when the user presses Escape.
 * Useful for closing modal dialogs or dismissible overlays.
 *
 * NOTE: This hook is provided for future modal implementations (e.g., US2/US3).
 * Currently not used in US1 (anonymous reader) as there are no modal dialogs yet.
 *
 * @example
 * function MyModal({ onClose }: { onClose: () => void }) {
 *   useEscapeKey(onClose);
 *   return <div role="dialog">...</div>;
 * }
 */
export function useEscapeKey(onEscape: () => void): void {
  useEffect(() => {
    function onKeydown(e: KeyboardEvent): void {
      if (e.key === "Escape") onEscape();
    }
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [onEscape]);
}

