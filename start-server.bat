@echo off
rem Double-click to run Boom Arena on this PC, then play at http://localhost:8080
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is needed to run Boom Arena. Install it from https://nodejs.org and double-click this again.
  pause
  exit /b 1
)
start "" /b cmd /c "ping -n 3 127.0.0.1 >nul & start http://localhost:8080"
node server.js
pause
