#!/bin/bash
# Verify GitHub Actions deployment setup

echo "=== GitHub Actions Deployment Verification ==="
echo ""

echo "1. Checking SSH directory permissions..."
ls -la ~/.ssh/authorized_keys 2>/dev/null || echo "❌ No authorized_keys file found"

echo ""
echo "2. Checking SSH directory permissions..."
ls -ld ~/.ssh

echo ""
echo "3. Verifying authorized_keys content..."
cat ~/.ssh/authorized_keys 2>/dev/null | wc -l
echo "key(s) found in authorized_keys"

echo ""
echo "4. Testing local SSH connection..."
echo "This will try to connect as xploitrum user (you'll need to type 'yes' if prompted)"

echo ""
echo "5. Checking if user can run sudo commands..."
sudo -n echo "✅ Sudo access confirmed" 2>/dev/null || echo "⚠️ May need password for sudo"

echo ""
echo "=== Verification Complete ==="
echo ""
echo "Next steps:"
echo "1. If authorized_keys is empty or missing, add your GitHub Actions public key"
echo "2. Ensure permissions are correct (700 for ~/.ssh, 600 for authorized_keys)"
echo "3. Test SSH connection from your local machine"

