import { describe, it, expect } from "vitest";
import { z } from "zod";
import { http, HttpResponse } from "msw";
import { server } from "../src/test/test-server";

// Define only the fields used by the UI
const UiPostSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const UiPostListSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  hasNextPage: z.boolean(),
  items: z.array(UiPostSchema),
});

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

describe("Client Contract Success: GET /posts contains UI-required fields", () => {
  it("validates list payload for fields used by UI", async () => {
    server.use(
      http.get(`${baseUrl}/posts`, () => {
        const now = new Date().toISOString();
        return HttpResponse.json(
          {
            page: 1,
            pageSize: 10,
            hasNextPage: false,
            items: [
              {
                id: "p1",
                title: "Hello",
                content: "World",
                createdAt: now,
                updatedAt: now,
              },
            ],
          },
          { status: 200 },
        );
      }),
    );

    const res = await fetch(`${baseUrl}/posts?page=1&pageSize=10`);
    expect(res.status).toBe(200);
    const json = await res.json();
    const parsed = UiPostListSchema.safeParse(json);
    expect(parsed.success).toBe(true);
  });
});


