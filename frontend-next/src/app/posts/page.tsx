import React from "react";

import PostsPageClient from "../../../components/PostsPageClient";

export const dynamic = "force-dynamic";

type PageSearchParams = { page?: string; pageSize?: string };

function buildPostsApiUrl(apiBaseUrl: string, page: number, pageSize: number): URL {
  const postsApiUrl = new URL("/posts", apiBaseUrl);
  postsApiUrl.searchParams.set("page", String(page));
  postsApiUrl.searchParams.set("pageSize", String(pageSize));
  return postsApiUrl;
}

async function fetchIsInitialListEmpty(url: URL): Promise<boolean> {
  try {
    const response = await fetch(url.toString(), { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as unknown;
      return Array.isArray(data) && data.length === 0;
    }
  } catch (error) {
    // Logged by caller with more context
  }
  return false;
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}): Promise<React.ReactElement> {
  const incomingQuery = (searchParams ? await searchParams : {}) as PageSearchParams;
  const page = Number(incomingQuery.page ?? "1");
  const pageSize = Number(incomingQuery.pageSize ?? "10");

  // Use 8080 for local to point to the API dev server; avoids self-proxying loops to Next at 3000
  const apiBaseUrl = process.env.API_BASE_URL ?? "http://localhost:8080";
  const postsApiUrl = buildPostsApiUrl(apiBaseUrl, page, pageSize);

  let isEmptyInitially = false;
  try {
    isEmptyInitially = await fetchIsInitialListEmpty(postsApiUrl);
  } catch (error) {
    console.error("SSR /posts initial fetch error", {
      url: postsApiUrl.toString(),
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


