"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home(): React.ReactElement {
  const router = useRouter();

  useEffect(() => {
    router.replace("/posts");
  }, [router]);

  return (
    <main style={{ padding: "2rem" }}>
      <p>Redirecting to /posts…</p>
      <p>
        If you are not redirected automatically, go to <Link href="/posts">/posts</Link>.
      </p>
    </main>
  );
}
