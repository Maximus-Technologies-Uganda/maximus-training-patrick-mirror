import type { NextConfig } from "next";
import path from "path";

// T076: Validate required environment variables at boot (but not in Docker production builds)
// Skip validation if NEXT_TELEMETRY_DISABLED is set (Docker production build indicator)
if (process.env.NEXT_TELEMETRY_DISABLED !== "1") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { validateFrontendEnvOnBoot } = require("./src/config/env");
    validateFrontendEnvOnBoot();
  } catch (error) {
    console.warn("Warning: Could not validate frontend env config:", error);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Default output mode works better with next start in Docker
  // output: "standalone", // Commented out - use default mode instead

  // Good practice for Docker deployments.
  images: { unoptimized: true },

  // Necessary if you are in a monorepo (e.g., with a `packages` or `libs` folder).
  // If `frontend-next` is your root, you can safely remove this line.
  outputFileTracingRoot: path.join(__dirname, ".."),

  // Headers for BFF API routes (development CORS support)
  async headers() {
    // Only apply minimal CORS headers in development
    // Production CORS is handled by the API server
    if (process.env.NODE_ENV === "development") {
      return [
        {
          source: "/api/:path*",
          headers: [
            {
              key: "Access-Control-Allow-Origin",
              value: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
            },
            {
              key: "Access-Control-Allow-Methods",
              value: "GET, POST, PUT, PATCH, DELETE, OPTIONS",
            },
            {
              key: "Access-Control-Allow-Headers",
              value: "Content-Type, Authorization, X-CSRF-Token, X-Request-Id",
            },
            {
              key: "Access-Control-Max-Age",
              value: "600",
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
