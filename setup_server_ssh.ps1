# Script to help debug SSH setup
# Run this from your local machine

Write-Host "=== SSH Setup Diagnostic ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Your Public Key (copy this to server):" -ForegroundColor Yellow
Get-Content "$HOME\.ssh\xploitrum_deploy.pub"
Write-Host ""

Write-Host "2. Testing SSH connection..." -ForegroundColor Yellow
Write-Host ""

Write-Host "Run this command to test manually:" -ForegroundColor Green
Write-Host "ssh -i `$HOME/.ssh/xploitrum_deploy xploitrum@143.198.195.84" -ForegroundColor White
Write-Host ""

Write-Host "3. If you need to add the key to your server, run these commands ON YOUR SERVER:" -ForegroundColor Yellow
Write-Host "   ssh root@143.198.195.84" -ForegroundColor White
Write-Host "   su - xploitrum" -ForegroundColor White
Write-Host "   mkdir -p ~/.ssh && chmod 700 ~/.ssh" -ForegroundColor White
Write-Host "   echo 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIH6HOtNs+akZP0RrbIDMxDRi/r0vY1cC64o2qlOdkqAh deployment@xploitrum' >> ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host "   chmod 600 ~/.ssh/authorized_keys" -ForegroundColor White
Write-Host ""

Write-Host "4. Check if key is on server:" -ForegroundColor Yellow
Write-Host "   ssh root@143.198.195.84" -ForegroundColor White
Write-Host "   cat /home/xploitrum/.ssh/authorized_keys" -ForegroundColor White
Write-Host ""

