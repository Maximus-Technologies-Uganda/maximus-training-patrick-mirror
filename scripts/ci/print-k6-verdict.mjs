import fs from "node:fs";
import path from "node:path";

const defaultSummaryPath = "bench/results/k6-summary.json";
const summaryPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : path.resolve(process.cwd(), defaultSummaryPath);

function coerceNumber(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function appendToSummary(line) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;
  try {
    fs.appendFileSync(summaryFile, `\n${line}\n`, "utf-8");
  } catch (error) {
    console.warn(`[k6] Failed to append to summary: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (!fs.existsSync(summaryPath)) {
  const message = `[k6] No summary found at ${summaryPath}. Skipping threshold verdict.`;
  console.log(message);
  appendToSummary(message);
  process.exit(0);
}

let payload;
try {
  const raw = fs.readFileSync(summaryPath, "utf-8");
  payload = JSON.parse(raw);
} catch (error) {
  console.error(`[k6] Failed to parse summary at ${summaryPath}: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

const metrics = payload?.metrics;
const httpMetric = metrics && typeof metrics === "object" ? metrics.http_req_duration : undefined;
const values = httpMetric && typeof httpMetric === "object" ? httpMetric.values ?? httpMetric : undefined;
const thresholds = httpMetric && typeof httpMetric === "object" ? httpMetric.thresholds : undefined;

const p95 = values && typeof values === "object" ? coerceNumber(values["p(95)"]) : undefined;

let verdictLine = "";
if (thresholds && typeof thresholds === "object") {
  for (const [rule, verdict] of Object.entries(thresholds)) {
    const ok = typeof verdict === "object" && verdict !== null ? Boolean(verdict.ok) : Boolean(verdict);
    const actual =
      typeof verdict === "object" && verdict !== null && "actual" in verdict ? coerceNumber(verdict.actual) : undefined;
    verdictLine = ok ? `✅ k6 threshold met (${rule})` : `❌ k6 threshold failed (${rule})`;
    if (typeof actual === "number") {
      verdictLine += ` — actual ${actual.toFixed(2)}ms`;
    }
    break;
  }
}

if (!verdictLine) {
  verdictLine = "ℹ️ k6 threshold verdict unavailable (no thresholds defined).";
}

if (typeof p95 === "number") {
  verdictLine += ` | p95=${p95.toFixed(2)}ms`;
}

console.log(verdictLine);
appendToSummary(verdictLine);
