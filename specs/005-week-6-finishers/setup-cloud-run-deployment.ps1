# Cloud Run Deployment Setup Script (PowerShell)
# This script sets up all necessary resources for deploying to Cloud Run with Workload Identity Federation

$ErrorActionPreference = "Stop"

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Cloud Run Deployment Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$PROJECT_ID = "proj-app-dev"
$PROJECT_NUMBER = "673209018655"
$REGION = "us-central1"
$SERVICE_ACCOUNT_NAME = "github-actions-deploy"
$SERVICE_ACCOUNT_EMAIL = "${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
$REPOSITORY_NAME = "Maximus-Technologies-Uganda/maximus-training-patrick-mirror"
$ARTIFACT_REGISTRY_REPO = "cloud-run-images"

Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Project ID: $PROJECT_ID"
Write-Host "  Project Number: $PROJECT_NUMBER"
Write-Host "  Region: $REGION"
Write-Host "  Service Account: $SERVICE_ACCOUNT_EMAIL"
Write-Host "  Repository: $REPOSITORY_NAME"
Write-Host ""

# Step 1: Enable required APIs
Write-Host "Step 1: Enabling required Google Cloud APIs..." -ForegroundColor Yellow
$APIS = @(
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "cloudbuild.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com"
)

foreach ($API in $APIS) {
    Write-Host "  Enabling $API..." -ForegroundColor Gray
    gcloud services enable $API --project=$PROJECT_ID
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to enable APIs" -ForegroundColor Red
    exit 1
}

Write-Host "✓ APIs enabled successfully!" -ForegroundColor Green
Write-Host ""

# Step 2: Create Artifact Registry repository
Write-Host "Step 2: Creating Artifact Registry repository..." -ForegroundColor Yellow
Write-Host "  Creating repository ${ARTIFACT_REGISTRY_REPO}..." -ForegroundColor Gray
gcloud artifacts repositories create $ARTIFACT_REGISTRY_REPO `
    --repository-format=docker `
    --location=$REGION `
    --description="Docker images for Cloud Run deployments" `
    --project=$PROJECT_ID 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Artifact Registry repository created!" -ForegroundColor Green
} else {
    Write-Host "✓ Artifact Registry repository already exists (or check manually)" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Create service account
Write-Host "Step 3: Creating service account..." -ForegroundColor Yellow
Write-Host "  Creating service account ${SERVICE_ACCOUNT_NAME}..." -ForegroundColor Gray
gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME `
    --display-name="GitHub Actions Deployment Service Account" `
    --description="Service account for deploying to Cloud Run from GitHub Actions" `
    --project=$PROJECT_ID 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Service account created!" -ForegroundColor Green
} else {
    Write-Host "✓ Service account already exists (or check manually)" -ForegroundColor Yellow
}
Write-Host ""

# Step 4: Grant IAM roles to service account
Write-Host "Step 4: Granting IAM roles to service account..." -ForegroundColor Yellow
$ROLES = @(
    "roles/run.admin",
    "roles/iam.serviceAccountUser",
    "roles/artifactregistry.writer",
    "roles/cloudbuild.builds.builder"
)

foreach ($ROLE in $ROLES) {
    Write-Host "  Granting $ROLE..." -ForegroundColor Gray
    gcloud projects add-iam-policy-binding $PROJECT_ID `
        --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" `
        --role="$ROLE" `
        --condition=None `
        --quiet
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to grant IAM roles" -ForegroundColor Red
    exit 1
}

Write-Host "✓ IAM roles granted successfully!" -ForegroundColor Green
Write-Host ""

# Step 5: Bind service account to Workload Identity Pool
Write-Host "Step 5: Binding service account to Workload Identity Pool..." -ForegroundColor Yellow

$POOL_NAME = "github-pool"
$PROVIDER_NAME = "github-provider"
$MEMBER = "principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/${POOL_NAME}/attribute.repository/${REPOSITORY_NAME}"

Write-Host "  Member: $MEMBER" -ForegroundColor Gray

gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL `
    --project=$PROJECT_ID `
    --role="roles/iam.workloadIdentityUser" `
    --member="$MEMBER"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to bind service account to Workload Identity Pool" -ForegroundColor Red
    Write-Host "  Make sure the Workload Identity Pool and Provider are set up correctly." -ForegroundColor Yellow
    Write-Host "  Run setup-workload-identity.ps1 first if you haven't already." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Service account bound to Workload Identity Pool!" -ForegroundColor Green
Write-Host ""

# Step 6: Grant Token Creator role to GitHub principal
Write-Host "Step 6: Granting Service Account Token Creator role..." -ForegroundColor Yellow

gcloud iam service-accounts add-iam-policy-binding $SERVICE_ACCOUNT_EMAIL `
    --project=$PROJECT_ID `
    --role="roles/iam.serviceAccountTokenCreator" `
    --member="$MEMBER"

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to grant Service Account Token Creator role" -ForegroundColor Red
    Write-Host "  Ensure the authenticated user has permission to update service account IAM." -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Service Account Token Creator role granted!" -ForegroundColor Green
Write-Host ""

# Display summary
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Resources Created:" -ForegroundColor Yellow
Write-Host "  ✓ Artifact Registry: ${REGION}-docker.pkg.dev/${PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}"
Write-Host "  ✓ Service Account: ${SERVICE_ACCOUNT_EMAIL}"
Write-Host "  ✓ Workload Identity Binding: Configured for ${REPOSITORY_NAME}"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Push your code to the 'development' or 'main' branch"
Write-Host "  2. The GitHub Actions workflow will automatically deploy to Cloud Run"
Write-Host "  3. Find the deployed URL in the workflow output"
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Yellow
Write-Host "  # Check Cloud Run services:"
Write-Host "  gcloud run services list --region=$REGION --project=$PROJECT_ID"
Write-Host ""
Write-Host "  # View service logs:"
Write-Host "  gcloud run services logs read maximus-training-frontend --region=$REGION --project=$PROJECT_ID"
Write-Host ""
Write-Host "  # Get service URL:"
Write-Host "  gcloud run services describe maximus-training-frontend --region=$REGION --project=$PROJECT_ID --format='value(status.url)'"
Write-Host ""

