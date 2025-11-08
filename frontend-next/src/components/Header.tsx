import type { ReactElement } from "react";
import Link from "next/link";

export function Header(): ReactElement {
  return (
    <header className="border-b border-text-muted/20 bg-surface">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-2">
        {/* @ts-expect-error React 18 + Next.js 16 JSX type conflict (expires: 2024-12-06) */}
        <Link href="/" className="text-base font-semibold text-text">
          Frontend Foundations
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-3 text-sm font-medium text-text">
            <li>
              {/* @ts-expect-error React 18 + Next.js 16 JSX type conflict (expires: 2024-12-06) */}
              <Link href="/posts" className="hover:text-primary transition-colors">
                Posts
              </Link>
            </li>
            <li>
              {/* @ts-expect-error React 18 + Next.js 16 JSX type conflict (expires: 2024-12-06) */}
              <Link href="/about" className="hover:text-primary transition-colors">
                About
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
