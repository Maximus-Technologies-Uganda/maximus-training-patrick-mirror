import React, { useEffect, useState } from "react";
import { LoadingState } from "./LoadingState";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";

type Post = { id: string; title: string; content: string };

export default function PostsPageClient(): React.ReactElement {
  const [data, setData] = useState<Post[] | null | undefined>(undefined);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await fetch("/api/posts?page=1&pageSize=10");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          const err: any = new Error("Fetch error");
          err.info = body;
          err.status = res.status;
          throw err;
        }
        const json = await res.json();
        let items: Post[] = [];
        if (Array.isArray(json)) items = json as Post[];
        else if (json && typeof json === "object" && Array.isArray((json as any).items)) items = (json as any).items as Post[];
        if (mounted) setData(items);
      } catch (e) {
        if (mounted) setError(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error?.info?.message ?? "Error"} />;
  if (!data || data.length === 0) return <EmptyState title="No posts yet" message="There are currently no posts." />;

  return (
    <section aria-label="Posts list" className="mt-4">
      <ul role="list" className="space-y-4">
        {data.map((p) => (
          <li key={p.id} className="rounded border border-gray-200 p-4 shadow-sm bg-white">
            <h3 className="text-lg font-semibold text-gray-900">{p.title}</h3>
            <p className="mt-2 text-gray-700">{p.content}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
