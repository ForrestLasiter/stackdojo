'use strict';
// Child-process harness for everything that grades inside Node: the JS-family
// tracks (JS, Node, TS, Electron, React, Next.js, React Native) plus the two
// in-process databases (PGlite for PostgreSQL, mingo for MongoDB).
// argv[2] = job.json. Result is written to job.out, never to stdout, so the
// learner's own console output can't be mistaken for a verdict.
const fs = require('fs');
const path = require('path');
const util = require('util');
const vm = require('vm');
const Module = require('module');

const job = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const ROOT = path.resolve(__dirname, '..');
const appRequire = Module.createRequire(path.join(ROOT, 'package.json'));

const result = { ok: false, tests: [], logs: '', error: null, table: null };
const logs = [];
for (const m of ['log', 'info', 'warn', 'error', 'debug']) {
  console[m] = (...a) => {
    const line = util.format(...a);
    if (/not wrapped in act\(|not configured to support act/.test(line)) return;
    logs.push(line);
  };
}

function finish() {
  result.logs = logs.join('\n').slice(0, 20000);
  result.ok = !result.error && result.tests.length > 0 && result.tests.every((t) => t.ok);
  fs.writeFileSync(job.out, JSON.stringify(result));
  process.exit(0);
}
function clean(e) {
  let m = e && e.message ? String(e.message) : String(e);
  m = m.replace(/\u001b\[[0-9;]*m/g, '');
  return m.length > 700 ? m.slice(0, 700) + ' …' : m;
}
process.on('uncaughtException', (e) => { result.error = result.error || 'Uncaught error: ' + clean(e); finish(); });
process.on('unhandledRejection', (e) => { result.error = result.error || 'Unhandled promise rejection: ' + clean(e); finish(); });

// ---------- assertion helpers shared by every JS-family test ----------
const show = (v) => (v && typeof v === 'object' && typeof v.nodeType === 'number' && v.tagName
  ? `<${v.tagName.toLowerCase()}> element (${JSON.stringify((v.textContent || '').slice(0, 40))})`
  : util.inspect(v, { depth: 4, breakLength: 100 }));
function eq(actual, expected, msg) {
  if (!util.isDeepStrictEqual(actual, expected)) {
    throw new Error((msg ? msg + ' — ' : '') + `expected ${show(expected)} but got ${show(actual)}`);
  }
}
function ok(cond, msg) { if (!cond) throw new Error(msg || 'expected a truthy value'); }
function near(a, b, eps = 1e-6, msg) { if (typeof a !== 'number' || Math.abs(a - b) > eps) throw new Error((msg ? msg + ' — ' : '') + `expected about ${b} but got ${show(a)}`); }
function throws(fn, msg) {
  let threw = false, err;
  try { fn(); } catch (e) { threw = true; err = e; }
  if (!threw) throw new Error(msg || 'expected the call to throw, but it returned normally');
  return err;
}
async function rejects(p, msg) {
  let threw = false, err;
  try { await (typeof p === 'function' ? p() : p); } catch (e) { threw = true; err = e; }
  if (!threw) throw new Error(msg || 'expected the promise to reject, but it resolved');
  return err;
}
function spy(impl) {
  const f = function (...a) { f.calls.push(a); return impl ? impl.apply(this, a) : undefined; };
  f.calls = [];
  return f;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function mockFetch(routes) {
  const calls = [];
  const keys = Object.keys(routes).sort((a, b) => b.length - a.length);
  global.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url || String(input);
    calls.push({ url, method: (init.method || 'GET').toUpperCase(), body: init.body, init });
    const k = keys.find((key) => url === key || url.endsWith(key));
    if (k === undefined) return new Response('Not found', { status: 404 });
    let hit = routes[k];
    if (typeof hit === 'function') hit = await hit(url, init);
    if (hit instanceof Error) throw hit;
    if (hit instanceof Response) return hit;
    return new Response(JSON.stringify(hit), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  return calls;
}

// ---------- TypeScript strict type check ----------
const TS_PRELUDE = `
declare const console: { log(...a: any[]): void; error(...a: any[]): void; warn(...a: any[]): void; info(...a: any[]): void };
declare function setTimeout(cb: (...a: any[]) => void, ms?: number, ...a: any[]): number;
declare function clearTimeout(id?: number): void;
declare function setInterval(cb: (...a: any[]) => void, ms?: number, ...a: any[]): number;
declare function clearInterval(id?: number): void;
declare function structuredClone<T>(v: T): T;
type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false;
type Expect<T extends true> = T;
type ExpectFalse<T extends false> = T;
`;
function typecheck(code, typeTests) {
  const ts = appRequire('typescript');
  const main = code + '\n' + (typeTests || '') + '\nexport {};\n';
  const files = { '/prelude.d.ts': TS_PRELUDE, '/main.ts': main };
  const opts = {
    strict: true, noEmit: true, skipLibCheck: true, types: [],
    target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler, lib: ['lib.es2022.d.ts'],
  };
  const host = ts.createCompilerHost(opts);
  const orig = host.getSourceFile.bind(host);
  host.getSourceFile = (f, lang) => (f in files ? ts.createSourceFile(f, files[f], lang, true) : orig(f, lang));
  const fe = host.fileExists.bind(host), rf = host.readFile.bind(host);
  host.fileExists = (f) => f in files || fe(f);
  host.readFile = (f) => (f in files ? files[f] : rf(f));
  host.writeFile = () => {};
  const prog = ts.createProgram(Object.keys(files), opts, host);
  const userLines = code.split('\n').length;
  const lines = main.split('\n');
  const out = [];
  for (const d of ts.getPreEmitDiagnostics(prog)) {
    const text = ts.flattenDiagnosticMessageText(d.messageText, '\n');
    if (d.file && d.file.fileName === '/main.ts' && d.start !== undefined) {
      const ln = d.file.getLineAndCharacterOfPosition(d.start).line;
      if (ln < userLines) out.push(`Line ${ln + 1}: ${text}`);
      else {
        const src = (lines[ln] || '').trim();
        if (/@ts-expect-error/.test(src)) {
          out.push(`This should be a type error, but your types allow it:\n    ${(lines[ln + 1] || '').trim()}`);
        } else out.push(`Type test failed:\n    ${src}\n    ${text}`);
      }
    } else out.push(text);
  }
  return out;
}

// ---------- jsdom for React / Next / React Native ----------
function setupDom() {
  const { JSDOM } = appRequire('jsdom');
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
  const w = dom.window;
  const force = new Set(['Event', 'CustomEvent', 'EventTarget', 'navigator', 'localStorage', 'sessionStorage', 'MessageEvent']);
  for (const k of Object.getOwnPropertyNames(w)) {
    if (k in global && !force.has(k)) continue;
    try { Object.defineProperty(global, k, { configurable: true, writable: true, value: w[k] }); } catch { /* skip */ }
  }
  global.window = w;
  global.document = w.document;
  if (!w.matchMedia) {
    w.matchMedia = global.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
  }
  if (!global.ResizeObserver) global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  global.IS_REACT_ACT_ENVIRONMENT = true;
  return w;
}

async function runJs() {
  const esbuild = appRequire('esbuild');
  if (job.typecheck) {
    const errs = typecheck(job.code, job.typeTests);
    if (errs.length) {
      result.tests.push({ name: 'Passes the strict type checker', ok: false, msg: errs.slice(0, 4).join('\n') });
      return;
    }
    result.tests.push({ name: 'Passes the strict type checker', ok: true });
  }
  const userLines = job.code.split('\n').length;
  let js;
  try {
    js = esbuild.transformSync(job.code + '\n;\n' + (job.tests || ''), {
      loader: job.loader || 'js', format: 'cjs', target: 'node20', jsx: 'automatic', logLevel: 'silent',
    }).code;
  } catch (e) {
    const er = e.errors && e.errors[0];
    if (er) {
      const ln = er.location ? er.location.line : 0;
      result.error = `Syntax error${ln && ln <= userLines ? ' on line ' + ln : ''}: ${er.text}` +
        (er.location && ln <= userLines ? '\n    ' + er.location.lineText.trim() : '');
    } else result.error = clean(e);
    return;
  }

  const registered = [];
  const scope = {
    test: (name, fn) => registered.push({ name, fn }),
    eq, ok, near, throws, rejects, spy, sleep, mockFetch, SOURCE: job.code,
    __dirname: '/app', __filename: '/app/main.js',
    output: () => logs.join('\n'),
    clearOutput: () => { logs.length = 0; },
    module: { exports: {} },
  };
  scope.exports = scope.module.exports;
  const shims = {};
  let afterEach = () => {};

  if (job.env === 'react' || job.env === 'next' || job.env === 'rn') {
    setupDom();
    const React = appRequire('react');
    const RTL = appRequire('@testing-library/react');
    RTL.configure({ getElementError: (message) => { const e = new Error(message); e.name = 'TestingLibraryElementError'; return e; } });
    Object.assign(scope, {
      React, render: RTL.render, screen: RTL.screen, fireEvent: RTL.fireEvent, waitFor: RTL.waitFor,
      act: RTL.act, within: RTL.within, renderHook: RTL.renderHook,
    });
    afterEach = () => { RTL.cleanup(); try { localStorage.clear(); } catch { /* none */ } };
    if (job.env === 'rn') {
      shims['react-native'] = appRequire('react-native-web');
      scope.css = (el) => getComputedStyle(el);
    }
    if (job.env === 'next') {
      const next = require('./shims/next.cjs')(React, spy);
      Object.assign(shims, next.modules);
      Object.assign(scope, next.helpers);
      const prev = afterEach;
      afterEach = () => { prev(); next.reset(); };
    }
  }
  if (job.env === 'electron') {
    global.window = {};
    const E = require('./shims/electron.cjs')(spy);
    shims.electron = E.module;
    scope.E = E;
  }
  if (job.env === 'node') {
    scope.TMP = fs.mkdtempSync(path.join(path.dirname(job.out), 'work-'));
  }
  scope.require = (id) => (id in shims ? shims[id] : appRequire(id));

  try {
    // The block gives the learner's top-level `const`/`let` their own scope, so
    // a name like `render` or `test` shadows the helper instead of colliding.
    new Function(...Object.keys(scope), '"use strict";{\n' + js + '\n}')(...Object.values(scope));
  } catch (e) {
    result.error = 'Your code threw an error while loading: ' + clean(e);
    return;
  }
  for (const t of registered) {
    let timer;
    try {
      await Promise.race([
        Promise.resolve().then(t.fn),
        new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('timed out after 5s — is something never resolving?')), 5000); }),
      ]);
      result.tests.push({ name: t.name, ok: true });
    } catch (e) {
      result.tests.push({ name: t.name, ok: false, msg: clean(e) });
    } finally {
      clearTimeout(timer);
      try { afterEach(); } catch { /* ignore */ }
    }
  }
}

