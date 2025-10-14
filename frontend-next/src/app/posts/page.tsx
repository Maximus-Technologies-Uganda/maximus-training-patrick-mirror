import React from "react";
import { cookies } from "next/headers";

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

  // Read session cookie on the server to derive userId without exposing the cookie to the client
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value || "";
  const userId = (() => {
    try {
      const parts = session.split(".");
      if (parts.length !== 3) return null;
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const payload = JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
      return typeof payload.userId === "string" ? payload.userId : null;
    } catch {
      return null;
    }
  })();

  // Always render the client component so interactive controls are available
  // even when the initial list is empty. The client handles empty/loading states.
  return <PostsPageClient page={page} pageSize={pageSize} q={q} currentUserId={userId ?? undefined} />;
}


