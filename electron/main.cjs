'use strict';
// Main process. Owns the window, the save file, and grading — the renderer is
// a sandboxed web page that can only reach four IPC channels through the
// preload bridge. Grading lives here because it spawns compilers and shells.
const { app, BrowserWindow, ipcMain, shell, Menu, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

const tracks = require('../content/index.cjs');
const { grade, toolchains } = require('../engine/grade.cjs');

const SMOKE = process.env.DOJO_SMOKE;
// Smoke runs get a throwaway profile so they can never touch real progress.
if (SMOKE) app.setPath('userData', fs.mkdtempSync(path.join(os.tmpdir(), 'stackdojo-smoke-')));

const saveFile = () => path.join(app.getPath('userData'), 'progress.json');
const TOOL_FOR = { bash: 'bash', ps: 'ps', rust: 'rust' };
const TOOL_HELP = {
  bash: 'Needs Git Bash — install Git for Windows.',
  ps: 'Needs PowerShell.',
  rust: 'Needs the Rust compiler — install it from rustup.rs.',
};

function publicContent() {
  const tools = toolchains();
  return tracks.map((t) => {
    const need = TOOL_FOR[t.runner.kind];
    return {
      id: t.id, name: t.name, short: t.short, blurb: t.blurb, lang: t.lang, schemaNote: t.schemaNote || '',
      missingTool: need && !tools[need] ? TOOL_HELP[need] : '',
      // Tests stay in the main process; the page never needs them.
      challenges: t.challenges.map((c) => ({
        id: c.id, title: c.title, tier: c.tier, prompt: c.prompt, starter: c.starter || '', hints: c.hints, solution: c.solution,
      })),
      drills: t.drills || [],
    };
  });
}

function registerIpc() {
  ipcMain.handle('dojo:content', () => publicContent());

  ipcMain.handle('dojo:run', async (event, trackId, challengeId, code) => {
    if (typeof trackId !== 'string' || typeof challengeId !== 'string' || typeof code !== 'string') throw new Error('bad request');
    if (code.length > 200000) return { ok: false, tests: [], error: 'That is more code than the dojo will run (200 KB limit).' };
    const track = tracks.find((t) => t.id === trackId);
    const challenge = track && track.challenges.find((c) => c.id === challengeId);
    if (!challenge) throw new Error('unknown challenge');
    return grade(track, challenge, code);
  });

  ipcMain.handle('dojo:load', () => {
    try { return JSON.parse(fs.readFileSync(saveFile(), 'utf8')); } catch { return null; }
  });

  ipcMain.handle('dojo:save', (event, state) => {
    const json = JSON.stringify(state);
    if (typeof state !== 'object' || state === null || json.length > 8000000) throw new Error('bad save');
    // Write-then-rename: a crash mid-save can never leave half a file.
    const tmp = saveFile() + '.tmp';
    fs.mkdirSync(path.dirname(tmp), { recursive: true });
    fs.writeFileSync(tmp, json);
    fs.renameSync(tmp, saveFile());
    return true;
  });
}

// Open on the second monitor when there is one, so launching the dojo never
// lands on top of whatever is running full-screen on the main display.
function startBounds() {
  const primary = screen.getPrimaryDisplay();
  const other = screen.getAllDisplays().find((d) => d.id !== primary.id);
  const area = (other || primary).workArea;
  const width = Math.min(1320, area.width), height = Math.min(860, area.height);
  return { width, height, x: Math.round(area.x + (area.width - width) / 2), y: Math.round(area.y + (area.height - height) / 2), secondary: !!other };
}

function createWindow() {
  const { secondary, ...bounds } = startBounds();
  if (SMOKE && !secondary) {
    // An automated run must never pop up on the only screen someone is using.
    fs.mkdirSync(SMOKE, { recursive: true });
    fs.writeFileSync(path.join(SMOKE, 'smoke.log'), 'SKIP no second monitor detected - not opening a window on the main display\n');
    app.exit(2);
    return null;
  }
  const win = new BrowserWindow({
    ...bounds, minWidth: 940, minHeight: 600,
    backgroundColor: '#0f1218', title: 'StackDojo', show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true,
    },
  });
  // Automated runs appear without taking keyboard focus.
  win.once('ready-to-show', () => (SMOKE ? win.showInactive() : win.show()));
  win.webContents.setWindowOpenHandler(({ url }) => {
    try { if (new URL(url).protocol === 'https:') shell.openExternal(url); } catch { /* ignore */ }
    return { action: 'deny' };
  });
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  if (SMOKE) require('../scripts/smoke-hook.cjs')(win, SMOKE);
  return win;
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerIpc();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
