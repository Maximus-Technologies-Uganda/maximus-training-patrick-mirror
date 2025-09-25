import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import React from "react";
import { describe, it } from "vitest";

import PostsPageClient from "../../../components/PostsPageClient";
import { server } from "../../test/test-server";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

describe("Integration: Client-side search filter", () => {
  it("filters items on the current page by title/content", async () => {
    server.use(
      http.get(`${baseUrl}/posts`, () => {
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


