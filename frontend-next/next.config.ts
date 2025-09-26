import type { NextConfig } from "next";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";
// Infer repository name from GitHub Actions env or allow manual override
const inferredRepoName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "Training";
const configuredBasePath = process.env.NEXT_BASE_PATH ?? (isProduction ? `/${inferredRepoName}` : "");

const nextConfig: NextConfig = {
  // Enable static HTML export for GitHub Pages deployment
  output: "export",
  // Ensure images work without the Next Image Optimization server
  images: { unoptimized: true },
  // Ensure pages and assets are served from the GitHub Pages subdirectory
  basePath: configuredBasePath || undefined,
  assetPrefix: configuredBasePath ? `${configuredBasePath}/` : undefined,
  // Silence monorepo root inference warning in this workspace
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;
