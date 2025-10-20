#!/usr/bin/env python3
"""
Test login directly against the backend
"""

import requests

# Test login
url = "http://localhost:8000/api/v1/auth/login"

# Login data (form-urlencoded format like OAuth2PasswordRequestForm expects)
data = {
    "username": "admin",
    "password": "xploitRUM2025"
}

print("Testing login...")
print(f"URL: {url}")
print(f"Username: {data['username']}")
print(f"Password: {data['password']}")
print()

try:
    response = requests.post(url, data=data)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    print()
    
    if response.status_code == 200:
        print("✅ Login successful!")
        token_data = response.json()
        print(f"Access Token: {token_data.get('access_token', 'N/A')[:50]}...")
    else:
        print("❌ Login failed!")
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

