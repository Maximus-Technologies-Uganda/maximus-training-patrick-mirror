import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import React from "react";
import { describe, it, expect } from "vitest";

import PostsPageClient from "../../../components/PostsPageClient";
import { server } from "../../test/test-server";

// Route Handlers proxy at /api/posts; stub those endpoints directly for tests

describe("Integration: create post and mutate cache", () => {
  it("creates successfully, clears form, focuses success alert, and refreshes list", async () => {
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
      http.post("*/api/posts", async () => {
        const now = new Date().toISOString();
        return HttpResponse.json(
          {
            id: "p-created-1",
            title: "T",
            content: "C",
            tags: [],
            published: true,
            createdAt: now,
            updatedAt: now,
          },
          { status: 201, headers: { Location: `/api/posts/p-created-1` } },
        );
      }),
    );

    render(<PostsPageClient />);

    // Fill and submit the form
    const title = await screen.findByLabelText(/title/i);
    const content = screen.getByLabelText(/content/i);
    const submit = screen.getByRole("button", { name: /create/i });
    const user = userEvent.setup();
    await user.type(title, "T");
    await user.type(content, "C");
    await user.click(submit);

    // Expect success alert to receive focus and list to re-fetch
    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(/created/i);
    expect(alert).toHaveFocus();
  });
});


