const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('boomDesktop', { quit: () => ipcRenderer.send('boom-quit'), fullscreen: on => ipcRenderer.send('boom-fullscreen', on) });
