'use strict';
// In-app updates from GitHub Releases, via electron-updater. The app checks
// once shortly after it opens and whenever the sidebar button is pressed.
// Nothing is downloaded until the user asks, and nothing is installed until
// they press "Restart to update".
//
// Only an installed build can update itself: when running from source there is
// no installer to replace, so the status is 'unsupported' and no request is made.
const { app, ipcMain } = require('electron');

// status: unsupported | idle | checking | none | available | downloading | ready | error
const state = { status: 'idle', current: app.getVersion(), version: '', percent: 0, message: '' };
let target = null;
let updater = null;

function set(patch) {
  Object.assign(state, patch);
  if (target && !target.isDestroyed()) target.webContents.send('dojo:update-status', { ...state });
}

function friendly(err) {
  const text = String((err && err.message) || err);
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ERR_INTERNET|ERR_NETWORK|net::/i.test(text)) return 'Could not reach GitHub. Check your internet connection.';
  if (/404|latest\.yml/i.test(text)) return 'No update information was found for this release.';
  return text.split('\n')[0].slice(0, 200);
}

async function check() {
  if (!updater || state.status === 'checking' || state.status === 'downloading' || state.status === 'ready') return { ...state };
  set({ status: 'checking', message: '' });
  try { await updater.checkForUpdates(); } catch (e) { set({ status: 'error', message: friendly(e) }); }
  return { ...state };
}

async function download() {
  if (!updater || state.status !== 'available') return { ...state };
  set({ status: 'downloading', percent: 0 });
  try { await updater.downloadUpdate(); } catch (e) { set({ status: 'error', message: friendly(e) }); }
  return { ...state };
}

function setup(win, { autoCheck }) {
  target = win;
  ipcMain.handle('dojo:update-get', () => ({ ...state }));
  ipcMain.handle('dojo:update-check', check);
  ipcMain.handle('dojo:update-download', download);
  ipcMain.handle('dojo:update-install', () => {
    if (updater && state.status === 'ready') updater.quitAndInstall(true, true);
    return true;
  });

  if (!app.isPackaged) {
    set({ status: 'unsupported', message: 'Updates are available in the installed app. From source, use git pull.' });
    return;
  }

  updater = require('electron-updater').autoUpdater;
  updater.autoDownload = false;
  updater.autoInstallOnAppQuit = true;
  updater.on('update-available', (info) => set({ status: 'available', version: info.version }));
  updater.on('update-not-available', () => set({ status: 'none' }));
  updater.on('download-progress', (p) => set({ status: 'downloading', percent: Math.round(p.percent) }));
  updater.on('update-downloaded', (info) => set({ status: 'ready', version: info.version, percent: 100 }));
  updater.on('error', (e) => set({ status: 'error', message: friendly(e) }));

  // A few seconds after launch, so the check never competes with startup.
  if (autoCheck) setTimeout(check, 4000);
}

module.exports = { setup, retarget: (win) => { target = win; } };
