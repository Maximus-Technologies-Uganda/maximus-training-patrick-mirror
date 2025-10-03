# Workload Identity Federation Setup Script (PowerShell)
# This script sets up a Workload Identity Pool and OIDC Provider for GitHub Actions

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Workload Identity Federation Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Task 1: Create the Workload Identity Pool
Write-Host "Task 1: Creating Workload Identity Pool..." -ForegroundColor Yellow
Write-Host "Running: gcloud iam workload-identity-pools create" -ForegroundColor Gray
Write-Host ""

gcloud iam workload-identity-pools create "github-pool" `
  --location="global" `
  --description="Identity pool for GitHub Actions" `
  --display-name="GitHub Pool"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to create pool" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ Pool created successfully!" -ForegroundColor Green
Write-Host ""

# Capture the pool ID
Write-Host "Fetching the Pool ID..." -ForegroundColor Yellow
$POOL_ID = gcloud iam workload-identity-pools describe "github-pool" `
  --location="global" `
  --format="value(name)"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to fetch pool ID" -ForegroundColor Red
    exit 1
}

Write-Host "Pool ID: $POOL_ID" -ForegroundColor Green
Write-Host ""

# Task 2: Create the OIDC Provider
Write-Host "Task 2: Creating OIDC Provider..." -ForegroundColor Yellow
Write-Host "Running: gcloud iam workload-identity-pools providers create-oidc" -ForegroundColor Gray
Write-Host ""

gcloud iam workload-identity-pools providers create-oidc "github-provider" `
  --workload-identity-pool="$POOL_ID" `
  --issuer-uri="https://token.actions.githubusercontent.com" `
  --location="global" `
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to create OIDC provider" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✓ OIDC Provider created successfully!" -ForegroundColor Green
Write-Host ""

# Display summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Pool ID: $POOL_ID" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Configure service account IAM bindings"
Write-Host "2. Update GitHub Actions workflow with the pool and provider details"
Write-Host ""

