#!/usr/bin/env python3
"""
Seed CTFd admin user. Basic script that retries until CTFd becomes available.
Usage: python3 seed_admin.py --email admin@xploitrum.org --password Pass1234
"""
import argparse, time, requests, os, sys

parser = argparse.ArgumentParser()
parser.add_argument("--email", required=True)
parser.add_argument("--password", required=True)
parser.add_argument("--host", default=os.environ.get("CTFD_HOST", "http://localhost:8000"))
args = parser.parse_args()

CTFD = os.environ.get("CTFD_HOST", args.host)

def create_admin(email, password):
    url = f"{CTFD.rstrip('/')}/api/v1/users"
    payload = {"name":"admin", "email":email, "password":password}
    # This endpoint may or may not be available depending on CTFd version; use setup flow or use direct DB if required.
    # We'll attempt to create via register and then mark as admin.
    try:
        r = requests.post(url, json=payload, timeout=5)
        if r.status_code in (200, 201):
            uid = r.json()["id"]
            # promote to admin
            promote = requests.patch(f"{CTFD.rstrip('/')}/api/v1/users/{uid}", json={"type":"admin"})
            if promote.status_code in (200,201):
                print("Admin created")
                return True
        else:
            print("Create user returned", r.status_code, r.text)
    except Exception as e:
        print("Error:", e)
    return False

# Retry loop
for i in range(30):
    print("Attempt", i+1)
    if create_admin(args.email, args.password):
        sys.exit(0)
    time.sleep(5)

print("Failed to create admin after retries.")
sys.exit(1)
