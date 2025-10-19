#!/usr/bin/env bash
# Simple tester to run the challenge locally and show flag.
docker build -t local-web-medium:latest .
docker run --rm -p 5000:5000 local-web-medium:latest &
sleep 2
curl -s http://localhost:5000 | grep -o 'XPLoitRUM{[^< ]*'
