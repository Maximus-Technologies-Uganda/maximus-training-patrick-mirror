# Cloud Run Deployment Setup

This document provides the complete setup for deploying the frontend-next application to Google Cloud Run using Workload Identity Federation.

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and authenticated
- Workload Identity Pool and Provider already configured (see WORKLOAD_IDENTITY_SETUP.md)
- Project ID: `proj-app-dev`
- Project Number: `673209018655`

## Setup Commands

Run these commands to set up the deployment infrastructure:

### 1. Enable Required APIs

```bash
gcloud services enable run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  iam.googleapis.com \
  iamcredentials.googleapis.com \
  --project=proj-app-dev
```

### 2. Create Artifact Registry Repository

```bash
gcloud artifacts repositories create cloud-run-images \
  --repository-format=docker \
  --location=us-central1 \
  --description="Docker images for Cloud Run deployments" \
  --project=proj-app-dev
```

### 3. Create Service Account

```bash
gcloud iam service-accounts create github-actions-deploy \
  --display-name="GitHub Actions Deployment Service Account" \
  --description="Service account for deploying to Cloud Run from GitHub Actions" \
  --project=proj-app-dev
```

### 4. Grant IAM Roles to Service Account

```bash
# Cloud Run Admin
gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deployer@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/run.admin" \
  --condition=None

# Service Account User
gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deployer@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser" \
  --condition=None

# Artifact Registry Writer
gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deployer@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer" \
  --condition=None

# Cloud Build Builder
gcloud projects add-iam-policy-binding proj-app-dev \
  --member="serviceAccount:github-actions-deployer@proj-app-dev.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.builder" \
  --condition=None
```

### 5. Bind Service Account to Workload Identity Pool

```bash
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-deployer@proj-app-dev.iam.gserviceaccount.com \
  --project=proj-app-dev \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/673209018655/locations/global/workloadIdentityPools/github-pool/attribute.repository/Maximus-Technologies-Uganda/maximus-training-patrick-mirror"
```

## Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy-cloud-run.yml`) will:

1. Authenticate using Workload Identity Federation
2. Build the Docker image from `frontend-next/Dockerfile`
3. Push the image to Artifact Registry
4. Deploy to Cloud Run in the `us-central1` region
5. Make the service publicly accessible

## Verification

After setup, verify the configuration:

```bash
# Check service account
gcloud iam service-accounts describe github-actions-deployer@proj-app-dev.iam.gserviceaccount.com

# List Artifact Registry repositories
gcloud artifacts repositories list --location=us-central1 --project=proj-app-dev

# Check IAM policy bindings
gcloud projects get-iam-policy proj-app-dev \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:github-actions-deployer@proj-app-dev.iam.gserviceaccount.com"
```

## Triggering Deployment

The deployment workflow triggers automatically on:
- Push to `main` or `development` branches
- Changes in the `frontend-next/` directory
- Manual trigger via GitHub Actions UI

## Accessing the Deployed Application

After successful deployment, the service URL will be displayed in the GitHub Actions workflow output.

You can also get the URL with:

```bash
gcloud run services describe maximus-training-frontend \
  --region=us-central1 \
  --project=proj-app-dev \
  --format='value(status.url)'
```

## Troubleshooting

### View Service Logs

```bash
gcloud run services logs read maximus-training-frontend \
  --region=us-central1 \
  --project=proj-app-dev \
  --limit=50
```

### List All Cloud Run Services

```bash
gcloud run services list --region=us-central1 --project=proj-app-dev
```

### Check Service Details

```bash
gcloud run services describe maximus-training-frontend \
  --region=us-central1 \
  --project=proj-app-dev
```

