import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import React from "react";
import { describe, it } from "vitest";

import PostsPageClient from "../../../components/PostsPageClient";
import { server } from "../../test/test-server";

// App proxies the upstream API via Next.js Route Handlers at /api/posts

describe("A11y: /posts page states have basic roles/labels", () => {
  it("renders loading in aria-live region, then shows content with proper roles", async () => {
    server.use(
      http.get("*/api/posts", () => {
        return HttpResponse.json(
          {
            page: 1,
            pageSize: 10,
            hasNextPage: false,
            items: [],
          },
          { status: 200 },
        );
      }),
    );

    render(<PostsPageClient />);
    // Expect a polite live region to announce loading
    // This will initially fail until live region exists
    const live = screen.getByRole("status");
    expect(live).toHaveAttribute("aria-live", "polite");

    // Once loaded, expect a heading and landmark roles
    const heading = await screen.findByRole("heading", { name: /posts/i });
    expect(heading).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});


