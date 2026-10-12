'use strict';
// Tests get a fresh scratch directory as `TMP`. Test-side requires are
// underscore-prefixed so they can't collide with the learner's own top-level
// `const fs = require(...)`.

const T_PRE = `const _fs = require('node:fs'); const _path = require('node:path');
const _w = (name, text) => { const f = _path.join(TMP, name); _fs.mkdirSync(_path.dirname(f), { recursive: true }); _fs.writeFileSync(f, text); return f; };
`;
const T_HTTP = `async function _serve(app, fn) {
  await new Promise((r) => app.listen(0, '127.0.0.1', r));
  try { return await fn('http://127.0.0.1:' + app.address().port); } finally { app.close(); if (app.closeAllConnections) app.closeAllConnections(); }
}
`;

module.exports = {
  id: 'node',
  name: 'Node.js',
  short: 'ND',
  blurb: 'JavaScript outside the browser: files, paths, streams, processes, HTTP servers.',
  lang: 'javascript',
  runner: { kind: 'node', loader: 'js', env: 'node' },
  challenges: [
    {
      id: 'path-parts', title: 'Take a path apart', tier: 1,
      prompt: "Write `describe(file)` returning `{ dir, name, ext }` for a file path — e.g. `'/var/log/app.log'` → `{ dir: '/var/log', name: 'app', ext: '.log' }`. Use the `node:path` module rather than string splitting.",
      starter: `const path = require('node:path');\n\nfunction describe(file) {\n  \n}\n`,
      solution: `const path = require('node:path');\n\nfunction describe(file) {\n  const { dir, name, ext } = path.parse(file);\n  return { dir, name, ext };\n}\n`,
      tests: `test('splits a path', () => eq(describe('/var/log/app.log'), { dir: '/var/log', name: 'app', ext: '.log' }));
test('only the last extension counts', () => eq(describe('backup.tar.gz'), { dir: '', name: 'backup.tar', ext: '.gz' }));
test('no extension', () => eq(describe('/etc/hosts'), { dir: '/etc', name: 'hosts', ext: '' }));`,
      hints: ['`path.parse()` returns an object with `root`, `dir`, `base`, `name` and `ext`.'],
    },
    {
      id: 'path-safe', title: 'Stay inside the folder', tier: 2,
      prompt: "A server lets users request files under a base folder. Write `safeJoin(base, userPath)` that returns the absolute path of `userPath` inside `base` — or throws `new Error('forbidden')` if the result would escape `base` (think `../../etc/passwd`).",
      starter: `const path = require('node:path');\n\nfunction safeJoin(base, userPath) {\n  return path.join(base, userPath);\n}\n`,
      solution: `const path = require('node:path');\n\nfunction safeJoin(base, userPath) {\n  const root = path.resolve(base);\n  const full = path.resolve(root, userPath);\n  if (full !== root && !full.startsWith(root + path.sep)) throw new Error('forbidden');\n  return full;\n}\n`,
      tests: T_PRE + `test('joins a normal path', () => eq(safeJoin(TMP, 'docs/a.txt'), _path.resolve(TMP, 'docs', 'a.txt')));
test('blocks ../ escapes', () => eq(throws(() => safeJoin(TMP, '../../secret')).message, 'forbidden'));
test('blocks sneaky escapes', () => { throws(() => safeJoin(TMP, 'docs/../../x')); });
test('blocks sibling folders with the same prefix', () => { throws(() => safeJoin(TMP, '../' + _path.basename(TMP) + '-evil/x')); });
test('allows .. that stays inside', () => eq(safeJoin(TMP, 'a/../b.txt'), _path.resolve(TMP, 'b.txt')));`,
      hints: ['`path.resolve` collapses every `..` and gives you the real absolute path.', 'Then it is a string question: does the result start with the base folder?', 'Compare against `base + path.sep`, or `/data-evil` will pass as "inside" `/data`.'],
    },
    {
      id: 'read-json', title: 'Read a JSON file', tier: 1,
      prompt: "Write `async readJson(file)` that reads a file with `fs/promises` and returns the parsed JSON. If the file does not exist, return `null`. Any other error (including bad JSON) should still reject.",
      starter: `const fs = require('node:fs/promises');\n\nasync function readJson(file) {\n  \n}\n`,
      solution: `const fs = require('node:fs/promises');\n\nasync function readJson(file) {\n  try {\n    return JSON.parse(await fs.readFile(file, 'utf8'));\n  } catch (e) {\n    if (e.code === 'ENOENT') return null;\n    throw e;\n  }\n}\n`,
      tests: T_PRE + `test('parses the file', async () => eq(await readJson(_w('a.json', '{"n": 5}')), { n: 5 }));
test('missing file gives null', async () => eq(await readJson(_path.join(TMP, 'nope.json')), null));
test('bad JSON still rejects', async () => { await rejects(readJson(_w('bad.json', '{oops'))); });`,
      hints: ['`fs.readFile(file, "utf8")` resolves with a string; without the encoding you get a Buffer.', 'Node file errors carry a `code`. "No such file" is `ENOENT`.'],
    },
    {
      id: 'write-lines', title: 'Write lines', tier: 1,
      prompt: "Write `async writeLines(file, lines)` that writes an array of strings to a file, one per line, each line ending with `\\n`. Create any missing parent folders.",
      starter: `const fs = require('node:fs/promises');\nconst path = require('node:path');\n\nasync function writeLines(file, lines) {\n  \n}\n`,
      solution: `const fs = require('node:fs/promises');\nconst path = require('node:path');\n\nasync function writeLines(file, lines) {\n  await fs.mkdir(path.dirname(file), { recursive: true });\n  await fs.writeFile(file, lines.map((l) => l + '\\n').join(''));\n}\n`,
      tests: T_PRE + `test('writes one line each', async () => { const f = _path.join(TMP, 'out.txt'); await writeLines(f, ['a', 'b']); eq(_fs.readFileSync(f, 'utf8'), 'a\\nb\\n'); });
test('creates parent folders', async () => { const f = _path.join(TMP, 'deep', 'er', 'out.txt'); await writeLines(f, ['x']); eq(_fs.readFileSync(f, 'utf8'), 'x\\n'); });
test('empty list makes an empty file', async () => { const f = _path.join(TMP, 'empty.txt'); await writeLines(f, []); eq(_fs.readFileSync(f, 'utf8'), ''); });`,
      hints: ['`fs.mkdir(dir, { recursive: true })` creates the whole chain and does not fail if it already exists.', '`path.dirname(file)` is the folder a file lives in.'],
    },
    {
      id: 'exists', title: 'Does it exist?', tier: 1,
      prompt: "Write `async exists(p)` resolving to `true` if the path exists and `false` if it does not. It must never reject.",
      starter: `const fs = require('node:fs/promises');\n\nasync function exists(p) {\n  \n}\n`,
      solution: `const fs = require('node:fs/promises');\n\nasync function exists(p) {\n  try { await fs.access(p); return true; } catch { return false; }\n}\n`,
      tests: T_PRE + `test('true for a file', async () => eq(await exists(_w('here.txt', 'x')), true));
test('true for a folder', async () => eq(await exists(TMP), true));
test('false when missing', async () => eq(await exists(_path.join(TMP, 'ghost')), false));`,
      hints: ['`fs.access(p)` resolves if the path is reachable and rejects if not.', 'Turn the rejection into `false` with try/catch.'],
    },
    {
      id: 'list-ext', title: 'List files by extension', tier: 2,
      prompt: "Write `async listByExt(dir, ext)` returning the names of the **files** directly inside `dir` whose extension is `ext` (like `'.log'`), sorted alphabetically. Folders are ignored even if their name matches. Extension matching ignores case.",
      starter: `const fs = require('node:fs/promises');\nconst path = require('node:path');\n\nasync function listByExt(dir, ext) {\n  \n}\n`,
      solution: `const fs = require('node:fs/promises');\nconst path = require('node:path');\n\nasync function listByExt(dir, ext) {\n  const entries = await fs.readdir(dir, { withFileTypes: true });\n  return entries\n    .filter((e) => e.isFile() && path.extname(e.name).toLowerCase() === ext.toLowerCase())\n    .map((e) => e.name)\n    .sort();\n}\n`,
      tests: T_PRE + `test('filters and sorts', async () => { _w('l/b.log', ''); _w('l/a.log', ''); _w('l/notes.txt', ''); _w('l/C.LOG', ''); eq(await listByExt(_path.join(TMP, 'l'), '.log'), ['C.LOG', 'a.log', 'b.log']); });
test('ignores folders', async () => { _w('m/x.log', ''); _fs.mkdirSync(_path.join(TMP, 'm', 'dir.log')); eq(await listByExt(_path.join(TMP, 'm'), '.log'), ['x.log']); });
test('nothing matches', async () => { _w('n/a.txt', ''); eq(await listByExt(_path.join(TMP, 'n'), '.md'), []); });`,
      hints: ['`readdir(dir, { withFileTypes: true })` returns entries that know whether they are files or directories.', '`path.extname("a.LOG")` is `".LOG"`.'],
    },
    {
      id: 'walk', title: 'Walk a folder tree', tier: 2,
      prompt: "Write `async walk(dir)` returning every file under `dir`, at any depth, as paths **relative to `dir`** using forward slashes, sorted. Example: `['a.txt', 'sub/b.txt', 'sub/deep/c.txt']`.",
      starter: `const fs = require('node:fs/promises');\nconst path = require('node:path');\n\nasync function walk(dir) {\n  \n}\n`,
      solution: `const fs = require('node:fs/promises');\nconst path = require('node:path');\n\nasync function walk(dir) {\n  const out = [];\n  async function visit(current, prefix) {\n    for (const e of await fs.readdir(current, { withFileTypes: true })) {\n      const rel = prefix ? prefix + '/' + e.name : e.name;\n      if (e.isDirectory()) await visit(path.join(current, e.name), rel);\n      else out.push(rel);\n    }\n  }\n  await visit(dir, '');\n  return out.sort();\n}\n`,
      tests: T_PRE + `test('finds nested files', async () => { _w('t/a.txt', ''); _w('t/sub/b.txt', ''); _w('t/sub/deep/c.txt', ''); eq(await walk(_path.join(TMP, 't')), ['a.txt', 'sub/b.txt', 'sub/deep/c.txt']); });
test('empty folders add nothing', async () => { _fs.mkdirSync(_path.join(TMP, 'e', 'hollow'), { recursive: true }); eq(await walk(_path.join(TMP, 'e')), []); });`,
      hints: ['Recursion: for each entry, a directory means "do the same thing one level down".', 'Carry the relative prefix along as you descend, joined with `/` yourself — `path.join` would give backslashes on Windows.'],
    },
    {
      id: 'base64', title: 'Buffers and base64', tier: 1,
      prompt: "Write `toBase64(text)` and `fromBase64(b64)` that convert a UTF-8 string to base64 and back, using `Buffer`.",
      starter: `function toBase64(text) {\n  \n}\n\nfunction fromBase64(b64) {\n  \n}\n`,
      solution: `function toBase64(text) {\n  return Buffer.from(text, 'utf8').toString('base64');\n}\n\nfunction fromBase64(b64) {\n  return Buffer.from(b64, 'base64').toString('utf8');\n}\n`,
      tests: `test('encodes', () => eq(toBase64('hello'), 'aGVsbG8='));
test('decodes', () => eq(fromBase64('aGVsbG8='), 'hello'));
test('round-trips unicode', () => eq(fromBase64(toBase64('naïve ☕')), 'naïve ☕'));`,
      hints: ['`Buffer.from(string, encoding)` reads bytes in; `buffer.toString(encoding)` writes them out.'],
    },
    {
      id: 'sha256', title: 'Hash a string', tier: 1,
      prompt: "Write `sha256(text)` returning the SHA-256 hash of a string as lowercase hex, using `node:crypto`.",
      starter: `const crypto = require('node:crypto');\n\nfunction sha256(text) {\n  \n}\n`,
      solution: `const crypto = require('node:crypto');\n\nfunction sha256(text) {\n  return crypto.createHash('sha256').update(text).digest('hex');\n}\n`,
      tests: `test('known hash', () => eq(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'));
test('empty string', () => eq(sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'));`,
      hints: ['`crypto.createHash(algorithm)` gives a hash object: feed it with `.update()`, finish with `.digest()`.'],
    },
    {
      id: 'url-param', title: 'Read a URL', tier: 1,
      prompt: "Write `getParam(url, name)` returning the value of a query-string parameter from a full URL, or `null` if it is absent. Use the built-in `URL` class.",
      starter: `function getParam(url, name) {\n  \n}\n`,
      solution: `function getParam(url, name) {\n  return new URL(url).searchParams.get(name);\n}\n`,
      tests: `test('finds a param', () => eq(getParam('https://x.test/search?q=node&page=2', 'page'), '2'));
test('decodes it', () => eq(getParam('https://x.test/?q=hello%20world', 'q'), 'hello world'));
test('absent is null', () => eq(getParam('https://x.test/', 'q'), null));`,
      hints: ['`new URL(str).searchParams` is a `URLSearchParams` object with a `.get()` method.'],
    },
    {
      id: 'env-config', title: 'Config from the environment', tier: 2,
      prompt: "Write `loadConfig(env)` (you will be passed an object shaped like `process.env`, where every value is a string). Return:\n\n- `port` — `env.PORT` as a **number**, default `3000`\n- `debug` — `true` only when `env.DEBUG` is exactly `'true'`\n- `apiKey` — `env.API_KEY`; if it is missing or empty, throw `new Error('API_KEY is required')`",
      starter: `function loadConfig(env) {\n  \n}\n`,
      solution: `function loadConfig(env) {\n  if (!env.API_KEY) throw new Error('API_KEY is required');\n  return {\n    port: env.PORT ? Number(env.PORT) : 3000,\n    debug: env.DEBUG === 'true',\n    apiKey: env.API_KEY,\n  };\n}\n`,
      tests: `test('reads everything', () => eq(loadConfig({ PORT: '8080', DEBUG: 'true', API_KEY: 'k' }), { port: 8080, debug: true, apiKey: 'k' }));
test('applies defaults', () => eq(loadConfig({ API_KEY: 'k' }), { port: 3000, debug: false, apiKey: 'k' }));
test("DEBUG='false' is false", () => eq(loadConfig({ API_KEY: 'k', DEBUG: 'false' }).debug, false));
test('requires the key', () => eq(throws(() => loadConfig({ API_KEY: '' })).message, 'API_KEY is required'));`,
      hints: ['Environment variables are always strings. `"false"` is a truthy string.', 'Convert the port with `Number(...)`.'],
    },
    {
      id: 'argv', title: 'Parse command-line arguments', tier: 2,
      prompt: "Write `parseArgs(argv)` for an array like `process.argv.slice(2)`:\n\n- `--name=value` → `{ name: 'value' }`\n- `--name value` → `{ name: 'value' }`\n- `--flag` (followed by another option, or nothing) → `{ flag: true }`\n- anything else is positional and collected, in order, under `_`",
      starter: `function parseArgs(argv) {\n  \n}\n`,
      solution: `function parseArgs(argv) {\n  const out = { _: [] };\n  for (let i = 0; i < argv.length; i++) {\n    const a = argv[i];\n    if (!a.startsWith('--')) { out._.push(a); continue; }\n    const body = a.slice(2);\n    const eqAt = body.indexOf('=');\n    if (eqAt !== -1) out[body.slice(0, eqAt)] = body.slice(eqAt + 1);\n    else if (i + 1 < argv.length && !argv[i + 1].startsWith('--')) out[body] = argv[++i];\n    else out[body] = true;\n  }\n  return out;\n}\n`,
      tests: `test('--name=value', () => eq(parseArgs(['--port=8080']), { _: [], port: '8080' }));
test('--name value', () => eq(parseArgs(['--port', '8080']), { _: [], port: '8080' }));
test('boolean flags', () => eq(parseArgs(['--verbose', '--dry-run']), { _: [], verbose: true, 'dry-run': true }));
test('positionals', () => eq(parseArgs(['build', '--out', 'dist', 'src']), { _: ['build', 'src'], out: 'dist' }));
test('values may contain =', () => eq(parseArgs(['--q=a=b']), { _: [], q: 'a=b' }));`,
      hints: ['Walk the array with an index, because `--name value` consumes two items.', 'Look ahead: if the next item exists and is not itself an option, it is this option\'s value.', 'Split `--a=b` at the *first* `=` only.'],
    },
    {
      id: 'promisify', title: 'Promisify a callback API', tier: 2,
      prompt: "Old Node APIs take a callback as their last argument, called as `cb(err, result)`. Write `promisify(fn)` **by hand** (no `util.promisify`). It returns a function that takes the same arguments minus the callback and returns a Promise.",
      starter: `function promisify(fn) {\n  \n}\n`,
      solution: `function promisify(fn) {\n  return (...args) => new Promise((resolve, reject) => {\n    fn(...args, (err, result) => (err ? reject(err) : resolve(result)));\n  });\n}\n`,
      tests: `const _legacyAdd = (a, b, cb) => setTimeout(() => cb(null, a + b), 5);
const _legacyFail = (cb) => setTimeout(() => cb(new Error('disk full')), 5);
test('resolves with the result', async () => eq(await promisify(_legacyAdd)(2, 3), 5));
test('rejects with the error', async () => eq((await rejects(promisify(_legacyFail)())).message, 'disk full'));
test('returns a promise', () => ok(promisify(_legacyAdd)(1, 1) instanceof Promise));
test('written by hand', () => ok(!/util/.test(promisify.toString()), 'no util.promisify'));`,
      hints: ['Return a function that returns `new Promise(...)`.', 'Inside, call the original with the arguments plus a callback you supply. That callback settles the promise.'],
    },
    {
      id: 'timeout', title: 'Give up after a while', tier: 2,
      prompt: "Write `withTimeout(promise, ms)`. It settles the same way as `promise` if that happens within `ms` milliseconds; otherwise it rejects with `new Error('timeout')`. Do not leave a timer running after the promise settles.",
      starter: `function withTimeout(promise, ms) {\n  \n}\n`,
      solution: `function withTimeout(promise, ms) {\n  let timer;\n  const limit = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('timeout')), ms); });\n  return Promise.race([promise, limit]).finally(() => clearTimeout(timer));\n}\n`,
      tests: `test('passes a fast result through', async () => eq(await withTimeout(sleep(5).then(() => 'ok'), 100), 'ok'));
test('rejects when too slow', async () => eq((await rejects(withTimeout(sleep(200), 20))).message, 'timeout'));
test('passes rejections through', async () => eq((await rejects(withTimeout(Promise.reject(new Error('own')), 100))).message, 'own'));
test('clears its timer', async () => { const before = process.getActiveResourcesInfo().filter((r) => r === 'Timeout').length; await withTimeout(Promise.resolve(1), 5000); eq(process.getActiveResourcesInfo().filter((r) => r === 'Timeout').length, before); });`,
      hints: ['`Promise.race([a, b])` settles with whichever settles first.', 'Race the real promise against one that rejects after `ms`.', '`.finally(() => clearTimeout(timer))` runs whichever way it ends.'],
    },
    {
      id: 'job-events', title: 'Extend EventEmitter', tier: 2,
      prompt: "Write `class Job extends EventEmitter`, constructed with a number of `steps`. Its `async run()` method emits, in order:\n\n- `'start'` once\n- `'progress'` once per step, with the step number (1-based) and the total\n- `'done'` once\n\n`run()` should `await` a `setImmediate`-style pause between steps so listeners can keep up, and resolve after `'done'`.",
      starter: `const { EventEmitter } = require('node:events');\n\nclass Job extends EventEmitter {\n  constructor(steps) {\n    super();\n    this.steps = steps;\n  }\n\n  async run() {\n    \n  }\n}\n`,
      solution: `const { EventEmitter } = require('node:events');\n\nclass Job extends EventEmitter {\n  constructor(steps) {\n    super();\n    this.steps = steps;\n  }\n\n  async run() {\n    this.emit('start');\n    for (let i = 1; i <= this.steps; i++) {\n      await new Promise((r) => setImmediate(r));\n      this.emit('progress', i, this.steps);\n    }\n    this.emit('done');\n  }\n}\n`,
      tests: `test('emits the full sequence', async () => { const j = new Job(3); const log = []; j.on('start', () => log.push('start')); j.on('progress', (i, n) => log.push(i + '/' + n)); j.on('done', () => log.push('done')); await j.run(); eq(log, ['start', '1/3', '2/3', '3/3', 'done']); });
test('is a real EventEmitter', () => ok(new Job(1) instanceof require('node:events').EventEmitter));
test('zero steps still starts and finishes', async () => { const j = new Job(0); const log = []; j.on('start', () => log.push('s')); j.on('done', () => log.push('d')); await j.run(); eq(log, ['s', 'd']); });`,
      hints: ['`this.emit(name, ...args)` calls every listener registered with `on(name, ...)`.', 'Wrap `setImmediate` in a promise to await it: `new Promise((r) => setImmediate(r))`.'],
    },
    {
      id: 'transform', title: 'A Transform stream', tier: 2,
      prompt: "Write `upperCase()` returning a `Transform` stream that upper-cases whatever text flows through it.",
      starter: `const { Transform } = require('node:stream');\n\nfunction upperCase() {\n  \n}\n`,
      solution: `const { Transform } = require('node:stream');\n\nfunction upperCase() {\n  return new Transform({\n    transform(chunk, encoding, callback) {\n      callback(null, chunk.toString().toUpperCase());\n    },\n  });\n}\n`,
      tests: `const { Readable: _Readable, Transform: _Transform } = require('node:stream');
const _collect = async (s) => { let out = ''; for await (const c of s) out += c; return out; };
test('upper-cases chunks', async () => eq(await _collect(_Readable.from(['he', 'llo ', 'world']).pipe(upperCase())), 'HELLO WORLD'));
test('is a Transform', () => ok(upperCase() instanceof _Transform));
test('each call makes a new stream', () => ok(upperCase() !== upperCase()));`,
      hints: ['`new Transform({ transform(chunk, encoding, callback) { ... } })`.', 'Chunks arrive as Buffers. Finish each one with `callback(null, output)`.'],
    },
    {
      id: 'line-count-stream', title: 'Count lines without loading the file', tier: 3,
      prompt: "Log files get too big to read into memory. Write `async countMatches(file, word)` that returns how many **lines** contain `word`, reading the file as a stream, line by line, with `node:readline`.",
      starter: `const fs = require('node:fs');\nconst readline = require('node:readline');\n\nasync function countMatches(file, word) {\n  \n}\n`,
      solution: `const fs = require('node:fs');\nconst readline = require('node:readline');\n\nasync function countMatches(file, word) {\n  const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });\n  let n = 0;\n  for await (const line of rl) if (line.includes(word)) n++;\n  return n;\n}\n`,
      tests: T_PRE + `test('counts matching lines', async () => eq(await countMatches(_w('app.log', 'ok\\nERROR one\\nok\\nERROR two\\n'), 'ERROR'), 2));
test('counts lines, not occurrences', async () => eq(await countMatches(_w('b.log', 'x x x\\ny\\n'), 'x'), 1));
test('handles a big file', async () => eq(await countMatches(_w('big.log', ('line\\nhit\\n').repeat(20000)), 'hit'), 20000));
test('streams the file', () => ok(/createReadStream/.test(countMatches.toString()) && !/readFile/.test(countMatches.toString()), 'use createReadStream + readline, not readFile'));`,
      hints: ['`readline.createInterface({ input: fs.createReadStream(file) })` yields one line at a time.', 'The interface is async-iterable: `for await (const line of rl)`.'],
    },
    {
      id: 'spawn', title: 'Run another program', tier: 2,
      prompt: "Write `run(cmd, args)` that starts a child process with `spawn` and returns a Promise resolving to `{ code, stdout }` — the exit code and everything the process wrote to standard output, as a string.",
      starter: `const { spawn } = require('node:child_process');\n\nfunction run(cmd, args) {\n  \n}\n`,
      solution: `const { spawn } = require('node:child_process');\n\nfunction run(cmd, args) {\n  return new Promise((resolve, reject) => {\n    const child = spawn(cmd, args);\n    let stdout = '';\n    child.stdout.on('data', (d) => { stdout += d; });\n    child.on('error', reject);\n    child.on('close', (code) => resolve({ code, stdout }));\n  });\n}\n`,
      tests: `test('captures output', async () => eq(await run(process.execPath, ['-e', 'console.log(6 * 7)']), { code: 0, stdout: '42\\n' }));
test('reports the exit code', async () => eq((await run(process.execPath, ['-e', 'process.exit(3)'])).code, 3));
test('collects multiple writes', async () => eq((await run(process.execPath, ['-e', 'process.stdout.write("a"); setTimeout(() => process.stdout.write("b"), 30)'])).stdout, 'ab'));`,
      hints: ['`spawn` returns immediately with a child whose `stdout` is a stream — listen for `data` events and add them up.', 'The `close` event fires with the exit code once the process has ended *and* its streams are flushed.'],
    },
    {
      id: 'http-health', title: 'An HTTP server', tier: 2,
      prompt: "Write `createApp()` returning an `http.Server` (do **not** call `listen` — the tests do). It should answer:\n\n- `GET /health` → status `200`, JSON body `{ \"status\": \"ok\" }`\n- anything else → status `404`, JSON body `{ \"error\": \"not found\" }`\n\nSet `Content-Type: application/json` on both.",
      starter: `const http = require('node:http');\n\nfunction createApp() {\n  return http.createServer((req, res) => {\n    \n  });\n}\n`,
      solution: `const http = require('node:http');\n\nfunction createApp() {\n  return http.createServer((req, res) => {\n    const send = (status, body) => {\n      res.writeHead(status, { 'Content-Type': 'application/json' });\n      res.end(JSON.stringify(body));\n    };\n    if (req.method === 'GET' && req.url === '/health') send(200, { status: 'ok' });\n    else send(404, { error: 'not found' });\n  });\n}\n`,
      tests: T_HTTP + `test('GET /health', () => _serve(createApp(), async (base) => { const r = await fetch(base + '/health'); eq(r.status, 200); eq(await r.json(), { status: 'ok' }); }));
test('sends a JSON content type', () => _serve(createApp(), async (base) => { const r = await fetch(base + '/health'); ok(r.headers.get('content-type').includes('application/json')); }));
test('unknown paths are 404', () => _serve(createApp(), async (base) => { const r = await fetch(base + '/nope'); eq(r.status, 404); eq(await r.json(), { error: 'not found' }); }));
test('POST /health is not the health check', () => _serve(createApp(), async (base) => { eq((await fetch(base + '/health', { method: 'POST' })).status, 404); }));`,
      hints: ['`req.method` and `req.url` tell you what was asked for.', '`res.writeHead(status, headers)` then `res.end(body)`. If you never call `end`, the request hangs.'],
    },
    {
      id: 'http-echo', title: 'Read a request body', tier: 3,
      prompt: "Write `createApp()` returning an `http.Server` that handles `POST /echo`:\n\n- read the request body (it arrives in chunks) and parse it as JSON\n- respond `200` with JSON `{ \"received\": <the parsed body> }`\n- if the body is not valid JSON, respond `400` with `{ \"error\": \"invalid json\" }`\n\nEvery other request gets `404` with `{ \"error\": \"not found\" }`.",
      starter: `const http = require('node:http');\n\nfunction createApp() {\n  return http.createServer(async (req, res) => {\n    \n  });\n}\n`,
      solution: `const http = require('node:http');\n\nfunction createApp() {\n  return http.createServer(async (req, res) => {\n    const send = (status, body) => {\n      res.writeHead(status, { 'Content-Type': 'application/json' });\n      res.end(JSON.stringify(body));\n    };\n    if (req.method !== 'POST' || req.url !== '/echo') return send(404, { error: 'not found' });\n    let raw = '';\n    for await (const chunk of req) raw += chunk;\n    try {\n      send(200, { received: JSON.parse(raw) });\n    } catch {\n      send(400, { error: 'invalid json' });\n    }\n  });\n}\n`,
      tests: T_HTTP + `const _post = (base, body) => fetch(base + '/echo', { method: 'POST', body });
test('echoes JSON back', () => _serve(createApp(), async (base) => { const r = await _post(base, JSON.stringify({ a: [1, 2] })); eq(r.status, 200); eq(await r.json(), { received: { a: [1, 2] } }); }));
test('handles a large body', () => _serve(createApp(), async (base) => { const big = { text: 'x'.repeat(300000) }; const r = await _post(base, JSON.stringify(big)); eq((await r.json()).received.text.length, 300000); }));
test('bad JSON is a 400', () => _serve(createApp(), async (base) => { const r = await _post(base, '{nope'); eq(r.status, 400); eq(await r.json(), { error: 'invalid json' }); }));
test('other routes are 404', () => _serve(createApp(), async (base) => { eq((await fetch(base + '/echo')).status, 404); }));`,
      hints: ['The request object is a readable stream: `for await (const chunk of req)`.', 'A body can arrive in many chunks — collect them all before parsing.', '`JSON.parse` throws on bad input; catch it and answer 400 instead of crashing the server.'],
    },
    {
      id: 'json-store', title: 'Boss: a crash-safe JSON store', tier: 3,
      prompt: "Write `class JsonStore` taking a file path.\n\n- `async get(key)` — the stored value, or `undefined`\n- `async set(key, value)` — stores it and saves to disk\n- data must survive: a **new** `JsonStore` on the same file sees earlier writes\n- a missing file means an empty store\n- saves must be **atomic**: write the JSON to `<file>.tmp`, then `rename` it over the real file, so a crash mid-write can never leave a half-written store",
      starter: `const fs = require('node:fs/promises');\n\nclass JsonStore {\n  constructor(file) {\n    this.file = file;\n  }\n}\n`,
      solution: `const fs = require('node:fs/promises');\n\nclass JsonStore {\n  constructor(file) {\n    this.file = file;\n  }\n  async #load() {\n    try {\n      return JSON.parse(await fs.readFile(this.file, 'utf8'));\n    } catch (e) {\n      if (e.code === 'ENOENT') return {};\n      throw e;\n    }\n  }\n  async get(key) {\n    return (await this.#load())[key];\n  }\n  async set(key, value) {\n    const data = await this.#load();\n    data[key] = value;\n    const tmp = this.file + '.tmp';\n    await fs.writeFile(tmp, JSON.stringify(data, null, 2));\n    await fs.rename(tmp, this.file);\n  }\n}\n`,
      tests: T_PRE + `test('set then get', async () => { const s = new JsonStore(_path.join(TMP, 'a.json')); await s.set('theme', 'dark'); eq(await s.get('theme'), 'dark'); });
test('missing key is undefined', async () => eq(await new JsonStore(_path.join(TMP, 'b.json')).get('x'), undefined));
test('survives a restart', async () => { const f = _path.join(TMP, 'c.json'); await new JsonStore(f).set('n', { deep: [1, 2] }); eq(await new JsonStore(f).get('n'), { deep: [1, 2] }); });
test('keeps earlier keys', async () => { const f = _path.join(TMP, 'd.json'); const s = new JsonStore(f); await s.set('a', 1); await s.set('b', 2); eq(JSON.parse(_fs.readFileSync(f, 'utf8')), { a: 1, b: 2 }); });
test('leaves no .tmp file behind', async () => { const f = _path.join(TMP, 'e.json'); await new JsonStore(f).set('a', 1); eq(_fs.existsSync(f + '.tmp'), false); });
test('writes via rename', () => ok(/rename/.test(JsonStore.toString()), 'write to a temp file, then rename over the real one'));`,
      hints: ['Loading: read + parse, treating `ENOENT` as `{}`.', 'Saving: `writeFile(file + ".tmp", ...)` then `rename(tmp, file)`.', 'A rename within one folder is a single filesystem operation: readers see the old file or the new one, never half of each.'],
    },
    {
      id: 'append-line', title: 'Append to a log', tier: 1,
      prompt: "Write `async appendLine(file, line)` that adds `line` plus a newline to the **end** of a file, creating the file if it does not exist. Existing content must be kept.",
      starter: `const fs = require('node:fs/promises');\n\nasync function appendLine(file, line) {\n  \n}\n`,
      solution: `const fs = require('node:fs/promises');\n\nasync function appendLine(file, line) {\n  await fs.appendFile(file, line + '\\n');\n}\n`,
      tests: T_PRE + `test('creates the file', async () => { const f = _path.join(TMP, 'new.log'); await appendLine(f, 'first'); eq(_fs.readFileSync(f, 'utf8'), 'first\\n'); });
test('keeps what was there', async () => { const f = _w('old.log', 'a\\n'); await appendLine(f, 'b'); await appendLine(f, 'c'); eq(_fs.readFileSync(f, 'utf8'), 'a\\nb\\nc\\n'); });`,
      hints: ['`fs.writeFile` replaces the whole file. `fs.appendFile` adds to the end.'],
    },
    {
      id: 'copy-file', title: 'Copy a file', tier: 1,
      prompt: "Write `async copyInto(src, destDir)` that copies the file `src` into the folder `destDir` (keeping its file name), creating the folder if needed. Return the full path of the new copy.",
      starter: `const fs = require('node:fs/promises');\nconst path = require('node:path');\n\nasync function copyInto(src, destDir) {\n  \n}\n`,
      solution: `const fs = require('node:fs/promises');\nconst path = require('node:path');\n\nasync function copyInto(src, destDir) {\n  await fs.mkdir(destDir, { recursive: true });\n  const dest = path.join(destDir, path.basename(src));\n  await fs.copyFile(src, dest);\n  return dest;\n}\n`,
      tests: T_PRE + `test('copies and returns the new path', async () => { const src = _w('report.txt', 'numbers'); const out = await copyInto(src, _path.join(TMP, 'backup', 'today')); eq(out, _path.join(TMP, 'backup', 'today', 'report.txt')); eq(_fs.readFileSync(out, 'utf8'), 'numbers'); });
test('leaves the original', async () => { const src = _w('keep.txt', 'x'); await copyInto(src, _path.join(TMP, 'b2')); eq(_fs.existsSync(src), true); });`,
      hints: ['`path.basename(src)` is the file name without its folder.', '`fs.copyFile(src, dest)` does the copy; make the folder first.'],
    },
    {
      id: 'dir-size', title: 'Size of a folder', tier: 2,
      prompt: "Write `async dirSize(dir)` returning the total size in bytes of every file under `dir`, at any depth.",
      starter: `const fs = require('node:fs/promises');\nconst path = require('node:path');\n\nasync function dirSize(dir) {\n  \n}\n`,
      solution: `const fs = require('node:fs/promises');\nconst path = require('node:path');\n\nasync function dirSize(dir) {\n  let total = 0;\n  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {\n    const full = path.join(dir, entry.name);\n    if (entry.isDirectory()) total += await dirSize(full);\n    else total += (await fs.stat(full)).size;\n  }\n  return total;\n}\n`,
      tests: T_PRE + `test('adds up nested files', async () => { _w('s/a.bin', 'x'.repeat(100)); _w('s/sub/b.bin', 'x'.repeat(250)); _w('s/sub/deep/c.bin', 'x'.repeat(7)); eq(await dirSize(_path.join(TMP, 's')), 357); });
test('empty folder is 0', async () => { _fs.mkdirSync(_path.join(TMP, 'void')); eq(await dirSize(_path.join(TMP, 'void')), 0); });`,
      hints: ['`fs.stat(path)` resolves with an object whose `.size` is the byte count.', 'Recurse into directories and add what they return.'],
    },
    {
      id: 'tail', title: 'The last lines', tier: 2,
      prompt: "Write `async tail(file, n)` returning the last `n` lines of a text file as an array of strings. A trailing newline at the end of the file does not count as an extra empty line. Handle both `\\n` and Windows `\\r\\n` line endings.",
      starter: `const fs = require('node:fs/promises');\n\nasync function tail(file, n) {\n  \n}\n`,
      solution: `const fs = require('node:fs/promises');\n\nasync function tail(file, n) {\n  const text = await fs.readFile(file, 'utf8');\n  const lines = text.split(/\\r?\\n/);\n  if (lines[lines.length - 1] === '') lines.pop();\n  return n > 0 ? lines.slice(-n) : [];\n}\n`,
      tests: T_PRE + `test('last two lines', async () => eq(await tail(_w('t.log', 'a\\nb\\nc\\nd\\n'), 2), ['c', 'd']));
test('no trailing newline', async () => eq(await tail(_w('t2.log', 'a\\nb'), 1), ['b']));
test('asking for more than exist', async () => eq(await tail(_w('t3.log', 'only\\n'), 5), ['only']));
test('windows line endings', async () => eq(await tail(_w('t4.log', 'a\\r\\nb\\r\\n'), 2), ['a', 'b']));
test('zero lines', async () => eq(await tail(_w('t5.log', 'a\\nb\\n'), 0), []));`,
      hints: ['Split on the regex `/\\r?\\n/` to accept both line endings.', 'A file ending in a newline splits into a final empty string — drop it.', '`slice(-n)` takes the last n; beware that `slice(-0)` is the whole array.'],
    },
    {
      id: 'csv', title: 'Parse simple CSV', tier: 2,
      prompt: "Write `parseCsv(text)`. The first line holds column names; every later line is a row. Return an array of objects keyed by column name. Trim spaces around values, and skip blank lines. (No quoted fields — just commas.)",
      starter: `function parseCsv(text) {\n  \n}\n`,
      solution: `function parseCsv(text) {\n  const lines = text.split(/\\r?\\n/).filter((l) => l.trim() !== '');\n  if (lines.length === 0) return [];\n  const cells = (line) => line.split(',').map((c) => c.trim());\n  const header = cells(lines[0]);\n  return lines.slice(1).map((line) => {\n    const values = cells(line);\n    return Object.fromEntries(header.map((name, i) => [name, values[i] ?? '']));\n  });\n}\n`,
      tests: `test('rows become objects', () => eq(parseCsv('name,age\\nAda,36\\nLinus,29'), [{ name: 'Ada', age: '36' }, { name: 'Linus', age: '29' }]));
test('trims and skips blank lines', () => eq(parseCsv(' name , city \\n\\n Ada , Tulsa \\n\\n'), [{ name: 'Ada', city: 'Tulsa' }]));
test('short rows get empty strings', () => eq(parseCsv('a,b,c\\n1,2'), [{ a: '1', b: '2', c: '' }]));
test('header only', () => eq(parseCsv('a,b'), []));
test('empty text', () => eq(parseCsv(''), []));`,
      hints: ['Split into lines, drop the blank ones, peel off the header.', '`Object.fromEntries` turns `[[key, value], ...]` pairs into an object.'],
    },
    {
      id: 'hmac', title: 'Sign and verify', tier: 2,
      prompt: "Webhooks prove who sent them with an HMAC signature. Write:\n\n- `sign(payload, secret)` — the HMAC-SHA256 of the payload, as hex\n- `verify(payload, signature, secret)` — `true` only if the signature is correct. Compare with `crypto.timingSafeEqual`, and return `false` (do not throw) for a signature of the wrong length.",
      starter: `const crypto = require('node:crypto');\n\nfunction sign(payload, secret) {\n  \n}\n\nfunction verify(payload, signature, secret) {\n  \n}\n`,
      solution: `const crypto = require('node:crypto');\n\nfunction sign(payload, secret) {\n  return crypto.createHmac('sha256', secret).update(payload).digest('hex');\n}\n\nfunction verify(payload, signature, secret) {\n  const expected = Buffer.from(sign(payload, secret));\n  const given = Buffer.from(String(signature));\n  if (expected.length !== given.length) return false;\n  return crypto.timingSafeEqual(expected, given);\n}\n`,
      tests: `const _c = require('node:crypto');
const _good = _c.createHmac('sha256', 's3cret').update('{"id":1}').digest('hex');
test('signs', () => eq(sign('{"id":1}', 's3cret'), _good));
test('accepts a correct signature', () => eq(verify('{"id":1}', _good, 's3cret'), true));
test('rejects a tampered payload', () => eq(verify('{"id":2}', _good, 's3cret'), false));
test('rejects the wrong secret', () => eq(verify('{"id":1}', _good, 'guess'), false));
test('wrong length does not throw', () => eq(verify('{"id":1}', 'abc', 's3cret'), false));
test('uses a constant-time comparison', () => ok(/timingSafeEqual/.test(verify.toString()), 'compare with crypto.timingSafeEqual, not ==='));`,
      hints: ['`crypto.createHmac("sha256", secret).update(payload).digest("hex")`.', '`timingSafeEqual` needs two Buffers of the same length and throws otherwise — check the lengths first.', 'A plain `===` leaks, through timing, how many leading characters were right.'],
    },
    {
      id: 'wait-for-event', title: 'Await an event', tier: 2,
      prompt: "Write `waitFor(emitter, event, ms)` returning a Promise that resolves with the first argument of the next `event` emitted — or rejects with `new Error('timeout')` if none arrives within `ms` milliseconds. Either way, it must leave **no listener** attached afterwards.",
      starter: `function waitFor(emitter, event, ms) {\n  \n}\n`,
      solution: `function waitFor(emitter, event, ms) {\n  return new Promise((resolve, reject) => {\n    const onEvent = (value) => { clearTimeout(timer); resolve(value); };\n    const timer = setTimeout(() => { emitter.off(event, onEvent); reject(new Error('timeout')); }, ms);\n    emitter.once(event, onEvent);\n  });\n}\n`,
      tests: `const { EventEmitter: _EE } = require('node:events');
test('resolves with the payload', async () => { const e = new _EE(); setTimeout(() => e.emit('ready', { port: 80 }), 10); eq(await waitFor(e, 'ready', 200), { port: 80 }); });
test('times out', async () => { const e = new _EE(); eq((await rejects(waitFor(e, 'ready', 20))).message, 'timeout'); });
test('removes its listener after success', async () => { const e = new _EE(); setTimeout(() => e.emit('x', 1), 5); await waitFor(e, 'x', 200); eq(e.listenerCount('x'), 0); });
test('removes its listener after a timeout', async () => { const e = new _EE(); await rejects(waitFor(e, 'x', 10)); eq(e.listenerCount('x'), 0); });
test('ignores other events', async () => { const e = new _EE(); setTimeout(() => { e.emit('other', 1); e.emit('x', 2); }, 5); eq(await waitFor(e, 'x', 200), 2); });`,
      hints: ['`emitter.once(event, fn)` removes the listener by itself after the first call.', 'On timeout nothing has fired, so remove the listener yourself with `emitter.off`.', 'Clear the timer on success, or it keeps the process alive.'],
    },
    {
      id: 'gzip', title: 'Compress with a pipeline', tier: 2,
      prompt: "Write `async gzipFile(src, dest)` that writes a gzip-compressed copy of `src` to `dest`, by connecting three streams with `pipeline` from `node:stream/promises`: a read stream, `zlib.createGzip()`, and a write stream.",
      starter: `const fs = require('node:fs');\nconst zlib = require('node:zlib');\nconst { pipeline } = require('node:stream/promises');\n\nasync function gzipFile(src, dest) {\n  \n}\n`,
      solution: `const fs = require('node:fs');\nconst zlib = require('node:zlib');\nconst { pipeline } = require('node:stream/promises');\n\nasync function gzipFile(src, dest) {\n  await pipeline(fs.createReadStream(src), zlib.createGzip(), fs.createWriteStream(dest));\n}\n`,
      tests: T_PRE + `const _z = require('node:zlib');
test('round-trips', async () => { const src = _w('big.txt', 'log line\\n'.repeat(5000)); const dest = src + '.gz'; await gzipFile(src, dest); eq(_z.gunzipSync(_fs.readFileSync(dest)).toString(), 'log line\\n'.repeat(5000)); });
test('output is smaller', async () => { const src = _w('big2.txt', 'aaaa'.repeat(10000)); await gzipFile(src, src + '.gz'); ok(_fs.statSync(src + '.gz').size < 1000); });
test('a missing source rejects', async () => { await rejects(gzipFile(_path.join(TMP, 'ghost.txt'), _path.join(TMP, 'ghost.gz'))); });
test('uses streams', () => ok(/pipeline/.test(gzipFile.toString()) && !/readFile/.test(gzipFile.toString()), 'connect streams with pipeline'));`,
      hints: ['`await pipeline(source, transform, destination)` resolves when all the data has been written, and rejects if any stage fails.', 'Chaining `.pipe()` by hand does not forward errors — `pipeline` does.'],
    },
    {
      id: 'http-router', title: 'Boss: a tiny REST API', tier: 3,
      prompt: "Write `createApp()` returning an `http.Server` backed by an in-memory list of users (start empty; ids count up from 1). All responses are JSON.\n\n- `GET /users` → `200`, the array\n- `GET /users/:id` → `200` with the user, or `404` `{ \"error\": \"not found\" }`\n- `POST /users` with JSON `{ \"name\": \"…\" }` → `201` with the new `{ id, name }`; a missing or blank name, or invalid JSON, → `400` `{ \"error\": \"name is required\" }`\n- `DELETE /users/:id` → `204` with no body, or the 404\n- anything else → `404` `{ \"error\": \"not found\" }`\n\nEach call to `createApp()` gets its own list.",
      starter: `const http = require('node:http');\n\nfunction createApp() {\n  const users = [];\n  return http.createServer(async (req, res) => {\n    \n  });\n}\n`,
      solution: `const http = require('node:http');\n\nfunction createApp() {\n  const users = [];\n  let nextId = 1;\n  return http.createServer(async (req, res) => {\n    const send = (status, body) => {\n      res.writeHead(status, { 'Content-Type': 'application/json' });\n      res.end(body === undefined ? undefined : JSON.stringify(body));\n    };\n    const notFound = () => send(404, { error: 'not found' });\n    const match = req.url.match(/^\\/users(?:\\/(\\d+))?$/);\n    if (!match) return notFound();\n    const id = match[1] === undefined ? null : Number(match[1]);\n\n    if (id === null && req.method === 'GET') return send(200, users);\n    if (id === null && req.method === 'POST') {\n      let raw = '';\n      for await (const chunk of req) raw += chunk;\n      let body = null;\n      try { body = JSON.parse(raw); } catch { /* handled below */ }\n      const name = body && typeof body.name === 'string' ? body.name.trim() : '';\n      if (!name) return send(400, { error: 'name is required' });\n      const user = { id: nextId++, name };\n      users.push(user);\n      return send(201, user);\n    }\n    if (id !== null) {\n      const index = users.findIndex((u) => u.id === id);\n      if (index === -1) return notFound();\n      if (req.method === 'GET') return send(200, users[index]);\n      if (req.method === 'DELETE') { users.splice(index, 1); return send(204); }\n    }\n    notFound();\n  });\n}\n`,
      tests: T_HTTP + `const _j = (base, path, method, body) => fetch(base + path, { method, body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body) });
test('starts empty', () => _serve(createApp(), async (b) => { const r = await _j(b, '/users'); eq(r.status, 200); eq(await r.json(), []); }));
test('create, then read back', () => _serve(createApp(), async (b) => { const r = await _j(b, '/users', 'POST', { name: ' Ada ' }); eq(r.status, 201); eq(await r.json(), { id: 1, name: 'Ada' }); await _j(b, '/users', 'POST', { name: 'Linus' }); eq(await (await _j(b, '/users/2')).json(), { id: 2, name: 'Linus' }); eq((await (await _j(b, '/users')).json()).length, 2); }));
test('validation', () => _serve(createApp(), async (b) => { for (const bad of [{}, { name: '   ' }, { name: 7 }, '{nope']) { const r = await _j(b, '/users', 'POST', bad); eq(r.status, 400); eq(await r.json(), { error: 'name is required' }); } }));
test('unknown user is 404', () => _serve(createApp(), async (b) => { const r = await _j(b, '/users/99'); eq(r.status, 404); eq(await r.json(), { error: 'not found' }); }));
test('delete', () => _serve(createApp(), async (b) => { await _j(b, '/users', 'POST', { name: 'Ada' }); const r = await _j(b, '/users/1', 'DELETE'); eq(r.status, 204); eq(await r.text(), ''); eq((await _j(b, '/users/1')).status, 404); eq((await _j(b, '/users/1', 'DELETE')).status, 404); }));
test('ids are never reused', () => _serve(createApp(), async (b) => { await _j(b, '/users', 'POST', { name: 'A' }); await _j(b, '/users/1', 'DELETE'); eq((await (await _j(b, '/users', 'POST', { name: 'B' })).json()).id, 2); }));
test('other paths are 404', () => _serve(createApp(), async (b) => { eq((await _j(b, '/')).status, 404); eq((await _j(b, '/users/abc')).status, 404); }));
test('apps do not share data', () => _serve(createApp(), async (b1) => { await _j(b1, '/users', 'POST', { name: 'A' }); await _serve(createApp(), async (b2) => eq(await (await _j(b2, '/users')).json(), [])); }));`,
      hints: ['Route on two things: `req.method` and `req.url`. A regex like `/^\\/users(?:\\/(\\d+))?$/` covers both `/users` and `/users/12`.', 'Keep a separate id counter — `users.length + 1` hands out a used id after a delete.', 'Write one `send(status, body)` helper so every branch sets the header and ends the response.'],
    },
  ],
  drills: [
    { q: 'What is the difference between `fs.readFileSync` and `fs.promises.readFile`?', choices: ['No difference', 'The sync version blocks the whole process until the read finishes', 'The promise version is slower', 'The sync version only reads text'], answer: 1, why: 'Node runs your JavaScript on one thread. A sync call freezes every other request until it returns — fine in a startup script, harmful in a server.' },
    { q: 'In a CommonJS file, what is `__dirname`?', choices: ['The folder the process was started from', 'The folder containing the current file', 'The user home folder', 'The node_modules folder'], answer: 1, why: '`process.cwd()` is where the process was launched; `__dirname` is where this file lives. Build paths to bundled files from `__dirname`.' },
    { q: 'Which line exports a function from a CommonJS module?', choices: ['export default fn', 'module.exports = fn', 'exports = fn', 'return fn'], answer: 1, why: '`exports = fn` only rebinds a local variable. `module.exports` is the object `require()` actually returns.' },
    { q: 'What does `process.argv[2]` hold for `node app.js build`?', choices: ['"node"', '"app.js"', '"build"', 'undefined'], answer: 2, why: 'Index 0 is the node binary, 1 is the script path. Your own arguments start at 2 — hence `process.argv.slice(2)`.' },
    { q: 'What exit code means success?', choices: ['1', '0', '-1', '200'], answer: 1, why: 'Zero is success; anything else is failure. Scripts and CI check it, so `process.exit(1)` on errors matters.' },
    { q: 'Why use `path.join(a, b)` instead of `a + "/" + b`?', choices: ['It is faster', 'It uses the right separator per OS and normalises `..` and double slashes', 'It checks the file exists', 'It makes the path absolute'], answer: 1, why: 'Windows uses backslashes. `path.join` also tidies redundant segments. It does not touch the disk or make the path absolute — that is `path.resolve`.' },
    { q: 'What happens to an unhandled promise rejection in modern Node?', choices: ['It is silently ignored', 'The process crashes with a non-zero exit code', 'It retries automatically', 'It becomes a warning only'], answer: 1, why: 'Since Node 15 the default is to throw, which ends the process. Always `await` inside try/catch or attach `.catch()`.' },
    { q: 'What is a stream good for?', choices: ['Making code synchronous', 'Processing data piece by piece without holding all of it in memory', 'Encrypting files', 'Running code on another thread'], answer: 1, why: 'A 10 GB log read with readFile needs 10 GB of RAM. A stream handles it in small chunks with flat memory use.' },
    { q: 'Which file lists exact installed versions for reproducible installs?', choices: ['package.json', 'package-lock.json', '.npmrc', 'node_modules/.bin'], answer: 1, why: 'package.json states ranges (`^1.2.0`). The lockfile pins the exact tree that was installed — commit it.' },
    { q: 'What does `npm install --save-dev` change?', choices: ['Installs globally', 'Records the package under devDependencies', 'Skips the lockfile', 'Installs only in production'], answer: 1, why: 'devDependencies are tools needed to build or test (TypeScript, Vite, test runners), not to run the shipped app.' },
    { q: 'Where does `require("./util")` look?', choices: ['In node_modules', 'Relative to the current file', 'Relative to process.cwd()', 'In the global npm folder'], answer: 1, why: 'A leading `./` or `../` means a file path relative to the requiring file. A bare name like `"express"` means node_modules.' },
    { q: 'Why does `spawn` beat `exec` for untrusted input?', choices: ['It is faster', 'Arguments are passed as an array, not through a shell, so they cannot inject commands', 'It returns a promise', 'It runs in a sandbox'], answer: 1, why: '`exec("ls " + userInput)` runs a shell; input like `; rm -rf ~` executes. `spawn("ls", [userInput])` passes one literal argument.' },
    { q: 'What does `"type": "module"` in package.json change?', choices: ['Enables TypeScript', 'Makes `.js` files ES modules: `import`/`export` instead of `require`', 'Turns on strict mode only', 'Bundles the project'], answer: 1, why: 'Without it, `.js` files are CommonJS. Either way, `.mjs` is always an ES module and `.cjs` is always CommonJS.' },
    { q: 'In which order do these print?', code: `setTimeout(() => console.log('timeout'), 0);\nsetImmediate(() => console.log('immediate'));\nprocess.nextTick(() => console.log('tick'));\nconsole.log('sync');`, choices: ['sync, timeout, immediate, tick', 'sync, tick, then timeout and immediate', 'tick, sync, timeout, immediate', 'timeout, immediate, tick, sync'], answer: 1, why: 'Synchronous code first, then the `nextTick` queue, and only then the event loop phases where timers and immediates run.' },
    { q: 'What does a Node error object\'s `code` of `ENOENT` mean?', choices: ['Permission denied', 'No such file or directory', 'File already exists', 'Connection refused'], answer: 1, why: 'Others worth knowing: `EACCES` (permission), `EEXIST` (already exists), `ECONNREFUSED` (nothing listening), `EADDRINUSE` (port taken).' },
    { q: 'What does `EADDRINUSE` tell you when starting a server?', choices: ['The address is invalid', 'Another process is already listening on that port', 'The firewall blocked it', 'DNS failed'], answer: 1, why: 'Usually a previous copy of your own server is still running. Stop it, or listen on a different port.' },
    { q: 'What is a `Buffer`?', choices: ['A string with a maximum length', 'A fixed-size chunk of raw bytes', 'A queue of promises', 'A cache for require()'], answer: 1, why: 'Files and sockets deliver bytes, not text. A Buffer holds them; `.toString("utf8")` decodes them into a string.' },
    { q: 'What does `npx` do?', choices: ['Installs a package globally', 'Runs a package\'s command without installing it globally', 'Updates npm', 'Publishes a package'], answer: 1, why: 'It runs the binary from local `node_modules/.bin`, or fetches it temporarily. `npx tsc`, `npx vite`.' },
    { q: 'What does `^1.4.2` allow in package.json?', choices: ['Only 1.4.2', 'Any 1.x.x at or above 1.4.2, but not 2.0.0', 'Any version at all', 'Only patch updates'], answer: 1, why: 'The caret permits minor and patch updates. `~1.4.2` permits patches only. The lockfile is what pins the exact version.' },
    { q: 'Why is `process.env.PORT || 3000` a common pattern?', choices: ['It validates the port', 'It reads the port from the environment and falls back to 3000', 'It opens two ports', 'It converts the port to a number'], answer: 1, why: 'Hosting platforms inject the port through the environment. The value is a string — convert it if you need arithmetic.' },
    { q: 'What happens if a stream writes faster than its destination can accept?', choices: ['Data is dropped', 'Data piles up in memory unless backpressure is respected', 'The stream reverses', 'Node throws immediately'], answer: 1, why: '`pipe` and `pipeline` handle backpressure for you by pausing the source. Calling `write()` in a tight loop does not.' },
    { q: 'What is the event loop?', choices: ['A thread pool for JavaScript', 'The mechanism that runs callbacks one at a time as I/O completes', 'A kind of for-loop', 'The garbage collector'], answer: 1, why: 'Your JavaScript runs on a single thread. Slow work (disk, network) happens elsewhere and its callback is queued for the loop.' },
    { q: 'How should a long-running server shut down on SIGTERM?', choices: ['Ignore it', 'Stop accepting connections, finish in-flight work, then exit', 'Call process.exit() immediately', 'Restart itself'], answer: 1, why: 'A graceful shutdown: `server.close()`, close database pools, then exit. Exiting instantly cuts off requests mid-response.' },
    { q: 'What does `require` do the second time you require the same file?', choices: ['Runs the file again', 'Returns the cached exports from the first time', 'Throws an error', 'Returns undefined'], answer: 1, why: 'Modules are evaluated once and cached. That makes a module a natural singleton — and means top-level code runs only once.' },
  ],
};
