import React from "react";

import type { ReactElement } from "react";

export function Header(): ReactElement {
  return (
    <header className="border-b border-text-muted/20 bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
        <a href="/" className="text-base font-semibold text-text">
          Frontend Foundations
        </a>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-3 text-sm font-medium text-text">
            <li>
              <a href="/posts" className="hover:text-primary transition-colors">
                Posts
              </a>
            </li>
            <li>
              <a href="/about" className="hover:text-primary transition-colors">
                About
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
