@echo off
title CropShield AI - Starting All Services
color 0A

echo.
echo  ========================================
echo   CropShield AI - Starting All Services
echo  ========================================
echo.

:: ── Check if MongoDB is running ──
sc query MongoDB | find "RUNNING" >nul 2>&1
if %errorlevel% neq 0 (
    echo [*] Starting MongoDB service...
    net start MongoDB >nul 2>&1
    if %errorlevel% neq 0 (
        echo [WARN] Could not auto-start MongoDB. Make sure it is running manually.
    ) else (
        echo [OK] MongoDB started.
    )
) else (
    echo [OK] MongoDB already running.
)

:: ── Start Python ML API in a new window ──
echo [*] Starting Python ML API (port 8000)...
start "CropShield - Python ML API" cmd /k "cd /d %~dp0ai-api && venv\Scripts\activate && uvicorn app:app --reload --port 8000"

timeout /t 5 /nobreak >nul

:: ── Start Node.js Backend in a new window ──
echo [*] Starting Node.js Backend (port 5001)...
start "CropShield - Node Backend" cmd /k "cd /d %~dp0server && node server.js"

timeout /t 3 /nobreak >nul

:: ── Start React Frontend in a new window ──
echo [*] Starting React Frontend (port 5173)...
start "CropShield - React Frontend" cmd /k "cd /d %~dp0client && npm run dev"

echo.
echo  ========================================
echo   All services launched!
echo.
echo   Frontend  : http://localhost:5173
echo   Backend   : http://localhost:5001
echo   ML API    : http://localhost:8000
echo  ========================================
echo.
echo  Close the individual terminal windows to stop each service.
echo.
pause
