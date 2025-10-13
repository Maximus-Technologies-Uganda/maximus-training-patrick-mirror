import React from "react";

import PostsPageClient from "../../../components/PostsPageClient";

export const dynamic = "force-dynamic";

type PageSearchParams = { page?: string; pageSize?: string; q?: string };
export default async function PostsPage({
  searchParams,
}: {
  searchParams?: Promise<PageSearchParams>;
}): Promise<React.ReactElement> {
  const incomingQuery = (searchParams ? await searchParams : {}) as PageSearchParams;
  const page = Number(incomingQuery.page ?? "1");
  const pageSize = Number(incomingQuery.pageSize ?? "10");
  const q = incomingQuery.q ?? "";

  // Always render the client component so interactive controls are available
  // even when the initial list is empty. The client handles empty/loading states.
  return <PostsPageClient page={page} pageSize={pageSize} q={q} />;
}


