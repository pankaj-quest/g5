#!/bin/bash
# ─────────────────────────────────────────────────────
# G5 Analytics — GCP Backend Infrastructure Setup
# Run ONCE to provision all resources
# Frontend is on AWS Amplify (not managed here)
#
# Stack:
#   - Cloud Run (API + consumers)
#   - Firestore w/ MongoDB compatibility (database)
#   - Memorystore Redis (cache + realtime)
#   - Pub/Sub (event ingestion buffer)
#
# Prerequisites:
#   - gcloud CLI authenticated (gcloud auth login)
#   - Billing enabled on project
# ─────────────────────────────────────────────────────

set -euo pipefail

PROJECT_ID=$(gcloud config get-value project)
REGION="asia-south1"
REPO_NAME="g5"
REDIS_INSTANCE="g5-redis"
VPC_CONNECTOR="g5-connector"
FIRESTORE_DB="g5-analytics"

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║   G5 Analytics — GCP Backend Setup               ║"
echo "║   Project: $PROJECT_ID"
echo "║   Region:  $REGION"
echo "║                                                  ║"
echo "║   Firestore (MongoDB compat) + Pub/Sub + Redis   ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Enable APIs ──
echo "▸ [1/10] Enabling APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  redis.googleapis.com \
  vpcaccess.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com \
  pubsub.googleapis.com \
  firestore.googleapis.com
echo "  Done."

# ── 2. Firestore with MongoDB Compatibility ──
echo ""
echo "▸ [2/10] Creating Firestore database (MongoDB compatible)..."
gcloud firestore databases create \
  --database=$FIRESTORE_DB \
  --location=$REGION \
  --type=firestore-native \
  2>/dev/null || echo "  (already exists)"

# Get the MongoDB-compatible connection string
# Format: mongodb+srv://<project>.firestore.googleapis.com/?authMechanism=MONGODB-OIDC
FIRESTORE_MONGO_URI="mongodb+srv://${PROJECT_ID}.firestore.googleapis.com/${FIRESTORE_DB}?authMechanism=MONGODB-OIDC"
echo "  Firestore DB: $FIRESTORE_DB"
echo "  MongoDB URI:  $FIRESTORE_MONGO_URI"

# ── 3. Artifact Registry ──
echo ""
echo "▸ [3/10] Creating Artifact Registry..."
gcloud artifacts repositories create $REPO_NAME \
  --repository-format=docker \
  --location=$REGION \
  --description="G5 Analytics Docker images" \
  2>/dev/null || echo "  (already exists)"

# ── 4. VPC Connector (Cloud Run → Memorystore) ──
echo ""
echo "▸ [4/10] Creating VPC Connector..."
gcloud compute networks vpc-access connectors create $VPC_CONNECTOR \
  --region=$REGION \
  --range="10.8.0.0/28" \
  --min-instances=2 \
  --max-instances=10 \
  --machine-type=e2-standard-4 \
  2>/dev/null || echo "  (already exists)"

# ── 5. Redis (Memorystore) — Standard HA ──
echo ""
echo "▸ [5/10] Creating Memorystore Redis (Standard HA, 5GB)..."
gcloud redis instances create $REDIS_INSTANCE \
  --size=5 \
  --region=$REGION \
  --redis-version=redis_7_0 \
  --tier=standard \
  --replica-count=1 \
  --read-replicas-mode=READ_REPLICAS_ENABLED \
  2>/dev/null || echo "  (already exists)"

REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --format='value(host)')
REDIS_PORT=$(gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --format='value(port)')
echo "  Redis: $REDIS_HOST:$REDIS_PORT (HA, 5GB)"

# ── 6. Pub/Sub Topics + Subscriptions ──
echo ""
echo "▸ [6/10] Creating Pub/Sub topics and subscriptions..."

TOPICS=("g5-events-raw" "g5-profiles-update" "g5-groups-update" "g5-identity-merge" "g5-events-dlq")
for TOPIC in "${TOPICS[@]}"; do
  gcloud pubsub topics create $TOPIC \
    --message-retention-duration=7d \
    2>/dev/null || echo "  $TOPIC exists"
done

# Events → fan-out to writer + realtime
gcloud pubsub subscriptions create g5-event-writer \
  --topic=g5-events-raw \
  --ack-deadline=60 \
  --min-retry-delay=10s \
  --max-retry-delay=600s \
  --dead-letter-topic=g5-events-dlq \
  --max-delivery-attempts=5 \
  2>/dev/null || echo "  g5-event-writer exists"

gcloud pubsub subscriptions create g5-realtime-fan \
  --topic=g5-events-raw \
  --ack-deadline=30 \
  --expiration-period=never \
  2>/dev/null || echo "  g5-realtime-fan exists"

