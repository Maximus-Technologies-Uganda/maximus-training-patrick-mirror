import { render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { http, HttpResponse } from "msw";
import React from "react";
import { describe, it, vi } from "vitest";

import PostsPageClient from "../../../components/PostsPageClient";
import { server } from "../../test/test-server";

// Route Handlers proxy at /api/posts; stub those endpoints directly for tests
// Need to use real SWR for these integration tests (unmock it)
vi.unmock("../../lib/swr");

describe("Integration: Posts list states", () => {
  it("shows loading then success state with items", async () => {
    server.use(
      http.get("*/api/posts", () => {
        return HttpResponse.json(
          {
            page: 1,
            pageSize: 10,
            hasNextPage: true,
            items: [
              {
                id: "p1",
                title: "Title 1",
                content: "Content 1",
                tags: [],
                published: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          { status: 200 },
        );
      }),
    );

  console.debug('[diag][posts.list] globalThis.fetch before render ->', globalThis.fetch);
  console.debug('[diag][posts.list] typeof fetch ->', typeof globalThis.fetch);

  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PostsPageClient />
    </SWRConfig>,
  );

    // Expect loading first (to be implemented)
    // expect(screen.getByRole("status")).toHaveTextContent(/loading/i);

    // Then success list
    // This will fail until the component renders items
    await screen.findByText(/Title 1/);
  });

  it("shows empty state when no items", async () => {
    server.use(
      http.get("*/api/posts", () => {
        return HttpResponse.json(
          { page: 1, pageSize: 10, hasNextPage: false, items: [] },
          { status: 200 },
        );
      }),
    );

  console.debug('[diag][posts.list] globalThis.fetch before render ->', globalThis.fetch);
  console.debug('[diag][posts.list] typeof fetch ->', typeof globalThis.fetch);

  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PostsPageClient />
    </SWRConfig>,
  );
    // This will fail until empty state is implemented
    await screen.findByText(/no posts yet/i);
  });

  it("shows error state and retry on failure", async () => {
    server.use(
      http.get("*/api/posts", () => {
        return HttpResponse.json(
          { message: "Server error" },
          { status: 500 },
        );
      }),
    );

  console.debug('[diag][posts.list] globalThis.fetch before render ->', globalThis.fetch);
  console.debug('[diag][posts.list] typeof fetch ->', typeof globalThis.fetch);

  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PostsPageClient />
    </SWRConfig>,
  );
    // This will fail until error state is implemented
    await screen.findByText(/error/i);
  });
});


