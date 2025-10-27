#!/bin/bash

# Test script to run BFF denial e2e tests and save outputs
# This script demonstrates direct API bypass attempts and their rejection

set -e

echo "Running BFF Denial E2E Tests (T077)..."
echo "This script demonstrates that direct API calls bypassing the BFF are properly rejected."

# Change to API directory
cd api

# Run the BFF denial tests
echo "Running tests..."
npm test -- tests/contracts/bff-denial.e2e.spec.ts

# Copy test outputs to packet directory
echo "Copying test outputs to packet/contracts/..."
mkdir -p ../packet/contracts/bff-denial
cp -r tests/contracts/bff-denial/* ../packet/contracts/bff-denial/ 2>/dev/null || true

echo "Test outputs saved to packet/contracts/bff-denial/"
echo "Tests demonstrate:"
echo "1. Direct API calls with bearer tokens (no CSRF) are rejected with 403"
echo "2. Direct API calls with CSRF but no identity headers are rejected with 403"
echo "3. Direct API calls with mismatched identity headers are rejected with 403"
echo "4. Valid BFF calls with proper identity forwarding are accepted"
echo "5. All error responses include proper requestId and Cache-Control headers"
