# Pharmacy POS - Quick Start Guide

## 🚀 Fastest Way to Get Started

### If you have Docker installed:
1. Double-click `start_docker.bat`
2. Wait for services to start (2-3 minutes)
3. Open http://localhost

### If you don't have Docker:
1. Install Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Then follow steps above

## 📋 What You Get

- **POS Interface**: Modern, keyboard-optimized checkout
- **Offline Mode**: Works without internet connection
- **Prescription Management**: Digital Rx tracking
- **FEFO Inventory**: Automatic expiry-based stock rotation
- **Loyalty Program**: Automatic points and tiers
- **Reports**: Sales and inventory analytics

## 💡 First Steps

1. **The system starts with mock data** - you can immediately test the POS
2. **Backend API**: http://localhost:3000
3. **Frontend App**: http://localhost (Docker) or http://localhost:5173 (manual)

## 📚 Learn More

- **User Guide**: See `walkthrough.md`
- **Deployment**: See `DEPLOYMENT.md`
- **Technical Details**: See `implementation_status.md`

## ⚠️ Important Notes

- Database schema must be run manually (see `docs/schema.sql`)
- Change JWT_SECRET before production use
- Docker is strongly recommended for consistent environment

## 🆘 Need Help?

Check `DEPLOYMENT.md` for detailed setup instructions and troubleshooting.
