# Fix GitHub Actions Deployment Issues

## Common Issues and Solutions

### Issue 1: SSH Key Not Added to Server

**Problem**: The public key generated for GitHub Actions hasn't been added to the server's `~/.ssh/authorized_keys`

**Solution**:

1. **Get your GitHub Actions public key** (from your local machine):
   ```powershell
   cat ~/.ssh/xploitrum_deploy.pub
   ```

2. **SSH to your production server as root**:
   ```bash
   ssh root@143.198.195.84
   ```

3. **Switch to xploitrum user**:
   ```bash
   su - xploitrum
   ```

4. **Create .ssh directory if it doesn't exist**:
   ```bash
   mkdir -p ~/.ssh
   chmod 700 ~/.ssh
   ```

5. **Add the public key**:
   ```bash
   # Replace YOUR_PUBLIC_KEY with the content from step 1
   echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
   chmod 600 ~/.ssh/authorized_keys
   ```

6. **Verify it was added**:
   ```bash
   cat ~/.ssh/authorized_keys
   ```

---

### Issue 2: Incorrect GitHub Actions Secret

**Problem**: The private key stored in GitHub Secrets is incorrect or malformed

**Solution**:

1. **Get your private key content** (from your local machine):
   ```powershell
   cat ~/.ssh/xploitrum_deploy
   ```
   Copy the ENTIRE output including headers:
   ```
   -----BEGIN OPENSSH PRIVATE KEY-----
   [key content]
   -----END OPENSSH PRIVATE KEY-----
   ```

2. **Add to GitHub Secrets**:
   - Go to: https://github.com/RayMuvz/xploitrum.org/settings/secrets/actions
   - Create or update secret `SSH_PRIVATE_KEY`
   - Paste the entire private key (including headers)

---

### Issue 3: Incorrect Permissions

**Problem**: The `.ssh` directory or `authorized_keys` file has wrong permissions

**Solution**:

On your production server:
```bash
# SSH as root
ssh root@143.198.195.84

# Fix permissions
chown -R xploitrum:xploitrum /home/xploitrum/.ssh
chmod 700 /home/xploitrum/.ssh
chmod 600 /home/xploitrum/.ssh/authorized_keys
```

---

### Issue 4: Wrong Username in Workflow

**Problem**: The workflow is trying to connect as the wrong user

**Current setup**: The workflow connects as `xploitrum` user (correct)

**Verify**: In `.github/workflows/deploy.yml`, line 18 should be:
```yaml
username: xploitrum
```

---

### Issue 5: SSH Server Configuration

**Problem**: The SSH server might not allow public key authentication

**Check**:

1. **SSH to your server**:
   ```bash
   ssh root@143.198.195.84
   ```

2. **Check SSH server config**:
   ```bash
   sudo grep -E "^PubkeyAuthentication|^PasswordAuthentication" /etc/ssh/sshd_config
   ```

3. **If PubkeyAuthentication is disabled** (set to `no`):
   ```bash
   sudo nano /etc/ssh/sshd_config
   # Change: PubkeyAuthentication no
   # To:     PubkeyAuthentication yes
   
   # Then restart SSH service
   sudo systemctl restart sshd
   ```

---

## Complete Setup Process

### Step 1: Generate SSH Key (if not done already)

```powershell
# On your Windows machine
ssh-keygen -t ed25519 -C "deployment@xploitrum" -f ~/.ssh/xploitrum_deploy
# Press Enter when prompted for passphrase
```

### Step 2: Add Public Key to Server

```bash
# Show your public key
cat ~/.ssh/xploitrum_deploy.pub
```

Copy the output, then:

```bash
# SSH to server as root
ssh root@143.198.195.84

# Switch to xploitrum user
su - xploitrum

# Setup SSH directory
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Add the public key
echo "YOUR_PUBLIC_KEY" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### Step 3: Add Private Key to GitHub

1. Get private key:
   ```powershell
   cat ~/.ssh/xploitrum_deploy
   ```

2. Go to GitHub: https://github.com/RayMuvz/xploitrum.org/settings/secrets/actions

3. Create two secrets:
   - **DROPLET_IP**: `143.198.195.84`
   - **SSH_PRIVATE_KEY**: Paste the entire private key content

### Step 4: Test Connection

```powershell
# Test SSH connection from your local machine
ssh -i ~/.ssh/xploitrum_deploy xploitrum@143.198.195.84
```

If this works, GitHub Actions will work too!

### Step 5: Trigger Deployment

```powershell
# Make a small change to trigger deployment
git commit --allow-empty -m "test: Trigger deployment"
git push origin main
```

Or manually trigger:
1. Go to: https://github.com/RayMuvz/xploitrum.org/actions
2. Click "Deploy to Production"
3. Click "Run workflow"

---

## Quick Diagnostic Commands

### On Your Server

```bash
# Check if authorized_keys exists and has correct permissions
ls -la ~/.ssh/

# View authorized keys
cat ~/.ssh/authorized_keys

# Test SSH connection locally
ssh localhost
```

### From GitHub Actions Logs

Check the logs at:
https://github.com/RayMuvz/xploitrum.org/actions

If you see "ssh: handshake failed", it's an authentication issue. Follow the steps above.

---

## Success Indicators

✅ SSH connection works from local machine  
✅ GitHub Actions can connect to server  
✅ Deployment runs automatically  
✅ All services restart successfully  
✅ Website is updated  

If any step fails, follow the corresponding solution above.

