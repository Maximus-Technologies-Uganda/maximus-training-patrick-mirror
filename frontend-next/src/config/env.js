const frontendRequiredEnvInProd = ["NEXT_PUBLIC_API_URL"];

function hasFrontendEnvVar(key) {
  return Object.prototype.hasOwnProperty.call(process.env, key);
}

function validateFrontendEnvOnBoot() {
  if (process.env.NODE_ENV !== "production") return;
  const missing = frontendRequiredEnvInProd.filter((key) => !hasFrontendEnvVar(key));
  if (missing.length > 0) {
    throw new Error(`[frontend-config] Missing required env var(s): ${missing.join(", ")}`);
  }
}

module.exports = {
  frontendRequiredEnvInProd,
  validateFrontendEnvOnBoot,
};
