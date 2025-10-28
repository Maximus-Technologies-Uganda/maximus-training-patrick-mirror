import { promises as fs } from "fs";
import path from "path";

function resolveCommitSha(): string {
  const candidates = [process.env.GITHUB_SHA, process.env.VERCEL_GIT_COMMIT_SHA, process.env.COMMIT_SHA];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return "local-dev";
}

async function ensureExists(filePath: string, description: string): Promise<void> {
  try {
    await fs.access(filePath);
  } catch (error) {
    throw new Error(`Missing ${description} at ${filePath}`, { cause: error });
  }
}

async function findVideoFile(dir: string): Promise<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = await findVideoFile(path.join(dir, entry.name));
      if (nested) {
        return nested;
      }
    } else if (entry.isFile()) {
      if (entry.name.endsWith(".webm") || entry.name.endsWith(".mp4")) {
        return path.join(dir, entry.name);
      }
    }
  }
  return "";
}

async function findJsonFile(dir: string): Promise<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = await findJsonFile(path.join(dir, entry.name));
      if (nested) {
        return nested;
      }
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      return path.join(dir, entry.name);
    }
  }
  return "";
}

/**
 * Ensures the Playwright a11y artifacts exist in the expected directory structure.
 */
async function main(): Promise<void> {
  const commitSha = resolveCommitSha();
  const baseDir = path.resolve(process.cwd(), "a11y-frontend-next", commitSha);
  await ensureExists(baseDir, "a11y artifact directory");

  const htmlPath = path.join(baseDir, "index.html");
  await ensureExists(htmlPath, "Playwright HTML report");

  let videoPath = await findVideoFile(baseDir);
  if (!videoPath) {
    throw new Error(`Expected a recorded video (webm/mp4) under ${baseDir}`);
  }
  const preferredVideoPath = path.join(baseDir, "keyboard-only.webm");
  if (path.resolve(videoPath) !== path.resolve(preferredVideoPath)) {
    await fs.copyFile(videoPath, preferredVideoPath);
    videoPath = preferredVideoPath;
  }

  const jsonPath = path.join(baseDir, "axe-results.json");
  try {
    await ensureExists(jsonPath, "axe results JSON");
  } catch (error) {
    const discoveredJson = await findJsonFile(baseDir);
    if (!discoveredJson) {
      throw error;
    }
    await fs.copyFile(discoveredJson, jsonPath);
  }

  // eslint-disable-next-line no-console -- CLI utility for CI diagnostics
  console.log(
    JSON.stringify(
      {
        commitSha,
        html: path.relative(process.cwd(), htmlPath),
        video: path.relative(process.cwd(), videoPath),
        json: path.relative(process.cwd(), jsonPath),
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console -- CLI utility for CI diagnostics
  console.error(error);
  process.exitCode = 1;
});
