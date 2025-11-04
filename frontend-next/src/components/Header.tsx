import Link from "next/link";

export function Header(): JSX.Element {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-base font-semibold">
          Frontend Foundations
        </Link>
        <nav aria-label="Primary">
          <ul className="flex items-center gap-4 text-sm font-medium">
            <li>
              <Link href="/posts">Posts</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
