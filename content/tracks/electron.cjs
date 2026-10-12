'use strict';
// `require('electron')` resolves to a behavioural stand-in: windows record
// their options, and ipcRenderer is wired to ipcMain, so a call made through a
// preload bridge really arrives at the main-process handler. Tests inspect it
// through the global `E` (E.windows, E.app, E.ipcRenderer, E.state, …).
// Where an exercise has both sides, main and preload share one editor.

const PLATFORM = `const _as = (platform, fn) => { const real = Object.getOwnPropertyDescriptor(process, 'platform'); Object.defineProperty(process, 'platform', { value: platform, configurable: true }); try { return fn(); } finally { Object.defineProperty(process, 'platform', real); } };
`;

module.exports = {
  id: 'electron',
  name: 'Electron',
  short: 'El',
  blurb: 'Desktop apps: the main process, windows, IPC, preload bridges and locking it all down.',
  lang: 'javascript',
  runner: { kind: 'node', loader: 'js', env: 'electron' },
  challenges: [
    {
      id: 'create-window', title: 'Open a window', tier: 1,
      prompt: "Write `createWindow()`. It creates a `BrowserWindow` that is 1000 wide and 700 tall with the title `Dojo`, loads `index.html` with `loadFile`, and returns the window.",
      starter: `const { BrowserWindow } = require('electron');\n\nfunction createWindow() {\n  \n}\n`,
      solution: `const { BrowserWindow } = require('electron');\n\nfunction createWindow() {\n  const win = new BrowserWindow({ width: 1000, height: 700, title: 'Dojo' });\n  win.loadFile('index.html');\n  return win;\n}\n`,
      tests: `test('creates one window with the right options', () => { const w = createWindow(); eq(E.windows.length, 1); ok(w === E.windows[0], 'return the window'); eq([w.options.width, w.options.height, w.options.title], [1000, 700, 'Dojo']); });
test('loads index.html', () => { const w = E.windows[0]; eq(w.loadFile.calls, [['index.html']]); });`,
      hints: ['`new BrowserWindow({ width, height, title })`.', '`loadFile` is for a local HTML file; `loadURL` is for a web address or dev server.'],
    },
    {
      id: 'when-ready', title: 'Wait for the app', tier: 1,
      prompt: "Creating a window before Electron has finished starting throws. Make this script call `createWindow` once the app is ready — and not a moment before.",
      starter: `const { app, BrowserWindow } = require('electron');\n\nfunction createWindow() {\n  const win = new BrowserWindow({ width: 800, height: 600 });\n  win.loadFile('index.html');\n}\n\n// start the app here\n`,
      solution: `const { app, BrowserWindow } = require('electron');\n\nfunction createWindow() {\n  const win = new BrowserWindow({ width: 800, height: 600 });\n  win.loadFile('index.html');\n}\n\napp.whenReady().then(createWindow);\n`,
      tests: `test('no window before ready', () => eq(E.windows.length, 0));
test('one window once ready', async () => { await E.emitReady(); eq(E.windows.length, 1); });`,
      hints: ['`app.whenReady()` returns a promise.', "`.then(createWindow)` — pass the function, do not call it."],
    },
    {
      id: 'all-closed', title: 'Quit — except on macOS', tier: 1,
      prompt: "On Windows and Linux, an app quits when its last window closes. On macOS (`process.platform === 'darwin'`) apps stay running in the dock. Register a `window-all-closed` handler that calls `app.quit()` on every platform except macOS.",
      starter: `const { app } = require('electron');\n\n`,
      solution: `const { app } = require('electron');\n\napp.on('window-all-closed', () => {\n  if (process.platform !== 'darwin') app.quit();\n});\n`,
      tests: PLATFORM + `test('quits on Windows', () => { _as('win32', () => E.app.emit('window-all-closed')); eq(E.app.quit.calls.length, 1); });
test('quits on Linux', () => { _as('linux', () => E.app.emit('window-all-closed')); eq(E.app.quit.calls.length, 2); });
test('stays alive on macOS', () => { _as('darwin', () => E.app.emit('window-all-closed')); eq(E.app.quit.calls.length, 2); });`,
      hints: ['`app.on("window-all-closed", handler)`.', '`process.platform` is `"win32"`, `"darwin"` or `"linux"`.'],
    },
    {
      id: 'activate', title: 'Re-open from the dock', tier: 2,
      prompt: "On macOS, clicking the dock icon fires `activate`. If the app has no windows open at that moment, it should open one; if it already has a window, it should not open another.\n\nWhen the app is ready: create a window, and register that `activate` handler.",
      starter: `const { app, BrowserWindow } = require('electron');\n\nfunction createWindow() {\n  new BrowserWindow({ width: 800, height: 600 }).loadFile('index.html');\n}\n\n`,
      solution: `const { app, BrowserWindow } = require('electron');\n\nfunction createWindow() {\n  new BrowserWindow({ width: 800, height: 600 }).loadFile('index.html');\n}\n\napp.whenReady().then(() => {\n  createWindow();\n  app.on('activate', () => {\n    if (BrowserWindow.getAllWindows().length === 0) createWindow();\n  });\n});\n`,
      tests: `test('opens a window on ready', async () => { await E.emitReady(); eq(E.windows.length, 1); });
test('activate with a window open does nothing', () => { E.app.emit('activate'); eq(E.windows.length, 1); });
test('activate with none open creates one', () => { E.app.removeAllListeners('window-all-closed'); E.windows[0].close(); eq(E.windows.length, 0); E.app.emit('activate'); eq(E.windows.length, 1); });`,
      hints: ['`BrowserWindow.getAllWindows()` returns the open windows.', 'Register the `activate` listener inside the ready callback, so it cannot fire before windows are allowed.'],
    },
    {
      id: 'secure-window', title: 'Secure webPreferences', tier: 2,
      prompt: "A renderer shows web content, so it must not get Node.js powers. Write `createWindow()` returning a `BrowserWindow` whose `webPreferences` set:\n\n- `contextIsolation: true`\n- `nodeIntegration: false`\n- `sandbox: true`\n- `preload` — the absolute path to `preload.js` next to this file (`path.join(__dirname, 'preload.js')`)",
      starter: `const { BrowserWindow } = require('electron');\nconst path = require('node:path');\n\nfunction createWindow() {\n  return new BrowserWindow({\n    width: 900,\n    height: 600,\n    webPreferences: {\n      nodeIntegration: true,\n    },\n  });\n}\n`,
      solution: `const { BrowserWindow } = require('electron');\nconst path = require('node:path');\n\nfunction createWindow() {\n  return new BrowserWindow({\n    width: 900,\n    height: 600,\n    webPreferences: {\n      contextIsolation: true,\n      nodeIntegration: false,\n      sandbox: true,\n      preload: path.join(__dirname, 'preload.js'),\n    },\n  });\n}\n`,
      tests: `const _wp = () => createWindow().options.webPreferences || {};
test('context isolation on', () => eq(_wp().contextIsolation, true));
test('node integration off', () => eq(_wp().nodeIntegration, false));
test('sandbox on', () => eq(_wp().sandbox, true));
test('preload is an absolute path', () => eq(_wp().preload, require('node:path').join(__dirname, 'preload.js')));`,
      hints: ['`nodeIntegration: true` gives any script on the page — including an injected one — full access to the disk.', 'The preload script is the one controlled doorway; it needs an absolute path.'],
    },
    {
      id: 'ipc-handle', title: 'ipcMain.handle', tier: 1,
      prompt: "The renderer asks, the main process answers. Register two handlers in the main process:\n\n- `'math:add'` — takes two numbers, returns their sum\n- `'app:version'` — returns `app.getVersion()`\n\nRemember the first argument of every handler is the IPC **event**, not your data.",
      starter: `const { app, ipcMain } = require('electron');\n\n`,
      solution: `const { app, ipcMain } = require('electron');\n\nipcMain.handle('math:add', (event, a, b) => a + b);\nipcMain.handle('app:version', () => app.getVersion());\n`,
      tests: `test('math:add', async () => eq(await E.ipcRenderer.invoke('math:add', 2, 40), 42));
test('app:version', async () => eq(await E.ipcRenderer.invoke('app:version'), '1.0.0'));`,
      hints: ['`ipcMain.handle(channel, (event, ...args) => result)`.', 'Whatever the handler returns (or resolves to) becomes the result of `ipcRenderer.invoke` on the other side.'],
    },
    {
      id: 'preload-bridge', title: 'The preload bridge', tier: 2,
      prompt: "The page cannot touch `ipcRenderer` directly — the preload script exposes a small, named API instead.\n\nThe main-process handler is written for you. In the preload section, use `contextBridge.exposeInMainWorld` to give the page `window.api` with exactly one function: `add(a, b)`, which invokes `'math:add'` and returns the promise.\n\nDo **not** expose `ipcRenderer` itself.",
      starter: `const { ipcMain, ipcRenderer, contextBridge } = require('electron');\n\n// ---- main.js ----\nipcMain.handle('math:add', (event, a, b) => a + b);\n\n// ---- preload.js ----\n`,
      solution: `const { ipcMain, ipcRenderer, contextBridge } = require('electron');\n\n// ---- main.js ----\nipcMain.handle('math:add', (event, a, b) => a + b);\n\n// ---- preload.js ----\ncontextBridge.exposeInMainWorld('api', {\n  add: (a, b) => ipcRenderer.invoke('math:add', a, b),\n});\n`,
      tests: `test('window.api.add works end to end', async () => { ok(window.api, 'nothing was exposed as window.api'); eq(await window.api.add(19, 23), 42); });
test('exposes only what is needed', () => eq(Object.keys(window.api), ['add']));
test('does not leak ipcRenderer', () => { for (const v of Object.values(window.api)) ok(v !== E.ipcRenderer && v !== E.ipcRenderer.invoke && v !== E.ipcRenderer.send, 'never hand the page ipcRenderer or its methods'); });`,
      hints: ['`contextBridge.exposeInMainWorld("api", { ... })` makes `window.api` appear in the page.', 'Wrap each call: `add: (a, b) => ipcRenderer.invoke("math:add", a, b)`. A wrapper fixes the channel name; exposing `invoke` would let the page call *any* channel.'],
    },
    {
      id: 'one-way', title: 'One-way messages', tier: 1,
      prompt: "Not every message needs an answer. Wire up a fire-and-forget log channel:\n\n- **main:** listen on `'log'` with `ipcMain.on` and push each message onto the provided `logLines` array\n- **preload:** expose `window.logger.log(message)` which sends on `'log'`",
      starter: `const { ipcMain, ipcRenderer, contextBridge } = require('electron');\n\nconst logLines = [];\n\n// ---- main.js ----\n\n// ---- preload.js ----\n`,
      solution: `const { ipcMain, ipcRenderer, contextBridge } = require('electron');\n\nconst logLines = [];\n\n// ---- main.js ----\nipcMain.on('log', (event, message) => {\n  logLines.push(message);\n});\n\n// ---- preload.js ----\ncontextBridge.exposeInMainWorld('logger', {\n  log: (message) => ipcRenderer.send('log', message),\n});\n`,
      tests: `test('messages reach the main process', () => { ok(window.logger, 'expose window.logger'); window.logger.log('boot'); window.logger.log('ready'); eq(logLines, ['boot', 'ready']); });
test('uses send, not invoke', () => eq(E.handlers.has('log'), false, "one-way messages use ipcMain.on + ipcRenderer.send"));`,
      hints: ['`ipcRenderer.send(channel, ...args)` pairs with `ipcMain.on(channel, (event, ...args) => {})`.', '`invoke`/`handle` is for request-and-response; `send`/`on` is for notifications.'],
    },
    {
      id: 'push-to-renderer', title: 'Main → renderer', tier: 2,
      prompt: "Sometimes the main process starts the conversation.\n\n- **main:** write `notifyUpdate(win, version)` that sends `version` to that window on the channel `'update:available'`\n- **preload:** expose `window.updates.onAvailable(callback)`. The callback must be called with **just the version** — never pass the raw IPC event object to page code.",
      starter: `const { ipcRenderer, contextBridge } = require('electron');\n\n// ---- main.js ----\nfunction notifyUpdate(win, version) {\n  \n}\n\n// ---- preload.js ----\n`,
      solution: `const { ipcRenderer, contextBridge } = require('electron');\n\n// ---- main.js ----\nfunction notifyUpdate(win, version) {\n  win.webContents.send('update:available', version);\n}\n\n// ---- preload.js ----\ncontextBridge.exposeInMainWorld('updates', {\n  onAvailable: (callback) => ipcRenderer.on('update:available', (event, version) => callback(version)),\n});\n`,
      tests: `test('the page hears about updates', () => { const win = new E.BrowserWindow(); const seen = spy(); ok(window.updates, 'expose window.updates'); window.updates.onAvailable(seen); notifyUpdate(win, '2.1.0'); eq(win.webContents.send.calls, [['update:available', '2.1.0']]); eq(seen.calls, [['2.1.0']]); });
test('callback gets only the version', () => { const win = new E.BrowserWindow(); const seen = spy(); window.updates.onAvailable(seen); notifyUpdate(win, '3.0.0'); eq(seen.calls[0].length, 1, 'do not forward the IPC event to the page'); });`,
      hints: ['Main talks to a specific window: `win.webContents.send(channel, data)`.', 'In the preload, `ipcRenderer.on(channel, (event, data) => ...)`. The `event` carries a reference to `ipcRenderer` — strip it before calling the page.'],
    },
    {
      id: 'settings-ipc', title: 'Validate what arrives', tier: 2,
      prompt: "Treat every IPC message as untrusted input. Using the provided `settings` Map, register:\n\n- `'settings:get'` (key) → the stored value, or `null`\n- `'settings:set'` (key, value) → stores it and returns `true`\n\nBoth must **throw `new Error('invalid key')`** unless the key is one of `ALLOWED`. `set` must also throw `new Error('invalid value')` unless the value is a string of at most 50 characters.",
      starter: `const { ipcMain } = require('electron');\n\nconst ALLOWED = ['theme', 'language'];\nconst settings = new Map();\n\n`,
      solution: `const { ipcMain } = require('electron');\n\nconst ALLOWED = ['theme', 'language'];\nconst settings = new Map();\n\nfunction checkKey(key) {\n  if (!ALLOWED.includes(key)) throw new Error('invalid key');\n}\n\nipcMain.handle('settings:get', (event, key) => {\n  checkKey(key);\n  return settings.has(key) ? settings.get(key) : null;\n});\n\nipcMain.handle('settings:set', (event, key, value) => {\n  checkKey(key);\n  if (typeof value !== 'string' || value.length > 50) throw new Error('invalid value');\n  settings.set(key, value);\n  return true;\n});\n`,
      tests: `const _inv = (...a) => E.ipcRenderer.invoke(...a);
test('set then get', async () => { eq(await _inv('settings:set', 'theme', 'dark'), true); eq(await _inv('settings:get', 'theme'), 'dark'); });
test('unset key gives null', async () => eq(await _inv('settings:get', 'language'), null));
test('rejects unknown keys', async () => { eq((await rejects(_inv('settings:get', '__proto__'))).message, 'invalid key'); eq((await rejects(_inv('settings:set', 'admin', 'yes'))).message, 'invalid key'); });
test('rejects bad values', async () => { eq((await rejects(_inv('settings:set', 'theme', { evil: true }))).message, 'invalid value'); eq((await rejects(_inv('settings:set', 'theme', 'x'.repeat(51)))).message, 'invalid value'); eq(await _inv('settings:get', 'theme'), 'dark'); });`,
      hints: ['An allowlist (`ALLOWED.includes(key)`) is safer than trying to list everything bad.', 'Throwing inside a handler rejects the promise on the renderer side.'],
    },
    {
      id: 'open-dialog', title: 'Native file dialog', tier: 2,
      prompt: "Register `'file:pick'`. It shows a native open dialog limited to **one file** (`properties: ['openFile']`) with a filter named `Text` for the extensions `txt` and `md`. Return the chosen path, or `null` if the user cancelled.",
      starter: `const { ipcMain, dialog } = require('electron');\n\n`,
      solution: `const { ipcMain, dialog } = require('electron');\n\nipcMain.handle('file:pick', async () => {\n  const result = await dialog.showOpenDialog({\n    properties: ['openFile'],\n    filters: [{ name: 'Text', extensions: ['txt', 'md'] }],\n  });\n  return result.canceled ? null : result.filePaths[0];\n});\n`,
      tests: `test('returns the chosen path', async () => { E.state.openDialogResult = { canceled: false, filePaths: ['/home/me/todo.md'] }; eq(await E.ipcRenderer.invoke('file:pick'), '/home/me/todo.md'); });
test('cancel gives null', async () => { E.state.openDialogResult = { canceled: true, filePaths: [] }; eq(await E.ipcRenderer.invoke('file:pick'), null); });
test('dialog options', async () => { await E.ipcRenderer.invoke('file:pick'); const opts = E.dialog.showOpenDialog.calls.at(-1).find((a) => a && a.properties); ok(opts, 'pass an options object with properties'); eq(opts.properties, ['openFile']); eq(opts.filters, [{ name: 'Text', extensions: ['txt', 'md'] }]); });`,
      hints: ['`dialog.showOpenDialog(options)` resolves to `{ canceled, filePaths }`.', 'The dialog lives in the main process on purpose: the page never gets to choose a path by itself.'],
    },
    {
      id: 'menu', title: 'Application menu', tier: 2,
      prompt: "Write `buildMenu(onOpen)`. Build a menu from a template and install it as the application menu. The template has one top-level `File` item whose submenu is, in order:\n\n1. `Open…` with accelerator `CmdOrCtrl+O`, whose click calls `onOpen()`\n2. a separator\n3. the built-in quit item (`{ role: 'quit' }`)",
      starter: `const { Menu } = require('electron');\n\nfunction buildMenu(onOpen) {\n  \n}\n`,
      solution: `const { Menu } = require('electron');\n\nfunction buildMenu(onOpen) {\n  const menu = Menu.buildFromTemplate([\n    {\n      label: 'File',\n      submenu: [\n        { label: 'Open…', accelerator: 'CmdOrCtrl+O', click: () => onOpen() },\n        { type: 'separator' },\n        { role: 'quit' },\n      ],\n    },\n  ]);\n  Menu.setApplicationMenu(menu);\n}\n`,
      tests: `const _onOpen = spy(); buildMenu(_onOpen);
const _tpl = () => (E.Menu.buildFromTemplate.calls[0] || [[]])[0];
test('File menu with three entries', () => { eq(_tpl().length, 1); eq(_tpl()[0].label, 'File'); eq(_tpl()[0].submenu.length, 3); });
test('Open item', () => { const o = _tpl()[0].submenu[0]; eq([o.label, o.accelerator], ['Open…', 'CmdOrCtrl+O']); o.click(); eq(_onOpen.calls.length, 1); });
test('separator and quit role', () => { eq(_tpl()[0].submenu[1].type, 'separator'); eq(_tpl()[0].submenu[2].role, 'quit'); });
test('installed as the application menu', () => { eq(E.Menu.setApplicationMenu.calls.length, 1); ok(E.Menu.setApplicationMenu.calls[0][0] && E.Menu.setApplicationMenu.calls[0][0].items, 'pass the built menu'); });`,
      hints: ['A menu template is an array of objects; nested arrays go under `submenu`.', '`CmdOrCtrl` means ⌘ on macOS and Ctrl elsewhere. Roles like `quit` give you correct native behaviour for free.'],
    },
    {
      id: 'notify', title: 'Notifications', tier: 1,
      prompt: "Write `notify(title, body)`. If `Notification.isSupported()`, create a `Notification` with that title and body, show it, and return `true`. Otherwise return `false` without creating one.",
      starter: `const { Notification } = require('electron');\n\nfunction notify(title, body) {\n  \n}\n`,
      solution: `const { Notification } = require('electron');\n\nfunction notify(title, body) {\n  if (!Notification.isSupported()) return false;\n  new Notification({ title, body }).show();\n  return true;\n}\n`,
      tests: `test('shows a notification', () => { eq(notify('Build done', 'All tests pass'), true); eq(E.notifications.length, 1); eq(E.notifications[0].options, { title: 'Build done', body: 'All tests pass' }); eq(E.notifications[0].show.calls.length, 1); });
test('does nothing when unsupported', () => { const real = E.Notification.isSupported; E.Notification.isSupported = () => false; try { eq(notify('x', 'y'), false); eq(E.notifications.length, 1); } finally { E.Notification.isSupported = real; } });`,
      hints: ['`new Notification({ title, body })` only builds it — nothing appears until `.show()`.'],
    },
    {
      id: 'external-links', title: 'Keep the web outside', tier: 2,
      prompt: "A link with `target=\"_blank\"` would open a new Electron window with your app's privileges. Write `lockDownLinks(win)` that installs a window-open handler:\n\n- for `https:` URLs, open them in the user's real browser with `shell.openExternal`\n- for anything else (`http:`, `file:`, `javascript:`…) do not open it at all\n- in every case, return `{ action: 'deny' }` so no new Electron window appears",
      starter: `const { shell } = require('electron');\n\nfunction lockDownLinks(win) {\n  \n}\n`,
      solution: `const { shell } = require('electron');\n\nfunction lockDownLinks(win) {\n  win.webContents.setWindowOpenHandler(({ url }) => {\n    let protocol = '';\n    try { protocol = new URL(url).protocol; } catch { /* not a URL */ }\n    if (protocol === 'https:') shell.openExternal(url);\n    return { action: 'deny' };\n  });\n}\n`,
      tests: `const _win = new E.BrowserWindow(); lockDownLinks(_win);
const _open = (url) => { ok(_win.webContents.windowOpenHandler, 'call win.webContents.setWindowOpenHandler'); return _win.webContents.windowOpenHandler({ url }); };
test('https goes to the real browser', () => { eq(_open('https://example.com/docs'), { action: 'deny' }); eq(E.shell.openExternal.calls, [['https://example.com/docs']]); });
test('other schemes are dropped', () => { for (const u of ['http://insecure.test', 'file:///etc/passwd', 'javascript:alert(1)', 'smb://evil/share', 'not a url']) eq(_open(u), { action: 'deny' }, u); eq(E.shell.openExternal.calls.length, 1); });
test('a lookalike prefix does not fool it', () => { _open('httpsx://evil.test'); eq(E.shell.openExternal.calls.length, 1); });`,
      hints: ['`win.webContents.setWindowOpenHandler(({ url }) => ({ action: "deny" }))`.', 'Parse with `new URL(url).protocol` instead of `startsWith` — and remember `new URL` throws on garbage.', '`shell.openExternal` on an unchecked URL can launch arbitrary programs via custom protocol handlers.'],
    },
    {
      id: 'single-instance', title: 'Single instance', tier: 2,
      prompt: "Double-clicking the icon twice should focus the existing app, not start a second copy. Write `setupSingleInstance(getMainWindow)`:\n\n- ask for the lock with `app.requestSingleInstanceLock()`\n- if you did **not** get it: call `app.quit()` and return `false`\n- if you did: listen for `'second-instance'`. When it fires, take the window from `getMainWindow()`; if there is one, `restore()` it if it is minimised, then `focus()` it. Return `true`.",
      starter: `const { app } = require('electron');\n\nfunction setupSingleInstance(getMainWindow) {\n  \n}\n`,
      solution: `const { app } = require('electron');\n\nfunction setupSingleInstance(getMainWindow) {\n  if (!app.requestSingleInstanceLock()) {\n    app.quit();\n    return false;\n  }\n  app.on('second-instance', () => {\n    const win = getMainWindow();\n    if (!win) return;\n    if (win.isMinimized()) win.restore();\n    win.focus();\n  });\n  return true;\n}\n`,
      tests: `test('second copy quits', () => { E.state.lock = false; eq(setupSingleInstance(() => null), false); eq(E.app.quit.calls.length, 1); eq(E.app.listenerCount('second-instance'), 0); });
test('first copy keeps running', () => { E.state.lock = true; const win = new E.BrowserWindow(); win.minimized = true; eq(setupSingleInstance(() => win), true); eq(E.app.quit.calls.length, 1); E.app.emit('second-instance'); eq(win.restore.calls.length, 1); eq(win.focus.calls.length, 1); });
test('does not restore a window that is not minimised', () => { E.app.removeAllListeners('second-instance'); const win = new E.BrowserWindow(); setupSingleInstance(() => win); E.app.emit('second-instance'); eq([win.restore.calls.length, win.focus.calls.length], [0, 1]); });
test('survives having no window', () => { E.app.removeAllListeners('second-instance'); setupSingleInstance(() => null); E.app.emit('second-instance'); });`,
      hints: ['`requestSingleInstanceLock()` returns `true` for the first copy and `false` for any later one.', 'The `second-instance` event fires in the *first* copy when someone tries to start another.'],
    },
    {
      id: 'sender-check', title: 'Who is asking?', tier: 3,
      prompt: "If your window ever navigates to, or embeds, a remote page, that page can call your IPC channels too. Register `'secrets:get'` so that it returns the provided `API_TOKEN` **only** when the calling frame is your own app.\n\nThe caller's URL is `event.senderFrame.url`. Accept it only when its protocol is `file:` and its path ends with `/app/index.html`. Otherwise throw `new Error('forbidden')`.",
      starter: `const { ipcMain } = require('electron');\n\nconst API_TOKEN = 'tok_live_abc123';\n\nipcMain.handle('secrets:get', (event) => {\n  return API_TOKEN;\n});\n`,
      solution: `const { ipcMain } = require('electron');\n\nconst API_TOKEN = 'tok_live_abc123';\n\nfunction isTrusted(frameUrl) {\n  try {\n    const u = new URL(frameUrl);\n    return u.protocol === 'file:' && u.pathname.endsWith('/app/index.html');\n  } catch {\n    return false;\n  }\n}\n\nipcMain.handle('secrets:get', (event) => {\n  if (!isTrusted(event.senderFrame.url)) throw new Error('forbidden');\n  return API_TOKEN;\n});\n`,
      tests: `const _from = async (url) => { E.state.senderUrl = url; return E.ipcRenderer.invoke('secrets:get'); };
test('the app itself gets the token', async () => eq(await _from('file:///app/index.html'), 'tok_live_abc123'));
test('a remote page is refused', async () => eq((await rejects(_from('https://evil.test/app/index.html'))).message, 'forbidden'));
test('another local file is refused', async () => eq((await rejects(_from('file:///tmp/download.html'))).message, 'forbidden'));
test('query-string tricks are refused', async () => eq((await rejects(_from('https://evil.test/?x=file:///app/index.html'))).message, 'forbidden'));
test('garbage is refused', async () => eq((await rejects(_from(''))).message, 'forbidden'));`,
      hints: ['Parse the URL and check its parts — `protocol` and `pathname` — rather than searching the raw string.', 'A substring check like `url.includes("/app/index.html")` is fooled by putting that text in a query string.'],
    },
    {
      id: 'csp', title: 'Content-Security-Policy', tier: 3,
      prompt: "A CSP tells the renderer which scripts it may run — the last line of defence against injected code. Write `applyCsp(win)` that uses `win.webContents.session.webRequest.onHeadersReceived` to add this header to every response, **keeping** the headers that were already there:\n\n`Content-Security-Policy: default-src 'self'; script-src 'self'`\n\nThe listener receives `(details, callback)` and must call `callback({ responseHeaders })`. Header values are arrays of strings.",
      starter: `function applyCsp(win) {\n  \n}\n`,
      solution: `function applyCsp(win) {\n  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {\n    callback({\n      responseHeaders: {\n        ...details.responseHeaders,\n        'Content-Security-Policy': ["default-src 'self'; script-src 'self'"],\n      },\n    });\n  });\n}\n`,
      tests: `const _w = new E.BrowserWindow(); applyCsp(_w);
const _run = (headers) => { const h = _w.webContents.session.headersHandler; ok(h, 'register an onHeadersReceived listener'); const cb = spy(); h({ responseHeaders: headers }, cb); eq(cb.calls.length, 1, 'call the callback exactly once'); return cb.calls[0][0].responseHeaders; };
test('adds the policy', () => eq(_run({})['Content-Security-Policy'], ["default-src 'self'; script-src 'self'"]));
test('keeps existing headers', () => eq(_run({ 'Content-Type': ['text/html'] })['Content-Type'], ['text/html']));
test('no unsafe-inline', () => ok(!/unsafe-inline|unsafe-eval/.test(_run({})['Content-Security-Policy'][0])));`,
      hints: ['Spread the existing headers, then add yours: `{ ...details.responseHeaders, "Content-Security-Policy": [...] }`.', 'If you never call `callback`, every request hangs.'],
    },
    {
      id: 'notes-boss', title: 'Boss: a secure notes app', tier: 3,
      prompt: "Wire up both sides of a small notes app.\n\n**main**, using the provided `notes` array:\n\n- `'notes:list'` → a **copy** of the array\n- `'notes:add'` (text) → throws `new Error('invalid note')` unless `text` is a string that, trimmed, is 1–200 characters. Otherwise stores `{ id, text }` (ids count up from 1, text trimmed), then sends `'notes:changed'` with the new count to **every open window**, and returns the new note.\n\n**preload** — expose `window.notes` with exactly:\n\n- `list()` and `add(text)` — invoke the handlers\n- `onChanged(callback)` — calls `callback(count)` on each `'notes:changed'`",
      starter: `const { BrowserWindow, ipcMain, ipcRenderer, contextBridge } = require('electron');\n\nconst notes = [];\n\n// ---- main.js ----\n\n// ---- preload.js ----\n`,
      solution: `const { BrowserWindow, ipcMain, ipcRenderer, contextBridge } = require('electron');\n\nconst notes = [];\n\n// ---- main.js ----\nipcMain.handle('notes:list', () => [...notes]);\n\nipcMain.handle('notes:add', (event, text) => {\n  const clean = typeof text === 'string' ? text.trim() : '';\n  if (clean.length < 1 || clean.length > 200) throw new Error('invalid note');\n  const note = { id: notes.length + 1, text: clean };\n  notes.push(note);\n  for (const win of BrowserWindow.getAllWindows()) win.webContents.send('notes:changed', notes.length);\n  return note;\n});\n\n// ---- preload.js ----\ncontextBridge.exposeInMainWorld('notes', {\n  list: () => ipcRenderer.invoke('notes:list'),\n  add: (text) => ipcRenderer.invoke('notes:add', text),\n  onChanged: (callback) => ipcRenderer.on('notes:changed', (event, count) => callback(count)),\n});\n`,
      tests: `const _w1 = new E.BrowserWindow(), _w2 = new E.BrowserWindow();
test('bridge shape', () => { ok(window.notes, 'expose window.notes'); eq(Object.keys(window.notes).sort(), ['add', 'list', 'onChanged']); });
test('starts empty', async () => eq(await window.notes.list(), []));
test('add stores a trimmed note', async () => { eq(await window.notes.add('  Buy RAM  '), { id: 1, text: 'Buy RAM' }); eq(await window.notes.list(), [{ id: 1, text: 'Buy RAM' }]); });
test('every window is told', async () => { const seen = spy(); window.notes.onChanged(seen); await window.notes.add('Second'); eq(_w1.webContents.send.calls.at(-1), ['notes:changed', 2]); eq(_w2.webContents.send.calls.at(-1), ['notes:changed', 2]); ok(seen.calls.length >= 1 && seen.calls.every((c) => c.length === 1 && c[0] === 2), 'onChanged callback should receive just the count'); });
test('rejects bad notes', async () => { for (const bad of ['', '    ', 'x'.repeat(201), 42, null, { text: 'hi' }]) eq((await rejects(window.notes.add(bad))).message, 'invalid note'); eq((await window.notes.list()).length, 2); });
test('list returns a copy', async () => { const a = await E.ipcRenderer.invoke('notes:list'); a.push('junk'); eq((await window.notes.list()).length, 2); });`,
      hints: ['Three layers: handlers in main, wrappers in preload, nothing else exposed.', 'Validate in main — the preload runs in the renderer process and cannot be trusted to have checked.', '`BrowserWindow.getAllWindows()` + `win.webContents.send(...)` broadcasts.'],
    },
    {
      id: 'ready-to-show', title: 'No white flash', tier: 1,
      prompt: "A window shown immediately is blank white until the page has painted. Write `createWindow()` that creates the `BrowserWindow` **hidden** (`show: false`), loads `index.html`, and calls `win.show()` only when the window emits `ready-to-show`. Return the window.",
      starter: `const { BrowserWindow } = require('electron');\n\nfunction createWindow() {\n  const win = new BrowserWindow({ width: 900, height: 600 });\n  win.loadFile('index.html');\n  return win;\n}\n`,
      solution: `const { BrowserWindow } = require('electron');\n\nfunction createWindow() {\n  const win = new BrowserWindow({ width: 900, height: 600, show: false });\n  win.once('ready-to-show', () => win.show());\n  win.loadFile('index.html');\n  return win;\n}\n`,
      tests: `test('created hidden', () => { const w = createWindow(); eq(w.options.show, false); eq(w.show.calls.length, 0); eq(w.loadFile.calls, [['index.html']]); });
test('shown when ready', () => { const w = createWindow(); w.emit('ready-to-show'); eq(w.show.calls.length, 1); });
test('only once', () => { const w = createWindow(); w.emit('ready-to-show'); w.emit('ready-to-show'); eq(w.show.calls.length, 1); });`,
      hints: ['`show: false` in the options keeps it hidden.', '`win.once(event, handler)` listens for a single occurrence.'],
    },
    {
      id: 'window-state', title: 'Remember the window size', tier: 1,
      prompt: "Write `createWindow(saved)`. `saved` is either `null` or an object like `{ x, y, width, height }` from the last session.\n\n- with saved bounds, create the window at exactly that position and size\n- with `null`, use 1000 × 700 and leave `x`/`y` unset so the OS centres it\n\nThen, when the window emits `close`, call the provided `saveBounds(win.getBounds())`.",
      starter: `const { BrowserWindow } = require('electron');\n\nconst stored = [];\nfunction saveBounds(bounds) { stored.push(bounds); }\n\nfunction createWindow(saved) {\n  \n}\n`,
      solution: `const { BrowserWindow } = require('electron');\n\nconst stored = [];\nfunction saveBounds(bounds) { stored.push(bounds); }\n\nfunction createWindow(saved) {\n  const win = new BrowserWindow(saved ? { ...saved } : { width: 1000, height: 700 });\n  win.on('close', () => saveBounds(win.getBounds()));\n  return win;\n}\n`,
      tests: `test('defaults when nothing was saved', () => { const w = createWindow(null); eq([w.options.width, w.options.height], [1000, 700]); eq([w.options.x, w.options.y], [undefined, undefined]); });
test('restores saved bounds', () => { const w = createWindow({ x: 40, y: 60, width: 800, height: 500 }); eq([w.options.x, w.options.y, w.options.width, w.options.height], [40, 60, 800, 500]); });
test('saves on close', () => { const w = createWindow(null); w.getBounds = () => ({ x: 5, y: 6, width: 700, height: 400 }); w.emit('close'); eq(stored.at(-1), { x: 5, y: 6, width: 700, height: 400 }); });`,
      hints: ['Pass `x` and `y` only when you have them — `undefined` lets the OS place the window.', '`win.getBounds()` returns `{ x, y, width, height }`. The `close` event fires just before the window goes away.'],
    },
    {
      id: 'devtools', title: 'DevTools only in development', tier: 1,
      prompt: "Write `setupDevTools(win)`. Open the DevTools for the window **only** when the app is running from source — that is, when `app.isPackaged` is false. A packaged build shipped to users must not open them.",
      starter: `const { app } = require('electron');\n\nfunction setupDevTools(win) {\n  win.webContents.openDevTools();\n}\n`,
      solution: `const { app } = require('electron');\n\nfunction setupDevTools(win) {\n  if (!app.isPackaged) win.webContents.openDevTools();\n}\n`,
      tests: `test('opens in development', () => { E.app.isPackaged = false; const w = new E.BrowserWindow(); setupDevTools(w); eq(w.webContents.openDevTools.calls.length, 1); });
test('stays closed when packaged', () => { E.app.isPackaged = true; const w = new E.BrowserWindow(); setupDevTools(w); eq(w.webContents.openDevTools.calls.length, 0); E.app.isPackaged = false; });`,
      hints: ['`app.isPackaged` is `true` in an installed build and `false` under `electron .`.'],
    },
    {
      id: 'clipboard', title: 'Clipboard over IPC', tier: 1,
      prompt: "The sandboxed page cannot reach the system clipboard, so the main process does it. Wire up both sides:\n\n- **main:** `'clipboard:copy'` (text) — if `text` is a string, write it to the clipboard and return `true`; otherwise return `false` and write nothing\n- **preload:** expose `window.clip.copy(text)`",
      starter: `const { ipcMain, ipcRenderer, contextBridge, clipboard } = require('electron');\n\n// ---- main.js ----\n\n// ---- preload.js ----\n`,
      solution: `const { ipcMain, ipcRenderer, contextBridge, clipboard } = require('electron');\n\n// ---- main.js ----\nipcMain.handle('clipboard:copy', (event, text) => {\n  if (typeof text !== 'string') return false;\n  clipboard.writeText(text);\n  return true;\n});\n\n// ---- preload.js ----\ncontextBridge.exposeInMainWorld('clip', {\n  copy: (text) => ipcRenderer.invoke('clipboard:copy', text),\n});\n`,
      tests: `test('copies text', async () => { ok(window.clip, 'expose window.clip'); eq(await window.clip.copy('hello'), true); eq(E.clipboard.readText(), 'hello'); });
test('refuses non-strings', async () => { eq(await window.clip.copy({ toString: () => 'sneaky' }), false); eq(await window.clip.copy(undefined), false); eq(E.clipboard.readText(), 'hello'); });
test('bridge exposes only copy', () => eq(Object.keys(window.clip), ['copy']));`,
      hints: ['`clipboard.writeText(text)` from the `electron` module.', 'Check the type in main — the preload cannot vouch for what the page sent.'],
    },
    {
      id: 'save-file', title: 'Save with a dialog', tier: 2,
      prompt: "Register `'file:save'` (content). It must:\n\n1. reject non-string content with `new Error('invalid content')` — before showing any dialog\n2. show a save dialog with `defaultPath: 'notes.txt'`\n3. if the user cancels, return `null`\n4. otherwise store the content with the provided `writeFile(path, content)` and return the chosen path",
      starter: `const { ipcMain, dialog } = require('electron');\n\nconst disk = new Map();\nasync function writeFile(path, content) { disk.set(path, content); }\n\n`,
      solution: `const { ipcMain, dialog } = require('electron');\n\nconst disk = new Map();\nasync function writeFile(path, content) { disk.set(path, content); }\n\nipcMain.handle('file:save', async (event, content) => {\n  if (typeof content !== 'string') throw new Error('invalid content');\n  const result = await dialog.showSaveDialog({ defaultPath: 'notes.txt' });\n  if (result.canceled) return null;\n  await writeFile(result.filePath, content);\n  return result.filePath;\n});\n`,
      tests: `const _save = (c) => E.ipcRenderer.invoke('file:save', c);
test('writes to the chosen path', async () => { E.state.saveDialogResult = { canceled: false, filePath: '/home/me/todo.txt' }; eq(await _save('buy milk'), '/home/me/todo.txt'); eq(disk.get('/home/me/todo.txt'), 'buy milk'); });
test('suggests a file name', () => { const opts = E.dialog.showSaveDialog.calls.at(-1).find((a) => a && a.defaultPath); ok(opts, 'pass { defaultPath }'); eq(opts.defaultPath, 'notes.txt'); });
test('cancel writes nothing', async () => { E.state.saveDialogResult = { canceled: true }; const before = disk.size; eq(await _save('x'), null); eq(disk.size, before); });
test('rejects bad content without a dialog', async () => { const shown = E.dialog.showSaveDialog.calls.length; eq((await rejects(_save({ evil: 1 }))).message, 'invalid content'); eq(E.dialog.showSaveDialog.calls.length, shown); });`,
      hints: ['`dialog.showSaveDialog(options)` resolves to `{ canceled, filePath }`.', 'Validate first: there is no point asking the user where to save something you will refuse to write.'],
    },
    {
      id: 'progress', title: 'Progress updates', tier: 2,
      prompt: "A long task should report progress while it runs. Register `'export:start'`. It runs the four provided `steps` in order, and **after each one** sends the percentage done (`25`, `50`, `75`, `100`) back to the window that asked, on the channel `'export:progress'`. When all are finished it returns `'done'`.\n\nReply to the caller with `event.sender.send(...)`.",
      starter: `const { ipcMain } = require('electron');\n\nconst ran = [];\nconst steps = ['collect', 'convert', 'compress', 'write'].map((name) => async () => { ran.push(name); });\n\n`,
      solution: `const { ipcMain } = require('electron');\n\nconst ran = [];\nconst steps = ['collect', 'convert', 'compress', 'write'].map((name) => async () => { ran.push(name); });\n\nipcMain.handle('export:start', async (event) => {\n  for (let i = 0; i < steps.length; i++) {\n    await steps[i]();\n    event.sender.send('export:progress', Math.round(((i + 1) / steps.length) * 100));\n  }\n  return 'done';\n});\n`,
      tests: `test('reports progress, then finishes', async () => { const seen = []; E.ipcRenderer.on('export:progress', (e, pct) => seen.push(pct)); eq(await E.ipcRenderer.invoke('export:start'), 'done'); eq(seen, [25, 50, 75, 100]); });
test('runs every step in order', () => eq(ran, ['collect', 'convert', 'compress', 'write']));`,
      hints: ['`event.sender` is the `webContents` of the window that made the request — the right place to send replies.', '`await` each step before reporting it, or the progress bar races ahead of the work.'],
    },
    {
      id: 'lock-navigation', title: 'Stop the window wandering off', tier: 2,
      prompt: "If a link or a script navigates your window to a website, that site is now running inside your app's shell. Write `lockNavigation(win)`: listen for `will-navigate` on `win.webContents` and call `event.preventDefault()` for every destination **except** your own app's files (URLs whose protocol is `file:`).",
      starter: `function lockNavigation(win) {\n  \n}\n`,
      solution: `function lockNavigation(win) {\n  win.webContents.on('will-navigate', (event, url) => {\n    let protocol = '';\n    try { protocol = new URL(url).protocol; } catch { /* not a URL */ }\n    if (protocol !== 'file:') event.preventDefault();\n  });\n}\n`,
      tests: `const _w = new E.BrowserWindow(); lockNavigation(_w);
const _nav = (url) => { const event = { preventDefault: spy() }; _w.webContents.emit('will-navigate', event, url); return event.preventDefault.calls.length > 0; };
test('blocks websites', () => eq([_nav('https://evil.test/'), _nav('http://example.com')], [true, true]));
test('allows the app\\'s own files', () => eq(_nav('file:///app/settings.html'), false));
test('blocks odd schemes and junk', () => eq([_nav('javascript:alert(1)'), _nav('not a url'), _nav('data:text/html,<h1>x</h1>')], [true, true, true]));
test('a file-looking https URL is still blocked', () => eq(_nav('https://evil.test/file:///app/index.html'), true));`,
      hints: ['`win.webContents.on("will-navigate", (event, url) => { ... })`.', 'Decide from `new URL(url).protocol`, and treat a URL that fails to parse as blocked.'],
    },
    {
      id: 'permissions', title: 'Deny permissions by default', tier: 3,
      prompt: "Web content can ask for the camera, microphone, location and more. Write `lockPermissions(win)` that installs a permission request handler on `win.webContents.session`. It should grant **only** `'notifications'`, and only when the request comes from your own app (`webContents.getURL()` starts with `file://`). Everything else is denied.\n\nThe handler signature is `(webContents, permission, callback)`; answer by calling `callback(true)` or `callback(false)`.",
      starter: `function lockPermissions(win) {\n  \n}\n`,
      solution: `function lockPermissions(win) {\n  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {\n    const ours = webContents.getURL().startsWith('file://');\n    callback(ours && permission === 'notifications');\n  });\n}\n`,
      tests: `const _w = new E.BrowserWindow(); lockPermissions(_w);
const _ask = (url, permission) => { const h = _w.webContents.session.permissionHandler; ok(h, 'call session.setPermissionRequestHandler'); const cb = spy(); h({ getURL: () => url }, permission, cb); eq(cb.calls.length, 1, 'answer every request exactly once'); return cb.calls[0][0]; };
test('own app may notify', () => eq(_ask('file:///app/index.html', 'notifications'), true));
test('own app gets nothing else', () => eq(['media', 'geolocation', 'clipboard-read', 'openExternal'].map((p) => _ask('file:///app/index.html', p)), [false, false, false, false]));
test('remote content gets nothing at all', () => eq(['notifications', 'media'].map((p) => _ask('https://ads.test/frame', p)), [false, false]));`,
      hints: ['`session.setPermissionRequestHandler((webContents, permission, callback) => callback(boolean))`.', 'With no handler installed, Electron **grants** every request — that is the default you are replacing.'],
    },
  ],
  drills: [
    { q: 'How many main processes does an Electron app have?', choices: ['One per window', 'Exactly one', 'One per CPU core', 'None'], answer: 1, why: 'One main process (Node.js) owns the app lifecycle and creates windows. Each window gets its own renderer process.' },
    { q: 'What can a renderer do by default in a modern, sandboxed Electron app?', choices: ['Read any file with fs', 'Only what a web page can do, plus whatever the preload exposes', 'Spawn processes', 'Access ipcMain'], answer: 1, why: 'With contextIsolation and sandbox on, the page is an ordinary web page. Powers arrive only through the bridge you define.' },
    { q: 'What does `contextIsolation: true` do?', choices: ['Blocks the network', 'Runs the preload in a separate JavaScript world from the page', 'Encrypts IPC', 'Disables DevTools'], answer: 1, why: 'The page cannot reach or tamper with preload globals. `contextBridge` is the only crossing point.' },
    { q: 'Which pair is request-and-response?', choices: ['ipcRenderer.send / ipcMain.on', 'ipcRenderer.invoke / ipcMain.handle', 'webContents.send / ipcRenderer.on', 'emit / on'], answer: 1, why: '`invoke` returns a promise that resolves with whatever the `handle` callback returns.' },
    { q: 'How does the main process send a message to a window?', choices: ['ipcMain.send(...)', 'win.webContents.send(channel, data)', 'ipcRenderer.emit(...)', 'window.postMessage(...)'], answer: 1, why: 'There is no `ipcMain.send`. Main addresses a specific window through its `webContents`.' },
    { q: 'Why is `nodeIntegration: true` dangerous?', choices: ['It slows rendering', 'Any script that reaches the page — including injected ones — gets full Node access', 'It disables IPC', 'It breaks on macOS'], answer: 1, why: 'One XSS becomes remote code execution on the user\'s machine. Keep it off and use a preload bridge.' },
    { q: 'What is the first argument of an `ipcMain.handle` callback?', choices: ['The first value the renderer sent', 'An event object describing the sender', 'The channel name', 'The window'], answer: 1, why: 'Your data starts at the second parameter. Forgetting this is the classic first Electron bug.' },
    { q: 'Where does a preload script run?', choices: ['In the main process', 'In the renderer process, before the page loads', 'In a worker thread', 'On the server'], answer: 1, why: 'It runs in the renderer with limited Node access, before page scripts — the place to set up the bridge.' },
    { q: 'What does `win.loadURL("http://localhost:5173")` typically indicate?', choices: ['A production build', 'Loading from a dev server during development', 'An error', 'A remote website'], answer: 1, why: 'In development you load the Vite/webpack dev server for hot reload; packaged apps load built files with `loadFile`.' },
    { q: 'Which module shows a native "Open file" dialog?', choices: ['shell', 'dialog', 'app', 'clipboard'], answer: 1, why: '`dialog.showOpenDialog` runs in the main process. `shell` opens files and URLs with the OS default handler.' },
    { q: 'Why wrap IPC calls in named preload functions instead of exposing `ipcRenderer`?', choices: ['It is faster', 'It limits the page to the specific channels you intended', 'Electron requires it for typing', 'To support older versions'], answer: 1, why: 'Exposing `ipcRenderer.invoke` lets compromised page code call every handler in your app with any arguments.' },
    { q: 'What does `app.isPackaged` tell you?', choices: ['Whether npm install ran', 'Whether the app is running from a built installer rather than from source', 'Whether asar is enabled', 'Whether it is 64-bit'], answer: 1, why: 'Use it to switch between dev behaviour (dev server, DevTools) and production behaviour (bundled files).' },
    { q: 'Which process may create a `BrowserWindow`?', choices: ['Any renderer', 'Only the main process', 'The preload script', 'A web worker'], answer: 1, why: 'Windows, menus, dialogs and the app lifecycle all belong to the main process. A renderer asks for them over IPC.' },
    { q: 'What does `sandbox: true` take away from a preload script?', choices: ['Access to the DOM', 'Most of Node.js — it keeps only a small safe subset such as ipcRenderer and contextBridge', 'Access to IPC', 'Nothing'], answer: 1, why: 'A sandboxed preload cannot `require("fs")`. File work has to be requested from the main process.' },
    { q: 'What happens if two calls register `ipcMain.handle` for the same channel?', choices: ['The second replaces the first', 'The second throws: only one handler per channel is allowed', 'Both run', 'Nothing'], answer: 1, why: 'Call `ipcMain.removeHandler(channel)` first if you really mean to replace it. `ipcMain.on` listeners, by contrast, can stack.' },
    { q: 'What kind of values can cross IPC?', choices: ['Anything, including functions', 'Data the structured clone algorithm can copy — no functions, no DOM nodes', 'Only strings', 'Only JSON text'], answer: 1, why: 'Objects are copied, not shared. Sending a function or a class instance with methods fails or arrives stripped.' },
    { q: 'Where does `app.getPath("userData")` point?', choices: ['The install folder', 'A per-user folder for this app\'s settings and data', 'The desktop', 'The temp folder'], answer: 1, why: 'On Windows that is under `%APPDATA%`. The install folder may be read-only, so never write settings beside the executable.' },
    { q: 'What is an `asar` archive?', choices: ['An installer', 'A single file that packs your app\'s source for distribution', 'An encrypted database', 'A crash dump'], answer: 1, why: 'It speeds up loading and tidies the install — but it is not encryption; anyone can unpack it.' },
    { q: 'Why should a packaged app be code-signed?', choices: ['To make it faster', 'So the OS can verify who published it and that it was not altered', 'To shrink the download', 'Electron requires it to start'], answer: 1, why: 'Unsigned apps trigger SmartScreen or Gatekeeper warnings, and auto-update on macOS will not work at all.' },
    { q: 'What does `webContents.send` do if the page has no listener for that channel?', choices: ['Throws', 'Nothing — the message is silently dropped', 'Queues it forever', 'Crashes the renderer'], answer: 1, why: 'Sends are fire-and-forget. If the page must be ready first, have it announce itself or wait for `did-finish-load`.' },
    { q: 'How does the page learn which channels it may use?', choices: ['It imports electron', 'Only through what the preload exposes with contextBridge', 'From a config file', 'It can use any channel'], answer: 1, why: 'With context isolation the page has no `require` and no `ipcRenderer`. `window.yourApi` is its entire view of the OS.' },
    { q: 'What is the risk of `shell.openExternal(url)` with a URL from the page?', choices: ['None', 'A crafted URL scheme can launch other programs on the machine', 'It slows the app', 'It leaks memory'], answer: 1, why: 'Allow-list the protocol (`https:`) before opening. `file:` and custom schemes can run things.' },
    { q: 'Which build tool turns your project into an installer?', choices: ['Vite', 'electron-builder or Electron Forge', 'tsc', 'npm pack'], answer: 1, why: 'They bundle the Electron runtime with your code and produce `.exe`/`.dmg`/`.AppImage` installers, optionally signed.' },
    { q: 'Why keep heavy work out of the main process?', choices: ['It has less memory', 'Blocking it freezes every window and all IPC', 'It cannot use npm packages', 'It cannot be debugged'], answer: 1, why: 'The main process is a single event loop coordinating everything. Move long jobs to a worker thread or a child process.' },
  ],
};
