// Everything about scoring lives here, as pure functions over one Progress
// object — so the rules can be read (and changed) in one place.

export interface Challenge { id: string; title: string; tier: 1 | 2 | 3; prompt: string; starter: string; hints: string[]; solution: string }
export interface Drill { q: string; code?: string; choices: string[]; answer: number; why: string }
export interface Track {
  id: string; name: string; short: string; blurb: string; lang: string; schemaNote: string; missingTool: string;
  challenges: Challenge[]; drills: Drill[];
}
export interface TestResult { name: string; ok: boolean; msg?: string }
export interface RunResult {
  ok: boolean; tests: TestResult[]; logs?: string; error?: string | null; ms?: number;
  table?: { fields?: string[]; rows?: unknown[][]; total?: number; json?: string } | null;
}

export interface SolveRec { stars: 1 | 2 | 3; xp: number; at: number; attempts: number; hints: number; peeked: boolean }
export interface DayRec { solved: number; tracks: string[]; stars3: number; tier2: number; drillBest: number }
export interface Progress {
  v: 1;
  xp: number;
  solved: Record<string, SolveRec>;
  attempts: Record<string, number>;
  hints: Record<string, number>;
  peeked: Record<string, boolean>;
  drafts: Record<string, string>;
  drill: { correct: Record<string, true>; best: Record<string, number>; perfect: number };
  streak: { count: number; best: number; last: string };
  days: Record<string, DayRec>;
  quests: { date: string; claimed: string[] };
  achievements: Record<string, number>;
  last?: { track: string; challenge: string };
}

export const emptyProgress = (): Progress => ({
  v: 1, xp: 0, solved: {}, attempts: {}, hints: {}, peeked: {}, drafts: {},
  drill: { correct: {}, best: {}, perfect: 0 },
  streak: { count: 0, best: 0, last: '' },
  days: {}, quests: { date: '', claimed: [] }, achievements: {},
});

/** Fill in anything an older or hand-edited save file is missing. */
export function hydrate(raw: unknown): Progress {
  const base = emptyProgress();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Progress>;
  return {
    ...base, ...r,
    drill: { ...base.drill, ...(r.drill || {}) },
    streak: { ...base.streak, ...(r.streak || {}) },
    quests: { ...base.quests, ...(r.quests || {}) },
  };
}

export const key = (trackId: string, challengeId: string) => `${trackId}/${challengeId}`;

// ---------- dates ----------
export function dayString(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
const yesterday = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayString(d); };

/** The streak as it stands right now: a missed day shows as zero. */
export function liveStreak(p: Progress): number {
  return p.streak.last === dayString() || p.streak.last === yesterday() ? p.streak.count : 0;
}

// ---------- XP, levels, belts ----------
export const TIER_XP = [0, 20, 40, 80];
export const TIER_NAME = ['', 'Warm-up', 'Core', 'Advanced'];

/** Level n starts at 50·n·(n−1) XP: 0, 100, 300, 600, 1000 … */
export const levelStart = (level: number) => 50 * level * (level - 1);
export function levelOf(xp: number): number {
  let n = 1;
  while (levelStart(n + 1) <= xp) n++;
  return n;
}

export const BELTS = [
  { name: 'White', at: 0, color: '#f1f3f7' },
  { name: 'Yellow', at: 0.1, color: '#f7d046' },
  { name: 'Orange', at: 0.25, color: '#f59e42' },
  { name: 'Green', at: 0.4, color: '#4ade80' },
  { name: 'Blue', at: 0.55, color: '#60a5fa' },
  { name: 'Purple', at: 0.7, color: '#c4a7ff' },
  { name: 'Brown', at: 0.85, color: '#b98a5e' },
  { name: 'Black', at: 1, color: '#05070a' },
];
export function beltFor(fraction: number) {
  let b = BELTS[0];
  for (const belt of BELTS) if (fraction >= belt.at) b = belt;
  return b;
}
export function nextBelt(fraction: number) {
  return BELTS.find((b) => b.at > fraction) || null;
}

export function trackStats(p: Progress, t: Track) {
  let solved = 0, stars = 0;
  for (const c of t.challenges) {
    const s = p.solved[key(t.id, c.id)];
    if (s) { solved++; stars += s.stars; }
  }
  const fraction = t.challenges.length ? solved / t.challenges.length : 0;
  return { solved, total: t.challenges.length, stars, fraction, belt: beltFor(fraction) };
}

