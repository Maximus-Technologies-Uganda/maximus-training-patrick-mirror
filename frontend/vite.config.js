import { defineConfig } from 'vite';

export default defineConfig({
  // Allow overriding the base path for GitHub Pages deployments
  base: process.env.APP_BASE || '/',
});
