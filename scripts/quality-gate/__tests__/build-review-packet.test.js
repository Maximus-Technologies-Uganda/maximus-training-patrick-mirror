"use strict";

const path = require("path");

// Test targets: scripts/quality-gate/build-review-packet.js (T031)
// References:
// - Spec FR-004: specs/005-week-6-finishers/spec.md
// - Plan: specs/005-week-6-finishers/plan.md
// - Tasks: specs/005-week-6-finishers/tasks.md (T031, T060)

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "quality-gate", "build-review-packet.js");
const REVIEW_DIR = path.join(process.cwd(), "docs", "ReviewPacket");
const ZIP_PATH = path.join(process.cwd(), "docs", "review-packet.zip");
const TEMPLATE_PATH = path.join(process.cwd(), "scripts", "quality-gate", "manifest.json.template");

function makeFsMock(options = {}) {
  const existing = new Set((options.existsPaths || []).map((p) => path.normalize(p)));
  const writes = [];
  const copies = [];
  const mkdirs = [];
  const streams = [];

  const fsMock = {
    mkdirSync: jest.fn((dir) => { mkdirs.push(path.normalize(dir)); }),
    existsSync: jest.fn((p) => existing.has(path.normalize(p))),
    readFileSync: jest.fn((p) => {
      const n = path.normalize(p);
      if (n === path.normalize(TEMPLATE_PATH)) {
        const tmpl = options.template || {
          $schema: "./schemas/manifest.schema.json",
          required: ["coverage", "tests", "typecheck", "a11y", "contract", "security", "governance"],
          thresholds: {
            coverage: { statements: 60, branches: 50, functions: 55 },
            a11y: { denyImpacts: ["critical", "serious"] },
            contract: { allowBreaking: false },
            security: { denyLevels: ["high", "critical"] },
          },
        };
        return JSON.stringify(tmpl);
      }
      throw Object.assign(new Error("ENOENT"), { code: "ENOENT", path: p });
    }),
    writeFileSync: jest.fn((p, data) => {
      writes.push({ path: path.normalize(p), data: String(data) });
    }),
    copyFileSync: jest.fn((src, dest) => {
      copies.push({ src: path.normalize(src), dest: path.normalize(dest) });
    }),
    rmSync: jest.fn(),
    createWriteStream: jest.fn(() => {
      const s = {
        _handlers: {},
        on(event, cb) { this._handlers[event] = cb; return this; },
        emit(event) { const h = this._handlers[event]; if (typeof h === "function") h(); },
      };
      streams.push(s);
      return s;
    }),
    // helpers for assertions
    __writes: writes,
    __copies: copies,
    __mkdirs: mkdirs,
    __streams: streams,
    __addExists(p) { existing.add(path.normalize(p)); },
  };
  return fsMock;
}

function makeArchiverMock(fsMock) {
  const api = {
    on: jest.fn(() => api),
    pipe: jest.fn(() => api),
    directory: jest.fn(() => api),
    finalize: jest.fn(() => {
      const last = fsMock.__streams[fsMock.__streams.length - 1];
      // simulate successful archive close
      if (last) last.emit("close");
    }),
  };
  const factory = jest.fn(() => api);
  return { factory, api };
}

function normalizeJsonWrite(writeEntry) {
  const obj = JSON.parse(writeEntry.data);
  return { path: writeEntry.path, obj };
}

