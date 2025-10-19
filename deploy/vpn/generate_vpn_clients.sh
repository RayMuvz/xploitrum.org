#!/usr/bin/env bash
set -euo pipefail
# Generates OpenVPN server if not present and produces three client ovpn files.
# Requires docker running and the openvpn container defined in docker-compose.

OVPN_DATA_VOL="openvpn-data"
CLIENTS=(player1 player2 player3)
EASYRSA_DIR="/etc/openvpn"

# Initialize PKI if not present
if [ ! -d /var/lib/docker/volumes/openvpn-data/_data ]; then
  echo "Initializing OpenVPN PKI in docker volume (this may take a while)..."
  docker run -v openvpn-data:/etc/openvpn --rm kylemanna/openvpn ovpn_genconfig -u udp://vpn.xploitrum.org
  docker run -v openvpn-data:/etc/openvpn --rm -it kylemanna/openvpn ovpn_initpki nopass
fi

# Generate client configs
mkdir -p ../../deploy/vpn/clients
for c in "${CLIENTS[@]}"; do
  docker run -v openvpn-data:/etc/openvpn --rm kylemanna/openvpn easyrsa build-client-full "$c" nopass || true
  docker run -v openvpn-data:/etc/openvpn --rm kylemanna/openvpn ovpn_getclient "$c" > ../../deploy/vpn/clients/${c}.ovpn
  echo "Generated ../../deploy/vpn/clients/${c}.ovpn"
done

echo "Client configs in deploy/vpn/clients"
