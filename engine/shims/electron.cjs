'use strict';
// A behavioural stand-in for the `electron` module, so Electron exercises can
// be graded without opening real windows. Main-process and renderer-side IPC
// are wired to each other, so ipcRenderer.invoke really reaches ipcMain.handle.
const { EventEmitter } = require('events');

module.exports = function createElectron(spy) {
  const windows = [];
  const handlers = new Map();
  const state = {
    senderUrl: 'file:///app/index.html',
    openDialogResult: { canceled: false, filePaths: ['/docs/notes.txt'] },
    saveDialogResult: { canceled: false, filePath: '/docs/out.txt' },
    lock: true,
  };

  const ipcRenderer = new EventEmitter();
  const ipcMain = new EventEmitter();
  const makeEvent = () => ({
    sender: { send: (ch, ...a) => ipcRenderer.emit(ch, {}, ...a) },
    senderFrame: { url: state.senderUrl },
    reply: (ch, ...a) => ipcRenderer.emit(ch, {}, ...a),
  });
  ipcMain.handle = (ch, fn) => {
    if (handlers.has(ch)) throw new Error(`Attempted to register a second handler for '${ch}'`);
    handlers.set(ch, fn);
  };
  ipcMain.removeHandler = (ch) => { handlers.delete(ch); };
  ipcRenderer.invoke = async (ch, ...args) => {
    const h = handlers.get(ch);
    if (!h) throw new Error(`Error invoking remote method '${ch}': No handler registered for '${ch}'`);
    return h(makeEvent(), ...args);
  };
  ipcRenderer.send = (ch, ...args) => { ipcMain.emit(ch, makeEvent(), ...args); };

  class WebContents extends EventEmitter {
    constructor() {
      super();
      this.send = spy((ch, ...a) => { ipcRenderer.emit(ch, {}, ...a); });
      this.openDevTools = spy();
      this.windowOpenHandler = null;
      this.session = {
        webRequest: { onHeadersReceived: (fn) => { this.session.headersHandler = fn; } },
        setPermissionRequestHandler: (fn) => { this.session.permissionHandler = fn; },
      };
    }
    setWindowOpenHandler(fn) { this.windowOpenHandler = fn; }
  }
  const app = new EventEmitter();
  class BrowserWindow extends EventEmitter {
    constructor(options = {}) {
      super();
      this.options = options;
      this.webContents = new WebContents();
      this.loadFile = spy(async () => {});
      this.loadURL = spy(async () => {});
      this.show = spy(); this.hide = spy(); this.focus = spy();
      this.restore = spy(() => { this.minimized = false; });
      this.setTitle = spy(); this.setMenu = spy(); this.removeMenu = spy();
      this.minimized = false; this.destroyed = false;
      windows.push(this);
    }
    isMinimized() { return this.minimized; }
    isDestroyed() { return this.destroyed; }
    close() {
      this.destroyed = true;
      windows.splice(windows.indexOf(this), 1);
      this.emit('closed');
      if (windows.length === 0) app.emit('window-all-closed');
    }
    static getAllWindows() { return [...windows]; }
    static getFocusedWindow() { return windows[windows.length - 1] || null; }
  }
  let ready = false, resolveReady;
  const readyPromise = new Promise((r) => { resolveReady = r; });
  Object.assign(app, {
    whenReady: () => readyPromise,
    isReady: () => ready,
    quit: spy(),
    exit: spy(),
    getPath: (n) => `/fake/${n}`,
    getVersion: () => '1.0.0',
    getName: () => 'DojoApp',
    isPackaged: false,
    requestSingleInstanceLock: spy(() => state.lock),
    setAppUserModelId: spy(),
  });
  const notifications = [];
  class Notification {
    constructor(opts = {}) { this.options = opts; this.show = spy(); notifications.push(this); }
    static isSupported() { return true; }
  }
  const mod = {
    app, BrowserWindow, ipcMain, ipcRenderer,
    contextBridge: { exposeInMainWorld: spy((key, api) => { global.window[key] = api; }) },
    dialog: {
      showOpenDialog: spy(async () => state.openDialogResult),
      showSaveDialog: spy(async () => state.saveDialogResult),
      showMessageBox: spy(async () => ({ response: 0 })),
      showErrorBox: spy(),
    },
    shell: { openExternal: spy(async () => {}), openPath: spy(async () => ''), showItemInFolder: spy() },
    Menu: { buildFromTemplate: spy((t) => ({ items: t })), setApplicationMenu: spy() },
    Notification,
    nativeTheme: { shouldUseDarkColors: false, themeSource: 'system' },
    clipboard: { _t: '', writeText: spy((t) => { mod.clipboard._t = t; }), readText: () => mod.clipboard._t },
    globalShortcut: { register: spy(() => true), unregisterAll: spy() },
  };
  return {
    module: mod, ...mod, windows, handlers, notifications, state,
    async emitReady() { ready = true; resolveReady(); app.emit('ready'); await new Promise((r) => setTimeout(r, 5)); },
  };
};
