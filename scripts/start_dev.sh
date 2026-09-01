#!/bin/bash

echo "======================================================"
echo "   Lancement du développement TDC (TeCoX Digital Challenge)"
echo "======================================================"

# Backend
echo "[1/2] Lancement du Backend Django (Port 8000)..."
(cd backend && python manage.py runserver 0.0.0.0:8000) &

# Frontend
echo "[2/2] Lancement du Frontend Next.js (Port 3000)..."
(cd frontend && npm run dev) &

wait
