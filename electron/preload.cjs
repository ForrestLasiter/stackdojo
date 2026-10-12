'use strict';
// The only door between the page and the OS: four named calls for the dojo
// itself, plus the updater controls. Nothing else is exposed.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dojo', {
  content: () => ipcRenderer.invoke('dojo:content'),
  run: (trackId, challengeId, code) => ipcRenderer.invoke('dojo:run', trackId, challengeId, code),
  load: () => ipcRenderer.invoke('dojo:load'),
  save: (state) => ipcRenderer.invoke('dojo:save', state),
  update: {
    get: () => ipcRenderer.invoke('dojo:update-get'),
    check: () => ipcRenderer.invoke('dojo:update-check'),
    download: () => ipcRenderer.invoke('dojo:update-download'),
    install: () => ipcRenderer.invoke('dojo:update-install'),
    // The page gets the status only — never the raw IPC event.
    onStatus: (callback) => { ipcRenderer.on('dojo:update-status', (event, status) => callback(status)); },
  },
});