/** What a solve would be worth right now, given hints used and attempts so far. */
export function scoreFor(tier: number, hints: number, attempts: number, peeked: boolean) {
  const base = TIER_XP[tier];
  if (peeked) return { xp: Math.round(base * 0.25), stars: 1 as const };
  const clean = hints === 0 && attempts <= 1;
  const mult = clean ? 1.25 : Math.max(0.4, 1 - 0.2 * hints);
  const penalty = hints + (attempts > 1 ? 1 : 0) + (attempts > 4 ? 1 : 0);
  const stars = Math.max(1, 3 - Math.min(2, penalty)) as 1 | 2 | 3;
  return { xp: Math.round(base * mult), stars };
}

// ---------- daily quests ----------
export interface Quest { id: string; title: string; xp: number; progress: number; goal: number }
const today = (p: Progress): DayRec => p.days[dayString()] || { solved: 0, tracks: [], stars3: 0, tier2: 0, drillBest: 0 };

export function questsFor(p: Progress, tracks: Track[]): Quest[] {
  const d = today(p);
  const date = new Date();
  const dayNumber = Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86400000);
  // Track of the day: rotate through the tracks, skipping finished ones.
  const open = tracks.filter((t) => !t.missingTool && trackStats(p, t).solved < t.challenges.length);
  const pool = open.length ? open : tracks;
  const focus = pool[dayNumber % pool.length];
  const third: Quest[] = [
    { id: 'drill8', title: 'Score 8 or more in a drill round', xp: 40, progress: Math.min(d.drillBest, 8), goal: 8 },
    { id: 'stars3', title: 'Earn three stars on a challenge', xp: 40, progress: Math.min(d.stars3, 1), goal: 1 },
    { id: 'tier2', title: 'Solve a Core or Advanced challenge', xp: 50, progress: Math.min(d.tier2, 1), goal: 1 },
  ];
  return [
    { id: 'solve3', title: 'Solve 3 challenges', xp: 60, progress: Math.min(d.solved, 3), goal: 3 },
    { id: 'focus:' + focus.id, title: `Solve a ${focus.name} challenge`, xp: 40, progress: d.tracks.includes(focus.id) ? 1 : 0, goal: 1 },
    third[dayNumber % third.length],
  ];
}

// ---------- achievements ----------
export interface Achievement { id: string; name: string; desc: string; icon: string }
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', name: 'First Blood', desc: 'Solve your first challenge.', icon: '🥋' },
  { id: 'ten', name: 'Getting Warm', desc: 'Solve 10 challenges.', icon: '🔥' },
  { id: 'fifty', name: 'Half a Hundred', desc: 'Solve 50 challenges.', icon: '⚔️' },
  { id: 'hundred', name: 'Centurion', desc: 'Solve 100 challenges.', icon: '🛡️' },
  { id: 'twohundred', name: 'Relentless', desc: 'Solve 200 challenges.', icon: '🏔️' },
  { id: 'everything', name: 'Grandmaster', desc: 'Solve every challenge in the dojo.', icon: '👑' },
  { id: 'polyglot', name: 'Polyglot', desc: 'Solve at least one challenge in every track.', icon: '🗣️' },
  { id: 'fullstackday', name: 'Full-Stack Day', desc: 'Solve challenges in 4 different tracks in one day.', icon: '🥞' },
  { id: 'green', name: 'Green Belt', desc: 'Reach a green belt in any track.', icon: '🟢' },
  { id: 'black', name: 'Black Belt', desc: 'Solve every challenge in one track.', icon: '⬛' },
  { id: 'boss', name: 'Boss Slayer', desc: 'Solve an Advanced challenge.', icon: '🐉' },
  { id: 'bossrush', name: 'Boss Rush', desc: 'Solve 15 Advanced challenges.', icon: '💀' },
  { id: 'flawless', name: 'Flawless', desc: 'Earn three stars on 10 challenges.', icon: '✨' },
  { id: 'ownfeet', name: 'Own Two Feet', desc: 'Solve 25 challenges without opening a hint.', icon: '🦶' },
  { id: 'stubborn', name: 'Stubborn', desc: 'Solve a challenge after 5 or more failed runs.', icon: '🪨' },
  { id: 'quick', name: 'Quick Draw', desc: 'Solve a challenge within 90 seconds of opening it.', icon: '⚡' },
  { id: 'streak3', name: 'Habit Forming', desc: 'Practice 3 days in a row.', icon: '📅' },
  { id: 'streak7', name: 'One Week Strong', desc: 'Practice 7 days in a row.', icon: '🗓️' },
  { id: 'streak30', name: 'Thirty Days', desc: 'Practice 30 days in a row.', icon: '🌙' },
  { id: 'drillperfect', name: 'Sharp', desc: 'Score 10 out of 10 in a drill round.', icon: '🎯' },
  { id: 'drill100', name: 'Flash Cards', desc: 'Answer 100 different drill questions correctly.', icon: '🃏' },
  { id: 'level5', name: 'Level 5', desc: 'Reach level 5.', icon: '⭐' },
  { id: 'level10', name: 'Level 10', desc: 'Reach level 10.', icon: '🌟' },
  { id: 'nightowl', name: 'Night Owl', desc: 'Solve a challenge between midnight and 5 am.', icon: '🦉' },
];