describe("build-review-packet (unit)", () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  test("generates manifest and zips ReviewPacket directory via archiver when artifacts exist", async () => {
    const root = process.cwd();
    const pathsThatExist = [
      path.join(root, "gate", "summary.json"),
      path.join(root, "coverage", "coverage-summary.json"),
      path.join(root, "test-results", "summary.json"),
      path.join(root, "typecheck", "results.json"),
      path.join(root, "a11y", "report.json"),
      path.join(root, "contract", "report.json"),
      path.join(root, "security", "audit-summary.json"),
      path.join(root, "governance", "report.json"),
      TEMPLATE_PATH,
      path.join(root, "api", "openapi.json"),
    ];

    const fsMock = makeFsMock({ existsPaths: pathsThatExist });
    const { factory: archiverFactory, api: archiverApi } = makeArchiverMock(fsMock);

    jest.doMock("fs", () => fsMock);
    jest.doMock("child_process", () => ({ spawn: jest.fn() }));
    jest.doMock("archiver", () => archiverFactory);

    const oldArgv = process.argv;
    process.argv = [oldArgv[0], SCRIPT_PATH, "--demo-url", "https://demo.example", "--force"];

    await new Promise((resolve) => {
      jest.isolateModules(() => {
        require(SCRIPT_PATH);
      });
      // wait a macrotask so archiver.finalize triggers stream close
      setImmediate(resolve);
    });

    // Assert a manifest write occurred
    const manifestWrite = fsMock.__writes.find((w) => w.path === path.normalize(path.join(REVIEW_DIR, "manifest.json")));
    expect(manifestWrite).toBeTruthy();
    const { obj: manifest } = normalizeJsonWrite(manifestWrite);

    // Expected basic structure
    expect(manifest).toHaveProperty("inputs");
    expect(manifest).toHaveProperty("references");
    expect(manifest).toHaveProperty("packet");
    expect(typeof manifest.generatedAt).toBe("string");

    // inputs reflect existence
    expect(manifest.inputs.coverage).toBe("coverage/coverage-summary.json");
    expect(manifest.inputs.tests).toBe("test-results/summary.json");
    expect(manifest.inputs.typecheck).toBe("typecheck/results.json");
    expect(manifest.inputs.a11y).toBe("a11y/report.json");
    expect(manifest.inputs.contract).toBe("contract/report.json");
    expect(manifest.inputs.security).toBe("security/audit-summary.json");
    expect(manifest.inputs.governance).toBe("governance/report.json");

    // references include spec/plan/tasks and resolved contract path
    expect(manifest.references.spec).toBe(path.join(root, "specs", "005-week-6-finishers", "spec.md"));
    expect(manifest.references.plan).toBe(path.join(root, "specs", "005-week-6-finishers", "plan.md"));
    expect(manifest.references.tasks).toBe(path.join(root, "specs", "005-week-6-finishers", "tasks.md"));
    expect(manifest.references.contractSourceOfTruth).toBe(path.join(root, "api", "openapi.json"));
    expect(manifest.references.demoUrl).toBe("https://demo.example");

    // packet metadata
    expect(manifest.packet.baseDir).toBe(REVIEW_DIR);
    expect(manifest.packet.zipPath).toBe(ZIP_PATH);
    expect(Array.isArray(manifest.packet.included)).toBe(true);
    // at least the 8 known files (gate summary + 7 dimensions) should be included
    expect(manifest.packet.included.length).toBeGreaterThanOrEqual(8);

    // Archiver used with ReviewPacket dir
    expect(archiverFactory).toHaveBeenCalledWith("zip", { zlib: { level: 9 } });
    expect(archiverApi.directory).toHaveBeenCalledWith(REVIEW_DIR, false);
  });

  test("falls back to OS zip when archiver is unavailable (platform-specific)", async () => {
    const root = process.cwd();
    const pathsThatExist = [
      path.join(root, "gate", "summary.json"),
      path.join(root, "coverage", "coverage-summary.json"),
      path.join(root, "test-results", "summary.json"),
      path.join(root, "typecheck", "results.json"),
      path.join(root, "a11y", "report.json"),
      path.join(root, "contract", "report.json"),
      path.join(root, "security", "audit-summary.json"),
      path.join(root, "governance", "report.json"),
      TEMPLATE_PATH,
    ];

    const fsMock = makeFsMock({ existsPaths: pathsThatExist });
    const spawn = jest.fn(() => ({
      on: (event, cb) => { if (event === "exit") cb(0); },
    }));

    jest.doMock("fs", () => fsMock);
    jest.doMock("child_process", () => ({ spawn }));
    // Make archiver mock return a non-callable to trigger try/catch and fallback
    jest.doMock("archiver", () => ({}));

    const oldArgv = process.argv;
    process.argv = [oldArgv[0], SCRIPT_PATH, "--force"];

    await new Promise((resolve) => {
      jest.isolateModules(() => {
        require(SCRIPT_PATH);
      });
      setImmediate(resolve);
    });

    // Validate fallback command
    expect(spawn).toHaveBeenCalled();
    const [exe, args, opts] = spawn.mock.calls[0];
    if (process.platform === "win32") {
      expect(String(exe).toLowerCase()).toContain("powershell");
      const cmdArg = String(args[args.indexOf("-Command") + 1] || "");
      expect(cmdArg).toContain("Compress-Archive");
      expect(cmdArg).toContain(path.join(REVIEW_DIR, "*"));
      expect(cmdArg).toContain(ZIP_PATH);
    } else {
      expect(String(exe)).toBe("zip");
      expect(args).toEqual(expect.arrayContaining(["-r", "-q", ZIP_PATH, path.basename(REVIEW_DIR)]));
      expect(opts && opts.cwd).toBe(path.dirname(REVIEW_DIR));
    }
  });

  test("handles missing required artifacts by writing manifest and exiting with code 1", () => {
    const fsMock = makeFsMock({ existsPaths: [TEMPLATE_PATH] });
    jest.doMock("fs", () => fsMock);
    jest.doMock("child_process", () => ({ spawn: jest.fn() }));
    jest.doMock("archiver", () => ({ }));

    const exitOrig = process.exit;
    const exitSpy = jest.fn();
    // @ts-ignore
    process.exit = exitSpy;

    const oldArgv = process.argv;
    process.argv = [oldArgv[0], SCRIPT_PATH];

    jest.isolateModules(() => {
      require(SCRIPT_PATH);
    });

    // Two writes: initial manifest, augmented with missingRequired list
    const manifestWrites = fsMock.__writes.filter((w) => w.path === path.normalize(path.join(REVIEW_DIR, "manifest.json")));
    expect(manifestWrites.length).toBeGreaterThanOrEqual(2);
    const second = normalizeJsonWrite(manifestWrites[manifestWrites.length - 1]);
    expect(Array.isArray(second.obj.missingRequired)).toBe(true);
    expect(second.obj.missingRequired.length).toBeGreaterThan(0);

    expect(exitSpy).toHaveBeenCalledWith(1);

    // restore
    process.exit = exitOrig;
  });
});


