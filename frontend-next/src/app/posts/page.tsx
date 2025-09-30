import React from "react";

import PostsPageClient from "../../../components/PostsPageClient";

export const dynamic = "force-static";

export default function Page({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // Intentionally do not await or use searchParams to keep the page static-export compatible.
  return <PostsPageClient />;
}


