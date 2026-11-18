# Boom Arena

A fast first-person shooter for Mac and Windows: bot matches, killstreaks, Gun Game, Mini Warzone and Battle Royale.

## ⬇ Download (Mac)

**[Download Boom Arena for Mac](https://github.com/Samuel-ai90/Boom-Arena/releases/latest/download/BoomArena-mac.dmg)** (Apple silicon: M1 or newer)

1. Open `BoomArena-mac.dmg` and drag **Boom Arena** into **Applications**.
2. Open Boom Arena from Applications or Launchpad. It runs full screen in its own window, no browser and no internet needed.
3. The first time, macOS may say it can't verify the app (it isn't signed with a paid Apple developer account). Go to **System Settings › Privacy & Security**, scroll down and click **Open Anyway**. You only do this once.

## ⬇ Download (Windows)

**[Download Boom Arena for Windows](https://github.com/Samuel-ai90/Boom-Arena/releases/latest/download/BoomArena-windows.zip)** (64-bit Windows 10 or 11)

1. Right-click `BoomArena-windows.zip` → **Extract All…**, and put the **Boom Arena** folder anywhere you like (Documents, Desktop…).
2. Open the folder and double-click **Boom Arena.exe**. Right-click it → **Show more options** → **Send to** → **Desktop (create shortcut)** for a desktop icon.
3. The first time, Windows SmartScreen may say it "protected your PC" (the app isn't signed with a paid certificate). Click **More info** → **Run anyway**. You only do this once.

All releases: https://github.com/Samuel-ai90/Boom-Arena/releases

## Controls

| Action | Key |
| --- | --- |
| Move | W A S D |
| Look / shoot / aim | Mouse / left click / right click |
| Jump / crouch / sprint | Space / C / Shift |
| Reload / swap weapon | R / Q |
| Grenade / tactical | G / T |
| Melee / armor plate | V / X |
| Scoreboard / map | Tab / M |
| FPS counter | F3 |
| Full screen on / off | F11 |
| Quit | Cmd+Q, or the power button in the lobby |

Every key can be changed in **Settings › Controls**. Controllers work too.

## Graphics

The game tests your computer the first time it loads and picks the best look that holds your screen's refresh rate. You can choose a preset yourself in **Settings › Display**.

## Building the app

`desktop/build-mac.sh` builds `dist/Boom Arena.app` and `dist/BoomArena-mac.dmg` from this folder (it needs Electron 33: `npm install electron@33.4.11` in any folder, then point `ELECTRON_APP` at its `node_modules/electron/dist/Electron.app`). `--install` also copies the app to Applications. `desktop/build-win.sh` builds `dist/BoomArena-windows.zip` on a Mac (with electron-builder and resedit; see the script).

## Online match server

`node server.js` (Node.js 22 or newer) runs the online match server on its own; see `render.yaml` to host it on Render.

## Credits

- Gunshot recordings: [Snake's Authentic Gun Sounds](https://f8studios.itch.io/snakes-authentic-gun-sounds) and [Snake's SECOND Authentic Gun Sounds](https://f8studios.itch.io/snakes-second-authentic-gun-sounds-pack) by SnakeF8 (public domain).
- MP5 model: ["MP5 Submachine Gun"](https://sketchfab.com/3d-models/mp5-submachine-gun-a73b61932a0e4eecb5db5c63c158aa24) by [Rotuma](https://sketchfab.com/Rotuma), licensed under [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/) (textures resized for the game).
- M16A4 model: ["M16 Assault Rifle"](https://sketchfab.com/3d-models/m16-assault-rifle-339d0f7b21024387853dd926a5d51b50) by Mateusz Woliński ([jeandiz](https://sketchfab.com/jeandiz)), CC-BY-4.0 (carry handle hidden, textures resized).
- M9 model: ["Beretta M9"](https://sketchfab.com/3d-models/beretta-m9-d1200d9aa28f466484f7d3fdd7724e76) by [emran.bayati](https://sketchfab.com/emran.bayati), CC-BY-4.0 (spare magazine hidden, textures resized).
- M870 model: ["Remington 870 Police Magnum 12 Gauge Shotgun"](https://sketchfab.com/3d-models/remington-870-police-magnum-12-gauge-shotgun-eea11de7e9d24b6683962b8388c319eb) by 8sianDude ([haoliu95](https://sketchfab.com/haoliu95)), CC-BY-4.0 (loose shells removed, textures resized).
- M249 model: ["M249"](https://sketchfab.com/3d-models/m249-9b4c19512e6749248704ff5a5b6d4421) by [Chipotle0303](https://sketchfab.com/Chipotle0303), CC-BY-4.0 (textures resized).
- Soldier: infantry soldier model by Grab3D (CC0, AI-assisted mesh cleaned up by hand), on the skeleton and idle / walk / jog / sprint animations of the [Universal Animation Library](https://quaternius.com) by Quaternius (CC0).
- World props (ammo crates, oil drums, jersey barriers, tyres, gas bottles, generator, utility box): photo-scanned models from [Poly Haven](https://polyhaven.com/models) (CC0), simplified and resized for the game: wooden_military_crate, old_military_crate, concrete_road_barrier, Barrel_01, Barrel_02, barrel_03, old_tyre, propane_tank, utility_box_02, portable_generator.
- App shell: [Electron](https://www.electronjs.org) (MIT licence; Electron and Chromium licences are inside the app).