// ---------- shared row comparison for SQL + Mongo ----------
function normCell(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'bigint') return Number(v);
  if (v instanceof Date) return v.toISOString().replace('T00:00:00.000Z', '');
  if (typeof v === 'number') return Math.round(v * 1e6) / 1e6;
  if (typeof v === 'string' && /^-?\d+(\.\d+)?$/.test(v.trim())) return Math.round(Number(v) * 1e6) / 1e6;
  if (typeof v === 'object') return JSON.stringify(v);
  return v;
}

async function runSql() {
  const { PGlite } = await import('@electric-sql/pglite');
  async function exec(code) {
    const db = new PGlite();
    await db.exec(job.dataset);
    let res = await db.exec(code, { rowMode: 'array' });
    if (job.check) res = await db.exec(job.check, { rowMode: 'array' });
    const last = [...res].reverse().find((r) => r.fields && r.fields.length);
    await db.close().catch(() => {});
    if (!last) return null;
    return { fields: last.fields.map((f) => f.name), rows: last.rows.map((r) => r.map(normCell)) };
  }
  if (!job.code.replace(/--.*$/gm, '').trim()) { result.error = 'Nothing to run yet — write your SQL in the editor.'; return; }
  let mine;
  try { mine = await exec(job.code); } catch (e) {
    result.tests.push({ name: 'Runs without an error', ok: false, msg: 'PostgreSQL said: ' + clean(e) });
    return;
  }
  result.tests.push({ name: 'Runs without an error', ok: true });
  const want = await exec(job.solution);
  if (!mine) { result.tests.push({ name: 'Returns rows', ok: false, msg: 'Your SQL ran, but the last statement did not return a result set.' }); return; }
  if (!job.check) result.table = { fields: mine.fields, rows: mine.rows.slice(0, 25), total: mine.rows.length };
  compareTables(mine, want);
}

