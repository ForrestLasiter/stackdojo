'use strict';
// Loaded by electron/main.cjs only when DOJO_SMOKE=<output dir> is set. Drives
// the real window — navigate, type a solution, run it, play a drill — saves
// screenshots, and exits 0 only if every step held. It is the one check that
// catches a white screen or a grader that works in Node but not in Electron.
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

module.exports = function smoke(win, outDir) {
  fs.mkdirSync(outDir, { recursive: true });
  const log = [];
  const errors = [];
  const wc = win.webContents;
  wc.on('console-message', (e, level, message) => { if (level >= 3) errors.push(message); });
  wc.on('render-process-gone', () => errors.push('renderer crashed'));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const js = (code) => wc.executeJavaScript(`(async () => { ${code} })()`, true);
  const shot = async (name) => { await sleep(350); fs.writeFileSync(path.join(outDir, name + '.png'), (await wc.capturePage()).toPNG()); };
  async function waitFor(selector, timeout = 15000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) {
      if (await js(`return !!document.querySelector(${JSON.stringify(selector)})`)) return;
      await sleep(100);
    }
    throw new Error('timed out waiting for ' + selector);
  }
  const click = (selector, text) => js(`
    const els = [...document.querySelectorAll(${JSON.stringify(selector)})];
    const el = ${text ? `els.find((e) => e.textContent.includes(${JSON.stringify(text)}))` : 'els[0]'};
    if (!el) throw new Error('nothing to click: ${selector} ${text || ''}');
    el.click();`);
  const step = async (name, fn) => { await fn(); log.push('ok   ' + name); };

  async function main() {
    await step('dashboard renders', async () => { await waitFor('.shell'); await waitFor('.cards .card'); await shot('1-dashboard'); });

    await step('every track grades its first solution inside Electron', async () => {
      const bad = await js(`
        const tracks = await window.dojo.content();
        const bad = [];
        for (const t of tracks) {
          if (t.missingTool) continue;
          const c = t.challenges[0];
          const r = await window.dojo.run(t.id, c.id, c.solution);
          if (!r.ok) bad.push(t.id + ': ' + (r.error || JSON.stringify(r.tests.filter((x) => !x.ok))));
        }
        return bad;`);
      if (bad.length) throw new Error(bad.join('\n'));
    });

    await step('track page', async () => { await click('.nav-item.track', 'JavaScript'); await waitFor('.rows .row'); await shot('2-track'); });

    await step('solve a challenge through the editor', async () => {
      await click('.rows .row', 'Sum the array');
      await waitFor('.cm-content');
      await shot('3-challenge');
      await js(`
        const el = document.querySelector('.editor-wrap .cm-content');
        el.focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, 'function sum(nums) {\\n  return nums.reduce((a, b) => a + b, 0);\\n}\\n');`);
      await sleep(200);
      await click('.toolbar .btn.primary');
      await waitFor('.verdict', 30000);
      await sleep(400);
      await shot('4-solved');
      const state = await js(`return { pass: !!document.querySelector('.verdict.pass'), win: !!document.querySelector('.win'), text: document.querySelector('.results').innerText.slice(0, 300) }`);
      if (!state.pass || !state.win) throw new Error('expected a pass banner, got: ' + state.text);
    });

    await step('a wrong answer fails with a readable message', async () => {
      await js(`
        const el = document.querySelector('.editor-wrap .cm-content');
        el.focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, 'function sum(nums) {\\n  return 0;\\n}\\n');`);
      await sleep(200);
      await click('.toolbar .btn.primary');
      await waitFor('.verdict.fail', 30000);
      await shot('5-failed');
    });

    await step('SQL challenge shows a result table', async () => {
      await click('.nav-item.track', 'PostgreSQL');
      await waitFor('.rows .row');
      await click('.rows .row', 'Top three');
      await waitFor('.cm-content');
      await js(`
        const el = document.querySelector('.editor-wrap .cm-content');
        el.focus();
        document.execCommand('selectAll');
        document.execCommand('insertText', false, 'SELECT name, price FROM products ORDER BY price DESC LIMIT 3;');`);
      await sleep(200);
      await click('.toolbar .btn.primary');
      await waitFor('.verdict.pass', 30000);
      await waitFor('.results table');
      await shot('6-sql');
    });

    await step('drill round', async () => {
      await click('.nav-item', 'Quick-fire drills');
      await waitFor('.page-head .btn.primary');
      await shot('7-drills');
      await click('.page-head .btn.primary');
      await waitFor('.choice');
      await click('.choice');
      await waitFor('.explain');
      await shot('8-drill-answer');
    });

    await step('achievements', async () => { await click('.nav-item', 'Achievements'); await waitFor('.trophy'); await shot('9-achievements'); });

    await step('progress was saved and reloads', async () => {
      await sleep(700);
      const saved = await js('return window.dojo.load()');
      if (!saved || !saved.solved || !saved.solved['javascript/sum']) throw new Error('javascript/sum missing from the save file');
      await click('.nav-item', 'Dashboard');
      await waitFor('.stats');
      await shot('10-dashboard-after');
    });

    await step('no console errors', async () => { if (errors.length) throw new Error(errors.join('\n')); });
  }

  wc.once('did-finish-load', async () => {
    let code = 0;
    try { await main(); } catch (e) { code = 1; log.push('FAIL ' + (e && e.message)); try { await shot('failure'); } catch { /* ignore */ } }
    fs.writeFileSync(path.join(outDir, 'smoke.log'), log.join('\n') + '\n');
    app.exit(code);
  });
};
