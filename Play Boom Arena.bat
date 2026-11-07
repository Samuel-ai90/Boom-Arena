@echo off
rem Double-click to play Boom Arena on Windows.
rem With Node.js installed you get everything, including online matches with friends on your Wi-Fi.
rem Without it, Python runs single-player. With neither, the web version opens.
cd /d "%~dp0"
set URL=http://localhost:8080/
set WEB=https://samuel-ai90.github.io/Boom-Arena/

where node >nul 2>nul
if not errorlevel 1 (
  echo Starting Boom Arena... close this window to stop it.
  start "" /b cmd /c "ping -n 3 127.0.0.1 >nul & start %URL%"
  node server.js
  pause
  exit /b
)
where py >nul 2>nul
if not errorlevel 1 (
  echo Starting Boom Arena single-player... install Node.js from https://nodejs.org for online matches.
  start "" /b cmd /c "ping -n 3 127.0.0.1 >nul & start %URL%"
  py -m http.server 8080 --bind 127.0.0.1
  pause
  exit /b
)
echo Neither Node.js nor Python was found, so opening the web version instead.
start "" %WEB%
