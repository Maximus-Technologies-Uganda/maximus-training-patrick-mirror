# Workload Identity Federation Setup Guide

## Overview
This guide walks you through setting up Workload Identity Federation for GitHub Actions to authenticate with Google Cloud Platform without using service account keys.

## Prerequisites
1. **Google Cloud SDK** installed and configured
2. **Authentication**: Run `gcloud auth login`
3. **Project**: Ensure you're in the correct project with `gcloud config get-value project`
4. **Permissions**: You need the following IAM roles:
   - `roles/iam.workloadIdentityPoolAdmin`
   - `roles/iam.serviceAccountAdmin`

## Quick Start

### Option 1: Automated Script (Recommended)

#### For PowerShell (Windows):
```powershell
cd specs/005-week-6-finishers
.\setup-workload-identity.ps1
```

#### For Bash (Linux/Mac):
```bash
cd specs/005-week-6-finishers
chmod +x setup-workload-identity.sh
./setup-workload-identity.sh
```

### Option 2: Manual Step-by-Step

#### Task 1: Create the Workload Identity Pool
Run this command and copy the full NAME (Pool ID) from the output:

```bash
gcloud iam workload-identity-pools create "github-pool" \
  --location="global" \
  --description="Identity pool for GitHub Actions" \
  --display-name="GitHub Pool"
```

**Expected Output:**
```
Created workload identity pool [github-pool].
NAME: projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool
```

**Copy the NAME value** - you'll need it for Task 2.

#### Task 2: Create the OIDC Provider
Replace `[YOUR_POOL_ID_HERE]` with the NAME you copied from Task 1:

```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --workload-identity-pool="[YOUR_POOL_ID_HERE]" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --location="global" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"
```

**Example with actual Pool ID:**
```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --workload-identity-pool="projects/123456789/locations/global/workloadIdentityPools/github-pool" \
  --issuer-uri="https://token.actions.githubusercontent.com" \
  --location="global" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository"
```

## Verification

Verify the pool was created:
```bash
gcloud iam workload-identity-pools describe "github-pool" --location="global"
```

Verify the provider was created:
```bash
gcloud iam workload-identity-pools providers describe "github-provider" \
  --workload-identity-pool="github-pool" \
  --location="global"
```

## Next Steps

After setting up the Workload Identity Pool and Provider:

### 1. Configure Service Account Binding
```bash
# Replace with your actual values
PROJECT_ID="your-project-id"
PROJECT_NUMBER="your-project-number"
REPO="your-github-org/your-repo"
SERVICE_ACCOUNT="your-service-account@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts add-iam-policy-binding "${SERVICE_ACCOUNT}" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/workloadIdentityPools/github-pool/attribute.repository/${REPO}"
```

### 2. Update GitHub Actions Workflow
Add to your `.github/workflows/*.yml`:

```yaml
jobs:
  deploy:
    permissions:
      contents: read
      id-token: write  # Required for OIDC token
    
    steps:
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: 'projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
          service_account: 'your-service-account@PROJECT_ID.iam.gserviceaccount.com'
```

## Troubleshooting

### Error: "PERMISSION_DENIED"
- Ensure you have `roles/iam.workloadIdentityPoolAdmin` role
- Check your current project: `gcloud config get-value project`

### Error: "Pool already exists"
- The pool may already be created. Verify with:
  ```bash
  gcloud iam workload-identity-pools list --location="global"
  ```

### Error: "Provider already exists"
- The provider may already exist. Verify with:
  ```bash
  gcloud iam workload-identity-pools providers list \
    --workload-identity-pool="github-pool" \
    --location="global"
  ```

## Cleanup (if needed)

To delete the setup:
```bash
# Delete provider first
gcloud iam workload-identity-pools providers delete "github-provider" \
  --workload-identity-pool="github-pool" \
  --location="global"

# Then delete pool
gcloud iam workload-identity-pools delete "github-pool" --location="global"
```

## Resources
- [Workload Identity Federation Documentation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [google-github-actions/auth](https://github.com/google-github-actions/auth)

