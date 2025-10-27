#!/bin/bash
# Deploy to production from your local machine
# Usage: ./deploy-to-production.sh

echo "🚀 Deploying to production..."

# Push latest code to GitHub
echo "📤 Pushing code to GitHub..."
git push origin main

echo ""
echo "✅ Code pushed to GitHub!"
echo ""
echo "Now SSH to your server and run:"
echo "  ssh root@143.198.195.84"
echo "  cd /home/xploitrum.org"
echo "  ./manual-deploy.sh"
echo ""
echo "Or if you have SSH keys set up, run this command directly:"
echo "  ssh root@143.198.195.84 'cd /home/xploitrum.org && ./manual-deploy.sh'"

