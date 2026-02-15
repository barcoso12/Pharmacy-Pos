#!/bin/bash
# Pharmacy POS - Complete Startup Script
# This script sets up and starts both frontend and backend servers

set -e

echo "======================================"
echo "🏥 Pharmacy POS System - Startup"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version:${NC} $(node -v)"
echo -e "${GREEN}✓ npm version:${NC} $(npm -v)"
echo ""

# Check if PostgreSQL is needed
echo -e "${YELLOW}Prerequisites:${NC}"
echo "1. PostgreSQL 15+ should be running"
echo "2. Create database: CREATE DATABASE pharmacy_pos;"
echo "3. Update DATABASE_URL in .env file"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing root dependencies...${NC}"
    npm install
fi

if [ ! -d "apps/server/node_modules" ]; then
    echo -e "${YELLOW}Installing server dependencies...${NC}"
    cd apps/server
    npm install
    cd ../..
fi

if [ ! -d "apps/web/node_modules" ]; then
    echo -e "${YELLOW}Installing frontend dependencies...${NC}"
    cd apps/web
    npm install
    cd ../..
fi

# Check .env file
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating template...${NC}"
    cat > .env << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database
DATABASE_URL=postgres://user:password@localhost:5432/pharmacy_pos
DATABASE_LOGGING=true

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=900

# CORS
CORS_ORIGIN=http://localhost:5173

# Application
APP_NAME=Pharmacy POS
APP_VERSION=1.0.0
EOF
    echo -e "${YELLOW}Please update .env with your database credentials${NC}"
    echo ""
fi

# Start servers
echo -e "${GREEN}Starting servers...${NC}"
echo ""

# Create separate terminal windows (if on macOS)
if [[ "$OSTYPE" == "darwin"* ]]; then
    osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/apps/server\" && npm run dev"'
    osascript -e 'tell app "Terminal" to do script "cd \"'"$(pwd)"'/apps/web\" && npm run dev"'
    echo -e "${GREEN}✓ Backend server started in new terminal (port 3000)${NC}"
    echo -e "${GREEN}✓ Frontend server started in new terminal (port 5173)${NC}"
else
    # For Linux or other systems
    echo -e "${YELLOW}To start the servers manually:${NC}"
    echo ""
    echo "Terminal 1 (Backend):"
    echo "  cd apps/server && npm run dev"
    echo ""
    echo "Terminal 2 (Frontend):"
    echo "  cd apps/web && npm run dev"
    echo ""
fi

echo ""
echo -e "${GREEN}======================================"
echo "🚀 Servers starting..."
echo "=====================================${NC}"
echo ""
echo "Frontend: http://localhost:5173"
echo "Backend:  http://localhost:3000"
echo "API Docs: http://localhost:3000/api/docs"
echo ""
echo "Default Login:"
echo "  Email: admin@pharmacy.com"
echo "  Password: password123"
echo ""
echo "Press Ctrl+C to stop"
