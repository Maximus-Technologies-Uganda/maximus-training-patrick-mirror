import type { NextConfig } from "next";
import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // This is the most important line for your Docker build.
  output: "standalone",

  // Good practice for Docker deployments.
  images: { unoptimized: true },
  // Do not block production builds on ESLint errors; CI can lint separately.
  eslint: { ignoreDuringBuilds: true },

  // Necessary if you are in a monorepo (e.g., with a `packages` or `libs` folder).
  // If `frontend-next` is your root, you can safely remove this line.
  outputFileTracingRoot: path.join(__dirname, ".."),

  // Headers for BFF API routes (development CORS support)
  async headers() {
    // Only apply minimal CORS headers in development
    // Production CORS is handled by the API server
    if (process.env.NODE_ENV === 'development') {
      return [
        {
          source: '/api/:path*',
          headers: [
            {
              key: 'Access-Control-Allow-Origin',
              value: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
            },
            {
              key: 'Access-Control-Allow-Methods',
              value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
            },
            {
              key: 'Access-Control-Allow-Headers',
              value: 'Content-Type, Authorization, X-CSRF-Token, X-Request-Id',
            },
            {
              key: 'Access-Control-Max-Age',
              value: '600',
            },
          ],
        },
      ];
    }
    return [];
  },
};

export default nextConfig;