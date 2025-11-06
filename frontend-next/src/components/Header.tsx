import type { ReactElement } from "react";
import Link from "next/link";

export function Header(): ReactElement {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        {/* @ts-expect-error React 18 + Next.js 16 JSX type conflict (expires: 2024-12-06) */}
        <Link href="/" className="text-base font-semibold">
          Frontend Foundations
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-4 text-sm font-medium">
            <li>
              {/* @ts-expect-error React 18 + Next.js 16 JSX type conflict (expires: 2024-12-06) */}
              <Link href="/posts">Posts</Link>
            </li>
            <li>
              {/* @ts-expect-error React 18 + Next.js 16 JSX type conflict (expires: 2024-12-06) */}
              <Link href="/about">About</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
