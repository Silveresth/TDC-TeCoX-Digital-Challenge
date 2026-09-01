@echo off
title TDC - TeCoX Digital Challenge 2026 Launcher

echo ======================================================
echo    Lancement de l'environnement de developpement TDC
echo    TeCoX - Tech Community eXperience
echo ======================================================

echo [1/2] Lancement du Backend Django (Port 8000)...
start "TDC Backend API" cmd /k "cd backend && python manage.py runserver 0.0.0.0:8000"

echo [2/2] Lancement du Frontend Next.js (Port 3000)...
start "TDC Frontend Next.js" cmd /k "cd frontend && npm run dev"

echo.
echo Application accessible sur :
echo   - Frontend : http://localhost:3000
echo   - Backend  : http://localhost:8000/admin
echo.
echo Identifiants par defaut :
echo   - Admin : admin / Admin@TDC2026!
echo   - Participant : TDC-2026-001 / Tdc2026!
echo ======================================================
pause
