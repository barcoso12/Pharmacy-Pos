# Pharmacy POS - Deployment Checklist

## Prerequisites

### Option 1: Docker Deployment (Recommended)
- [ ] Install Docker Desktop from https://www.docker.com/products/docker-desktop/
- [ ] Ensure Docker Desktop is running
- [ ] Run `start_docker.bat`

### Option 2: Manual Deployment
- [ ] Install Node.js 18+ from https://nodejs.org
- [ ] Install PostgreSQL 15+ from https://www.postgresql.org/download/
- [ ] Install Redis (optional) from https://redis.io/download

## Setup Steps (Manual)

### 1. Environment Configuration
```bash
# Copy the example environment file
copy .env.example .env

# Edit .env with your actual credentials
```

### 2. Database Setup
```bash
# Connect to PostgreSQL and create database
createdb pharmacy_pos

# Run the schema
psql -d pharmacy_pos -f docs/schema.sql
```

### 3. Install Dependencies
```bash
# From project root
npm install
```

### 4. Start Development Servers
```bash
# Terminal 1 - Backend
cd apps/server
npm run dev

# Terminal 2 - Frontend  
cd apps/web
npm run dev
```

## Production Deployment

### Docker Production
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Production
```bash
# Build backend
cd apps/server
npm run build
npm run start:prod

# Build frontend
cd apps/web
npm run build
# Serve dist folder with nginx or similar
```

## Post-Deployment Verification

- [ ] Backend health: http://localhost:3000/api
- [ ] Frontend loads: http://localhost or http://localhost:5173
- [ ] Database connection successful
- [ ] Test POS transaction flow
- [ ] Verify offline sync functionality
- [ ] Check prescription management
- [ ] Validate FEFO inventory deduction

## Security Checklist (Before Production)

- [ ] Change JWT_SECRET in .env
- [ ] Update database credentials
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set up backup strategy
- [ ] Enable audit logging
- [ ] Review user permissions

## Troubleshooting

### "Cannot find module" errors
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Docker build fails
```bash
# Clean Docker cache
docker-compose down
docker system prune -a
docker-compose up --build
```

### Database connection fails
- Verify PostgreSQL is running
- Check credentials in .env
- Ensure database exists
- Check firewall settings

## Support & Documentation

- Architecture: `docs/architecture.md`
- API Docs: `docs/api_spec.md`
- User Guide: `walkthrough.md`
- Features: `implementation_status.md`
