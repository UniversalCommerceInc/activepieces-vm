#!/bin/bash
set -euo pipefail

echo "🔐 Logging in to GHCR..."
echo "${GHCR_PAT}"  | docker login ghcr.io -u yogi2023-cne --password-stdin 

echo "📦 Pulling latest image from GHCR..."
docker compose pull

echo "🛑 Stopping existing containers..."
docker compose down

echo "🚀 Recreating containers from updated image..."
docker compose up -d --force-recreate

echo "✅ Deployment complete."

echo "📦 Currently running image:"
docker inspect --format='{{.Config.Image}}' $(docker ps -q --filter "name=activepieces")

