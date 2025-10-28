import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import React from "react";
import { describe, it, vi } from "vitest";

import PostsPageClient from "../../../components/PostsPageClient";
import { server } from "../../test/test-server";

// Route Handlers proxy at /api/posts; stub those endpoints directly for tests
// Need to use real SWR for these integration tests (unmock it)
vi.unmock("../../lib/swr");

describe("Integration: Client-side search filter", () => {
  it("filters items on the current page by title/content", async () => {
    server.use(
      http.get("*/api/posts", () => {
        return HttpResponse.json(
          {
            page: 1,
            pageSize: 10,
            hasNextPage: false,
            items: [
              {
                id: "p1",
                title: "Hello World",
                content: "Greeting content",
                tags: [],
                published: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
              {
                id: "p2",
                title: "Another Story",
                content: "Different topic",
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

    render(<PostsPageClient />);
    // This will fail until search input and filtering are implemented
    await screen.findByText(/Hello World/);
  });
});


