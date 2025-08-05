#!/bin/bash
set -euo pipefail

# ==== Configuration ====
REGISTRY="ghcr.io"
IMAGE="ghcr.io/universalcommerceinc/activepieces:testing-ee"
GITHUB_USER="yogi2023-cne"

echo "🔐 Logging in to GHCR..."
echo "${GHCR_PAT}" | docker login ${REGISTRY} -u ${GITHUB_USER} --password-stdin

echo "📦 Pulling latest image from GHCR..."
docker compose pull

echo "🛑 Stopping existing containers..."
docker compose down

echo "🚀 Recreating containers from updated image..."
docker compose up -d --force-recreate

echo "✅ Deployment complete."

echo "🔍 Verifying running image:"
docker ps --filter "name=activepieces" --format "Container: {{.Names}} | Image: {{.Image}} | Status: {{.Status}}"

echo "📦 Latest pulled image:"
docker images "${IMAGE}" --format "Image: {{.Repository}}:{{.Tag}} | Created: {{.CreatedSince}} | Size: {{.Size}}"

