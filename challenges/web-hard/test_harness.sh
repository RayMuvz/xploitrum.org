#!/usr/bin/env bash
# Simple tester to run the challenge locally and show flag.
docker build -t local-web-hard:latest .
docker run --rm -p 5000:5000 local-web-hard:latest &
sleep 2
curl -s http://localhost:5000 | grep -o 'XPLoitRUM{[^< ]*'
