# Boom Arena

A fast first-person shooter in the browser: bot matches, killstreaks, Gun Game, Mini Warzone and Battle Royale.

## ▶ Play now (nothing to install)

**https://samuel-ai90.github.io/Boom-Arena/**

Opens straight in Chrome, Edge or Safari. Single-player against bots. Press **F3** in-game for an FPS counter.

## ⬇ Download and play on your computer

1. Click the green **Code** button above → **Download ZIP**, then unzip it.
2. Double-click the launcher:
   - **Mac:** `Play Boom Arena.command`
     (the first time, macOS may block it: right-click it → **Open** → **Open**)
   - **Windows:** `Play Boom Arena.bat`
     (if SmartScreen appears: **More info** → **Run anyway**)
3. The game opens in your browser at `http://localhost:8080`. Close the launcher window to stop it.

The launcher uses [Node.js](https://nodejs.org) if you have it, which also lets friends on your Wi-Fi join your online matches. Without Node it falls back to Python for single-player, and with neither it opens the web version.

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

Every key can be changed in **Settings › Controls**. Controllers work too.

## Graphics

The game tests your computer the first time it loads and picks the best look that holds your screen's refresh rate. You can choose a preset yourself in **Settings › Display**.

## Hosting online matches

Run `node server.js` (Node.js 22 or newer). Players on the same network join at the address it prints. See `render.yaml` to host it on Render.

## Credits

- Gunshot recordings: [Snake's Authentic Gun Sounds](https://f8studios.itch.io/snakes-authentic-gun-sounds) and [Snake's SECOND Authentic Gun Sounds](https://f8studios.itch.io/snakes-second-authentic-gun-sounds-pack) by SnakeF8 (public domain).
- MP5 model: ["MP5 Submachine Gun"](https://sketchfab.com/3d-models/mp5-submachine-gun-a73b61932a0e4eecb5db5c63c158aa24) by [Rotuma](https://sketchfab.com/Rotuma), licensed under [CC-BY-4.0](http://creativecommons.org/licenses/by/4.0/) (textures resized for the game).
