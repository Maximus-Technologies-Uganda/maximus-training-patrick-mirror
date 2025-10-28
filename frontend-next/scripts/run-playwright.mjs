#!/usr/bin/env node

import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const cliPath = require.resolve("@playwright/test/cli");

const forwardedArgs = process.argv.slice(2).filter((arg) => arg !== "--");

function runNodeSubprocess(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      stdio: "inherit",
      ...options,
    });

    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code, signal) => {
      if (signal) {
        // Mirror the child signal so CI/local shells behave consistently.
        process.kill(process.pid, signal);
        return;
      }
      if (code === 0) {
        resolve();
        return;
      }
      const error = new Error(`Command failed with exit code ${code}: node ${args.join(" ")}`);
      error.exitCode = code ?? 1;
      reject(error);
    });
  });
}

async function main() {
  const shouldInstallBrowsers = process.env.PLAYWRIGHT_SKIP_BROWSER_INSTALL !== "1";

  if (shouldInstallBrowsers) {
    console.log("Ensuring Playwright browsers are installed (set PLAYWRIGHT_SKIP_BROWSER_INSTALL=1 to skip)…");
    const browsers = (process.env.PLAYWRIGHT_BROWSERS ?? "chromium")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean);
    const installArgs = process.env.PLAYWRIGHT_INSTALL_WITH_DEPS === "1"
      ? ["install", "--with-deps", ...browsers]
      : ["install", ...browsers];
    try {
      await runNodeSubprocess([cliPath, ...installArgs]);
    } catch (error) {
      if (installArgs.includes("--with-deps")) {
        console.warn("playwright install --with-deps failed; retrying without system dependencies", error);
        await runNodeSubprocess([cliPath, "install", ...browsers]);
      } else {
        throw error;
      }
    }
  }

  await runNodeSubprocess([cliPath, "test", ...forwardedArgs]);
}

main().catch((error) => {
  if (typeof error?.exitCode === "number") {
    process.exit(error.exitCode);
  }
  console.error("Failed to launch Playwright:", error);
  process.exit(1);
});
