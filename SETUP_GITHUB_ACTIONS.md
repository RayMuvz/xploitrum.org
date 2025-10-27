# Setup GitHub Actions for Automated Deployment

## Issue
SSH authentication failed because GitHub Secrets are not configured.

## Quick Fix - Setup GitHub Secrets

### Step 1: Generate SSH Key (if you don't have one)

On your local machine, generate a new SSH key pair:

```bash
ssh-keygen -t ed25519 -C "deployment@xploitrum" -f ~/.ssh/xploitrum_deploy
```

This creates:
- `~/.ssh/xploitrum_deploy` (private key)
- `~/.ssh/xploitrum_deploy.pub` (public key)

### Step 2: Add Public Key to Your Server

Copy the public key to your DigitalOcean droplet:

```bash
# Display your public key
cat ~/.ssh/xploitrum_deploy.pub

# Copy the output, then SSH to your server
ssh root@your_droplet_ip

# On the server, add the key for xploitrum user
mkdir -p /home/xploitrum/.ssh
echo "YOUR_PUBLIC_KEY_CONTENT" >> /home/xploitrum/.ssh/authorized_keys
chown -R xploitrum:xploitrum /home/xploitrum/.ssh
chmod 700 /home/xploitrum/.ssh
chmod 600 /home/xploitrum/.ssh/authorized_keys
```

### Step 3: Add GitHub Secrets

Go to your GitHub repository:
1. Click **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**

Add these secrets:

#### Secret 1: DROPLET_IP
- **Name**: `DROPLET_IP`
- **Value**: Your DigitalOcean droplet IP address (e.g., `123.45.67.89`)

#### Secret 2: SSH_PRIVATE_KEY
- **Name**: `SSH_PRIVATE_KEY`
- **Value**: Your private key content

Get the private key content:
```bash
cat ~/.ssh/xploitrum_deploy
```

Copy the ENTIRE output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

### Step 4: Test SSH Connection

Test that you can connect:

```bash
ssh -i ~/.ssh/xploitrum_deploy xploitrum@your_droplet_ip
```

If it works, you're ready!

### Step 5: Retry Deployment

After setting up the secrets, you can either:
1. Push another commit (triggers automatic deployment)
2. Manually trigger the workflow in GitHub Actions

## Alternative: Manual Deployment

If you prefer to deploy manually without GitHub Actions:

```bash
# SSH to your server
ssh xploitrum@your_droplet_ip

# Navigate to project
cd ~/xploitrum.org

# Pull latest
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt --quiet --upgrade
sudo systemctl restart xploitrum-backend

# Update frontend
cd ../frontend
npm install --silent
npm run build
sudo systemctl restart xploitrum-frontend

# Reload Nginx
sudo systemctl reload nginx

echo "✅ Deployment complete!"
```

## Current Status

Your code is already pushed to GitHub successfully. You just need to configure the GitHub Secrets, and the automated deployment will work.

## What Needs to Be Configured

✅ Code is pushed to GitHub  
✅ Workflow file is ready  
❌ GitHub Secrets not configured (DROPLET_IP, SSH_PRIVATE_KEY)  

Once you add the secrets, the deployment will work automatically on every push!