interface Ctx { tracks: Track[]; ms?: number; failedBefore?: number }
function earned(p: Progress, ctx: Ctx): string[] {
  const recs = Object.values(p.solved);
  const n = recs.length;
  const total = ctx.tracks.reduce((s, t) => s + t.challenges.length, 0);
  const stats = ctx.tracks.map((t) => trackStats(p, t));
  const tier3 = ctx.tracks.reduce((s, t) => s + t.challenges.filter((c) => c.tier === 3 && p.solved[key(t.id, c.id)]).length, 0);
  const d = today(p);
  const out: string[] = [];
  const add = (id: string, cond: boolean) => { if (cond) out.push(id); };
  add('first', n >= 1); add('ten', n >= 10); add('fifty', n >= 50); add('hundred', n >= 100); add('twohundred', n >= 200);
  add('everything', total > 0 && n >= total);
  add('polyglot', stats.length > 0 && stats.every((s) => s.solved > 0));
  add('fullstackday', d.tracks.length >= 4);
  add('green', stats.some((s) => s.fraction >= 0.4));
  add('black', stats.some((s) => s.total > 0 && s.solved === s.total));
  add('boss', tier3 >= 1); add('bossrush', tier3 >= 15);
  add('flawless', recs.filter((r) => r.stars === 3).length >= 10);
  add('ownfeet', recs.filter((r) => r.hints === 0 && !r.peeked).length >= 25);
  add('stubborn', (ctx.failedBefore || 0) >= 5);
  add('quick', ctx.ms !== undefined && ctx.ms <= 90000);
  add('streak3', p.streak.best >= 3); add('streak7', p.streak.best >= 7); add('streak30', p.streak.best >= 30);
  add('drillperfect', p.drill.perfect >= 1);
  add('drill100', Object.keys(p.drill.correct).length >= 100);
  add('level5', levelOf(p.xp) >= 5); add('level10', levelOf(p.xp) >= 10);
  return out;
}

// ---------- events ----------
export interface Notice { kind: 'xp' | 'achievement' | 'quest' | 'level' | 'belt'; title: string; detail?: string }

function touchDay(p: Progress): Progress {
  const t = dayString();
  if (p.streak.last === t) return p;
  const count = p.streak.last === yesterday() ? p.streak.count + 1 : 1;
  return { ...p, streak: { count, best: Math.max(p.streak.best, count), last: t } };
}

/** Award quests + achievements that the latest change unlocked. */
function settle(before: Progress, after: Progress, ctx: Ctx, notices: Notice[]): Progress {
  let p = after;
  const t = dayString();
  const claimed = p.quests.date === t ? [...p.quests.claimed] : [];
  for (const q of questsFor(p, ctx.tracks)) {
    if (q.progress >= q.goal && !claimed.includes(q.id)) {
      claimed.push(q.id);
      p = { ...p, xp: p.xp + q.xp };
      notices.push({ kind: 'quest', title: 'Daily quest complete', detail: `${q.title} · +${q.xp} XP` });
    }
  }
  p = { ...p, quests: { date: t, claimed } };
  const ach = { ...p.achievements };
  for (const id of earned(p, ctx)) {
    if (!ach[id]) {
      ach[id] = Date.now();
      const a = ACHIEVEMENTS.find((x) => x.id === id)!;
      notices.push({ kind: 'achievement', title: `Achievement: ${a.name}`, detail: a.desc });
    }
  }
  p = { ...p, achievements: ach };
  const l0 = levelOf(before.xp), l1 = levelOf(p.xp);
  if (l1 > l0) notices.push({ kind: 'level', title: `Level ${l1}!`, detail: 'Keep going.' });
  return p;
}

