import React from "react";

import PostsPageClient from "../../../components/PostsPageClient";

export const dynamic = "force-dynamic";

type PageSearchParams = { page?: string; pageSize?: string };

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}): Promise<React.ReactElement> {
  const resolved = (searchParams ? await searchParams : {}) as PageSearchParams;
  const page = Number(resolved.page ?? "1");
  const pageSize = Number(resolved.pageSize ?? "10");

  // Use 8080 for local to point to the API dev server; avoids self-proxying loops to Next at 3000
  const base = process.env.API_BASE_URL ?? "http://localhost:8080";
  const url = new URL("/posts", base);
  url.searchParams.set("page", String(page));
  url.searchParams.set("pageSize", String(pageSize));

  let isEmptyInitially = false;
  try {
    const res = await fetch(url.toString(), { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as unknown;
      if (Array.isArray(data) && data.length === 0) {
        isEmptyInitially = true;
      }
    }
  } catch (error) {
    console.error("SSR /posts initial fetch error", {
      url: url.toString(),
      page,
      pageSize,
      error,
    });
    // On failures, do not block render; client will handle error state
  }

  if (isEmptyInitially) {
    return (
      <main className="mx-auto max-w-3xl p-4">
        <h1 className="text-2xl font-bold text-gray-900">Posts</h1>
        <section className="mt-6" aria-label="Posts list">
          <p className="text-gray-600">No posts yet</p>
        </section>
      </main>
    );
  }

  return <PostsPageClient page={page} pageSize={pageSize} />;
}


