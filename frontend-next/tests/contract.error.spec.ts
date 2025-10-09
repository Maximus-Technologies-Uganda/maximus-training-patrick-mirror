import { describe, it, expect } from "vitest";
import { z } from "zod";
import { http, HttpResponse } from "msw";
import { server } from "../src/test/test-server";

const ErrorEnvelopeSchema = z.object({
  error: z.object({
    code: z.number(),
    message: z.string(),
  }),
});

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

describe("Client Contract Error: envelope for 400/404", () => {
  it("validates 400 error envelope shape", async () => {
    server.use(
      http.get(`${baseUrl}/posts`, () => {
        return HttpResponse.json({ error: { code: 400, message: "Bad request" } }, { status: 400 });
      }),
    );

    const res = await fetch(`${baseUrl}/posts?page=abc`);
    expect(res.status).toBe(400);
    const json = await res.json();
    const parsed = ErrorEnvelopeSchema.safeParse(json);
    expect(parsed.success).toBe(true);
  });

  it("validates 404 error envelope shape", async () => {
    server.use(
      http.get(`${baseUrl}/posts/unknown`, () => {
        return HttpResponse.json({ error: { code: 404, message: "Not found" } }, { status: 404 });
      }),
    );

    const res = await fetch(`${baseUrl}/posts/unknown`);
    expect(res.status).toBe(404);
    const json = await res.json();
    const parsed = ErrorEnvelopeSchema.safeParse(json);
    expect(parsed.success).toBe(true);
  });
});


