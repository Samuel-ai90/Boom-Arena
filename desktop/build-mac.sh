#!/bin/bash
# Builds the Mac app: dist/Boom Arena.app and dist/BoomArena-mac.dmg (drag-to-Applications installer).
#   desktop/build-mac.sh [--install]   (--install also copies it to /Applications; needs Electron: npm install electron@33.4.11 somewhere, then ELECTRON_APP=... or the default below)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ELECTRON_APP="${ELECTRON_APP:-$HOME/Documents/Projects/Boom Arena/desktop-build/node_modules/electron/dist/Electron.app}"
OUT="$ROOT/dist"; APP="$OUT/Boom Arena.app"; VER="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$ROOT/package.json" | head -1)"
[ -d "$ELECTRON_APP" ] || { echo "Electron not found at $ELECTRON_APP"; exit 1; }
rm -rf "$APP"; mkdir -p "$OUT"
ditto "$ELECTRON_APP" "$APP"
RES="$APP/Contents/Resources"; rm -f "$RES/default_app.asar"
# the game itself
rsync -a --delete "$ROOT/" "$RES/app/" \
  --exclude '.git' --exclude '.github' --exclude '.claude' --exclude 'node_modules' --exclude 'dist' --exclude 'dist-win' \
  --exclude 'tests' --exclude 'tools' --exclude 'characters' --exclude 'screenshots' --exclude '_site' --exclude '_ex_*' --exclude '*.tar.gz' \
  --exclude '*.command' --exclude '*.bat' --exclude 'render.yaml' --exclude 'package-lock.json' --exclude 'DEPLOY.md' --exclude '.DS_Store' \
  --exclude 'desktop/build-mac.sh' --exclude 'desktop/icon.icns' --exclude '.gitignore'
cp "$ROOT/desktop/icon.icns" "$RES/electron.icns"
# Electron and Chromium licences ship with the app
cp "$(dirname "$ELECTRON_APP")/LICENSE" "$RES/LICENSE.electron.txt"; cp "$(dirname "$ELECTRON_APP")/LICENSES.chromium.html" "$RES/LICENSES.chromium.html"
P="$APP/Contents/Info.plist"; pb() { /usr/libexec/PlistBuddy -c "$1" "$P"; }
pb "Set :CFBundleName Boom Arena"; pb "Set :CFBundleDisplayName Boom Arena"
pb "Set :CFBundleIdentifier com.samlindow.boomarena"
pb "Set :CFBundleShortVersionString $VER"; pb "Set :CFBundleVersion $VER"
pb "Add :LSApplicationCategoryType string public.app-category.action-games" 2>/dev/null || pb "Set :LSApplicationCategoryType public.app-category.action-games"
pb "Delete :NSMicrophoneUsageDescription" 2>/dev/null || true; pb "Delete :NSCameraUsageDescription" 2>/dev/null || true
pb "Delete :NSBluetoothAlwaysUsageDescription" 2>/dev/null || true; pb "Delete :NSBluetoothPeripheralUsageDescription" 2>/dev/null || true
# no Apple developer certificate here: sign "ad hoc" so macOS on Apple silicon will run it
codesign --force --deep --sign - "$APP" >/dev/null
codesign --verify --deep "$APP"
# installer disk image: the app plus a shortcut to Applications
STAGE="$(mktemp -d)"; ditto "$APP" "$STAGE/Boom Arena.app"; ln -s /Applications "$STAGE/Applications"
rm -f "$OUT/BoomArena-mac.dmg"
hdiutil create -quiet -volname "Boom Arena" -srcfolder "$STAGE" -fs HFS+ -format UDZO -imagekey zlib-level=6 "$OUT/BoomArena-mac.dmg"
rm -rf "$STAGE"
du -sh "$APP" "$OUT/BoomArena-mac.dmg"
if [ "${1:-}" = "--install" ]; then
  if pgrep -f "/Applications/Boom Arena.app/Contents/MacOS/Electron" >/dev/null; then echo "Boom Arena is open: quit it, then run this again to install"; exit 1; fi
  rm -rf "/Applications/Boom Arena.app"; ditto "$APP" "/Applications/Boom Arena.app"; echo "installed to /Applications/Boom Arena.app"
fi
