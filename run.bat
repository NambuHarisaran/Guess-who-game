@echo off
title Stage Guess Reveal Game
setlocal

cd /d "%~dp0"

echo ===================================================
echo        Starting Stage Guess Reveal Game
echo ===================================================
echo.

:: Check for Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please download and install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Check if node_modules exists, otherwise install dependencies
if not exist "node_modules\" (
    echo [INFO] Dependencies not found. Installing packages with npm install...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] npm install failed! Please check your internet connection.
        pause
        exit /b 1
    )
    echo.
)

:: Open browser automatically after a short delay in background
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:3000"

echo [INFO] Server starting at http://localhost:3000
echo [INFO] Both backend API and frontend are running together.
echo [INFO] Press Ctrl+C in this window to stop the server.
echo.

:: Start Node.js server
node backend/server.js

pause