function compareTables(mine, want) {
  const colsOk = mine.fields.length === want.fields.length;
  result.tests.push({
    name: `Returns ${want.fields.length} column${want.fields.length === 1 ? '' : 's'}`, ok: colsOk,
    msg: colsOk ? undefined : `expected ${want.fields.length} (${want.fields.join(', ')}) but got ${mine.fields.length} (${mine.fields.join(', ')})`,
  });
  if (!colsOk) return;
  const rowsOk = mine.rows.length === want.rows.length;
  result.tests.push({ name: `Returns ${want.rows.length} row${want.rows.length === 1 ? '' : 's'}`, ok: rowsOk, msg: rowsOk ? undefined : `got ${mine.rows.length}` });
  if (!rowsOk) return;
  const key = (r) => JSON.stringify(r);
  const a = mine.rows.map(key), b = want.rows.map(key);
  const sa = [...a].sort(), sb = [...b].sort();
  const bad = sa.findIndex((r, i) => r !== sb[i]);
  result.tests.push({ name: 'Row values are correct', ok: bad === -1, msg: bad === -1 ? undefined : `a row is wrong or missing.\n  expected: ${sb[bad]}\n  got:      ${sa[bad]}` });
  if (bad !== -1) return;
  if (job.ordered) {
    const o = a.findIndex((r, i) => r !== b[i]);
    result.tests.push({ name: 'Rows are in the requested order', ok: o === -1, msg: o === -1 ? undefined : `row ${o + 1} is out of order — expected ${b[o]}` });
  }
}

