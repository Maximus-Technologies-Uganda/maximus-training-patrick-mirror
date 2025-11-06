import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import path from "path";

// Force module resolution for 'react' and 'react-dom' to the monorepo root
// copies. Some dependencies (notably @testing-library/react) may resolve a
// nested copy of react/react-dom which causes the "Invalid hook call" errors
// during Vitest runs. Overriding Module.require here ensures a single React
// instance is used across the test runtime.
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Module = require("module");
  const origRequire = Module.prototype.require;
  const monorepoRoot = path.resolve(__dirname, "..", "..", "..");
  // projectRoot should point at the frontend-next package root (two levels up
  // from this file: src/test -> src -> frontend-next)
  const projectRoot = path.resolve(__dirname, "..", "..");
  // Resolve react/react-dom and jsx runtime files from monorepo root and project root
  let rootReactPath: string | null = null;
  let rootReactDomPath: string | null = null;
  let rootReactJsxRuntimePath: string | null = null;
  let rootReactJsxDevRuntimePath: string | null = null;
  let rootReactCjsPath: string | null = null;
  let rootReactDomCjsPath: string | null = null;
  // Paths to our local shims inside the frontend-next package
  const localReactShim = path.resolve(__dirname, "react-shim.cjs");
  const localJsxRuntimeShim = path.resolve(__dirname, "react-jsx-runtime-shim.cjs");
  const localTestingLibraryShim = path.resolve(__dirname, "testing-library-shim.cjs");
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    rootReactPath = require.resolve("react", { paths: [monorepoRoot] });
    try {
      rootReactCjsPath = require.resolve("react/cjs/react.development.js", { paths: [monorepoRoot] });
    } catch (e) {
      // ignore
    }
  } catch (err) {
    // ignore
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    rootReactDomPath = require.resolve("react-dom", { paths: [monorepoRoot] });
    try {
      rootReactDomCjsPath = require.resolve("react-dom/cjs/react-dom-client.development.js", { paths: [monorepoRoot] });
    } catch (e) {
      // ignore
    }
  } catch (err) {
    // ignore
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    rootReactJsxRuntimePath = require.resolve("react/jsx-runtime", { paths: [monorepoRoot] });
  } catch (err) {
    // ignore
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    rootReactJsxDevRuntimePath = require.resolve("react/jsx-dev-runtime", { paths: [monorepoRoot] });
  } catch (err) {
    // ignore
  }

  // If react was resolved from a project-local directory, prefer jsx-runtime
  // files from the same package directory to avoid mixing versions.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    if (rootReactPath) {
      const reactPkgDir = path.dirname(rootReactPath);
      const candidateJsx = path.join(reactPkgDir, "jsx-runtime.js");
      const candidateJsxDev = path.join(reactPkgDir, "jsx-dev-runtime.js");
      if (fs.existsSync(candidateJsx)) {
        rootReactJsxRuntimePath = candidateJsx;
      }
      if (fs.existsSync(candidateJsxDev)) {
        rootReactJsxDevRuntimePath = candidateJsxDev;
      }
    }
  } catch (err) {
    // ignore filesystem checks
  }

  // Prefer our local shims for runtime normalization. If the shim exists,
  // use it as the target for any require('react') or require('react/jsx-runtime')
  // calls so that CJS require paths also receive a normalized module shape.
  try {
    const fs = require("fs");
    if (fs.existsSync(localReactShim)) {
      // Use local shim for all react requires
      rootReactPath = localReactShim;
    }
    if (fs.existsSync(localJsxRuntimeShim)) {
      rootReactJsxRuntimePath = localJsxRuntimeShim;
      rootReactJsxDevRuntimePath = localJsxRuntimeShim;
    }
  } catch (err) {
    // ignore
  }

  // Diagnostic: log resolved jsx runtime paths
  // eslint-disable-next-line no-console
  console.log(`[test-setup] candidate jsx-runtime -> ${rootReactJsxRuntimePath}`);
  // eslint-disable-next-line no-console
  console.log(`[test-setup] candidate jsx-dev-runtime -> ${rootReactJsxDevRuntimePath}`);

  if (rootReactPath || rootReactDomPath) {
    // Helper: ensure the returned React module has both named exports and a
    // `.default` object surface that contains the same functions. Some
    // consumers import React via different interop shapes; normalizing here
    // prevents "default.forwardRef is not a function" and similar runtime
    // errors.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // Cache normalized modules by resolved path to preserve identity
    const __normalizeCache: Record<string, any> = {};
    function normalizeReact(mod: any, resolvedPath?: string) {
      try {
        if (!mod || typeof mod !== "object") return mod;
        // If we have a resolved path, return cached normalized module to
        // ensure all callers receive the exact same object reference.
        if (resolvedPath && __normalizeCache[resolvedPath]) {
          return __normalizeCache[resolvedPath];
        }

        // Mutate the actual module object instead of creating a shallow copy.
        // This preserves identity across require() calls which is critical
        // for React + React DOM to work correctly (shared internals rely on
        // identical module instances).
        if (!("default" in mod) || typeof mod.default !== "object") {
          // eslint-disable-next-line no-console
          console.log("[test-setup] normalizing react module shape (adding .default in-place)");
          try {
            // Prefer to set default to the same module object so identity
            // remains the same for any code checking equality.
            (mod as any).default = mod;
          } catch (e) {
            // If the exports object is non-writable, fall back to returning
            // it as-is to avoid throwing.
          }
        }

        // Ensure known function names exist on both the namespace and the
        // default surface so callers using either interop shape work.
        const fnNames = ["forwardRef", "createContext", "createElement", "useState", "useId"];
        for (const n of fnNames) {
          try {
            if (!(n in mod) && mod.default && n in mod.default) (mod as any)[n] = (mod as any).default[n];
            if (mod.default && !(n in mod.default) && n in mod) (mod as any).default[n] = (mod as any)[n];
          } catch (e) {
            // ignore property assignment failures
          }
        }

        if (resolvedPath) __normalizeCache[resolvedPath] = mod;
      } catch (e) {
        // swallow normalization errors to avoid breaking tests
      }
      return mod;
    }

    // Reentrancy guard: when true the override will call the original
    // require to avoid intercepting requires performed while loading the
    // shims or the real React runtime (prevents circular resolution).
    let __overrideSkip = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Module.prototype.require = function (this: any, request: string) {
      if (__overrideSkip) {
        return origRequire.call(this, request);
      }
      try {
        // Resolve the request to an absolute filename (handles relative paths
        // and internal requires inside packages). If the resolved path points
        // into a nested @testing-library/react node_modules/react or
        // node_modules/react-dom folder, redirect to the hoisted copies.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const resolveFilename = Module._resolveFilename as (id: string, parent: any) => string;
        let resolved: string | null = null;
        try {
          resolved = resolveFilename(request, this);
        } catch (e) {
          // Could not resolve (native module or other), fall through to name-based checks
          resolved = null;
        }

        if (resolved) {
          const normalized = resolved.replace(/\\/g, "/");
          // If anything is resolving inside @testing-library/react's nested
          // folder, force it to use our local testing-library shim which
          // re-exports the hoisted dist entry. This prevents that package
          // from loading its own nested react/react-dom copies.
          try {
            if (normalized.includes("/node_modules/@testing-library/react/") && localTestingLibraryShim && resolved !== localTestingLibraryShim) {
              // eslint-disable-next-line no-console
              console.log(`[test-setup] redirecting nested @testing-library/react ${resolved} -> ${localTestingLibraryShim}`);
              try {
                __overrideSkip = true;
                return origRequire.call(this, localTestingLibraryShim);
              } finally {
                __overrideSkip = false;
              }
            }
          } catch (e) {
            // ignore
          }
          // First, handle jsx-runtime files specifically so they are not
          // accidentally caught by the generic nested react check below.
          try {
            if (rootReactJsxRuntimePath && normalized.includes("/node_modules/react/jsx-runtime") && resolved !== rootReactJsxRuntimePath) {
              // eslint-disable-next-line no-console
              console.log(`[test-setup] redirecting nested react/jsx-runtime ${resolved} -> ${rootReactJsxRuntimePath}`);
              // Return the runtime as-is (do not apply React normalization).
              try {
                __overrideSkip = true;
                return origRequire.call(this, rootReactJsxRuntimePath);
              } finally {
                __overrideSkip = false;
              }
            }
            if (rootReactJsxDevRuntimePath && normalized.includes("/node_modules/react/jsx-dev-runtime") && resolved !== rootReactJsxDevRuntimePath) {
              // eslint-disable-next-line no-console
              console.log(`[test-setup] redirecting nested react/jsx-dev-runtime ${resolved} -> ${rootReactJsxDevRuntimePath}`);
              try {
                __overrideSkip = true;
                return origRequire.call(this, rootReactJsxDevRuntimePath);
              } finally {
                __overrideSkip = false;
              }
            }

            // Redirect any nested react/react-dom resolution (not just the
            // @testing-library/react case) to the hoisted monorepo copies.
            // This catches nested copies under frontend-next/node_modules or
            // other packages that may vendor their own node_modules folder.
            if (rootReactPath) {
              const isNestedReact = (normalized.includes("/node_modules/react/") || normalized.includes("/node_modules/@testing-library/react/node_modules/react/")) && resolved !== rootReactPath;
              const isNestedReactCjs = rootReactCjsPath && normalized.includes("/node_modules/react/cjs/") && resolved !== rootReactCjsPath;
              const isTestingLibNestedReact = normalized.includes("@testing-library/react/node_modules/react");
              if (isNestedReactCjs && rootReactCjsPath) {
                // Prefer redirecting cjs/react.development paths to the cjs file in the hoisted copy
                // eslint-disable-next-line no-console
                console.log(`[test-setup] redirecting nested react (cjs) ${resolved} -> ${rootReactCjsPath}`);
                try {
                  __overrideSkip = true;
                  return normalizeReact(origRequire.call(this, rootReactCjsPath), rootReactCjsPath);
                } finally {
                  __overrideSkip = false;
                }
              }
              if (isNestedReact || isTestingLibNestedReact) {
                // eslint-disable-next-line no-console
                console.log(`[test-setup] redirecting nested react ${resolved} -> ${rootReactPath}`);
                try {
                  __overrideSkip = true;
                  return normalizeReact(origRequire.call(this, rootReactPath), rootReactPath);
                } finally {
                  __overrideSkip = false;
                }
              }
            }
            if (rootReactDomPath) {
              const isNestedReactDom = (normalized.includes("/node_modules/react-dom/") || normalized.includes("/node_modules/@testing-library/react/node_modules/react-dom/")) && resolved !== rootReactDomPath;
              const isNestedReactDomCjs = rootReactDomCjsPath && normalized.includes("/node_modules/react-dom/cjs/") && resolved !== rootReactDomCjsPath;
              const isTestingLibNestedReactDom = normalized.includes("@testing-library/react/node_modules/react-dom");
              if (isNestedReactDomCjs && rootReactDomCjsPath) {
                // Redirect nested CJS react-dom client files to the hoisted cjs file
                // eslint-disable-next-line no-console
                console.log(`[test-setup] redirecting nested react-dom (cjs) ${resolved} -> ${rootReactDomCjsPath}`);
                try {
                  __overrideSkip = true;
                  return normalizeReact(origRequire.call(this, rootReactDomCjsPath), rootReactDomCjsPath);
                } finally {
                  __overrideSkip = false;
                }
              }
              // Extra safety: some packages bundle or require react-dom client files
              // from inside their own folder (for example
              // @testing-library/react/node_modules/react-dom/cjs/...). Catch those
              // specific cases and force them to use the hoisted react-dom entry so
              // the renderer shares internals with the hoisted React.
              try {
                if (normalized.includes("@testing-library/react/node_modules/react-dom/") && rootReactDomPath) {
                  // eslint-disable-next-line no-console
                  console.log(`[test-setup] redirecting nested @testing-library react-dom ${resolved} -> ${rootReactDomPath}`);
                  __overrideSkip = true;
                  return normalizeReact(origRequire.call(this, rootReactDomPath), rootReactDomPath);
                }
              } catch (e) {
                // ignore
              }
              if (isNestedReactDom || isTestingLibNestedReactDom) {
                // eslint-disable-next-line no-console
                console.log(`[test-setup] redirecting nested react-dom ${resolved} -> ${rootReactDomPath}`);
                try {
                  __overrideSkip = true;
                  return normalizeReact(origRequire.call(this, rootReactDomPath), rootReactDomPath);
                } finally {
                  __overrideSkip = false;
                }
              }
            }
          } catch (redirErr) {
            // swallow redirect errors and fall back to original require
          }
        }

        // Fallback name-based mapping for direct requests
        if (request === "react" && rootReactPath) {
          try {
            __overrideSkip = true;
            return normalizeReact(origRequire.call(this, rootReactPath));
          } finally {
            __overrideSkip = false;
          }
        }
        if (request === "react/jsx-runtime" && rootReactJsxRuntimePath) {
          try {
            __overrideSkip = true;
            return normalizeReact(origRequire.call(this, rootReactJsxRuntimePath));
          } finally {
            __overrideSkip = false;
          }
        }
        if (request === "react/jsx-dev-runtime" && rootReactJsxDevRuntimePath) {
          try {
            __overrideSkip = true;
            return normalizeReact(origRequire.call(this, rootReactJsxDevRuntimePath));
          } finally {
            __overrideSkip = false;
          }
        }
        if ((request === "react-dom" || request === "react-dom/client") && rootReactDomPath) {
          try {
            __overrideSkip = true;
            return normalizeReact(origRequire.call(this, rootReactDomPath));
          } finally {
            __overrideSkip = false;
          }
        }
      } catch (err) {
        // ignore and allow original require to run below
      }
      return origRequire.call(this, request);
    };
    // eslint-disable-next-line no-console
    console.log(`[test-setup] forced react -> ${rootReactPath} (projectRoot=${projectRoot})`);
    // eslint-disable-next-line no-console
    console.log(`[test-setup] forced react-dom -> ${rootReactDomPath} (projectRoot=${projectRoot})`);
    // eslint-disable-next-line no-console
    console.log(`[test-setup] forced react/jsx-runtime -> ${rootReactJsxRuntimePath}`);
    // eslint-disable-next-line no-console
    console.log(`[test-setup] forced react/jsx-dev-runtime -> ${rootReactJsxDevRuntimePath}`);
  }
} catch (err) {
  // eslint-disable-next-line no-console
  const _msg = err && (err as any) && (err as any).message ? (err as any).message : String(err);
  console.warn("[test-setup] could not override Module.require:", _msg);
}

