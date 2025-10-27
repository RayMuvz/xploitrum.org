#!/bin/bash
# Run this ON YOUR PRODUCTION SERVER to check SSH setup

echo "=== Checking SSH Setup for GitHub Actions ==="
echo ""

echo "1. Current user:"
whoami

echo ""
echo "2. Home directory:"
echo $HOME

echo ""
echo "3. Checking .ssh directory:"
ls -la ~/.ssh/

echo ""
echo "4. Checking authorized_keys:"
if [ -f ~/.ssh/authorized_keys ]; then
    echo "File exists with content:"
    cat ~/.ssh/authorized_keys
else
    echo "❌ authorized_keys does not exist"
fi

echo ""
echo "5. Checking permissions:"
ls -ld ~/.ssh/
if [ -f ~/.ssh/authorized_keys ]; then
    ls -l ~/.ssh/authorized_keys
fi

echo ""
echo "=== Instructions ==="
echo "1. Copy your public key from local machine:"
echo "   cat ~/.ssh/xploitrum_deploy.pub"
echo ""
echo "2. Add it to this server:"
echo "   echo 'PASTE_PUBLIC_KEY_HERE' >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys"

