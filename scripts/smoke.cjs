'use strict';
// npm run smoke — launches the real app against a throwaway profile, drives
// it (see smoke-hook.cjs), and exits non-zero if anything broke.
// Screenshots land in ./smoke-out. The window opens on the second monitor
// without taking focus, and the run is skipped if there is only one display.
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'smoke-out');
fs.rmSync(out, { recursive: true, force: true });

const env = { ...process.env, DOJO_SMOKE: out };
delete env.ELECTRON_RUN_AS_NODE;
const r = spawnSync(require('electron'), ['.'], { cwd: root, env, stdio: 'inherit', timeout: 240000 });

const logFile = path.join(out, 'smoke.log');
console.log(fs.existsSync(logFile) ? fs.readFileSync(logFile, 'utf8') : 'no smoke log was written');
// Exit 2 = skipped (no second monitor); the app refuses to open on the main one.
process.exit(r.status === 0 ? 0 : r.status === 2 ? 2 : 1);
