"use strict";

const path = require("path");

describe("aggregate-results (coverage missing includes path)", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("writes summary with coverage reason containing coverage file path", () => {
    const REPO_ROOT = process.cwd();
    const COVERAGE_PATH = path.join(REPO_ROOT, "coverage", "coverage-summary.json");
    const SUMMARY_PATH = path.join(REPO_ROOT, "gate", "summary.json");

    const writes = [];
    const fsMock = {
      readFileSync: jest.fn((p) => {
        const n = path.normalize(String(p));
        if (n === path.normalize(COVERAGE_PATH)) {
          const err = new Error("ENOENT");
          // @ts-ignore
          err.code = "ENOENT";
          throw err;
        }
        throw Object.assign(new Error("ENOENT"), { code: "ENOENT", path: p });
      }),
      mkdirSync: jest.fn(() => {}),
      writeFileSync: jest.fn((p, data) => {
        writes.push({ path: path.normalize(String(p)), data: String(data) });
      }),
    };

    jest.doMock("fs", () => fsMock);

    const oldArgv = process.argv;
    process.argv = [oldArgv[0], path.join(REPO_ROOT, "scripts", "quality-gate", "aggregate-results.js")];

    jest.isolateModules(() => {
      require(path.join(REPO_ROOT, "scripts", "quality-gate", "aggregate-results.js"));
    });

    const write = writes.find((w) => w.path === path.normalize(SUMMARY_PATH));
    expect(write).toBeTruthy();
    const summary = JSON.parse(write.data);
    expect(typeof summary).toBe("object");
    expect(summary && summary.results && summary.results.coverage).toBeTruthy();
    const reason = String(summary.results.coverage.reason || "");
    expect(reason).toContain(path.join("coverage", "coverage-summary.json"));

    // restore argv
    process.argv = oldArgv;
  });
});


