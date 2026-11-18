// Boom Arena desktop (macOS + Windows): runs the game's own server inside the app (this computer only), so
// matches with bots work with no browser and no terminal, then opens the game full screen in its own window.
// F11 (or Ctrl+Cmd+F on a Mac) toggles full screen; the lobby has Exit.
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path'), net = require('net'), fs = require('fs');
const MAC = process.platform === 'darwin';
app.setName('Boom Arena');
// the game is tuned for a GPU: never fall back to software rendering because of a blocklist entry
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');

// A fixed port keeps the page's origin the same every launch, which is where settings, loadouts and progress are
// saved (localStorage). If something else holds it, any free port is used for that session.
const PREF_PORT = +(process.env.BOOM_PORT || 47080);
const freePort = p => new Promise(res => {
  const s = net.createServer().once('error', () => res(false)).once('listening', () => s.close(() => res(true)));
  s.listen(p, '127.0.0.1');
});

// one-time import of a save from the old browser version (written next to the app's data as import-save.json)
function importSave(win) {
  const f = path.join(app.getPath('userData'), 'import-save.json');
  if (!fs.existsSync(f)) return Promise.resolve();
  let data; try { data = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return Promise.resolve(); }
  return win.webContents.executeJavaScript(`(() => { const d = ${JSON.stringify(data)}; let n = 0;
    if (localStorage.getItem('boomImported')) return 0;
    for (const k in d) if (typeof d[k] === 'string') { localStorage.setItem(k, d[k]); n++; }
    localStorage.setItem('boomImported', '1'); return n; })()`)
    .then(n => { try { fs.renameSync(f, f + '.done'); } catch (e) {} return n; }).catch(() => 0);
}

function appMenu() {
  if (!MAC) return Menu.setApplicationMenu(null);
  // a Mac needs the app and Edit menus for Cmd+Q / Cmd+H and copy-paste in text boxes (player name, match codes)
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Boom Arena', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] },
    { role: 'editMenu' },
    { label: 'View', submenu: [{ role: 'togglefullscreen' }, { role: 'reload' }] },
    { role: 'windowMenu' },
  ]));
}

// self-test runs use their own data folder, so they never touch the player's save or clash with an open game
if (process.env.BOOM_SELFTEST) app.setPath('userData', path.join(require('os').tmpdir(), 'boom-selftest'));
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  let win = null;
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.show(); win.focus(); } });
  ipcMain.on('boom-quit', () => app.quit());
  ipcMain.on('boom-fullscreen', (e, on) => { if (win) win.setFullScreen(on == null ? !win.isFullScreen() : !!on); });
  app.whenReady().then(async () => {
    process.env.PORT = process.env.BOOM_PORT_FORCE || ((await freePort(PREF_PORT)) ? String(PREF_PORT) : '0');
    process.env.HOST = process.env.BOOM_HOST || '127.0.0.1';
    process.env.NODE_ENV = 'production';   // no developer routes in the shipped app
    // hosted server for Play Online, baked in at build time (BOOM_ONLINE_URL=... npm run dist:mac)
    if (!process.env.BOOM_ONLINE_URL) try { process.env.BOOM_ONLINE_URL = require('./online.json').url || ''; } catch (e) {}
    const { server } = require(path.join(__dirname, '..', 'server.js'));
    if (!server.listening) await new Promise(res => server.once('listening', res));
    appMenu();
    const base = `http://127.0.0.1:${server.address().port}/`;
    win = new BrowserWindow({
      width: 1600, height: 900, minWidth: 960, minHeight: 600, fullscreen: !process.env.BOOM_SELFTEST, backgroundColor: '#070a12', show: false, title: 'Boom Arena',
      icon: path.join(__dirname, '..', 'icons', 'icon-512.png'),
      webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
    });
    win.once('ready-to-show', () => win.show());
    win.webContents.on('before-input-event', (e, i) => {
      if (i.type === 'keyDown' && i.key === 'F11') { e.preventDefault(); win.setFullScreen(!win.isFullScreen()); }
      if (i.type === 'keyDown' && ((i.alt && i.key === 'F4') || (i.meta && i.key.toLowerCase() === 'q'))) app.quit();
    });
    // the game never navigates away; links (credits) open in the normal browser
    win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
    win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(base)) { e.preventDefault(); if (/^https?:/.test(url)) shell.openExternal(url); } });
    if (process.env.BOOM_SELFTEST) {   // smoke test: report the page state (BOOM_SHOT: also save screenshots, lobby then a few seconds of a match), then quit
      const wait = ms => new Promise(r => setTimeout(r, ms)), js = c => win.webContents.executeJavaScript(c).catch(e => 'ERR ' + e);
      const shot = async n => { if (!process.env.BOOM_SHOT) return; const img = await win.webContents.capturePage(); fs.writeFileSync(`${process.env.BOOM_SHOT}-${n}.jpg`, img.toJPEG(80)); };
      win.webContents.on('console-message', (e, lvl, msg) => { if (lvl >= 2) console.log('PAGE', msg.slice(0, 200)); });
      win.webContents.once('did-finish-load', async () => {
        await wait(+process.env.BOOM_SELFTEST);
        console.log('SELFTEST', await js(`JSON.stringify({ url: location.href, lobby: !!(window.BoomLobby && BoomLobby.isOpen()), ops: OP_IDS.map(opOk), desk: !!window.boomDesktop, gl: !!renderer.getContext(), sw: !!navigator.serviceWorker.controller })`));
        await shot('lobby');
        if (process.env.BOOM_SHOT) {
          await js(`document.getElementById('lbPlay').click()`); await wait(9000);
          if (process.env.BOOM_TEST_JS) { console.log('JS', await js(process.env.BOOM_TEST_JS)); await wait(1500); }   // a test can set up the view it wants to see
          console.log('MATCH', await js(`new Promise(r => { let n = 0; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else r(JSON.stringify({ running, bots: bots.length, fps: Math.round(n/2) })); })(); })`));
          await shot('match');
        }
        app.quit();
      });
    }
    let imported = false;
    win.webContents.on('did-finish-load', async () => {
      if (imported) return; imported = true;
      if (await importSave(win)) win.webContents.reload();
    });
    win.loadURL(base);
  });
  app.on('window-all-closed', () => app.quit());
}