gcloud pubsub subscriptions create g5-profile-updater \
  --topic=g5-profiles-update \
  --ack-deadline=60 \
  --dead-letter-topic=g5-events-dlq \
  --max-delivery-attempts=5 \
  2>/dev/null || echo "  g5-profile-updater exists"

gcloud pubsub subscriptions create g5-group-updater \
  --topic=g5-groups-update \
  --ack-deadline=60 \
  --dead-letter-topic=g5-events-dlq \
  --max-delivery-attempts=5 \
  2>/dev/null || echo "  g5-group-updater exists"

gcloud pubsub subscriptions create g5-identity-merge-worker \
  --topic=g5-identity-merge \
  --ack-deadline=60 \
  --dead-letter-topic=g5-events-dlq \
  --max-delivery-attempts=5 \
  2>/dev/null || echo "  g5-identity-merge-worker exists"

echo "  5 topics, 5 subscriptions created"

# ── 7. Secrets ──
echo ""
echo "▸ [7/10] Setting up secrets..."
JWT_SECRET=$(openssl rand -hex 64)
echo -n "$JWT_SECRET" | gcloud secrets create g5-jwt-secret --data-file=- 2>/dev/null || echo "  g5-jwt-secret exists"
echo -n "$FIRESTORE_MONGO_URI" | gcloud secrets create g5-mongodb-uri --data-file=- 2>/dev/null || echo "  g5-mongodb-uri exists"
echo "  Done."

# ── 8. IAM Permissions ──
echo ""
echo "▸ [8/10] Granting IAM permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CB_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
COMPUTE_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# Cloud Build
for ROLE in roles/run.admin roles/iam.serviceAccountUser roles/secretmanager.secretAccessor roles/pubsub.editor; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$CB_SA" \
    --role="$ROLE" \
    --quiet 2>/dev/null
done

# Cloud Run service account — needs Pub/Sub + Firestore
for ROLE in roles/pubsub.editor roles/datastore.user; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$COMPUTE_SA" \
    --role="$ROLE" \
    --quiet 2>/dev/null
done
echo "  Done."

# ── 9. Deploy Backend ──
echo ""
echo "▸ [9/10] Deploying backend to Cloud Run (4 vCPU, 4GB RAM)..."
REDIS_URL="redis://$REDIS_HOST:$REDIS_PORT"

cd "$(dirname "$0")/.."
gcloud run deploy g5-api \
  --source=./backend \
  --region=$REGION \
  --platform=managed \
  --execution-environment=gen2 \
  --port=8080 \
  --memory=4Gi \
  --cpu=4 \
  --cpu-boost \
  --min-instances=3 \
  --max-instances=50 \
  --concurrency=250 \
  --timeout=300 \
  --allow-unauthenticated \
  --vpc-connector=$VPC_CONNECTOR \
  --set-env-vars="NODE_ENV=production,REDIS_URL=$REDIS_URL,CORS_ORIGIN=*,PUBSUB_ENABLED=true,GCP_PROJECT_ID=$PROJECT_ID,KAFKA_ENABLED=false" \
  --set-secrets="MONGODB_URI=g5-mongodb-uri:latest,JWT_SECRET=g5-jwt-secret:latest"

BACKEND_URL=$(gcloud run services describe g5-api --region=$REGION --format='value(status.url)')

# ── 10. Done ──
echo ""
echo "▸ [10/10] CI/CD: Cloud Build → Triggers → Create"
echo "  Branch: ^main\$  Config: cloudbuild.yaml"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   G5 Analytics — Deployed!                                 ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║   API:        $BACKEND_URL"
echo "║   Database:   Firestore (MongoDB compatible)               ║"
echo "║   Redis:      $REDIS_HOST:$REDIS_PORT (HA, 5GB)"
echo "║   Pub/Sub:    5 topics, 5 subscriptions                    ║"
echo "║                                                            ║"
echo "║   ┌──────────────────────────────────────────────┐         ║"
echo "║   │  Production Ingestion Pipeline:              │         ║"
echo "║   │                                              │         ║"
echo "║   │  SDK → Cloud Run → Pub/Sub (instant ack)     │         ║"
echo "║   │              │                               │         ║"
echo "║   │    ┌─────────┼──────────┐                    │         ║"
echo "║   │    ↓         ↓          ↓                    │         ║"
echo "║   │  Writer   Realtime   Identity                │         ║"
echo "║   │  (batch   (Socket)   (Merge)                 │         ║"
echo "║   │  →Firestore)                                 │         ║"
echo "║   └──────────────────────────────────────────────┘         ║"
echo "║                                                            ║"
echo "║   Cloud Run:  4 vCPU / 4GB per instance                   ║"
echo "║   Scaling:    3 → 50 instances (250 concurrency)           ║"
echo "║   Firestore:  Serverless, auto-scales, zero ops            ║"
echo "║                                                            ║"
echo "║   For AWS Amplify:                                         ║"
echo "║   VITE_API_URL=$BACKEND_URL"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
