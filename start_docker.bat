@echo off
echo Starting Pharmacy POS (Docker)...
docker-compose up --build -d
echo --------------------------------
echo Backend: http://localhost:3000
echo Frontend: http://localhost:80
echo --------------------------------
pause
