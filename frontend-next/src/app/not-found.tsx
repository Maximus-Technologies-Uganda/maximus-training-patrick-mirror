import Link from "next/link";

export default function NotFound(): React.ReactElement {
  return (
    <main style={{ padding: "2rem" }}>
      <h1 style={{ marginBottom: "0.5rem" }}>404 - Page Not Found</h1>
      <p style={{ marginBottom: "1rem" }}>
        The page you are looking for does not exist.
      </p>
      <p>
        Go back to <Link href="/posts">/posts</Link>.
      </p>
    </main>
  );
}


