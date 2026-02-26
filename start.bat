@echo off
title OpenClaw Chat UI

echo ========================================
echo   OpenClaw Chat UI
echo ========================================
echo.
echo Starting...
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found!
    echo Install from: https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js: 
node --version
echo.

if not exist "node_modules" (
    echo Installing dependencies...
    npm install
) else (
    echo Dependencies OK
)

echo.
echo Starting app...
echo.

npm start

echo.
echo Done.
pause
