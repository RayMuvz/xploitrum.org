#!/usr/bin/env bash
set -euo pipefail

# Bootstrap script (idempotent) to prepare Ubuntu 22.04 droplet and deploy the stack.
# Usage: curl -sSL https://.../bootstrap.sh | sudo bash

REPO="https://github.com/RayMuvz/xploitrum.org.git"
BRANCH="main"
DEPLOY_DIR="/opt/xploitrum-ctf"
CTFD_ADMIN_EMAIL="chrisrios02@gmail.com"
CTFD_ADMIN_PASSWORD="xploit2025!"

# 1) basic apt update + tools
apt-get update
apt-get install -y git curl ufw jq

# 2) install Docker (idempotent)
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

# 3) install docker-compose plugin
if ! docker compose version >/dev/null 2>&1; then
  apt-get install -y docker-compose-plugin
fi

# 4) create deploy user
if ! id -u deploy >/dev/null 2>&1; then
  useradd -m -s /bin/bash deploy
  mkdir -p /home/deploy/.ssh
  echo "# add public keys to /home/deploy/.ssh/authorized_keys" >/home/deploy/.ssh/README
  chown -R deploy:deploy /home/deploy/.ssh
fi

# 5) clone or update repo
if [ -d "$DEPLOY_DIR" ]; then
  cd "$DEPLOY_DIR"
  git fetch --all
  git reset --hard origin/$BRANCH
else
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$DEPLOY_DIR"
  chown -R deploy:deploy "$DEPLOY_DIR"
  cd "$DEPLOY_DIR"
fi

# 6) create .env from example if missing
if [ ! -f infra/.env ]; then
  cp infra/.env.example infra/.env
  sed -i "s/chrisrios02@gmail.com/chrisrios02@gmail.com/" infra/.env
fi

# 7) ensure necessary docker volumes exist (docker-compose will create them but doing explicit create is ok)
docker volume create traefik-letsencrypt || true
docker volume create openvpn-data || true

# 8) start infra
cd infra
# Export env for compose
set -a
[ -f .env ] && source .env
set +a
docker compose pull || true
docker compose up -d --remove-orphans

# 9) Wait for services to stabilize (simple checks)
echo "Waiting 10s for containers to start..."
sleep 10
docker compose ps

# 10) Build and load challenge images (optional local build so supervisor can spawn them)
cd "$DEPLOY_DIR"
for CH in challenges/*; do
  if [ -f "$CH/Dockerfile" ]; then
    docker build -t xploitrum/$(basename $CH):latest "$CH"
  fi
done

# 11) Seed admin (uses simple python script)
python3 deploy/seed_admin.py --email "$CTFD_ADMIN_EMAIL" --password "$CTFD_ADMIN_PASSWORD" || true

# 12) Generate VPN clients placeholder (run script to create configs using openvpn container)
bash deploy/vpn/generate_vpn_clients.sh || true

echo "Bootstrap complete. Frontend at https://${DOMAIN:-yourdomain.tld}, CTF at https://${CTFD_DOMAIN:-ctf.yourdomain.tld}"
echo "Admin user: $CTFD_ADMIN_EMAIL / $CTFD_ADMIN_PASSWORD"
