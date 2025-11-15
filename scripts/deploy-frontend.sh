#!/bin/bash
set -euxo pipefail
API_URL=$(cat api_url.txt)
gcloud run deploy "$1" \
  --image="$2" \
  --project="$3" \
  --region="$4" \
  --platform=managed \
  --port=8080 \
  --set-env-vars="NODE_ENV=production,NEXT_TELEMETRY_DISABLED=1,API_BASE_URL=$API_URL,ID_TOKEN_AUDIENCE=$API_URL" \
  --memory="1Gi" \
  --cpu="2" \
  --min-instances="$7" \
  --max-instances="$8" \
  --timeout="3600s" \
  --ingress=all \
  ${10:+$10}

