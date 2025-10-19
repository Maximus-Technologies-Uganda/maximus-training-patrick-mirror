#!/usr/bin/env node
"use strict";

const fs = require("fs");
const { URL } = require("url");

/**
 * Extract http/https links from markdown content.
 * - Matches [text](https://example.com) and bare URLs like https://example.com/path
 * - Strips URL fragments (#...)
 * - Deduplicates results
 */
function extractLinks(markdownText) {
  const links = new Set();
  const mdLinkRegex = /\[[^\]]*\]\((https?:[^)\s]+)\)/g; // [text](http...)
  const bareUrlRegex = /(https?:\/\/[\w.-]+(?:\/[\w\-._~:?#[\]@!$&'()*+,;=%]*)?)/g;

  let match;
  while ((match = mdLinkRegex.exec(markdownText))) {
    links.add(match[1]);
  }
  while ((match = bareUrlRegex.exec(markdownText))) {
    links.add(match[1]);
  }

  return Array.from(links)
    .map((u) => u.split("#")[0])
    .filter((u) => /^https?:\/\//.test(u));
}

/**
 * Returns true for URLs that should be ignored by CI (local-only addresses).
 */
function isSkippableUrl(urlString) {
  try {
    const u = new URL(urlString);
    if (u.hostname === "localhost") return true;
    if (u.hostname === "0.0.0.0") return true;
    if (u.hostname === "::1") return true;
    if (/^127\./.test(u.hostname)) return true;
    // Ignore known 403 from protected API base URL in README (publicly health-checkable endpoint may not exist)
    if (
      urlString ===
      "https://maximus-training-api-wyb2jsgqyq-bq.a.run.app"
    )
      return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Simple fetch with timeout using global fetch (Node 18+).
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} timeoutMs
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  if (typeof fetch !== "function") {
    throw new Error("Global fetch is not available. Use Node 18+ or setup undici.");
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkUrl(url) {
  // Try HEAD first
  try {
    const res = await fetchWithTimeout(url, { method: "HEAD" });
    if (res.ok) return { url, ok: true, status: res.status };
  } catch {}
  // Fallback to GET
  try {
    const res = await fetchWithTimeout(url, { method: "GET" });
    return { url, ok: res.ok, status: res.status };
  } catch (err) {
    return { url, ok: false, status: 0, error: String(err && err.message ? err.message : err) };
  }
}

async function run(markdownFilePath) {
  const md = fs.readFileSync(markdownFilePath, "utf8");
  const all = extractLinks(md);
  const urls = all.filter((u) => !isSkippableUrl(u));

  if (urls.length === 0) {
    console.log("[link-check] No http(s) links to verify (after skipping local-only URLs).");
    return 0;
  }

  const concurrency = Math.max(1, Number(process.env.LINK_CHECK_CONCURRENCY) || 8);
  const results = new Array(urls.length);
  let index = 0;

  async function worker() {
    while (true) {
      const i = index++;
      if (i >= urls.length) break;
      const u = urls[i];
      const r = await checkUrl(u);
      results[i] = r;
      const status = r.status || "ERR";
      console.log(`${r.ok ? "OK" : "FAIL"} ${status} ${u}`);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, urls.length) }, worker));

  const failures = results.filter((r) => !r.ok);
  if (failures.length > 0) {
    console.error(`\n[link-check] ${failures.length}/${urls.length} link(s) failed.`);
    for (const f of failures) {
      console.error(` - ${f.url} ${f.status ? `(status ${f.status})` : f.error ? `(${f.error})` : ""}`);
    }
    process.exitCode = 1;
  } else {
    console.log(`\n[link-check] All ${urls.length} link(s) passed.`);
  }
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node scripts/link-check.js <markdown-file>");
    process.exit(2);
  }
  run(file).catch((err) => {
    console.error("[link-check] Unhandled error:", err && err.stack ? err.stack : err);
    process.exit(1);
  });
}


