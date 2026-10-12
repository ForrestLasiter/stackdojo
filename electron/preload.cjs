'use strict';
// The only door between the page and the OS: four named calls, nothing else.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('dojo', {
  content: () => ipcRenderer.invoke('dojo:content'),
  run: (trackId, challengeId, code) => ipcRenderer.invoke('dojo:run', trackId, challengeId, code),
  load: () => ipcRenderer.invoke('dojo:load'),
  save: (state) => ipcRenderer.invoke('dojo:save', state),
});
