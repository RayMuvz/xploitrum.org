# Email Configuration for Student Registrations

## Overview
Student organization registrations are sent to `admin@xploitrum.org` via email with:
- Registration details in the email body
- CSV file attachment with all information

## Setup Email (Gmail Example)

1. **Add to `.env` file:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_TLS=True
FROM_EMAIL=noreply@xploitrum.org
```

2. **For Gmail, create an App Password:**
   - Go to Google Account Settings
   - Security → 2-Step Verification
   - App passwords → Generate new app password
   - Use this password in `SMTP_PASSWORD`

## Development Mode (No Email)
If email credentials are not configured:
- Registrations are saved to `backend/registrations/` folder
- Both CSV and summary text files are created
- Check terminal output for file locations

## Testing
1. Start the backend
2. Go to `/register` page
3. Fill out the form and submit
4. Check:
   - Terminal output for success message
   - `backend/registrations/` folder for files
   - `admin@xploitrum.org` inbox (if email configured)

## Troubleshooting
- **"Registration failed"**: Check backend terminal for detailed error
- **Email not sent**: Verify SMTP credentials in `.env`
- **Files not saved**: Check `backend/registrations/` directory permissions

