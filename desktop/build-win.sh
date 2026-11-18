#!/bin/bash
# Builds the Windows version on a Mac: dist/BoomArena-windows.zip (a "Boom Arena" folder; players unzip it and run
# Boom Arena.exe). With --installer it builds dist/BoomArena-Setup-<version>.exe instead (one click, Start menu and
# desktop shortcuts); that step runs NSIS, which on Apple silicon needs Rosetta: softwareupdate --install-rosetta
# Needs electron-builder 25 and resedit 2 in BOOM_TOOLS (default below): npm install electron-builder@25.1.8 resedit@2.0.3
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export BOOM_TOOLS="${BOOM_TOOLS:-$HOME/Documents/Projects/Boom Arena/desktop-build}"
TARGET=dir; [ "${1:-}" = "--installer" ] && TARGET=nsis
cd "$BOOM_TOOLS"
npx electron-builder --projectDir "$ROOT" --win "$TARGET" --x64 --publish never \
  -c.electronVersion=33.4.11 -c.afterPack="$ROOT/desktop/win-after-pack.js" -c.win.icon=desktop/icon.ico \
  -c.directories.output=dist -c.nsis.installerIcon=desktop/icon.ico -c.nsis.uninstallerIcon=desktop/icon.ico
if [ "$TARGET" = dir ]; then
  STAGE="$(mktemp -d)"; ditto --norsrc --noextattr "$ROOT/dist/win-unpacked" "$STAGE/Boom Arena"
  rm -f "$ROOT/dist/BoomArena-windows.zip"; (cd "$STAGE" && zip -q -r -X -9 "$ROOT/dist/BoomArena-windows.zip" "Boom Arena" -x '*.DS_Store')
  rm -rf "$STAGE"; du -sh "$ROOT/dist/BoomArena-windows.zip"
fi
