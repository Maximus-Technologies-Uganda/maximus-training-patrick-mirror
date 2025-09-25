import { http, HttpResponse } from "msw";
import { describe, it, expect } from "vitest";
import { z } from "zod";

import { server } from "../../test/test-server";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const PostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  published: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const PostListSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  hasNextPage: z.boolean(),
  items: z.array(PostSchema),
  totalItems: z.number().optional(),
  totalPages: z.number().optional(),
  currentPage: z.number().optional(),
});

describe("Contract: GET /posts", () => {
  it("returns PostList and respects pagination params", async () => {
    server.use(
      http.get(`${baseUrl}/posts`, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get("page") ?? "1");
        const pageSize = Number(url.searchParams.get("pageSize") ?? "10");

        const now = new Date().toISOString();
        const items = Array.from({ length: Math.min(pageSize, 2) }, (_, idx) => ({
          id: `p${page}-${idx + 1}`,
          title: `Post ${idx + 1}`,
          content: `Content ${idx + 1}`,
          tags: ["t1"],
          published: true,
          createdAt: now,
          updatedAt: now,
        }));

        return HttpResponse.json(
          { page, pageSize, hasNextPage: true, items },
          { status: 200 },
        );
      }),
    );

    const res = await fetch(`${baseUrl}/posts?page=1&pageSize=10`);
    expect(res.status).toBe(200);
    const json = await res.json();

    const parsed = PostListSchema.safeParse(json);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.pageSize).toBe(10);
      expect(Array.isArray(parsed.data.items)).toBe(true);
    }
  });
});


