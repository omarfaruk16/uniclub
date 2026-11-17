#!/bin/sh
# Run on the VPS from the project folder: sh scripts/deploy.sh
set -e
cd "$(dirname "$0")/.."
git pull --ff-only
mkdir -p data uploads
docker compose up -d --build
docker image prune -f >/dev/null
echo "Deployed. Logs: docker compose logs -f app"
