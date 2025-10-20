# XploitRUM - Cybersecurity Student Organization Platform

Full-stack CTF platform and professional website for XploitRUM at Universidad de Puerto Rico - Mayagüez.

## 🌟 Features

### Public Website
- Professional landing page with organization info
- Events calendar with registration
- Team showcase
- Contact form
- Documentation

### CTF Platform
- Browse and deploy CTF challenges (Docker-based)
- In-browser machine access (HackTheBox/TryHackMe style)
- OpenVPN connection for network access
- Real-time leaderboard and scoring
- Flag submission system
- Anonymous access (no login required)

### Admin Portal
- Challenge management (create, edit, activate/deactivate)
- Event management (create, edit, view registrations)
- Real-time platform statistics
- User registration control
- Email notifications

## 🛠️ Tech Stack

**Frontend:**
- Next.js 14 (App Router)
- TailwindCSS + Shadcn/UI
- Framer Motion (animations)
- TypeScript

**Backend:**
- FastAPI (Python)
- PostgreSQL (production) / SQLite (development)
- Docker (for CTF challenges)
- JWT authentication
- FastAPI-Mail (email)

**Infrastructure:**
- Nginx (reverse proxy)
- Let's Encrypt (SSL)
- Systemd (process management)
- GitHub Actions (CI/CD)

## 🚀 Local Development

### Prerequisites
- Node.js 20+
- Python 3.11+
- Git

### Quick Start

1. **Clone repository**
```bash
git clone https://github.com/YOUR_USERNAME/xploitrum.org.git
cd xploitrum.org
```

2. **Backend setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
python -c "from app.core.database import init_db; init_db()"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. **Frontend setup** (in new terminal)
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
npm run dev
```

4. **Access the application**
- Website: http://localhost:3000
- API Docs: http://localhost:8000/docs
- Admin Login: `admin` / `xploitRUM2025`

## 🌐 Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for complete production deployment guide.

### Quick Deploy (if already setup)

```bash
# On your local machine
git add .
git commit -m "Your changes"
git push origin main
# GitHub Actions will auto-deploy to DigitalOcean
```

Or manually on server:

```bash
# SSH to server
ssh xploitrum@your_droplet_ip

# Run deployment script
/home/xploitrum/deploy.sh
```

## 📁 Project Structure

```
xploitrum.org/
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # Reusable components
│   │   └── contexts/      # React contexts
│   └── public/            # Static assets
│
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core functionality
│   │   ├── models/       # Database models
│   │   └── services/     # Business logic
│   └── requirements.txt
│
├── scripts/              # Deployment scripts
├── .github/workflows/    # CI/CD workflows
└── DEPLOYMENT.md        # Deployment guide
```

## 🔑 Environment Variables

### Backend (.env)
```bash
DATABASE_URL=postgresql://user:pass@localhost/xploitrum
SECRET_KEY=your_secret_key
JWT_SECRET_KEY=your_jwt_secret
SMTP_HOST=smtp.gmail.com
SMTP_USERNAME=admin@xploitrum.org
SMTP_PASSWORD=your_app_password
CORS_ORIGINS=https://www.xploitrum.org
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://api.xploitrum.org
```

## 📧 Email Configuration

The platform uses Gmail SMTP for sending emails. Configure in `backend/.env`:

1. Create Gmail App Password: https://myaccount.google.com/apppasswords
2. Set `SMTP_USERNAME` and `SMTP_PASSWORD` in `.env`

Emails are sent for:
- Contact form submissions → admin@xploitrum.org
- Event registrations → admin@xploitrum.org
- Student organization registration → admin@xploitrum.org

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- HTTPS/TLS encryption
- CORS protection
- Rate limiting (production)
- Role-based access control (Admin/User)

## 🐳 Docker (CTF Challenges)

For production CTF challenges:

1. Install Docker on server
2. Pull challenge images:
```bash
docker pull vulnerables/web-dvwa
docker pull cyberxsecurity/owasp-bwa
```

For development, the platform runs in **simulation mode** without Docker.

## 🧪 Testing

### Create admin user
```bash
cd backend
source venv/bin/activate
python -c "
from app.core.database import SessionLocal
from app.services.auth_service import auth_service

db = SessionLocal()
admin = auth_service.register_user(db, {
    'username': 'admin',
    'email': 'admin@xploitrum.org',
    'password': 'xploitRUM2025',
    'full_name': 'Admin User'
})
admin.role = 'admin'
db.commit()
print('Admin created!')
"
```

## 📊 Monitoring

```bash
# View service logs
sudo journalctl -u xploitrum-backend -f
sudo journalctl -u xploitrum-frontend -f

# Check service status
sudo systemctl status xploitrum-backend xploitrum-frontend nginx

# Monitor resources
htop
docker stats
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📞 Support

- Email: admin@xploitrum.org
- Website: https://www.xploitrum.org/contact
- GitHub Issues: [Report a bug](https://github.com/YOUR_USERNAME/xploitrum.org/issues)

## 📄 License

Copyright © 2025 XploitRUM - UPRM Cybersecurity Student Organization

## 🎯 Roadmap

- [x] Professional website
- [x] CTF platform with Docker
- [x] Event management system
- [x] Admin portal
- [x] Real-time statistics
- [x] Email notifications
- [ ] OpenVPN server setup
- [ ] Lab environment
- [ ] Discord bot integration
- [ ] Analytics dashboard

## 🙏 Acknowledgments

- Universidad de Puerto Rico - Mayagüez
- Department of Electrical and Computer Engineering
- All XploitRUM members and contributors

---

**Built with ❤️ by the XploitRUM team**