// Diagnostic helpers: log which React/react-dom files are resolved and ensure
// that the jsdom `document` global is present when tests run. This helps
// debug intermittent "Invalid hook call" and "document is not defined" errors.
try {
  // Use CommonJS require.resolve for deterministic paths inside Vitest runtime
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const r = require as any;
  const reactPath = r.resolve("react");
  const reactDomPath = r.resolve("react-dom");
  // eslint-disable-next-line no-console
  console.log(`[test-setup] resolved react -> ${reactPath}`);
  // eslint-disable-next-line no-console
  console.log(`[test-setup] resolved react-dom -> ${reactDomPath}`);
} catch (err) {
  // eslint-disable-next-line no-console
  const _msg = err && (err as any) && (err as any).message ? (err as any).message : String(err);
  console.warn("[test-setup] could not resolve react/react-dom:", _msg);
}

// Check jsdom presence
if (typeof document === "undefined") {
  // eslint-disable-next-line no-console
  console.error("[test-setup] WARNING: document is undefined — jsdom may not be active for Vitest tests");
} else {
  // eslint-disable-next-line no-console
  console.log("[test-setup] document is available (jsdom OK)");
}

import { server } from "./test-server";
import { DEFAULT_POST_SORT } from "../lib/schemas";

// Mock Next.js navigation hooks for all tests
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  })),
  usePathname: vi.fn(() => "/posts"),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  useParams: vi.fn(() => ({})),
}));

// Mock useSession hook for all tests
vi.mock("../lib/auth/use-session", () => ({
  useSession: vi.fn(() => ({
    session: null,
    isLoading: false,
    signOut: vi.fn(),
  })),
}));

// Mock SWR hooks - but allow tests to override
const usePostsListMock = vi.fn(() => ({
  data: { items: [], hasNextPage: false, page: 1, pageSize: 10, sort: DEFAULT_POST_SORT },
  isLoading: false,
  error: null,
}));

vi.mock("../lib/swr", () => ({
  usePostsList: usePostsListMock,
  mutatePostsPage1: vi.fn(),
}));

// Export for tests that need to override
export { usePostsListMock };

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());
