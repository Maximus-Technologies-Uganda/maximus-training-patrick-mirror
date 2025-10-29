import fs from "node:fs";
import path from "node:path";
import request from "supertest";
import app from "#tsApp";

describe("/health contract drift guard", () => {
  function loadHealthExample(): Record<string, unknown> {
    const specPath = path.resolve(__dirname, "..", "..", "openapi.json");
    const raw = fs.readFileSync(specPath, "utf-8");
    const document = JSON.parse(raw) as Record<string, unknown>;
    const paths = document.paths as Record<string, unknown> | undefined;
    const health = (paths?.["/health"] as Record<string, unknown> | undefined) ?? undefined;
    const get = (health?.get as Record<string, unknown> | undefined) ?? undefined;
    const responses = (get?.responses as Record<string, unknown> | undefined) ?? undefined;
    const twoHundred = (responses?.["200"] as Record<string, unknown> | undefined) ?? undefined;
    const content = (twoHundred?.content as Record<string, unknown> | undefined) ?? undefined;
    const appJson = (content?.["application/json"] as Record<string, unknown> | undefined) ?? undefined;
    const examples = (appJson?.examples as Record<string, unknown> | undefined) ?? undefined;
    const example =
      (examples?.default as { value?: unknown } | undefined)?.value ?? appJson?.example ?? null;
    if (!example || typeof example !== "object") {
      throw new Error("Expected /health OpenAPI example to exist (examples.default.value or example)");
    }
    return example as Record<string, unknown>;
  }

  it("fails if runtime fields diverge from documented example", async () => {
    const res = await request(app).get("/health").set("Accept", "application/json");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/application\/json/);
    const body = res.body as Record<string, unknown>;
    expect(body).toBeTruthy();

    const example = loadHealthExample();
    const responseKeys = Object.keys(body).sort();
    const specKeys = Object.keys(example).sort();

    expect(responseKeys).toEqual(specKeys);
  });
});
