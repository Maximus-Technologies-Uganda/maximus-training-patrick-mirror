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

const PostCreateSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string()).optional(),
  published: z.boolean().optional(),
});

describe("Contract: POST /posts", () => {
  it("returns 201, Location header, and Post body", async () => {
    server.use(
      http.post(`${baseUrl}/posts`, async ({ request }) => {
        const body = (await request.json()) as unknown;
        const parsed = PostCreateSchema.safeParse(body);
        if (!parsed.success) {
          return HttpResponse.json({ message: "Invalid body" }, { status: 400 });
        }
        const now = new Date().toISOString();
        const id = "p-created-1";
        const post = {
          id,
          title: parsed.data.title,
          content: parsed.data.content,
          tags: parsed.data.tags ?? [],
          published: parsed.data.published ?? true,
          createdAt: now,
          updatedAt: now,
        };
        return HttpResponse.json(post, {
          status: 201,
          headers: { Location: `${baseUrl}/posts/${id}` },
        });
      }),
    );

    const res = await fetch(`${baseUrl}/posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Hello", content: "World" }),
    });

    expect(res.status).toBe(201);
    const location = res.headers.get("Location");
    expect(location).toMatch(/\/posts\//);

    const json = await res.json();
    const parsed = PostSchema.safeParse(json);
    expect(parsed.success).toBe(true);
  });
});


