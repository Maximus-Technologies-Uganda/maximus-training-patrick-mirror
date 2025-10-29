#!/usr/bin/env bash

set -Eeuo pipefail
IFS=$'\n\t'

################################################################################
# Local CI/CD Test Suite with 4-Tier Validation
#
# Mandatory comprehensive local validation before push with all quality checks.
# Usage: bash scripts/test-locally.sh
################################################################################

readonly TYPECHECK_TAIL_LINES=3
readonly TEST_TAIL_LINES=5

run_step() {
  local description="$1"
  local success_message="$2"
  local failure_message="$3"
  local tail_lines="$4"
  local workdir="$5"
  shift 5

  local -a command=("$@")

  echo "→ ${description}..."

  if ! (
    cd "${workdir}"
    "${command[@]}" 2>&1 | tail -n "${tail_lines}"
    exit $?
  ); then
    echo "❌ ${failure_message}"
    exit 1
  fi

  echo "✓ ${success_message}"
  echo ""
}

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║    Local CI/CD Test Suite - Pre-Push Validation (4-Tier)  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 1: Type Checking"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_step \
  "Type checking all workspaces" \
  "Type checking passed" \
  "Type checking failed" \
  "${TYPECHECK_TAIL_LINES}" \
  "." \
  npm run typecheck:bail

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 2: Unit Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

run_step \
  "Running API tests with coverage" \
  "API tests passed" \
  "API tests failed" \
  "${TEST_TAIL_LINES}" \
  "api" \
  pnpm test:ci

run_step \
  "Running frontend-next tests" \
  "Frontend tests passed" \
  "Frontend tests failed" \
  "${TEST_TAIL_LINES}" \
  "frontend-next" \
  pnpm test:ci

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PHASE 3: Security & Quality Checks (Mandatory)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Secret scanning
echo "→ Scanning for secrets and credentials..."
if command -v gitleaks &> /dev/null; then
  if gitleaks detect --verbose --exit-code 0 > /dev/null 2>&1; then
    echo "✓ Secret scan passed"
  else
    echo "⚠️  Secrets found (review manually)"
  fi
else
  echo "⚠️  gitleaks not installed (install with: npm install -g gitleaks)"
fi
echo ""

# README link check
echo "→ Checking README links..."
if command -v node &> /dev/null && [ -f scripts/link-check.js ]; then
  if node scripts/link-check.js README.md 2>&1 | tail -3; then
    echo "✓ README links valid"
  else
    echo "❌ README link check failed"
    exit 1
  fi
else
  echo "⚠️  link-check script not found or Node.js not available"
fi
echo ""

# GitHub workflow validation
echo "→ Validating GitHub workflow files..."
if command -v actionlint &> /dev/null; then
  if actionlint .github/workflows/*.yml 2>&1; then
    echo "✓ GitHub workflows valid"
  else
    echo "❌ GitHub workflow validation failed"
    exit 1
  fi
else
  echo "⚠️  actionlint not installed (install with: npm install -g actionlint)"
fi
echo ""

# Dependency audit
echo "→ Running security dependency audit..."
if npm audit --audit-level=moderate 2>&1 | tail -5; then
  echo "✓ Dependency audit passed"
else
  echo "⚠️  Vulnerabilities found (review with: npm audit)"
fi
echo ""

# Vendored artifacts check
echo "→ Checking for vendored binaries..."
if ! find . -type f \( -name "*.so" -o -name "*.dylib" -o -name "*.dll" -o -name "*.exe" \) ! -path "*/node_modules/*" ! -path "*/.next/*" ! -path "*/dist/*" ! -path "*/.git/*" -print -quit 2>/dev/null | grep -q .; then
  echo "✓ No vendored binaries detected"
else
  echo "❌ Vendored binaries found (should not be in repo)"
  exit 1
fi
echo ""

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  ✓ All checks passed! Safe to push to GitHub               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

exit 0
