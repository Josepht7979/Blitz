"use client";
import { useReducer, useRef, useState, useEffect } from "react";

type Q = { q: string; verse?: string; o: string[]; a: number; c: string; n: string; r?: string; ref?: string; generated?: boolean };
type Entry = { name: string; score: number };

const CATS: Record<string, { name: string; desc: string; time: number; color: string }> = {
  easy:     { name: "Easy",     desc: "Sunday-school favourites", time: 10, color: "#2dd4bf" },
  med:      { name: "Medium",   desc: "For the regular reader",   time: 8,  color: "#ffd166" },
  hard:     { name: "Hard",     desc: "Serious students only",    time: 7,  color: "#ff8c42" },
  edifying: { name: "Edifying", desc: "Grow, don't just guess",   time: 20, color: "#8ab4ff" },
};
const RANKS = [
  { min: 0, e: "💨", n: "A Spark" }, { min: 1500, e: "🪵", n: "Kindling" },
  { min: 4000, e: "🔥", n: "Steady Flame" }, { min: 8000, e: "🔥🔥", n: "Blaze" },
  { min: 15000, e: "🌋", n: "Wildfire" }, { min: 26000, e: "☄️", n: "Pillar of Fire" },
];

export default function Page() {
  const [screen, setScreen] = useState<"start" | "game" | "over" | "board">("start");
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState("");
  const [cat, setCat] = useState("med");
  const [, force] = useReducer((x) => x + 1, 0);

  // mutable game state (refs avoid stale closures in the timer)
  const G = useRef({
    score: 0, lives: 3, maxLives: 3, combo: 0, bestCombo: 0, answered: 0, correct: 0,
    cur: null as Q | null, locked: false, golden: false, chosen: -1,
    batch: [] as Q[], bi: 0, note: "", place: null as number | null,
  }).current;

  const [remaining, setRemaining] = useState(1);
  const deadline = useRef(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const mult = () => Math.min(8, 1 + Math.floor(G.combo / 3));
  const secs = () => CATS[cat].time;

  function stopTimer() { if (tick.current) { clearInterval(tick.current); tick.current = null; } }
  function startTimer() {
    deadline.current = performance.now() + secs() * 1000;
    stopTimer();
    tick.current = setInterval(() => {
      const ms = Math.max(0, deadline.current - performance.now());
      setRemaining(ms);
      if (ms <= 0) { stopTimer(); if (!G.locked) answer(-1); }
    }, 80);
  }
  useEffect(() => () => stopTimer(), []);

  async function loadBatch() {
    const r = await fetch(`/api/questions?category=${cat}&count=20`);
    const j = await r.json();
    G.batch = j.questions || []; G.bi = 0;
  }

  async function startRun() {
    G.score = 0; G.lives = 3; G.maxLives = 3; G.combo = 0; G.bestCombo = 0;
    G.answered = 0; G.correct = 0; G.locked = false; G.place = null;
    await loadBatch();
    setScreen("game");
    nextQuestion();
  }

  async function nextQuestion() {
    if (G.lives <= 0) return gameOver();
    if (G.bi >= G.batch.length) await loadBatch();
    G.cur = G.batch[G.bi++] || null;
    G.locked = false; G.chosen = -1; G.note = "";
    G.golden = cat !== "edifying" && G.combo > 0 && G.combo % 5 === 0;
    setRemaining(secs() * 1000);
    startTimer();
    force();
  }

  function answer(choice: number) {
    if (G.locked || !G.cur) return;
    G.locked = true; G.chosen = choice; stopTimer();
    G.answered++;
    const correct = choice === G.cur.a;
    if (correct) {
      G.correct++; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
      const frac = Math.max(0, remaining) / (secs() * 1000);
      let pts = Math.round(100 * mult() * (1 + frac));
      if (G.golden) { pts *= 2; if (G.lives < 5) { G.lives++; G.maxLives = Math.max(G.maxLives, G.lives); } }
      G.score += pts;
      const ref = G.cur.r ? ` <span class="ref">${G.cur.r}</span>` : "";
      G.note = `<b>Correct.</b> ${G.cur.n}${ref}`;
    } else {
      const lost = G.combo; G.combo = 0; G.lives = Math.max(0, G.lives - 1);
      const ref = G.cur.r ? ` <span class="ref">${G.cur.r}</span>` : "";
      const ls = lost >= 3 ? ` (lost a ×${lost} streak!)` : "";
      G.note = `<b>Answer:</b> ${G.cur.o[G.cur.a]} — ${G.cur.n}${ref}${ls}`;
    }
    force();
    const wait = correct ? (cat === "edifying" ? 1400 : 850) : 1600;
    setTimeout(() => { G.lives <= 0 ? gameOver() : nextQuestion(); }, wait);
  }

  async function gameOver() {
    stopTimer();
    setScreen("over"); force();
    if (G.score > 0) {
      try {
        const r = await fetch("/api/leaderboard", {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ name, score: G.score, category: cat }),
        });
        const j = await r.json();
        G.place = j.rank ?? null; force();
      } catch { /* offline: skip */ }
    }
  }

  function tryStart() {
    const t = name.trim();
    if (t.length < 2) { setNameErr("Enter a name (2+ characters)."); return; }
    setNameErr("");
    startRun();
  }

  /* ---------- leaderboard ---------- */
  const [lbCat, setLbCat] = useState("med");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [adminSecret, setAdminSecret] = useState("");
  const [adminOn, setAdminOn] = useState(false);

  async function openBoard(c: string) {
    setLbCat(c); setScreen("board");
    const r = await fetch(`/api/leaderboard?category=${c}&limit=20`);
    const j = await r.json(); setEntries(j.entries || []);
  }
  async function delName(n: string) {
    await fetch("/api/admin/delete", {
      method: "POST",
      headers: { "content-type": "application/json", "x-admin-secret": adminSecret },
      body: JSON.stringify({ name: n, category: lbCat }),
    });
    openBoard(lbCat);
  }

  /* keyboard 1–4 */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (screen === "game" && ["1", "2", "3", "4"].includes(e.key)) answer(+e.key - 1);
      if ((screen === "start") && e.key === "Enter") tryStart();
      if (screen === "over" && e.key === "Enter") startRun();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  /* ---------- render ---------- */
  if (screen === "start") return (
    <div className="app">
      <div className="flame-logo">🔥</div>
      <h1 className="brand">Scripture Blitz</h1>
      <p className="tag">How well — and how fast — do you know the Word?</p>
      <div className="field">
        <label htmlFor="nm">Your name (shown on the leaderboard)</label>
        <input id="nm" className="nameInput" maxLength={16} value={name}
          onChange={(e) => { setName(e.target.value); setNameErr(""); }} placeholder="e.g. Joe T" />
      </div>
      <div className="err">{nameErr}</div>
      <div className="cats">
        {Object.entries(CATS).map(([k, c]) => (
          <button key={k} className={"cat" + (k === cat ? " sel" : "")} style={{ ["--accent" as any]: c.color }} onClick={() => setCat(k)}>
            <span className="dot" /><span className="ct"><b>{c.name}</b><span>{c.desc}</span></span><span className="time">{c.time}s</span>
          </button>
        ))}
      </div>
      <button className="btn" onClick={tryStart}>Start the run</button>
      <button className="btn ghost" onClick={() => openBoard(cat)}>🏆 Leaderboards</button>
      <p className="footnote">Medium &amp; Hard mix in freshly generated questions, so the pool never runs dry.</p>
    </div>
  );

  if (screen === "game" && G.cur) {
    const c = G.cur, frac = Math.max(0, remaining) / (secs() * 1000);
    return (
      <div className="app">
        <div className="hud">
          <div className="lives">{"❤".repeat(G.lives)}{"🖤".repeat(Math.max(0, G.maxLives - G.lives))}</div>
          <div className="score-wrap"><div className="score-label">Score</div><div className="score">{G.score.toLocaleString()}</div></div>
        </div>
        <div className="combo-bar">
          <div className="flame" style={{ transform: `scale(${G.combo > 0 ? 0.8 + Math.min(1.4, G.combo * 0.12) : 0.6})`, filter: G.combo > 0 ? "none" : "grayscale(1) opacity(.4)" }}>🔥</div>
          <div className="combo-info"><div className="mult">×{mult()}</div><div className="streak">{G.combo === 0 ? "No streak yet" : `${G.combo} in a row`}</div></div>
          <div className="center"><div className="tnum">{Math.ceil(frac * secs())}</div></div>
        </div>
        <div className="tbar"><div style={{ width: `${frac * 100}%` }} /></div>
        <div className="q-card">
          <div className="q-meta">
            <span className="chip">{c.c}</span>
            {c.generated && <span className="chip gen">✦ Generated</span>}
            {G.golden && <span className="chip gold">✦ Golden Verse · 2×</span>}
          </div>
          <div className="question">{c.q}{c.verse && <span className="verse">{c.verse}</span>}</div>
          <div className="opts">
            {c.o.map((t, i) => {
              let cls = "opt";
              if (G.locked) { if (i === c.a) cls += " correct"; else if (i === G.chosen) cls += " wrong"; else cls += " dim"; }
              return <button key={i} className={cls} onClick={() => answer(i)}><span className="key">{i + 1}</span><span>{t}</span></button>;
            })}
          </div>
          <div className="note" dangerouslySetInnerHTML={{ __html: G.note || "&nbsp;" }} />
        </div>
        <button className="btn ghost" onClick={() => { stopTimer(); gameOver(); }}>End run ✕</button>
      </div>
    );
  }

  if (screen === "over") {
    const rank = [...RANKS].reverse().find((r) => G.score >= r.min) || RANKS[0];
    const acc = G.answered ? Math.round((G.correct / G.answered) * 100) : 0;
    return (
      <div className="app center" style={{ justifyContent: "center" }}>
        <div className="rank-emoji">{rank.e}</div>
        <div className="rank-name">{rank.n}</div>
        <div className="final">{G.score.toLocaleString()}</div>
        <div className="score-label">Final Score · {CATS[cat].name}</div>
        {G.place && <div className="lbplace">You're #{G.place} on the {CATS[cat].name} board</div>}
        <div className="stats">
          <div className="stat"><div className="v">×{G.bestCombo}</div><div className="l">Best Combo</div></div>
          <div className="stat"><div className="v">{acc}%</div><div className="l">Accuracy</div></div>
          <div className="stat"><div className="v">{G.correct}</div><div className="l">Correct</div></div>
        </div>
        <button className="btn" onClick={startRun}>Run it back</button>
        <button className="btn ghost" onClick={() => openBoard(cat)}>See where you rank 🏆</button>
        <button className="btn ghost" onClick={() => setScreen("start")}>Home</button>
      </div>
    );
  }

  // board
  return (
    <div className="app">
      <div className="hud"><h1 className="brand" style={{ fontSize: "1.4rem" }}>🏆 Leaderboards</h1>
        <button className="btn ghost" style={{ width: "auto", padding: "8px 14px" }} onClick={() => setScreen("start")}>Home</button></div>
      <div className="tabs">
        {Object.entries(CATS).map(([k, c]) => (
          <button key={k} className={"tab" + (k === lbCat ? " sel" : "")} style={{ ["--accent" as any]: c.color }} onClick={() => openBoard(k)}>{c.name}</button>
        ))}
      </div>
      <div className="lb-list">
        {entries.length === 0 ? <div className="lb-empty">No scores yet — be the first.</div> :
          entries.map((e, i) => (
            <div key={i} className="lb-row">
              <span className="rk">{i + 1}</span><span className="nm">{e.name}</span><span className="sc">{e.score.toLocaleString()}</span>
              {adminOn && <button className="del" onClick={() => delName(e.name)}>🗑</button>}
            </div>
          ))}
      </div>
      <div className="row2">
        <input className="txt" type="password" placeholder="Admin code" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} />
        <button className="btn ghost" style={{ width: "auto", padding: "0 16px" }} onClick={() => setAdminOn((v) => !v)}>{adminOn ? "Lock" : "Unlock"}</button>
      </div>
      <p className="footnote">Admin code is your ADMIN_SECRET env var. Unlock to remove inappropriate names.</p>
    </div>
  );
}
