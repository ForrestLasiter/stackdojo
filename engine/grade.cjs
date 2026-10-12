'use strict';
// The one grading entry point, used by the app (electron/main.cjs) and by
// `npm test` (scripts/verify.cjs) alike — so a challenge that passes
// verification is graded by exactly the same code in the running app.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, spawnSync } = require('child_process');
const datasets = require('../content/datasets.cjs');

const WIN = process.platform === 'win32';

function findBash() {
  if (!WIN) return 'bash';
  // Never plain `bash` on Windows: System32\bash.exe is the WSL launcher.
  const c = [process.env.DOJO_BASH, 'C:\\Program Files\\Git\\bin\\bash.exe', 'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    path.join(process.env.LOCALAPPDATA || '', 'Programs', 'Git', 'bin', 'bash.exe')];
  return c.find((p) => p && fs.existsSync(p)) || null;
}
function findRustc() {
  const home = path.join(os.homedir(), '.cargo', 'bin', WIN ? 'rustc.exe' : 'rustc');
  if (fs.existsSync(home)) return home;
  const r = spawnSync('rustc', ['--version'], { encoding: 'utf8' });
  return r.status === 0 ? 'rustc' : null;
}
const POWERSHELL = WIN ? 'powershell.exe' : 'pwsh';
let tools;
function toolchains() {
  if (!tools) {
    tools = {
      bash: !!findBash(),
      rust: !!findRustc(),
      ps: WIN || spawnSync('pwsh', ['-v']).status === 0,
    };
  }
  return tools;
}

function run(cmd, args, { cwd, env, timeout = 15000 } = {}) {
  return new Promise((resolve) => {
    let out = '', err = '', done = false, timedOut = false;
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...env }, windowsHide: true });
    const cap = (s, d) => (s.length < 60000 ? s + d : s);
    child.stdout.on('data', (d) => { out = cap(out, d); });
    child.stderr.on('data', (d) => { err = cap(err, d); });
    const timer = setTimeout(() => {
      timedOut = true;
      if (WIN) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F']);
      else child.kill('SIGKILL');
    }, timeout);
    const end = (code) => { if (done) return; done = true; clearTimeout(timer); resolve({ code, out, err, timedOut }); };
    child.on('error', (e) => { err += String(e.message); end(-1); });
    child.on('close', end);
  });
}

