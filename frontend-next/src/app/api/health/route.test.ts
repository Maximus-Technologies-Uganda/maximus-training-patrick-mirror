import { describe, it, expect } from "vitest";
import { GET } from "./route";

describe("GET /api/health (route handler)", () => {
  it("returns 200 with {status:'ok'} JSON", async () => {
    const res = await GET(new Request("http://localhost/api/health"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    const json = await res.json();
    expect(json).toEqual({ status: "ok" });
  });
});


