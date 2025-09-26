import React from "react";

import PostsPageClient from "../../../components/PostsPageClient";

export default function Page({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}): React.ReactElement {
  const rawPage = Array.isArray(searchParams?.page)
    ? searchParams?.page[0]
    : (searchParams?.page as string | undefined);
  const rawPageSize = Array.isArray(searchParams?.pageSize)
    ? searchParams?.pageSize[0]
    : (searchParams?.pageSize as string | undefined);

  const parsedPage = Number(rawPage);
  const parsedPageSize = Number(rawPageSize);

  const page = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const pageSize =
    Number.isFinite(parsedPageSize) && parsedPageSize > 0 ? parsedPageSize : 10;
  const q = Array.isArray(searchParams?.q)
    ? searchParams?.q[0] ?? ""
    : searchParams?.q ?? "";

  return <PostsPageClient page={page} pageSize={pageSize} q={q} />;
}


