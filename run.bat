@echo off
title Stage Guess Reveal Game (Hugo Extended)
setlocal

cd /d "%~dp0"

echo ===================================================
echo     Stage Guess Reveal Game (Hugo Extended)
echo ===================================================
echo.

:: Check for Hugo
where hugo >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Hugo is not installed or not in PATH!
    echo Please install Hugo Extended from: https://gohugo.io/installation/
    echo.
    pause
    exit /b 1
)

:: Open browser automatically after a short delay in background
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:1313"

echo [INFO] Server starting at http://localhost:1313
echo [INFO] Serverless Static Site running with Hugo Extended!
echo [INFO] Zero backend, zero databases, 100% offline & stage-ready.
echo [INFO] Press Ctrl+C in this window to stop.
echo.

:: Start Hugo server
hugo server -p 1313

pause