async function runMongo() {
  const makeDb = require('./mongo-shim.cjs');
  function exec(code) {
    const db = makeDb(appRequire, JSON.parse(JSON.stringify(job.dataset)));
    // Same realm as mingo on purpose: a regex literal made in a separate vm
    // context is not `instanceof RegExp` here, and would silently match nothing.
    Object.assign(global, { db, ISODate: (s) => new Date(s), print: (...a) => logs.push(util.format(...a)), printjson: (x) => logs.push(JSON.stringify(x, null, 2)) });
    let v = vm.runInThisContext(code, { timeout: 4000 });
    if (job.check) v = vm.runInThisContext(job.check, { timeout: 4000 });
    if (v && typeof v.toArray === 'function') v = v.toArray();
    return v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  }
  if (!job.code.replace(/\/\/.*$/gm, '').trim()) { result.error = 'Nothing to run yet — write your query in the editor.'; return; }
  let mine;
  try { mine = exec(job.code); } catch (e) {
    result.tests.push({ name: 'Runs without an error', ok: false, msg: clean(e) });
    return;
  }
  result.tests.push({ name: 'Runs without an error', ok: true });
  const want = exec(job.solution);
  if (mine === undefined) { result.tests.push({ name: 'Returns a result', ok: false, msg: 'Your code ran but its last expression has no value. End with the query itself, e.g. db.users.find({...})' }); return; }
  if (!job.check) result.table = { json: JSON.stringify(mine, null, 2).slice(0, 6000) };
  const sortKeys = (x) => Array.isArray(x) ? x.map(sortKeys) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map((k) => [k, sortKeys(x[k])])) : x;
  const A = sortKeys(mine), B = sortKeys(want);
  if (Array.isArray(B)) {
    if (!Array.isArray(A)) { result.tests.push({ name: 'Returns a list of documents', ok: false, msg: `got ${show(A)}` }); return; }
    const n = A.length === B.length;
    result.tests.push({ name: `Returns ${B.length} document${B.length === 1 ? '' : 's'}`, ok: n, msg: n ? undefined : `got ${A.length}` });
    if (!n) return;
    const a = A.map((d) => JSON.stringify(d)), b = B.map((d) => JSON.stringify(d));
    const sa = [...a].sort(), sb = [...b].sort();
    const bad = sa.findIndex((r, i) => r !== sb[i]);
    result.tests.push({ name: 'Documents have the right shape and values', ok: bad === -1, msg: bad === -1 ? undefined : `a document is wrong or missing.\n  expected: ${sb[bad]}\n  got:      ${sa[bad]}` });
    if (bad !== -1) return;
    if (job.ordered) {
      const o = a.findIndex((r, i) => r !== b[i]);
      result.tests.push({ name: 'Documents are in the requested order', ok: o === -1, msg: o === -1 ? undefined : `document ${o + 1} is out of order` });
    }
  } else {
    const same = JSON.stringify(A) === JSON.stringify(B);
    result.tests.push({ name: 'Result is correct', ok: same, msg: same ? undefined : `expected ${JSON.stringify(B)} but got ${JSON.stringify(A)}` });
  }
}

(async () => {
  try {
    if (job.kind === 'sql') await runSql();
    else if (job.kind === 'mongo') await runMongo();
    else await runJs();
  } catch (e) {
    result.error = result.error || clean(e);
  }
  finish();
})();
