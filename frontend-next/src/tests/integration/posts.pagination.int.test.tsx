import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import React from "react";
import { describe, it } from "vitest";

import PostsPageClient from "../../../components/PostsPageClient";
import { server } from "../../test/test-server";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

describe("Integration: Pagination and URL sync", () => {
  it("navigates to page 2 and updates URL query and focus", async () => {
    server.use(
      http.get(`${baseUrl}/posts`, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        const pageSize = Number(url.searchParams.get("pageSize") ?? "10");
        return HttpResponse.json(
          {
            page,
            pageSize,
            hasNextPage: page < 3,
            items: [
              {
                id: `p${page}-1`,
                title: `Title ${page}`,
                content: `Content ${page}`,
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

    // Initialize URL
    window.history.replaceState({}, "", "/posts?page=1&pageSize=10");

    const user = userEvent.setup();
    render(<PostsPageClient />);

    // Click next and expect URL to update and list heading focused
    const next = await screen.findByRole("button", { name: /next/i });
    await user.click(next);

    // These assertions will fail until component implements URL sync + focus
    expect(window.location.search).toContain("page=2");
    expect(window.location.search).toContain("pageSize=10");
    const heading = await screen.findByRole("heading", { name: /posts/i });
    expect(heading).toHaveFocus();
  });
});


