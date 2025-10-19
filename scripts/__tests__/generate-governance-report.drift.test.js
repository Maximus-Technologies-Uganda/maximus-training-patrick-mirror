"use strict";

const path = require("path");

describe("generate-governance-report (version drift warnings)", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("embeds warnings.versionDrift with major drift detection", () => {
    const REPO_ROOT = process.cwd();
    const LOCK_PATH = path.join(REPO_ROOT, "package-lock.json");
    const OUT_PATH = path.join(REPO_ROOT, "governance", "report.json");

    const writes = [];
    const fsMock = {
      existsSync: jest.fn((p) => path.normalize(String(p)) === path.normalize(LOCK_PATH)),
      readFileSync: jest.fn((p) => {
        const n = path.normalize(String(p));
        if (n === path.normalize(LOCK_PATH)) {
          // Minimal lockfile structure mixing versions in lock.packages
          const lock = {
            lockfileVersion: 3,
            packages: {
              "": { name: "root", version: "0.0.0" },
              "node_modules/example": { version: "1.2.3" },
              "packages/a/node_modules/example": { version: "2.0.0" },
            },
          };
          return JSON.stringify(lock);
        }
        return "";
      }),
      mkdirSync: jest.fn(() => {}),
      writeFileSync: jest.fn((p, data) => {
        writes.push({ path: path.normalize(String(p)), data: String(data) });
      }),
    };

    jest.doMock("fs", () => fsMock);

    const scriptPath = path.join(REPO_ROOT, "scripts", "generate-governance-report.js");
    const oldArgv = process.argv;
    process.argv = [oldArgv[0], scriptPath, "--out", OUT_PATH];

    jest.isolateModules(() => {
      require(scriptPath);
    });

    const write = writes.find((w) => w.path === path.normalize(OUT_PATH));
    expect(write).toBeTruthy();
    const report = JSON.parse(write.data);
    expect(report && report.warnings && report.warnings.versionDrift).toBeTruthy();
    const drift = report.warnings.versionDrift;
    const pkg = drift.find((d) => d.package === "example");
    expect(pkg).toBeTruthy();
    expect(Array.isArray(pkg.versions)).toBe(true);
    expect(pkg.versions).toEqual(expect.arrayContaining(["1.2.3", "2.0.0"]));
    expect(pkg.majorDrift).toBe(true);

    process.argv = oldArgv;
  });
});


