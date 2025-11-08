import { render, screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import React from "react";
import { describe, it, vi } from "vitest";

import PostsPageClient from "@/components/PostsPageClient";
import { server } from "../../test/test-server";

// App proxies the upstream API via Next.js Route Handlers at /api/posts
// Need to use real SWR for these integration tests (unmock it)
vi.unmock("../../lib/swr");

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
          { status: 200 }
        );
      })
    );

    render(<PostsPageClient />);
    // Expect a polite live region to announce loading (use specific selector since there are multiple status roles)
    const liveRegions = screen.getAllByRole("status", { hidden: true });
    const politeLive = liveRegions.find((el) => el.getAttribute("aria-live") === "polite");
    expect(politeLive).toBeDefined();

    // Once loaded, expect a heading and landmark roles
    const heading = await screen.findByRole("heading", { name: /posts/i });
    expect(heading).toBeInTheDocument();
    const section = screen.getByRole("region", { name: /posts list/i });
    expect(section).toBeInTheDocument();
  }, 10000);
});
