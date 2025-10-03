#!/bin/bash
# Workload Identity Federation Setup Script
# This script sets up a Workload Identity Pool and OIDC Provider for GitHub Actions

set -e  # Exit on error

echo "=========================================="
echo "Workload Identity Federation Setup"
echo "=========================================="
echo ""

# Task 1: Create the Workload Identity Pool
echo "Task 1: Creating Workload Identity Pool..."
echo "Running: gcloud iam workload-identity-pools create"
echo ""

gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --description="Identity pool for GitHub Actions" \
  --display-name="GitHub Pool"

echo ""
echo "✓ Pool created successfully!"
echo ""

# Capture the pool ID
echo "Fetching the Pool ID..."
POOL_ID=$(gcloud iam workload-identity-pools describe "github-pool" \
  --location="global" \
  --format="value(name)")

echo "Pool ID: $POOL_ID"
echo ""

# Task 2: Create the OIDC Provider
echo "Task 2: Creating OIDC Provider..."
echo "Running: gcloud iam workload-identity-pools providers create-oidc"
echo ""

gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --workload-identity-pool="$POOL_ID" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --location="global" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"

echo ""
echo "✓ OIDC Provider created successfully!"
echo ""

# Display summary
echo "=========================================="
echo "Setup Complete!"
echo "=========================================="
echo ""
echo "Pool ID: $POOL_ID"
echo ""
echo "Next steps:"
echo "1. Configure service account IAM bindings"
echo "2. Update GitHub Actions workflow with the pool and provider details"
echo ""

