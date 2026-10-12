import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from './Editor';
import { Prose, inline } from './md';
import {
  ACHIEVEMENTS, TIER_NAME, TIER_XP, dayString, drillId, emptyProgress, hydrate, key, levelOf, levelStart, liveStreak, nextBelt,
  questsFor, recordAttempt, recordDrillAnswer, recordDrillRound, recordSolve, scoreFor, trackStats,
  type Challenge, type Drill, type Notice, type Progress, type RunResult, type Track,
} from './game';

declare global {
  interface Window {
    dojo: {
      content(): Promise<Track[]>;
      run(trackId: string, challengeId: string, code: string): Promise<RunResult>;
      load(): Promise<unknown>;
      save(state: Progress): Promise<boolean>;
      update: {
        get(): Promise<UpdateState>;
        check(): Promise<UpdateState>;
        download(): Promise<UpdateState>;
        install(): Promise<boolean>;
        onStatus(callback: (state: UpdateState) => void): void;
      };
    };
  }
}

interface UpdateState {
  status: 'unsupported' | 'idle' | 'checking' | 'none' | 'available' | 'downloading' | 'ready' | 'error';
  current: string; version: string; percent: number; message: string;
}

type View =
  | { name: 'home' }
  | { name: 'track'; track: string }
  | { name: 'challenge'; track: string; challenge: string }
  | { name: 'drills' }
  | { name: 'drill'; scope: string; round?: number }
  | { name: 'achievements' };

interface Game {
  tracks: Track[];
  progress: Progress;
  /** Latest progress, for use inside async callbacks. */
  get(): Progress;
  commit(next: Progress): void;
  notify(notices: Notice[]): void;
  go(view: View): void;
}

// ---------- small shared pieces ----------
function Stars({ n }: { n: number }) {
  return (
    <span className="stars" role="img" aria-label={`${n} of 3 stars`}>
      {[1, 2, 3].map((i) => <span key={i} className={i <= n ? 'on' : 'off'} aria-hidden="true">{i <= n ? '★' : '☆'}</span>)}
    </span>
  );
}

function Belt({ name, color }: { name: string; color: string }) {
  return <span className="belt"><span className="belt-swatch" style={{ background: color }} aria-hidden="true" />{name} belt</span>;
}

function Bar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="bar" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.min(value, max)} aria-valuetext={`${value} of ${max}`}>
      <div className="bar-fill" style={{ width: pct + '%' }} />
    </div>
  );
}

const ICON: Record<Notice['kind'], string> = { xp: '✦', achievement: '🏆', quest: '📜', level: '⬆', belt: '🥋' };

