#!/bin/bash
set -euo pipefail

# Check if any workspace has zero coverage
# Usage: bash scripts/check-coverage-nonzero.sh api frontend-next expense quote todo

has_error=0

for workspace in "$@"; do
  summary="${workspace}/coverage/coverage-summary.json"

  if [ ! -f "$summary" ]; then
    echo "⚠️  SKIP: ${workspace} (no coverage file found)"
    continue
  fi

  # Extract coverage percentages
  statements=$(jq '.total.statements.pct // 0' "$summary" 2>/dev/null || echo "0")
  lines=$(jq '.total.lines.pct // 0' "$summary" 2>/dev/null || echo "0")

  # Check if zero
  if (( $(echo "$statements <= 0" | bc -l) )) || (( $(echo "$lines <= 0" | bc -l) )); then
    echo "❌ FAIL: ${workspace} has zero coverage!"
    echo "   statements=${statements}% | lines=${lines}%"
    has_error=1
  else
    echo "✅ PASS: ${workspace} (statements=${statements}% | lines=${lines}%)"
  fi
done

if [ $has_error -eq 0 ]; then
  echo ""
  echo "🎉 All workspaces have non-zero coverage!"
else
  echo ""
  echo "❌ Fix zero-coverage failures above"
fi

exit $has_error
