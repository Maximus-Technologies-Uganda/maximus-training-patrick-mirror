import type { NextConfig } from "next";
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // This is the most important line for your Docker build.
  output: "standalone",

  // Good practice for Docker deployments.
  images: { unoptimized: true },
  
  // Necessary if you are in a monorepo (e.g., with a `packages` or `libs` folder).
  // If `frontend-next` is your root, you can safely remove this line.
  outputFileTracingRoot: path.join(__dirname, ".."),
};

export default nextConfig;