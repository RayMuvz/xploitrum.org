#!/usr/bin/env bash
# Usage: ./deploy.sh root@159.65.248.234
set -euo pipefail
TARGET=${1:-root@159.65.248.234}
# Push code and run docker compose pull/up
ssh $TARGET 'bash -s' <<'REMOTE'
set -e
cd /opt/xploitrum-ctf || exit 1
git pull origin main || true
docker compose -f infra/docker-compose.yml pull || true
docker compose -f infra/docker-compose.yml up -d --remove-orphans
REMOTE
echo "Deployment triggered on $TARGET"