export function recordAttempt(p: Progress, k: string): Progress {
  return { ...p, attempts: { ...p.attempts, [k]: (p.attempts[k] || 0) + 1 } };
}

/** A challenge was passed. `p` must already include this attempt in `attempts`. */
export function recordSolve(p: Progress, tracks: Track[], track: Track, ch: Challenge, ms: number): { progress: Progress; notices: Notice[]; gained: number; stars: number; first: boolean } {
  const k = key(track.id, ch.id);
  const notices: Notice[] = [];
  const attempts = p.attempts[k] || 1;
  const hints = p.hints[k] || 0;
  const peeked = !!p.peeked[k];
  const score = scoreFor(ch.tier, hints, attempts, peeked);
  const prev = p.solved[k];
  if (prev) {
    // Re-solving earns nothing new; it can only improve the star count.
    const stars = Math.max(prev.stars, 1) as 1 | 2 | 3;
    return { progress: { ...p, solved: { ...p.solved, [k]: { ...prev, stars } } }, notices, gained: 0, stars, first: false };
  }
  const beltBefore = trackStats(p, track).belt;
  let next = touchDay(p);
  const t = dayString();
  const d = today(next);
  next = {
    ...next,
    xp: next.xp + score.xp,
    solved: { ...next.solved, [k]: { stars: score.stars, xp: score.xp, at: Date.now(), attempts, hints, peeked } },
    days: {
      ...next.days,
      [t]: {
        ...d, solved: d.solved + 1,
        tracks: d.tracks.includes(track.id) ? d.tracks : [...d.tracks, track.id],
        stars3: d.stars3 + (score.stars === 3 ? 1 : 0),
        tier2: d.tier2 + (ch.tier >= 2 ? 1 : 0),
      },
    },
  };
  const beltAfter = trackStats(next, track).belt;
  if (beltAfter.name !== beltBefore.name) notices.push({ kind: 'belt', title: `${beltAfter.name} belt in ${track.name}`, detail: 'New rank earned.' });
  const hour = new Date().getHours();
  next = settle(p, next, { tracks, ms, failedBefore: attempts - 1 }, notices);
  if (hour < 5 && !next.achievements.nightowl) {
    next = { ...next, achievements: { ...next.achievements, nightowl: Date.now() } };
    notices.push({ kind: 'achievement', title: 'Achievement: Night Owl', detail: 'Solve a challenge between midnight and 5 am.' });
  }
  return { progress: next, notices, gained: score.xp, stars: score.stars, first: true };
}

export function drillId(trackId: string, d: Drill) { return `${trackId}:${d.q}:${d.code || ''}`.slice(0, 160); }

/** One drill answer. First-ever correct answers pay 5 XP plus a combo bonus; repeats pay 1. */
export function recordDrillAnswer(p: Progress, id: string, correct: boolean, combo: number): { progress: Progress; gained: number } {
  if (!correct) return { progress: p, gained: 0 };
  const fresh = !p.drill.correct[id];
  const gained = fresh ? 5 + Math.min(combo, 5) : 1;
  return { progress: { ...p, xp: p.xp + gained, drill: { ...p.drill, correct: { ...p.drill.correct, [id]: true } } }, gained };
}

export function recordDrillRound(before: Progress, p: Progress, tracks: Track[], scope: string, score: number, outOf: number): { progress: Progress; notices: Notice[] } {
  const notices: Notice[] = [];
  let next = touchDay(p);
  const t = dayString();
  const d = today(next);
  // Quests and "best" are measured out of 10, so a short round scales up.
  const scaled = Math.round((score / outOf) * 10);
  next = {
    ...next,
    drill: { ...next.drill, best: { ...next.drill.best, [scope]: Math.max(next.drill.best[scope] || 0, scaled) }, perfect: next.drill.perfect + (score === outOf && outOf >= 10 ? 1 : 0) },
    days: { ...next.days, [t]: { ...d, drillBest: Math.max(d.drillBest, scaled) } },
  };
  next = settle(before, next, { tracks }, notices);
  return { progress: next, notices };
}
