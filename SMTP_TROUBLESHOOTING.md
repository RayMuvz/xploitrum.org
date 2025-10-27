# SMTP Troubleshooting Guide

## Check Email Configuration on Production

Run these commands on your droplet:

```bash
# SSH to your droplet
ssh root@143.198.195.84

# Check backend logs for SMTP errors
tail -100 /var/log/xploitrum-backend.log | grep -i smtp

# Check if .env file has email settings
cd /home/xploitrum.org/backend
cat .env | grep SMTP

# Test SMTP configuration
cd /home/xploitrum.org/backend
source venv/bin/activate
python test_smtp.py
```

## Common SMTP Issues

### Issue 1: Credentials Not Set
**Symptom**: "SMTP_USERNAME or SMTP_PASSWORD not set"

**Solution**: Add to `/home/xploitrum.org/backend/.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_TLS=true
FROM_EMAIL=noreply@xploitrum.org
```

### Issue 2: Wrong Port
**Symptom**: Connection timeout

**Solution**: Check SMTP port:
- Gmail: 587 (STARTTLS) or 465 (SSL)
- SendGrid: 587
- Other: Check provider docs

### Issue 3: Firewall Blocking
**Symptom**: Connection refused

**Solution**: Check if port is open:
```bash
telnet smtp.gmail.com 587
```

### Issue 4: App Password Required
**Symptom**: Gmail rejects password

**Solution**: Use App Passwords, not regular password:
1. Enable 2FA on Gmail
2. Generate App Password
3. Use app password as SMTP_PASSWORD

## Email Providers Setup

### Gmail SMTP
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your_email@gmail.com
SMTP_PASSWORD=your_app_password  # Not your regular password!
SMTP_TLS=true
FROM_EMAIL=your_email@gmail.com
```

### SendGrid SMTP
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USERNAME=apikey
SMTP_PASSWORD=your_sendgrid_api_key
SMTP_TLS=true
FROM_EMAIL=verified_sender@xploitrum.org
```

### Other Providers
Consult their SMTP documentation for:
- Host
- Port
- TLS/SSL settings
- Authentication requirements

## Next Steps

1. **Check your .env file** for correct SMTP settings
2. **Run test_smtp.py** to diagnose issues
3. **Check backend logs** for detailed error messages
4. **Update .env** with correct credentials
5. **Restart backend**: `sudo systemctl restart xploitrum-backend`

