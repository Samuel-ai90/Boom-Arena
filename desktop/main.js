// Boom Arena desktop (macOS + Windows): runs the game's own server inside the app (localhost only, a free port), so offline
// matches with bots work with no terminal, then opens it full screen. F11 toggles full screen; the lobby has Exit.
const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const path = require('path');
if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  let win = null;
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
  process.env.PORT = process.env.BOOM_PORT || '0';
  process.env.HOST = process.env.BOOM_HOST || '127.0.0.1';
  process.env.NODE_ENV = 'production';
  // hosted server for Play Online, baked in at build time (BOOM_ONLINE_URL=... npm run dist:win)
  if (!process.env.BOOM_ONLINE_URL) try { process.env.BOOM_ONLINE_URL = require('./online.json').url || ''; } catch (e) {}   // no developer routes in the shipped app
  const { server } = require(path.join(__dirname, '..', 'server.js'));
  const ready = new Promise(res => server.listening ? res() : server.once('listening', res));
  Menu.setApplicationMenu(null);
  ipcMain.on('boom-quit', () => app.quit());
  ipcMain.on('boom-fullscreen', (e, on) => { if (win) win.setFullScreen(on == null ? !win.isFullScreen() : !!on); });
  app.whenReady().then(async () => {
    await ready;
    win = new BrowserWindow({
      width: 1600, height: 900, fullscreen: true, backgroundColor: '#070a12', show: false, title: 'Boom Arena',
      icon: path.join(__dirname, '..', 'icons', 'icon-512.png'),
      webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false },
    });
    win.once('ready-to-show', () => win.show());
    win.webContents.on('before-input-event', (e, i) => {
      if (i.type === 'keyDown' && i.key === 'F11') { e.preventDefault(); win.setFullScreen(!win.isFullScreen()); }
      if (i.type === 'keyDown' && ((i.alt && i.key === 'F4') || (i.meta && i.key.toLowerCase() === 'q'))) app.quit();
    });
    win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/.test(url)) shell.openExternal(url); return { action: 'deny' }; });
    if (process.env.BOOM_SELFTEST) {   // CI-style smoke test: report the page state, then quit
      win.webContents.on('console-message', (e, lvl, msg) => { if (lvl >= 2) console.log('PAGE', msg.slice(0, 200)); });
      win.webContents.on('did-finish-load', () => setTimeout(async () => {
        const r = await win.webContents.executeJavaScript(`JSON.stringify({ play: document.getElementById('play').textContent, lobby: !!(window.BoomLobby && BoomLobby.isOpen()), ops: OP_IDS.map(opOk), desk: !!window.boomDesktop })`).catch(e => 'ERR ' + e);
        console.log('SELFTEST', r); app.quit();
      }, +process.env.BOOM_SELFTEST));
    }
    win.loadURL(`http://127.0.0.1:${server.address().port}/`);
  });
  app.on('window-all-closed', () => app.quit());
}
