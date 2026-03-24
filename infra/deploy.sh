#!/bin/bash
# ─────────────────────────────────────────────
# G5 Analytics — Manual Deploy (one-off)
# Use this for quick deploys without CI/CD
# ─────────────────────────────────────────────

set -euo pipefail

REGION="asia-south1"

echo "▸ Deploying backend..."
cd "$(dirname "$0")/.."

gcloud run deploy g5-api \
  --source=./backend \
  --region=$REGION \
  --platform=managed

BACKEND_URL=$(gcloud run services describe g5-api --region=$REGION --format='value(status.url)')
echo "  Backend: $BACKEND_URL"

echo ""
echo "▸ Deploying frontend..."
gcloud run deploy g5-web \
  --source=./frontend \
  --region=$REGION \
  --platform=managed \
  --set-env-vars="VITE_API_URL=$BACKEND_URL"

FRONTEND_URL=$(gcloud run services describe g5-web --region=$REGION --format='value(status.url)')
echo "  Frontend: $FRONTEND_URL"

echo ""
echo "Done! Open $FRONTEND_URL"