const strip = (s) => s.replace(/\u001b\[[0-9;]*m/g, '').replace(/\r\n/g, '\n');
const timeoutMsg = (s) => `Timed out — the run was stopped after ${s} seconds. Is there an infinite loop?`;

function parseMarkers(text, nonce) {
  const tests = [], rest = [];
  const tag = '@@' + nonce + '|';
  for (const line of text.split('\n')) {
    const i = line.indexOf(tag);
    if (i === -1) { rest.push(line); continue; }
    const [state, name, ...msg] = line.slice(i + tag.length).split('|');
    tests.push({ name, ok: state === 'ok', msg: state === 'ok' ? undefined : msg.join('|') });
  }
  return { tests, logs: rest.join('\n').trim() };
}

const BASH_HELPERS = (n) => `
__ok(){ printf '\\n@@${n}|ok|%s\\n' "$1"; }
__no(){ printf '\\n@@${n}|fail|%s|%s\\n' "$1" "$2"; }
# t NAME ACTUAL EXPECTED — string equality
t(){ if [ "$2" == "$3" ]; then __ok "$1"; else __no "$1" "expected $(printf '%q' "$3") but got $(printf '%q' "$2")"; fi; }
# tok NAME CMD... — command must succeed;  tno — must fail
tok(){ local n="$1"; shift; if "$@" >/dev/null 2>&1; then __ok "$n"; else __no "$n" "expected success from: $*"; fi; }
tno(){ local n="$1"; shift; if "$@" >/dev/null 2>&1; then __no "$n" "expected a non-zero exit from: $*"; else __ok "$n"; fi; }
`;

const PS_HELPERS = (n) => `
$ErrorActionPreference = 'Continue'
function __J($x) { if ($null -eq $x) { 'null' } else { ConvertTo-Json -InputObject $x -Compress -Depth 6 } }
function T($name, $actual, $expected) {
  $a = __J $actual; $e = __J $expected
  if ($a -ceq $e) { [Console]::Out.WriteLine("\`n@@${n}|ok|$name") }
  else { [Console]::Out.WriteLine("\`n@@${n}|fail|$name|expected $e but got $a") }
}
function TOK($name, $cond) {
  if ($cond) { [Console]::Out.WriteLine("\`n@@${n}|ok|$name") }
  else { [Console]::Out.WriteLine("\`n@@${n}|fail|$name|condition was false") }
}
`;

async function gradeShell(kind, ch, code, dir) {
  const nonce = crypto.randomBytes(6).toString('hex');
  const work = path.join(dir, 'work');
  fs.mkdirSync(work);
  let r;
  if (kind === 'bash') {
    const bash = findBash();
    if (!bash) return { ok: false, tests: [], error: 'Git Bash was not found. Install Git for Windows to use the Bash track.' };
    const file = path.join(dir, 'run.sh');
    fs.writeFileSync(file, [BASH_HELPERS(nonce), ch.setup || '', code, ch.tests].join('\n').replace(/\r\n/g, '\n'));
    r = await run(bash, ['--noprofile', '--norc', file], { cwd: work });
  } else {
    const file = path.join(dir, 'run.ps1');
    // BOM: Windows PowerShell 5.1 reads a BOM-less script as ANSI.
    fs.writeFileSync(file, '\ufeff' + [PS_HELPERS(nonce), ch.setup || '', code, ch.tests].join('\r\n'));
    r = await run(POWERSHELL, ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', file], { cwd: work });
  }
  if (r.timedOut) return { ok: false, tests: [], error: timeoutMsg(15) };
  const { tests, logs } = parseMarkers(strip(r.out), nonce);
  const errText = strip(r.err).split(dir).join('').trim();
  const result = { tests, logs: [logs, errText].filter(Boolean).join('\n').slice(0, 6000) };
  if (tests.length === 0) result.error = 'The script stopped before any check could run' + (errText ? ':\n' + errText.slice(0, 1500) : ' (did it call exit?)');
  result.ok = !result.error && tests.every((t) => t.ok);
  return result;
}

async function gradeRust(ch, code, dir) {
  const rustc = findRustc();
  if (!rustc) return { ok: false, tests: [], error: 'rustc was not found. Install Rust from https://rustup.rs to use the Rust track.' };
  const src = `${code}\n\n#[cfg(test)]\nmod tests {\n    use super::*;\n${ch.tests}\n}\n`;
  fs.writeFileSync(path.join(dir, 'main.rs'), src);
  const exe = path.join(dir, WIN ? 't.exe' : 't');
  const c = await run(rustc, ['--test', '--edition', '2021', '-A', 'unused', '--color', 'never', '-o', exe, 'main.rs'], { cwd: dir, timeout: 90000 });
  if (c.code !== 0) {
    return { ok: false, tests: [{ name: 'Compiles', ok: false, msg: strip(c.err).slice(0, 2500) }], logs: '' };
  }
  const r = await run(exe, ['--color', 'never', '--test-threads', '1'], { cwd: dir });
  if (r.timedOut) return { ok: false, tests: [], error: timeoutMsg(15) };
  const out = strip(r.out);
  const tests = [{ name: 'Compiles', ok: true }];
  for (const m of out.matchAll(/^test tests::(\w+) \.\.\. (ok|FAILED)$/gm)) {
    const t = { name: m[1].replace(/_/g, ' '), ok: m[2] === 'ok' };
    if (!t.ok) {
      const sec = out.split(`---- tests::${m[1]} stdout ----`)[1] || '';
      t.msg = sec.split(/\n---- |\nfailures:/)[0].replace(/note: run with.*\n?/, '').replace(/thread '.*' \(\d+\) /, '').trim().slice(0, 700);
    }
    tests.push(t);
  }
  const result = { tests, logs: '' };
  if (tests.length === 1) result.error = 'No tests ran.\n' + out.slice(0, 800) + strip(r.err).slice(0, 800);
  result.ok = !result.error && tests.every((t) => t.ok);
  return result;
}

async function gradeNode(runner, ch, code, dir) {
  const out = path.join(dir, 'result.json');
  const job = {
    kind: runner.kind, loader: runner.loader, env: runner.env, typecheck: !!runner.typecheck,
    code, tests: ch.tests, typeTests: ch.typeTests, solution: ch.solution, check: ch.check, ordered: !!ch.ordered, out,
  };
  if (runner.kind === 'sql') job.dataset = datasets.sql[ch.dataset || runner.dataset];
  if (runner.kind === 'mongo') job.dataset = datasets.mongo[ch.dataset || runner.dataset];
  const jobFile = path.join(dir, 'job.json');
  fs.writeFileSync(jobFile, JSON.stringify(job));
  // ELECTRON_RUN_AS_NODE makes the Electron binary behave as plain Node, so
  // the app needs no separately installed Node.js to grade.
  const r = await run(process.execPath, [path.join(__dirname, 'harness.cjs'), jobFile], { cwd: dir, env: { ELECTRON_RUN_AS_NODE: '1', NODE_NO_WARNINGS: '1' }, timeout: 30000 });
  if (r.timedOut) return { ok: false, tests: [], error: timeoutMsg(30) };
  if (!fs.existsSync(out)) return { ok: false, tests: [], error: 'The run crashed before finishing.\n' + strip(r.err).slice(0, 1500) };
  return JSON.parse(fs.readFileSync(out, 'utf8'));
}

async function grade(track, ch, code) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stackdojo-'));
  const started = Date.now();
  try {
    const kind = track.runner.kind;
    let res;
    if (kind === 'bash' || kind === 'ps') res = await gradeShell(kind, ch, code, dir);
    else if (kind === 'rust') res = await gradeRust(ch, code, dir);
    else res = await gradeNode(track.runner, ch, code, dir);
    res.ms = Date.now() - started;
    return res;
  } catch (e) {
    return { ok: false, tests: [], error: 'Grader error: ' + e.message, ms: Date.now() - started };
  } finally {
    fs.rm(dir, { recursive: true, force: true }, () => {});
  }
}

module.exports = { grade, toolchains };
