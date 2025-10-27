# Deploy to production from Windows
# Usage: .\deploy-to-production.ps1

Write-Host "🚀 Deploying to production..." -ForegroundColor Cyan

# Push latest code to GitHub
Write-Host "📤 Pushing code to GitHub..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "✅ Code pushed to GitHub!" -ForegroundColor Green
Write-Host ""
Write-Host "Now run these commands to deploy:" -ForegroundColor Cyan
Write-Host "  ssh root@143.198.195.84" -ForegroundColor White
Write-Host "  cd /home/xploitrum.org" -ForegroundColor White
Write-Host "  ./manual-deploy.sh" -ForegroundColor White

