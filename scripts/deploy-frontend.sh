#!/bin/bash
set -euxo pipefail
API_URL=$(cat api_url.txt)
SERVICE_NAME="$1"
PROJECT_ID="$3"
REGION="$4"
EXISTING_URL=$(gcloud run services describe "$SERVICE_NAME" --project "$PROJECT_ID" --region "$REGION" --format='value(status.url)' 2>/dev/null || true)
ENV_VARS="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,API_BASE_URL=$API_URL,NEXT_PUBLIC_API_URL=$API_URL,ID_TOKEN_AUDIENCE=$API_URL"
if [ -n "$EXISTING_URL" ]; then
  ENV_VARS="$ENV_VARS,APP_ORIGIN=$EXISTING_URL"
fi
gcloud run deploy "$SERVICE_NAME" \
  --image="$2" \
  --project="$PROJECT_ID" \
  --region="$REGION" \
  --platform=managed \
  --port=8080 \
  --set-env-vars="$ENV_VARS" \
  --memory="$5" \
  --cpu="$6" \
  --min-instances="$7" \
  --max-instances="$8" \
  --timeout="$9" \
  --ingress=all \
  ${10:+$10}