// ---------- app shell ----------
export default function App() {
  const [tracks, setTracks] = useState<Track[] | null>(null);
  const [failed, setFailed] = useState('');
  const [progress, setProgress] = useState<Progress>(emptyProgress);
  const [view, setView] = useState<View>({ name: 'home' });
  const [toasts, setToasts] = useState<(Notice & { id: number })[]>([]);
  const latest = useRef(progress);
  const saveTimer = useRef<number | undefined>(undefined);
  const toastId = useRef(0);
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    Promise.all([window.dojo.content(), window.dojo.load()])
      .then(([t, saved]) => { const p = hydrate(saved); latest.current = p; setProgress(p); setTracks(t); })
      .catch((e) => setFailed(String(e)));
  }, []);

  const commit = useCallback((next: Progress) => {
    latest.current = next;
    setProgress(next);
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { window.dojo.save(latest.current).catch(() => {}); }, 400);
  }, []);

  const notify = useCallback((notices: Notice[]) => {
    if (!notices.length) return;
    const added = notices.map((n) => ({ ...n, id: ++toastId.current }));
    setToasts((t) => [...t, ...added].slice(-5));
    for (const a of added) window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== a.id)), 7000);
  }, []);

  const viewKey = JSON.stringify(view);
  // Move focus to the new page's heading so keyboard and screen-reader users
  // land on the content that just changed.
  useEffect(() => { main.current?.querySelector<HTMLElement>('h1')?.focus(); }, [viewKey, tracks]);

  if (failed) return <main className="center"><h1>StackDojo could not start</h1><p role="alert">{failed}</p></main>;
  if (!tracks) return <main className="center"><p role="status">Loading the dojo…</p></main>;

  const g: Game = { tracks, progress, get: () => latest.current, commit, notify, go: setView };
  const level = levelOf(progress.xp);
  const into = progress.xp - levelStart(level);
  const span = levelStart(level + 1) - levelStart(level);
  const streak = liveStreak(progress);
  const activeTrack = view.name === 'track' || view.name === 'challenge' ? view.track : '';

  let page;
  if (view.name === 'track') {
    const t = tracks.find((x) => x.id === view.track)!;
    page = <TrackView g={g} track={t} />;
  } else if (view.name === 'challenge') {
    const t = tracks.find((x) => x.id === view.track)!;
    const c = t.challenges.find((x) => x.id === view.challenge)!;
    page = <ChallengeView key={viewKey} g={g} track={t} ch={c} />;
  } else if (view.name === 'drills') page = <DrillHome g={g} />;
  else if (view.name === 'drill') page = <DrillRound key={viewKey} g={g} scope={view.scope} />;
  else if (view.name === 'achievements') page = <Achievements g={g} />;
  else page = <Home g={g} />;

  return (
    <div className="shell">
      <a className="skip-link" href="#main">Skip to content</a>
      <aside className="sidebar" aria-label="Dojo navigation">
        <div className="brand"><span className="brand-mark" aria-hidden="true">道</span>StackDojo</div>
        <div className="me">
          <div className="me-row"><strong>Level {level}</strong><span>{progress.xp.toLocaleString()} XP</span></div>
          <Bar value={into} max={span} label={`Progress to level ${level + 1}`} />
          <div className="me-row small"><span>{span - into} XP to level {level + 1}</span><span title="Days practised in a row"><span aria-hidden="true">🔥</span> {streak} day{streak === 1 ? '' : 's'}</span></div>
        </div>
        <nav aria-label="Main">
          <ul className="nav">
            <li><button className="nav-item" aria-current={view.name === 'home' ? 'page' : undefined} onClick={() => setView({ name: 'home' })}>Dashboard</button></li>
            <li><button className="nav-item" aria-current={view.name === 'drills' || view.name === 'drill' ? 'page' : undefined} onClick={() => setView({ name: 'drills' })}>Quick-fire drills</button></li>
            <li><button className="nav-item" aria-current={view.name === 'achievements' ? 'page' : undefined} onClick={() => setView({ name: 'achievements' })}>Achievements <span className="count">{Object.keys(progress.achievements).length}/{ACHIEVEMENTS.length}</span></button></li>
          </ul>
        </nav>
        <nav aria-label="Tracks">
          <h2 className="nav-title">Tracks</h2>
          <ul className="nav">
            {tracks.map((t) => {
              const s = trackStats(progress, t);
              return (
                <li key={t.id}>
                  <button className="nav-item track" aria-current={activeTrack === t.id ? 'page' : undefined} onClick={() => setView({ name: 'track', track: t.id })}>
                    <span className="chip" aria-hidden="true">{t.short}</span>
                    <span className="grow">{t.name}</span>
                    <span className="count" aria-label={`${s.solved} of ${s.total} solved, ${s.belt.name} belt`}>
                      <span className="belt-swatch" style={{ background: s.belt.color }} aria-hidden="true" />{s.solved}/{s.total}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <UpdatePanel notify={notify} />
      </aside>
      <main id="main" ref={main} tabIndex={-1}>{page}</main>
      <div className="toasts" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            <span className="toast-icon" aria-hidden="true">{ICON[t.kind]}</span>
            <div><strong>{t.title}</strong>{t.detail && <div className="small">{t.detail}</div>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------- updates ----------
function UpdatePanel({ notify }: { notify: (n: Notice[]) => void }) {
  const [u, setU] = useState<UpdateState | null>(null);
  const announced = useRef('');

  useEffect(() => {
    window.dojo.update.get().then(setU).catch(() => {});
    window.dojo.update.onStatus(setU);
  }, []);

  // Tell the user once when the check on launch finds something.
  useEffect(() => {
    if (u?.status === 'available' && announced.current !== u.version) {
      announced.current = u.version;
      notify([{ kind: 'level', title: `Update available: v${u.version}`, detail: 'Download it from the bottom of the sidebar.' }]);
    }
  }, [u, notify]);

  if (!u) return null;
  const text: Record<UpdateState['status'], string> = {
    unsupported: u.message,
    idle: '',
    checking: 'Checking for updates…',
    none: 'You have the latest version.',
    available: `Version ${u.version} is available.`,
    downloading: `Downloading v${u.version || ''}… ${u.percent}%`,
    ready: `Version ${u.version} is ready to install.`,
    error: u.message || 'The update check failed.',
  };

  return (
    <section className="updates" aria-label="App updates">
      <div className="me-row small"><span>StackDojo v{u.current}</span></div>
      {u.status === 'downloading' && <Bar value={u.percent} max={100} label="Update download" />}
      <p className={u.status === 'error' ? 'small update-msg warn' : 'small update-msg'} role="status">{text[u.status]}</p>
      {u.status === 'available' && <button className="btn primary small-btn wide" onClick={() => window.dojo.update.download()}>Download v{u.version}</button>}
      {u.status === 'ready' && <button className="btn primary small-btn wide" onClick={() => window.dojo.update.install()}>Restart to update</button>}
      {(u.status === 'idle' || u.status === 'none' || u.status === 'error' || u.status === 'checking') && (
        <button className="btn small-btn wide" disabled={u.status === 'checking'} onClick={() => window.dojo.update.check()}>Check for updates</button>
      )}
    </section>
  );
}

// ---------- dashboard ----------
function nextUnsolved(p: Progress, t: Track, after?: string): Challenge | undefined {
  const start = after ? t.challenges.findIndex((c) => c.id === after) + 1 : 0;
  const order = [...t.challenges.slice(start), ...t.challenges.slice(0, start)];
  return order.find((c) => !p.solved[key(t.id, c.id)]);
}

function Home({ g }: { g: Game }) {
  const { tracks, progress } = g;
  const total = tracks.reduce((s, t) => s + t.challenges.length, 0);
  const solved = Object.keys(progress.solved).length;
  const stars = Object.values(progress.solved).reduce((s, r) => s + r.stars, 0);
  const quests = questsFor(progress, tracks);
  const claimed = progress.quests.date === dayString() ? progress.quests.claimed : [];

  let resume: { track: Track; ch: Challenge } | undefined;
  const lastTrack = progress.last && tracks.find((t) => t.id === progress.last!.track);
  if (lastTrack) {
    const cur = lastTrack.challenges.find((c) => c.id === progress.last!.challenge);
    const ch = cur && !progress.solved[key(lastTrack.id, cur.id)] ? cur : nextUnsolved(progress, lastTrack, cur?.id);
    if (ch) resume = { track: lastTrack, ch };
  }
  if (!resume) {
    const t = tracks.find((x) => !x.missingTool && nextUnsolved(progress, x));
    if (t) resume = { track: t, ch: nextUnsolved(progress, t)! };
  }

  return (
    <div className="page">
      <header className="page-head">
        <h1 tabIndex={-1}>{solved === 0 ? 'Welcome to the dojo' : 'Back on the mat'}</h1>
        <p className="muted">{total} challenges and {tracks.reduce((s, t) => s + t.drills.length, 0)} quick-fire questions across {tracks.length} tracks. Every answer is run for real.</p>
      </header>

      <section className="stats" aria-label="Your numbers">
        <div className="stat"><span className="stat-n">{levelOf(progress.xp)}</span><span className="stat-l">Level</span></div>
        <div className="stat"><span className="stat-n">{solved}<small>/{total}</small></span><span className="stat-l">Solved</span></div>
        <div className="stat"><span className="stat-n">{stars}</span><span className="stat-l">Stars</span></div>
        <div className="stat"><span className="stat-n">{liveStreak(progress)}</span><span className="stat-l">Day streak (best {progress.streak.best})</span></div>
      </section>

      {resume && (
        <section className="resume" aria-label="Continue">
          <div>
            <div className="eyebrow">{progress.last ? 'Pick up where you left off' : 'Start here'}</div>
            <h2>{resume.ch.title}</h2>
            <p className="muted">{resume.track.name} · {TIER_NAME[resume.ch.tier]} · {TIER_XP[resume.ch.tier]} XP</p>
          </div>
          <button className="btn primary" onClick={() => g.go({ name: 'challenge', track: resume!.track.id, challenge: resume!.ch.id })}>{progress.last ? 'Continue' : 'Begin'}</button>
        </section>
      )}

      <section aria-labelledby="quests-h">
        <h2 id="quests-h">Daily quests</h2>
        <ul className="quests">
          {quests.map((q) => {
            const done = claimed.includes(q.id) || q.progress >= q.goal;
            return (
              <li key={q.id} className={done ? 'quest done' : 'quest'}>
                <div className="quest-top"><span>{done && <span aria-hidden="true">✓ </span>}{q.title}</span><span className="xp">+{q.xp} XP</span></div>
                <Bar value={q.progress} max={q.goal} label={q.title} />
                <div className="small muted">{done ? 'Complete' : `${q.progress} of ${q.goal}`}</div>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="tracks-h">
        <h2 id="tracks-h">Tracks</h2>
        <ul className="cards">
          {tracks.map((t) => {
            const s = trackStats(progress, t);
            return (
              <li key={t.id}>
                <button className="card" onClick={() => g.go({ name: 'track', track: t.id })}>
                  <span className="card-top"><span className="chip big" aria-hidden="true">{t.short}</span><span className="card-name">{t.name}</span></span>
                  <span className="card-blurb">{t.blurb}</span>
                  <Bar value={s.solved} max={s.total} label={`${t.name} progress`} />
                  <span className="card-foot"><Belt name={s.belt.name} color={s.belt.color} /><span>{s.solved}/{s.total}</span></span>
                  {t.missingTool && <span className="warn small">{t.missingTool}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

// ---------- one track ----------
function TrackView({ g, track }: { g: Game; track: Track }) {
  const { progress } = g;
  const s = trackStats(progress, track);
  const nb = nextBelt(s.fraction);
  const need = nb ? Math.ceil(nb.at * s.total) - s.solved : 0;
  const next = nextUnsolved(progress, track);
  return (
    <div className="page">
      <header className="page-head">
        <div className="eyebrow">Track</div>
        <h1 tabIndex={-1}>{track.name}</h1>
        <p className="muted">{track.blurb}</p>
        {track.missingTool && <p className="warn" role="alert">{track.missingTool} Challenges in this track cannot be graded until it is installed.</p>}
        <div className="track-meta">
          <Belt name={s.belt.name} color={s.belt.color} />
          <span>{s.solved} of {s.total} solved</span>
          <span>{s.stars} of {s.total * 3} stars</span>
          {nb && <span className="muted">{need} more for {nb.name.toLowerCase()} belt</span>}
        </div>
        <Bar value={s.solved} max={s.total} label={`${track.name} progress`} />
        <div className="actions">
          {next && <button className="btn primary" onClick={() => g.go({ name: 'challenge', track: track.id, challenge: next.id })}>{s.solved ? 'Next unsolved' : 'Start'}: {next.title}</button>}
          {track.drills.length > 0 && <button className="btn" onClick={() => g.go({ name: 'drill', scope: track.id })}>Quick-fire drill ({track.drills.length} questions)</button>}
        </div>
      </header>
      {[1, 2, 3].map((tier) => {
        const list = track.challenges.filter((c) => c.tier === tier);
        if (!list.length) return null;
        return (
          <section key={tier} aria-labelledby={`tier-${tier}`}>
            <h2 id={`tier-${tier}`}>{TIER_NAME[tier]} <span className="muted small">· {TIER_XP[tier]} XP each</span></h2>
            <ul className="rows">
              {list.map((c) => {
                const k = key(track.id, c.id);
                const rec = progress.solved[k];
                const started = !rec && (progress.attempts[k] || progress.drafts[k] !== undefined);
                return (
                  <li key={c.id}>
                    <button className={rec ? 'row solved' : 'row'} onClick={() => g.go({ name: 'challenge', track: track.id, challenge: c.id })}>
                      <span className="row-state" aria-hidden="true">{rec ? '✓' : started ? '…' : '○'}</span>
                      <span className="grow">{c.title}</span>
                      <span className="row-status">{rec ? <Stars n={rec.stars} /> : <span className="muted small">{started ? 'In progress' : 'Not started'}</span>}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

// ---------- one challenge ----------
function ResultPanel({ result, running }: { result: RunResult | null; running: boolean }) {
  if (running) return <p className="muted">Running your code…</p>;
  if (!result) return <p className="muted">Press <kbd>Ctrl</kbd> + <kbd>Enter</kbd> or the Run button to check your code.</p>;
  const passed = result.tests.filter((t) => t.ok).length;
  return (
    <div>
      <p className={result.ok ? 'verdict pass' : 'verdict fail'}>
        <span aria-hidden="true">{result.ok ? '✓' : '✗'}</span> {result.ok ? 'All checks passed' : result.tests.length ? `${passed} of ${result.tests.length} checks passed` : 'Could not run the checks'}
        {result.ms !== undefined && <span className="muted small"> · {(result.ms / 1000).toFixed(1)}s</span>}
      </p>
      {result.error && <pre className="out err">{result.error}</pre>}
      {result.tests.length > 0 && (
        <ul className="tests">
          {result.tests.map((t, i) => (
            <li key={i} className={t.ok ? 'test ok' : 'test bad'}>
              <span className="test-mark" aria-hidden="true">{t.ok ? '✓' : '✗'}</span>
              <div className="grow"><span className="sr-only">{t.ok ? 'Passed: ' : 'Failed: '}</span>{t.name}{t.msg && <pre className="out">{t.msg}</pre>}</div>
            </li>
          ))}
        </ul>
      )}
      {result.table?.fields && result.table.rows && (
        <div className="table-wrap">
          <table>
            <caption>Your result — {result.table.total} row{result.table.total === 1 ? '' : 's'}{(result.table.total || 0) > result.table.rows.length ? ` (first ${result.table.rows.length} shown)` : ''}</caption>
            <thead><tr>{result.table.fields.map((f, i) => <th key={i} scope="col">{f}</th>)}</tr></thead>
            <tbody>{result.table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c === null ? <em className="muted">NULL</em> : String(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
      {result.table?.json && (<><h3 className="out-title">Your result</h3><pre className="out">{result.table.json}</pre></>)}
      {result.logs && (<><h3 className="out-title">Output</h3><pre className="out">{result.logs}</pre></>)}
    </div>
  );
}

function ChallengeView({ g, track, ch }: { g: Game; track: Track; ch: Challenge }) {
  const k = key(track.id, ch.id);
  const { progress } = g;
  const code = useRef(progress.drafts[k] ?? ch.starter);
  const [editorKey, setEditorKey] = useState(0);
  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [win, setWin] = useState<{ gained: number; stars: number; first: boolean } | null>(null);
  const [confirmPeek, setConfirmPeek] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const busy = useRef(false);
  const opened = useRef(Date.now());
  const draftTimer = useRef<number | undefined>(undefined);

  const rec = progress.solved[k];
  const attempts = progress.attempts[k] || 0;
  const hintsShown = progress.hints[k] || 0;
  const peeked = !!progress.peeked[k];
  const worth = scoreFor(ch.tier, hintsShown, attempts + 1, peeked);

  useEffect(() => {
    const p = g.get();
    if (p.last?.track !== track.id || p.last?.challenge !== ch.id) g.commit({ ...p, last: { track: track.id, challenge: ch.id } });
    return () => window.clearTimeout(draftTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveDraft = (text: string) => {
    code.current = text;
    window.clearTimeout(draftTimer.current);
    draftTimer.current = window.setTimeout(() => {
      const p = g.get();
      g.commit({ ...p, drafts: { ...p.drafts, [k]: text } });
    }, 600);
  };

  const run = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setRunning(true);
    setWin(null);
    let res: RunResult;
    try { res = await window.dojo.run(track.id, ch.id, code.current); }
    catch (e) { res = { ok: false, tests: [], error: String(e) }; }
    const base = g.get();
    let p = recordAttempt({ ...base, drafts: { ...base.drafts, [k]: code.current } }, k);
    if (res.ok) {
      const r = recordSolve(p, g.tracks, track, ch, Date.now() - opened.current);
      p = r.progress;
      setWin({ gained: r.gained, stars: r.stars, first: r.first });
      g.notify(r.notices);
    }
    g.commit(p);
    setResult(res);
    setRunning(false);
    busy.current = false;
  }, [g, track, ch, k]);

  // Ctrl+Enter also works when focus is outside the editor.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !e.defaultPrevented) { e.preventDefault(); run(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [run]);

  const reset = () => { code.current = ch.starter; saveDraft(ch.starter); setEditorKey((n) => n + 1); setResult(null); setWin(null); };
  const revealHint = () => { const p = g.get(); g.commit({ ...p, hints: { ...p.hints, [k]: Math.min(ch.hints.length, (p.hints[k] || 0) + 1) } }); };
  const peek = () => {
    if (!rec && !confirmPeek) { setConfirmPeek(true); return; }
    if (!rec) { const p = g.get(); g.commit({ ...p, peeked: { ...p.peeked, [k]: true } }); }
    setShowSolution(true);
    setConfirmPeek(false);
  };

  const idx = track.challenges.findIndex((c) => c.id === ch.id);
  const upcoming = nextUnsolved(g.progress, track, ch.id);
  const canPeek = !!rec || attempts >= 3;

  return (
    <div className="challenge">
      <header className="ch-head">
        <button className="link" onClick={() => g.go({ name: 'track', track: track.id })}><span aria-hidden="true">← </span>{track.name}</button>
        <div className="ch-title">
          <h1 tabIndex={-1}>{ch.title}</h1>
          <span className={`tier tier-${ch.tier}`}>{TIER_NAME[ch.tier]}</span>
          {rec ? <span className="solved-tag"><span aria-hidden="true">✓</span> Solved <Stars n={rec.stars} /></span> : <span className="muted small">Worth {worth.xp} XP right now</span>}
        </div>
        <span className="muted small">{idx + 1} of {track.challenges.length}</span>
      </header>

      <div className="ch-body">
        <section className="ch-left" aria-label="Instructions">
          {track.missingTool && <p className="warn" role="alert">{track.missingTool}</p>}
          <Prose text={ch.prompt} />
          {track.schemaNote && <details className="schema" open><summary>Data you can query</summary><Prose text={track.schemaNote} /></details>}

          <h2>Hints</h2>
          {hintsShown === 0 && <p className="muted small">Stuck? Each hint nudges a little further. {!rec && 'Solving without hints is worth more XP.'}</p>}
          <ol className="hints">
            {ch.hints.slice(0, hintsShown).map((h, i) => <li key={i}>{inline(h)}</li>)}
          </ol>
          {hintsShown < ch.hints.length && (
            <button className="btn small-btn" onClick={revealHint}>Show hint {hintsShown + 1} of {ch.hints.length}{!rec && ' (−20% XP)'}</button>
          )}

          <h2>Solution</h2>
          {showSolution ? (
            <div className="solution"><Editor key="sol" value={ch.solution} lang={track.lang} label="Reference solution" readOnly /></div>
          ) : canPeek ? (
            <>
              <button className="btn small-btn" onClick={peek}>{confirmPeek ? 'Confirm — reveal it (XP drops to 25%)' : rec ? 'Compare with the reference solution' : 'Reveal the solution'}</button>
              {confirmPeek && <button className="btn small-btn" onClick={() => setConfirmPeek(false)}>Keep trying</button>}
            </>
          ) : (
            <p className="muted small">Locked until you have run your code 3 times ({Math.max(0, 3 - attempts)} to go) — give it a real attempt first.</p>
          )}
        </section>

        <section className="ch-right" aria-label="Your code">
          <div className="toolbar">
            <button className="btn primary" onClick={run} disabled={running || !!track.missingTool}>{running ? 'Running…' : 'Run'}<span className="kbd-hint" aria-hidden="true"> Ctrl+Enter</span></button>
            <button className="btn" onClick={reset} disabled={running}>Reset code</button>
            <span id="editor-keys" className="muted small grow right">Tab indents. Press Esc, then Tab, to leave the editor.</span>
          </div>
          <div className="editor-wrap"><Editor key={editorKey} value={code.current} lang={track.lang} label={`Code editor for ${ch.title}`} onChange={saveDraft} onRun={run} /></div>
          <div className="results" aria-live="polite" aria-busy={running}>
            {win && (
              <div className="win">
                <div>
                  <strong>{win.first ? 'Solved!' : 'Solved again.'}</strong> {win.first ? <>+{win.gained} XP <Stars n={win.stars} /></> : 'No extra XP for repeat solves.'}
                </div>
                {upcoming && upcoming.id !== ch.id
                  ? <button className="btn primary" onClick={() => g.go({ name: 'challenge', track: track.id, challenge: upcoming.id })}>Next: {upcoming.title}</button>
                  : <button className="btn primary" onClick={() => g.go({ name: 'track', track: track.id })}>Back to {track.name}</button>}
              </div>
            )}
            <ResultPanel result={result} running={running} />
          </div>
        </section>
      </div>
    </div>
  );
}

// ---------- drills ----------
function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

function DrillHome({ g }: { g: Game }) {
  const { tracks, progress } = g;
  const all = tracks.reduce((s, t) => s + t.drills.length, 0);
  const known = Object.keys(progress.drill.correct).length;
  return (
    <div className="page">
      <header className="page-head">
        <div className="eyebrow">Quick-fire</div>
        <h1 tabIndex={-1}>Drills</h1>
        <p className="muted">Ten rapid questions: predict the output, spot the trap, recall the rule. A streak of right answers builds a combo bonus. You have answered {known} of {all} correctly at least once.</p>
        <div className="actions"><button className="btn primary" onClick={() => g.go({ name: 'drill', scope: 'mixed' })}>Mixed round — all tracks</button></div>
      </header>
      <section aria-labelledby="drill-tracks">
        <h2 id="drill-tracks">Or pick a track</h2>
        <ul className="rows">
          {tracks.filter((t) => t.drills.length).map((t) => {
            const got = t.drills.filter((d) => progress.drill.correct[drillId(t.id, d)]).length;
            const best = progress.drill.best[t.id];
            return (
              <li key={t.id}>
                <button className="row" onClick={() => g.go({ name: 'drill', scope: t.id })}>
                  <span className="chip" aria-hidden="true">{t.short}</span>
                  <span className="grow">{t.name}</span>
                  <span className="muted small">{got}/{t.drills.length} known{best !== undefined ? ` · best ${best}/10` : ''}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

interface DrillItem { trackId: string; trackName: string; drill: Drill; order: number[] }

function DrillRound({ g, scope }: { g: Game; scope: string }) {
  const start = useRef(g.get());
  const items = useMemo<DrillItem[]>(() => {
    const pool = g.tracks.filter((t) => scope === 'mixed' || t.id === scope)
      .flatMap((t) => t.drills.map((drill) => ({ trackId: t.id, trackName: t.name, drill, order: shuffle(drill.choices.map((_, i) => i)) })));
    const p = start.current;
    // Questions you have not got right yet come first.
    const fresh = shuffle(pool.filter((x) => !p.drill.correct[drillId(x.trackId, x.drill)]));
    const seen = shuffle(pool.filter((x) => p.drill.correct[drillId(x.trackId, x.drill)]));
    return shuffle([...fresh, ...seen].slice(0, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [gained, setGained] = useState(0);
  const [done, setDone] = useState(false);
  const nextBtn = useRef<HTMLButtonElement>(null);
  const item = items[i];

  const answer = useCallback((choice: number) => {
    if (picked !== null || !item) return;
    const correct = choice === item.drill.answer;
    setPicked(choice);
    const r = recordDrillAnswer(g.get(), drillId(item.trackId, item.drill), correct, combo);
    g.commit(r.progress);
    setGained((x) => x + r.gained);
    setScore((s) => s + (correct ? 1 : 0));
    setCombo(correct ? combo + 1 : 0);
  }, [picked, item, combo, g]);

  const advance = useCallback(() => {
    if (i + 1 < items.length) { setI(i + 1); setPicked(null); return; }
    const r = recordDrillRound(start.current, g.get(), g.tracks, scope, score, items.length);
    g.commit(r.progress);
    g.notify(r.notices);
    setDone(true);
  }, [i, items.length, g, scope, score]);

  useEffect(() => { if (picked !== null) nextBtn.current?.focus(); }, [picked]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || !item || picked !== null) return;
      const n = Number(e.key);
      if (n >= 1 && n <= item.order.length) { e.preventDefault(); answer(item.order[n - 1]); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [answer, item, picked, done]);

  const title = scope === 'mixed' ? 'Mixed drill' : `${g.tracks.find((t) => t.id === scope)?.name} drill`;
  if (!items.length) return <div className="page"><h1 tabIndex={-1}>{title}</h1><p>No questions here yet.</p></div>;

  if (done) {
    return (
      <div className="page narrow">
        <header className="page-head">
          <div className="eyebrow">Round complete</div>
          <h1 tabIndex={-1}>{score} out of {items.length}</h1>
          <p className="muted">{score === items.length ? 'Flawless.' : score >= items.length * 0.8 ? 'Sharp work.' : score >= items.length * 0.5 ? 'Solid — the misses are what to review.' : 'That is what drills are for. Go again.'} You earned {gained} XP.</p>
          <div className="actions">
            <button className="btn primary" onClick={() => g.go({ name: 'drill', scope, round: Date.now() })}>Another round</button>
            <button className="btn" onClick={() => g.go({ name: 'drills' })}>All drills</button>
          </div>
        </header>
      </div>
    );
  }

  const correct = picked !== null && picked === item.drill.answer;
  return (
    <div className="page narrow">
      <header className="page-head">
        <div className="eyebrow">{title} · {item.trackName}</div>
        <h1 tabIndex={-1} className="sr-only">{title}, question {i + 1} of {items.length}</h1>
        <div className="drill-meta"><span>Question {i + 1} of {items.length}</span><span>Score {score}</span><span>{combo > 1 ? `Combo ×${combo}` : 'No combo yet'}</span></div>
        <Bar value={i + (picked !== null ? 1 : 0)} max={items.length} label="Round progress" />
      </header>
      <section className="drill" aria-live="polite">
        <h2 className="drill-q">{inline(item.drill.q)}</h2>
        {item.drill.code && <pre className="codeblock"><code>{item.drill.code}</code></pre>}
        <ol className="choices">
          {item.order.map((ci, n) => {
            const isAnswer = ci === item.drill.answer;
            const state = picked === null ? '' : isAnswer ? ' right' : ci === picked ? ' wrong' : ' dim';
            return (
              <li key={ci}>
                <button className={'choice' + state} disabled={picked !== null} onClick={() => answer(ci)}>
                  <span className="choice-n" aria-hidden="true">{n + 1}</span>
                  <span className="grow">{inline(item.drill.choices[ci])}</span>
                  {picked !== null && isAnswer && <span className="choice-tag"><span aria-hidden="true">✓ </span>Correct answer</span>}
                  {picked !== null && !isAnswer && ci === picked && <span className="choice-tag"><span aria-hidden="true">✗ </span>Your answer</span>}
                </button>
              </li>
            );
          })}
        </ol>
        {picked === null ? <p className="muted small">Press 1–{item.order.length} or click an answer.</p> : (
          <div className={correct ? 'explain good' : 'explain bad'}>
            <p><strong>{correct ? 'Correct.' : 'Not quite.'}</strong> {inline(item.drill.why)}</p>
            <button ref={nextBtn} className="btn primary" onClick={advance}>{i + 1 < items.length ? 'Next question' : 'Finish round'}</button>
          </div>
        )}
      </section>
    </div>
  );
}

// ---------- achievements ----------
function Achievements({ g }: { g: Game }) {
  const have = g.progress.achievements;
  const n = Object.keys(have).length;
  return (
    <div className="page">
      <header className="page-head">
        <div className="eyebrow">Trophy wall</div>
        <h1 tabIndex={-1}>Achievements</h1>
        <p className="muted">{n} of {ACHIEVEMENTS.length} unlocked.</p>
        <Bar value={n} max={ACHIEVEMENTS.length} label="Achievements unlocked" />
      </header>
      <ul className="trophies">
        {ACHIEVEMENTS.map((a) => {
          const at = have[a.id];
          return (
            <li key={a.id} className={at ? 'trophy got' : 'trophy'}>
              <span className="trophy-icon" aria-hidden="true">{at ? a.icon : '🔒'}</span>
              <div>
                <strong>{a.name}</strong>
                <div className="small">{a.desc}</div>
                <div className="small muted">{at ? `Unlocked ${new Date(at).toLocaleDateString()}` : 'Locked'}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
