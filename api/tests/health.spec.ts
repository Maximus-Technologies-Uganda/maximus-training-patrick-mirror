import request from "supertest";
import app from "#tsApp";

describe("GET /health", () => {
  it("returns service metadata with dependencies", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toBe("no-store");
    expect(res.headers["content-type"]).toMatch(/application\/json/);

    const body = res.body as Record<string, unknown>;
    expect(body.service).toBe("api");
    expect(body.status).toBe("ok");
    expect(typeof body.commit).toBe("string");
    expect(typeof body.time).toBe("string");
    expect(typeof body.uptime_s).toBe("number");

    const dependencies = body.dependencies as Record<string, string>;
    expect(dependencies).toEqual({ firebase: "ok", db: "ok" });
  });
});
