#!/bin/bash
# Double-click to play Boom Arena on a Mac.
# With Node.js installed you get everything, including online matches with friends on your Wi-Fi.
# Without it, Python (built into most Macs) runs single-player. With neither, the web version opens.
cd "$(dirname "$0")"
URL="http://localhost:8080/"
WEB="https://samuel-ai90.github.io/Boom-Arena/"

if curl -fsS "$URL" >/dev/null 2>&1; then open "$URL"; exit 0; fi   # already running

( sleep 2; open "$URL" ) &
if command -v node >/dev/null 2>&1; then
  echo "Starting Boom Arena… (close this window to stop it)"
  exec node server.js
elif command -v python3 >/dev/null 2>&1 && python3 -c "" >/dev/null 2>&1; then
  echo "Starting Boom Arena (single-player)… Install Node.js from https://nodejs.org for online matches."
  echo "Close this window to stop it."
  exec python3 -m http.server 8080 --bind 127.0.0.1
else
  kill %1 2>/dev/null
  echo "Neither Node.js nor Python was found, so opening the web version instead."
  open "$WEB"
fi
