#!/usr/bin/env node
"use strict";

const fs = require("fs");

// Usage: invoked by git with path to todo file as argv[2]
const todoPath = process.argv[2];
if (!todoPath) process.exit(0);

// Configure via env to avoid hard-coding repo-specific SHAs
// Usage example:
//   REBASE_DUP_SHA_PREFIX=abc1234 REBASE_TARGET_SHA_PREFIX=def5678 \
//   GIT_SEQUENCE_EDITOR="node scripts/rebase-sequence-editor.js" git rebase -i <base>
const DUP_SHA_PREFIX = process.env.REBASE_DUP_SHA_PREFIX || ""; // duplicate commit to squash
const TARGET_SHA_PREFIX = process.env.REBASE_TARGET_SHA_PREFIX || ""; // earlier commit to squash into

try {
  const raw = fs.readFileSync(todoPath, "utf8");
  const lines = raw.split(/\r?\n/);

  const isPickLine = (ln) => /^pick\s+[0-9a-f]{7,40}\b/.test(ln);
  const findIndexByShaPrefix = (prefix) => lines.findIndex((ln) => isPickLine(ln) && ln.includes(prefix));

  if (!DUP_SHA_PREFIX || !TARGET_SHA_PREFIX) {
    // No configuration; leave sequence unchanged
    process.exit(0);
  }

  const idxDup = findIndexByShaPrefix(DUP_SHA_PREFIX);
  const idxTarget = findIndexByShaPrefix(TARGET_SHA_PREFIX);

  if (idxDup === -1 || idxTarget === -1) {
    // Nothing to change
    process.exit(0);
  }

  let dupLine = lines[idxDup];
  // Remove duplicate line from current position
  lines.splice(idxDup, 1);

  // Change 'pick' to 'fixup' to squash into previous line
  dupLine = dupLine.replace(/^pick\b/, "fixup");

  // Insert immediately after target line (account for index shift after removal)
  const targetIdxAfterRemoval = findIndexByShaPrefix(TARGET_SHA_PREFIX);
  const insertAt = targetIdxAfterRemoval + 1;
  lines.splice(insertAt, 0, dupLine);

  fs.writeFileSync(todoPath, lines.join("\n"), "utf8");
  process.exit(0);
} catch (_err) {
  // On any error, write back original and exit; rebase will continue unchanged
  try { fs.writeFileSync(todoPath, fs.readFileSync(todoPath, "utf8"), "utf8"); } catch {}
  process.exit(0);
}
