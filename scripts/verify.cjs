'use strict';
// npm test — runs every challenge through the real grader, twice:
//   1. the reference solution must PASS (the challenge is solvable)
//   2. the starter code must FAIL  (the challenge can't be passed untouched)
// Usage: node scripts/verify.cjs [trackId ...]
const tracks = require('../content/index.cjs');
const { grade, toolchains } = require('../engine/grade.cjs');

const only = process.argv.slice(2);
const TOOL = { bash: 'bash', ps: 'ps', rust: 'rust' };

(async () => {
  const tools = toolchains();
  const jobs = [];
  const problems = [];
  let drills = 0;
  for (const t of tracks) {
    if (only.length && !only.includes(t.id)) continue;
    const seen = new Set();
    for (const c of t.challenges) {
      if (seen.has(c.id)) problems.push(`${t.id}/${c.id}: duplicate id`);
      seen.add(c.id);
      for (const f of ['title', 'prompt', 'solution']) if (!c[f]) problems.push(`${t.id}/${c.id}: missing ${f}`);
      if (![1, 2, 3].includes(c.tier)) problems.push(`${t.id}/${c.id}: tier must be 1, 2 or 3`);
      if (!Array.isArray(c.hints) || !c.hints.length) problems.push(`${t.id}/${c.id}: needs at least one hint`);
      jobs.push({ t, c });
    }
    for (const [i, d] of (t.drills || []).entries()) {
      drills++;
      if (!d.q || !Array.isArray(d.choices) || d.choices.length < 2 || !(d.answer >= 0 && d.answer < d.choices.length) || !d.why) {
        problems.push(`${t.id} drill #${i + 1}: malformed`);
      }
      if (new Set(d.choices).size !== d.choices.length) problems.push(`${t.id} drill #${i + 1}: duplicate choices`);
    }
  }

  let done = 0, skipped = 0;
  const queue = [...jobs];
  async function worker() {
    for (;;) {
      const j = queue.shift();
      if (!j) return;
      const { t, c } = j;
      const need = TOOL[t.runner.kind];
      if (need && !tools[need]) { skipped++; continue; }
      const sol = await grade(t, c, c.solution);
      if (!sol.ok) {
        problems.push(`${t.id}/${c.id}: SOLUTION FAILS\n    ${sol.error || ''}\n` +
          sol.tests.filter((x) => !x.ok).map((x) => `    ✗ ${x.name}: ${x.msg}`).join('\n'));
      }
      const st = await grade(t, c, c.starter || '');
      if (st.ok) problems.push(`${t.id}/${c.id}: STARTER PASSES — the challenge needs no work`);
      done++;
      if (process.stdout.isTTY) process.stdout.write(`\r  ${done}/${jobs.length} challenges checked`);
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));

  console.log(`\n${done} challenges verified, ${skipped} skipped (toolchain missing), ${drills} drill questions checked.`);
  if (problems.length) {
    console.log(`\n${problems.length} problem(s):\n`);
    for (const p of problems) console.log('  ' + p + '\n');
    process.exit(1);
  }
  console.log('All good.');
})();
