@echo off
cd /d "%~dp0"
title Pharmacy POS Launcher

if not exist "package.json" (
    echo Error: package.json not found in the current directory.
    pause
    exit /b
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in your PATH.
    pause
    exit /b
)

if not exist "node_modules" (
    echo Error: node_modules not found. Please run 'npm install' first.
    pause
    exit /b
)

echo Starting Pharmacy POS System...
echo --------------------------------

echo Note: If the windows show errors, verify workspace names in package.json match @pos/server and @pos/web

echo 1. Launching Backend (NestJS)...
start "Pharmacy Backend" cmd /k "cd apps/server && npm run start:dev || echo Error: Failed to start backend. Check if 'apps/server' folder exists."

echo 2. Launching Frontend (React)...
start "Pharmacy Frontend" cmd /k "cd apps/web && npm run dev || echo Error: Failed to start frontend. Check if 'apps/web' folder exists."

echo --------------------------------
echo System starting...
echo Frontend: http://localhost:5173
echo Backend: http://localhost:3000
echo --------------------------------
pause
