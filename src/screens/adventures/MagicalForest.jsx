// MagicalForest.jsx — Number Garden adventure worlds for ages ~4: a world map, a Magical Forest,
// Under the Sea and a Sunny Savanna. 20 cartoon animals hide in each; tapping a marker opens a maths question, answering reveals the animal.
// Skills (all within 1–10): counting, before/after, ordering 1–10, adding.
// Usage: import MagicalForest from "./MagicalForest"; import "./MagicalForest.css";
// <MagicalForest onExit={goHome} /> — onExit, if given, adds a button on the world map back to the host app.
import React, { useState, useEffect, useRef } from "react";
import DinoRescue, { DinoSvg, DINO_IDS } from "./DinoRescue.jsx";
import NumberDriveAdventure from "./NumberDriveAdventure.jsx";

/* ---------------- helpers ---------------- */
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safeGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
function useAlive() { const r = useRef(true); useEffect(() => { r.current = true; return () => { r.current = false; }; }, []); return r; }

/* ---------------- sound + voice ---------------- */
let actx = null;
function tone(f, d = 0.18, delay = 0, type = "sine") {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime + delay;
    o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(actx.destination); o.start(t); o.stop(t + d + 0.05);
  } catch {}
}
const chime = (step = 0) => { tone(523 + step * 30); tone(784 + step * 30, 0.2, 0.08); };
const soft = () => tone(233, 0.28, 0, "triangle");
const sparkle = () => [659, 784, 988, 1319].forEach((f, i) => tone(f, 0.22, i * 0.09));

let promptListener = null, lastPrompt = "";
function say(text, { show = true, rate = 0.85 } = {}) {
  if (show) { lastPrompt = text; promptListener && promptListener(text); }
  try {
    const s = window.speechSynthesis; if (!s) return;
    s.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = rate; u.pitch = 1.15; s.speak(u);
  } catch {}
}
// For other screens (e.g. DinoRescue.jsx) that want to hook into the shared
// say()/🔊-repeat system: promptListener/lastPrompt are module-private
// mutable bindings, so an importing file can't assign into them directly —
// these two small functions are the only additive surface needed for that.
function subscribePrompt(setter) { promptListener = setter; return () => { promptListener = null; }; }
function getLastPrompt() { return lastPrompt; }

/* ---------------- content ---------------- */
const OBJECTS = [
  { e: "🍄", one: "mushroom", many: "mushrooms" },
  { e: "🍓", one: "berry", many: "berries" },
  { e: "🌸", one: "flower", many: "flowers" },
  { e: "🦋", one: "butterfly", many: "butterflies" },
  { e: "🐞", one: "ladybug", many: "ladybugs" },
  { e: "🍎", one: "apple", many: "apples" },
];
const SKILLS = ["count", "ba", "order", "add"];
const SKILL_NAMES = { count: "Counting", ba: "Before & after", order: "Order 1–10", add: "Adding" };
const PRAISE = ["Yes!", "You found it!", "Good looking!", "That's it!", "Lovely!"];
const pickPraise = () => PRAISE[rand(0, PRAISE.length - 1)];

/* ---------------- progress ---------------- */
const PKEY = "mf-progress-v1";
function defaultProgress() {
  const fl = +(safeGet("fl-level") || 0); // carry over Flower Line progress
  return { unlocked: fl >= 2 ? 2 : 1, hist: { count: [], ba: [], order: [], add: [] }, weak: {}, streak: {}, sessions: [], focus: "auto", foundBy: { forest: [], sea: [] }, dinos: [], driveLevel: 0, driveRounds: 0 };
}
function loadProgress() {
  try {
    const p = JSON.parse(safeGet(PKEY));
    if (p && p.hist) {
      const d = defaultProgress(), foundBy = { ...d.foundBy, ...(p.foundBy || {}) };
      if (Array.isArray(p.found)) foundBy.forest = p.found; // older single-world saves
      return { ...d, ...p, hist: { ...d.hist, ...p.hist }, foundBy };
    }
  } catch {}
  return defaultProgress();
}
const ratio = (h) => (h.length ? h.filter(Boolean).length / h.length : 0);
function mastered(p, s) { const h = p.hist[s].slice(-8); const need = s === "order" ? 3 : 6; return h.length >= need && ratio(h) >= (s === "order" ? 0.67 : 0.75); }
function nextUnlocked(p) {
  if (p.unlocked === 1 && mastered(p, "count") && mastered(p, "ba")) return 2;
  if (p.unlocked === 2 && mastered(p, "order")) return 3;
  return p.unlocked;
}
function pickNum(p, lo, hi) { // favour numbers she finds hard
  const bag = []; for (let n = lo; n <= hi; n++) { const w = 1 + Math.min(4, p.weak[n] || 0); for (let i = 0; i < w; i++) bag.push(n); }
  return bag[rand(0, bag.length - 1)];
}
function choicesFor(ans, lo = 1, hi = 10) { // near misses only
  const set = new Set([ans]);
  for (const x of shuffle([ans - 1, ans + 1, ans - 2, ans + 2])) { if (set.size >= 3) break; if (x >= lo && x <= hi) set.add(x); }
  return shuffle([...set]);
}
function planSession(p) {
  const f = p.focus;
  if (f && f !== "auto") return f === "order" ? ["order", "order"] : Array(6).fill(f);
  if (p.unlocked <= 1) return shuffle(["count", "count", "count", "ba", "ba", "ba"]);
  if (p.unlocked === 2) return [...shuffle(["count", "ba", "ba", "count"]), "order"];
  if (!mastered(p, "add")) return [...shuffle(["add", "add", "add", "ba", "count"]), "order"];
  return [...shuffle(["add", "add", "ba", "ba", "count"]), "order"]; // mixed review
}
function newSession(p) { const plan = planSession(p); return { plan, animals: shuffle(FOREST_ANIMALS).slice(0, plan.length), results: [] }; }
function makeChallenge(skill, p, objs = OBJECTS) {
  const obj = objs[rand(0, objs.length - 1)];
  if (skill === "count") { const n = pickNum(p, 1, 10); return { skill, n, obj, choices: choicesFor(n) }; }
  if (skill === "ba") {
    const dir = Math.random() < 0.5 ? "after" : "before";
    const n = dir === "after" ? pickNum(p, 1, 9) : pickNum(p, 2, 10);
    const ans = dir === "after" ? n + 1 : n - 1;
    return { skill, dir, n, ans, choices: choicesFor(ans) };
  }
  if (skill === "order") {
    let cards = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    while (cards[0] === 1) cards = shuffle(cards);
    return { skill, cards };
  }
  const easy = p.hist.add.length < 4;
  const a = rand(1, easy ? 3 : 6);
  const b = rand(1, Math.min(easy ? 2 : 4, (easy ? 5 : 10) - a));
  return { skill: "add", a, b, ans: a + b, obj, choices: choicesFor(a + b) };
}

/* ---------------- small UI pieces ---------------- */
function Dots({ n, lit = 0 }) {
  return (
    <span className="mf-dots" aria-hidden="true">
      {Array.from({ length: n }, (_, i) => <span key={i} className={`mf-dot${i >= 5 ? " b" : ""}${i < lit ? " lit" : ""}`} />)}
    </span>
  );
}
function Choices({ choices, answer, glow, onPick, disabled, label }) {
  const [wob, setWob] = useState(null);
  return (
    <div className="mf-choices" role="group" aria-label={label}>
      {choices.map((c) => (
        <button key={c} aria-label={`Number ${c}`} disabled={disabled}
          className={`mf-choice${glow && c === answer ? " glow" : ""}${wob === c ? " wobble" : ""}`}
          onClick={() => { if (!onPick(c)) { setWob(null); requestAnimationFrame(() => setWob(c)); } }}
          onAnimationEnd={(e) => { if (e.animationName === "mf-wobble") setWob(null); }}>
          {c}
        </button>
      ))}
    </div>
  );
}

/* ---------------- activity: counting ---------------- */
function CountActivity({ ch, onStep, onSolved, onMiss }) {
  const { n, obj, choices } = ch; const alive = useAlive();
  const [counted, setCounted] = useState([]);
  const [misses, setMisses] = useState(0), [maxHint, setMaxHint] = useState(0);
  const [pulse, setPulse] = useState(false), [lit, setLit] = useState(0), [busy, setBusy] = useState(false), [solved, setSolved] = useState(false);
  useEffect(() => { say(`How many ${obj.many}? Tap each one to count.`); }, []);

  const tapObj = (i) => {
    if (busy || solved || counted.includes(i)) return;
    const k = counted.length + 1; setCounted([...counted, i]); tone(392 + k * 40, 0.12); say(String(k), { show: false, rate: 0.95 });
  };
  async function demo() {
    setBusy(true); setCounted([]); setPulse(false);
    say("Let's count together."); await sleep(1100);
    for (let i = 1; i <= n; i++) { if (!alive.current) return; setLit(i); tone(392 + i * 40, 0.12); say(String(i), { show: false, rate: 0.95 }); await sleep(750); }
    if (!alive.current) return; say(`${n} ${n === 1 ? obj.one : obj.many}!`); setBusy(false);
  }
  function pick(c) {
    if (c === n) { setSolved(true); chime(); onStep(n, misses > 0); say(`${pickPraise()} ${n} ${n === 1 ? obj.one : obj.many}!`); onSolved({ misses, maxHint }); return true; }
    onMiss && onMiss(); const m = misses + 1; setMisses(m); setMaxHint((h) => Math.max(h, Math.min(m, 3))); soft();
    if (m === 1) { setCounted([]); setPulse(true); say(`Let's count again. Touch each ${obj.one} slowly.`); }
    else if (m === 2) demo();
    else say("Tap the glowing number.");
    return false;
  }
  return (
    <div className="mf-act">
      <div className="mf-field" aria-label={`${n} ${obj.many}`}>
        {Array.from({ length: n }, (_, i) => {
          const c = counted.indexOf(i);
          return (
            <button key={i} className={`mf-obj${c >= 0 || i < lit ? " on" : ""}${pulse && c < 0 ? " pulse" : ""}`} onClick={() => tapObj(i)} aria-label={`${obj.one} ${i + 1}`}>
              <span className="mf-obj-e">{obj.e}</span>
              {(c >= 0 || i < lit) && <span className="mf-badge">{c >= 0 ? c + 1 : i + 1}</span>}
            </button>
          );
        })}
      </div>
      <Choices label="How many?" choices={choices} answer={n} glow={misses >= 3} onPick={pick} disabled={busy || solved} />
    </div>
  );
}

/* ---------------- activity: before / after ---------------- */
function BAActivity({ ch, onStep, onSolved, onMiss, markerEmoji = "🐞" }) {
  const { dir, n, ans, choices } = ch; const alive = useAlive();
  const [misses, setMisses] = useState(0), [maxHint, setMaxHint] = useState(0);
  const [path, setPath] = useState(false), [lit, setLit] = useState(0), [busy, setBusy] = useState(false), [solved, setSolved] = useState(false);
  useEffect(() => { say(`What comes ${dir} ${n}?`); }, []);
  const stones = dir === "after" ? [n - 1 >= 1 ? n - 1 : null, n, "?"] : ["?", n, n + 1 <= 10 ? n + 1 : null];

  async function demo() {
    setBusy(true); setPath(true);
    const upto = dir === "after" ? n : ans - 1;
    say("Count with me."); await sleep(1000);
    for (let i = 1; i <= upto; i++) { if (!alive.current) return; setLit(i); tone(392 + i * 35, 0.12); say(String(i), { show: false, rate: 0.95 }); await sleep(650); }
    if (!alive.current) return;
    say(dir === "after" ? `${n}… and what comes next?` : upto === 0 ? `Which number comes first, before ${n}?` : `What comes next? It goes just before ${n}.`);
    setBusy(false);
  }
  function pick(c) {
    if (c === ans) { setSolved(true); chime(); onStep(ans, misses > 0); say(`${pickPraise()} ${ans} comes ${dir} ${n}!`); onSolved({ misses, maxHint }); return true; }
    onMiss && onMiss(); const m = misses + 1; setMisses(m); setMaxHint((h) => Math.max(h, Math.min(m, 3))); soft();
    if (m === 1) { setPath(true); say(dir === "after" ? `Look at the number path. Find ${n}. What comes next?` : `Look at the number path. Find ${n}. What comes just before it?`); }
    else if (m === 2) demo();
    else say("Tap the glowing number.");
    return false;
  }
  return (
    <div className="mf-act">
      <div className="mf-stones">
        {stones.map((s, i) => s === null ? <span key={i} className="mf-stone empty" /> : (
          <span key={i} className={`mf-stone${s === "?" ? " gap" : ""}${s === n ? " here" : ""}`}>
            {s === "?" ? (solved ? ans : "?") : s}
            {s === n && <span className="mf-bug" aria-hidden="true">{markerEmoji}</span>}
          </span>
        ))}
      </div>
      {path && (
        <div className="mf-path" aria-label="Number path 1 to 10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((k) => (
            <span key={k} className={`mf-tile${k === n ? " here" : ""}${k <= lit ? " lit" : ""}${k === ans ? " gap" : ""}`}>{k === ans && !solved ? "?" : k}</span>
          ))}
        </div>
      )}
      <Choices label={`What comes ${dir} ${n}?`} choices={choices} answer={ans} glow={misses >= 3} onPick={pick} disabled={busy || solved} />
    </div>
  );
}

/* ---------------- activity: order 1–10 ---------------- */
function OrderActivity({ ch, progress, onStep, onSolved }) {
  const alive = useAlive();
  const [pool, setPool] = useState(ch.cards), [placed, setPlaced] = useState([]);
  const [stepMiss, setStepMiss] = useState(0), [total, setTotal] = useState(0), [maxHint, setMaxHint] = useState(0);
  const [cmp, setCmp] = useState(null), [demoLit, setDemoLit] = useState({ a: 0, b: 0 });
  const [busy, setBusy] = useState(false), [countLit, setCountLit] = useState(0), [done, setDone] = useState(false), [wob, setWob] = useState(null);
  const target = placed.length + 1;
  const showDots = (k) => (progress.streak[k] || 0) < 2; // dots fade for numbers she has mastered
  useEffect(() => { say("Put the numbers in the tree, smallest first. Let's find the tiniest number!"); }, []);

  async function countAlong() {
    await sleep(700);
    for (let i = 1; i <= 10; i++) { if (!alive.current) return; setCountLit(i); tone(392 + i * 35, 0.15); say(String(i), { show: false, rate: 0.95 }); await sleep(700); }
    if (!alive.current) return; setCountLit(0); say("1 to 10! The tree is full!");
    await sleep(1400); if (alive.current) onSolved({ misses: total, maxHint });
  }
  function place(k) {
    chime(placed.length); onStep(k, stepMiss > 0, true);
    const np = [...placed, k]; setPlaced(np); setPool((p) => p.filter((x) => x !== k)); setCmp(null); setStepMiss(0); setDemoLit({ a: 0, b: 0 });
    if (np.length === 10) { setDone(true); say("You did it!"); countAlong(); }
    else say(`${pickPraise()} ${k} is in. Which is the smallest one left?`);
  }
  async function demo(wrong) {
    setBusy(true); say("Let's count the dots."); await sleep(1000);
    for (let i = 1; i <= target; i++) { if (!alive.current) return; setDemoLit({ a: i, b: 0 }); tone(392 + i * 35, 0.12); say(String(i), { show: false, rate: 0.95 }); await sleep(600); }
    await sleep(400);
    for (let i = 1; i <= wrong; i++) { if (!alive.current) return; setDemoLit({ a: target, b: i }); tone(392 + i * 35, 0.12); say(String(i), { show: false, rate: 1 }); await sleep(450); }
    if (!alive.current) return; say(`${target} has fewer. ${target} is smaller!`); setBusy(false);
  }
  function pick(k) {
    if (busy || done) return;
    if (k === target) return place(k);
    const m = stepMiss + 1; setStepMiss(m); setTotal((t) => t + 1); setMaxHint((h) => Math.max(h, Math.min(m, 3))); soft();
    setWob(null); requestAnimationFrame(() => setWob(k));
    if (m === 1) { setCmp({ wrong: k, pair: shuffle([k, target]) }); say("Look carefully. Which has fewer dots?"); }
    else if (m === 2) demo(cmp ? cmp.wrong : k);
    else say("Tap the glowing one.");
  }
  const litFor = (k) => (cmp ? (k === target ? demoLit.a : k === cmp.wrong ? demoLit.b : 0) : 0);

  return (
    <div className="mf-act">
      <div className="mf-branch" aria-label="Tree hollows 1 to 10">
        {Array.from({ length: 10 }, (_, i) => {
          const k = i + 1, has = placed.includes(k);
          return (
            <div key={k} className={`mf-hollow${!has && k === target && !done ? " next" : ""}${has ? " filled" : ""}${countLit === k ? " lit" : ""}`}>
              {has ? <span className="mf-acorn">{k}</span> : null}
            </div>
          );
        })}
      </div>
      {cmp ? (
        <div className="mf-compare">
          {cmp.pair.map((k) => (
            <button key={k} className={`mf-card big${stepMiss >= 3 && k === target ? " glow" : ""}${wob === k ? " wobble" : ""}`}
              onClick={() => pick(k)} disabled={busy} aria-label={`Number ${k}`} onAnimationEnd={(e) => { if (e.animationName === "mf-wobble") setWob(null); }}>
              <span className="mf-num">{k}</span><Dots n={k} lit={litFor(k)} />
            </button>
          ))}
        </div>
      ) : !done && (
        <div className="mf-bed">
          {pool.map((k) => (
            <button key={k} className={`mf-card${wob === k ? " wobble" : ""}`} onClick={() => pick(k)} aria-label={`Number ${k}`}
              onAnimationEnd={(e) => { if (e.animationName === "mf-wobble") setWob(null); }}>
              <span className="mf-num">{k}</span>{showDots(k) && <Dots n={k} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- activity: adding ---------------- */
function AddActivity({ ch, onStep, onSolved, onMiss, markerEmoji = "🐿️" }) {
  const { a, b, ans, obj, choices } = ch; const alive = useAlive();
  const [left, setLeft] = useState(a), [right, setRight] = useState(b), [basket, setBasket] = useState(0);
  const [counted, setCounted] = useState([]), [lit, setLit] = useState(0);
  const [misses, setMisses] = useState(0), [maxHint, setMaxHint] = useState(0), [pulse, setPulse] = useState(false), [busy, setBusy] = useState(false), [solved, setSolved] = useState(false);
  const ready = left === 0 && right === 0;
  const word = (k) => (k === 1 ? obj.one : obj.many);
  useEffect(() => { say(`${a} ${word(a)} and ${b} more. Tap them all into the basket!`); }, []);
  useEffect(() => { if (ready) setTimeout(() => alive.current && say("How many in the basket?"), 600); }, [ready]);

  const move = (side) => {
    if (side === "l" && left > 0) setLeft(left - 1); else if (side === "r" && right > 0) setRight(right - 1); else return;
    const nb = basket + 1; setBasket(nb); tone(392 + nb * 40, 0.12); say(String(nb), { show: false, rate: 0.95 });
  };
  const tapBasket = (i) => {
    if (!ready || busy || solved || counted.includes(i)) return;
    const k = counted.length + 1; setCounted([...counted, i]); tone(392 + k * 40, 0.12); say(String(k), { show: false, rate: 0.95 });
  };
  async function demo() { // count on from the first group
    setBusy(true); setCounted([]); setPulse(false);
    say(`Start at ${a}.`); setLit(a); tone(392 + a * 40, 0.15); await sleep(1300);
    for (let i = a + 1; i <= ans; i++) { if (!alive.current) return; setLit(i); tone(392 + i * 40, 0.12); say(String(i), { show: false, rate: 0.95 }); await sleep(750); }
    if (!alive.current) return; say(`${a} and ${b} make ${ans}!`); setBusy(false);
  }
  function pick(c) {
    if (c === ans) { setSolved(true); chime(); onStep(ans, misses > 0); say(`${pickPraise()} ${a} and ${b} make ${ans}!`); onSolved({ misses, maxHint }); return true; }
    onMiss && onMiss(); const m = misses + 1; setMisses(m); setMaxHint((h) => Math.max(h, Math.min(m, 3))); soft();
    if (m === 1) { setCounted([]); setPulse(true); say("Let's count the basket. Touch each one."); }
    else if (m === 2) demo();
    else say("Tap the glowing number.");
    return false;
  }
  return (
    <div className="mf-act">
      <div className="mf-groups">
        <div className="mf-group" aria-label={`Group of ${a}`}>
          {Array.from({ length: a }, (_, i) => i < left
            ? <button key={i} className="mf-obj sm" onClick={() => move("l")} aria-label={`Move ${obj.one}`}><span className="mf-obj-e">{obj.e}</span></button>
            : <span key={i} className="mf-obj sm ghost" />)}
        </div>
        <span className="mf-plus" aria-hidden="true">+</span>
        <div className="mf-group alt" aria-label={`Group of ${b}`}>
          {Array.from({ length: b }, (_, i) => i < right
            ? <button key={i} className="mf-obj sm" onClick={() => move("r")} aria-label={`Move ${obj.one}`}><span className="mf-obj-e">{obj.e}</span></button>
            : <span key={i} className="mf-obj sm ghost" />)}
        </div>
      </div>
      <div className="mf-basket-wrap">
        <span className="mf-helper" aria-hidden="true">{markerEmoji}</span>
        <div className="mf-basket" aria-label={`Basket with ${basket}`}>
          {Array.from({ length: basket }, (_, i) => {
            const c = counted.indexOf(i), on = c >= 0 || i < lit;
            return (
              <button key={i} className={`mf-obj sm${on ? " on" : ""}${pulse && c < 0 ? " pulse" : ""}${i < a ? "" : " second"}`} onClick={() => tapBasket(i)} aria-label={`${obj.one} in basket`}>
                <span className="mf-obj-e">{obj.e}</span>{on && <span className="mf-badge">{c >= 0 ? c + 1 : i + 1}</span>}
              </button>
            );
          })}
        </div>
      </div>
      {ready && <Choices label="How many in the basket?" choices={choices} answer={ans} glow={misses >= 3} onPick={pick} disabled={busy || solved} />}
    </div>
  );
}


/* ================= cartoon animal art (viewBox 0 0 100 100) ================= */
const OL = "#3b2b22", SW = 2.6;
const o = { stroke: OL, strokeWidth: SW, strokeLinejoin: "round", strokeLinecap: "round" };
function Eyes({ y = 54, dx = 11, r = 5.2, ring, cx = 50 }) {
  return (
    <g>
      {[cx - dx, cx + dx].map((x) => (
        <g key={x}>
          {ring && <circle cx={x} cy={y} r={r + 2.6} fill="#fff" stroke={OL} strokeWidth="1.6" />}
          <ellipse cx={x} cy={y} rx={r} ry={r * 1.18} fill="#2b1d16" />
          <circle cx={x + r * 0.35} cy={y - r * 0.45} r={r * 0.42} fill="#fff" />
          <circle cx={x - r * 0.35} cy={y + r * 0.42} r={r * 0.18} fill="#fff" />
        </g>
      ))}
    </g>
  );
}
const Blush = ({ y = 66, dx = 19, cx = 50 }) => (
  <g fill="#ff8f8f" opacity=".5"><ellipse cx={cx - dx} cy={y} rx="5" ry="3" /><ellipse cx={cx + dx} cy={y} rx="5" ry="3" /></g>
);
const Smile = ({ y = 70, w = 5 }) => (
  <path d={`M50 ${y - 3} v3 M${50 - w} ${y} q${w} ${w * 0.8} ${w * 2} 0`} stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
);
const Whiskers = ({ y = 68 }) => (
  <path d={`M38 ${y} L24 ${y - 4} M38 ${y + 3} L24 ${y + 4} M62 ${y} L76 ${y - 4} M62 ${y + 3} L76 ${y + 4}`} stroke={OL} strokeWidth="1.3" strokeLinecap="round" />
);

const MAM = {
  fox: { fur: "#f2873a", inner: "#ffe1c7", muzzle: "#fff4e6", ear: "point", chest: true,
    earExtra: <g fill={OL}><path d="M20 10 L22.6 21 L29.5 15.5Z" /><path d="M80 10 L77.4 21 L70.5 15.5Z" /></g>,
    face: <path d="M14 60 Q30 56 42 68 L50 76 L58 68 Q70 56 86 60 V92 H14Z" fill="#fff4e6" /> },
  bunny: { fur: "#efe6dc", inner: "#ffc3cf", muzzle: "#fffaf5", ear: "long", chest: true, nose: "#ff8fa3", noSmile: true,
    extra: <g><path d="M50 65 v3" stroke={OL} strokeWidth="2" strokeLinecap="round" /><rect x="46.5" y="69" width="7" height="6" rx="1.5" fill="#fff" stroke={OL} strokeWidth="1.6" /><path d="M50 69 v6" stroke={OL} strokeWidth="1" /><Whiskers /></g> },
  deer: { fur: "#cc8b52", inner: "#f5d4b2", muzzle: "#f7e7d3", ear: "side", chest: true,
    earExtra: <path d="M40 33 q-5 -10 -2 -17 M60 33 q5 -10 2 -17" stroke="#8a5a32" strokeWidth="5" strokeLinecap="round" fill="none" />,
    face: <g fill="#fff" opacity=".85"><circle cx="38" cy="38" r="2.6" /><circle cx="50" cy="34" r="2.6" /><circle cx="62" cy="38" r="2.6" /></g> },
  bear: { fur: "#9b6a44", inner: "#dba780", muzzle: "#ebc8a0", ear: "round", mw: 16 },
  squirrel: { fur: "#dc7536", inner: "#ffd6b5", muzzle: "#fde9d4", ear: "point", chest: true,
    tail: <g><path d="M62 101 C98 98 106 58 88 34 C79 22 60 25 63 42 C77 45 83 60 77 74 C73 86 64 93 58 101Z" fill="#e88a45" {...o} /><path d="M80 44 C90 56 90 74 80 86" stroke="#f6b27a" strokeWidth="4" fill="none" strokeLinecap="round" /></g>,
    earExtra: <path d="M20 10 l-4 -7 M20 10 l1 -8 M80 10 l4 -7 M80 10 l-1 -8" stroke="#a8501f" strokeWidth="3" strokeLinecap="round" /> },
  raccoon: { fur: "#9c9ca3", inner: "#4a4a52", muzzle: "#f3f2ef", ear: "point", ring: true, chest: true,
    face: <g><path d="M18 50 Q30 41 44 51 Q50 55 56 51 Q70 41 82 50 Q79 63 65 62 Q56 60 50 63 Q44 60 35 62 Q21 63 18 50Z" fill="#3a3a42" /><path d="M27 42 Q37 36 45 42 M55 42 Q63 36 73 42" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" /></g>,
    extra: <Whiskers /> },
  mouse: { fur: "#bdb6af", inner: "#ffbfca", muzzle: "#f1ebe4", ear: "big", nose: "#ff8fa3", extra: <Whiskers /> },
  badger: { fur: "#7d7d84", head: "#f4f2ee", earFill: "#3a3a40", inner: "#6a6a72", muzzle: "#ffffff", ear: "small", ring: true,
    face: <g fill="#2e2e34"><path d="M31 28 Q37 50 36 72 L43 72 Q45 50 40 28Z" /><path d="M69 28 Q63 50 64 72 L57 72 Q55 50 60 28Z" /></g> },
  beaver: { fur: "#8d5b37", inner: "#c48a5c", muzzle: "#dcb48e", ear: "small", chest: true, noSmile: true,
    extra: <g><path d="M44 72 q6 3 12 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" /><path d="M45.5 73 h9 v7 q-4.5 2 -9 0Z" fill="#fff" stroke={OL} strokeWidth="1.6" /><path d="M50 73 v8" stroke={OL} strokeWidth="1.2" /></g> },
  otter: { fur: "#8b6141", inner: "#5e3f2a", muzzle: "#ecd6ba", ear: "small", mw: 19, chest: true,
    face: <ellipse cx="50" cy="70" rx="26" ry="16" fill="#dcc09c" />, extra: <Whiskers y={69} /> },
};
function Mammal(id, c) {
  const ef = c.earFill || c.fur, hf = c.head || c.fur, inn = c.inner;
  const EARS = {
    point: <g><path d="M26 46 L20 10 L47 32Z" fill={ef} {...o} /><path d="M74 46 L80 10 L53 32Z" fill={ef} {...o} /><path d="M28 39 L24 19 L40 31Z" fill={inn} /><path d="M72 39 L76 19 L60 31Z" fill={inn} /></g>,
    round: <g><circle cx="26" cy="34" r="12" fill={ef} {...o} /><circle cx="74" cy="34" r="12" fill={ef} {...o} /><circle cx="26" cy="34" r="6" fill={inn} /><circle cx="74" cy="34" r="6" fill={inn} /></g>,
    small: <g><circle cx="28" cy="36" r="8.5" fill={ef} {...o} /><circle cx="72" cy="36" r="8.5" fill={ef} {...o} /><circle cx="28" cy="36" r="4" fill={inn} /><circle cx="72" cy="36" r="4" fill={inn} /></g>,
    big: <g><circle cx="22" cy="30" r="17" fill={ef} {...o} /><circle cx="78" cy="30" r="17" fill={ef} {...o} /><circle cx="22" cy="30" r="10" fill={inn} /><circle cx="78" cy="30" r="10" fill={inn} /></g>,
    long: <g><ellipse cx="37" cy="18" rx="9" ry="24" transform="rotate(-12 37 18)" fill={ef} {...o} /><ellipse cx="63" cy="18" rx="9" ry="24" transform="rotate(12 63 18)" fill={ef} {...o} /><ellipse cx="37" cy="20" rx="4.5" ry="17" transform="rotate(-12 37 20)" fill={inn} /><ellipse cx="63" cy="20" rx="4.5" ry="17" transform="rotate(12 63 20)" fill={inn} /></g>,
    side: <g><ellipse cx="18" cy="42" rx="17" ry="8" transform="rotate(-22 18 42)" fill={ef} {...o} /><ellipse cx="82" cy="42" rx="17" ry="8" transform="rotate(22 82 42)" fill={ef} {...o} /><ellipse cx="17" cy="42" rx="10" ry="4" transform="rotate(-22 17 42)" fill={inn} /><ellipse cx="83" cy="42" rx="10" ry="4" transform="rotate(22 83 42)" fill={inn} /></g>,
  };
  return (
    <g>
      <defs><clipPath id={`mh-${id}`}><ellipse cx="50" cy="56" rx="30" ry="27" /></clipPath></defs>
      {c.tail}
      <path d="M20 101 C20 84 33 77 50 77 C67 77 80 84 80 101Z" fill={c.fur} {...o} />
      {c.chest && <path d="M39 101 C40 91 44 86 50 86 C56 86 60 91 61 101Z" fill={c.muzzle} />}
      {EARS[c.ear]}
      {c.earExtra}
      <ellipse cx="50" cy="56" rx="30" ry="27" fill={hf} {...o} />
      <g clipPath={`url(#mh-${id})`}>{c.face}</g>
      <ellipse cx="50" cy="68" rx={c.mw || 15} ry="11" fill={c.muzzle} />
      <Eyes ring={c.ring} />
      <Blush />
      <path d="M45 61.5 Q50 58.5 55 61.5 Q50 67 45 61.5Z" fill={c.nose || "#2b1d16"} stroke={OL} strokeWidth="1.2" />
      {!c.noSmile && <Smile />}
      {c.extra}
    </g>
  );
}
const HEDGE_SPIKES = (() => { const pts = []; for (let i = 0; i <= 26; i++) { const a = Math.PI + (i * Math.PI) / 26, r = i % 2 ? 33 : 45; pts.push(`${(50 + Math.cos(a) * r * 1.08).toFixed(1)},${(82 + Math.sin(a) * r).toFixed(1)}`); } return pts.join(" ") + " 99,101 1,101"; })();
const SPECIAL = {
  hedgehog: () => (
    <g>
      <polygon points={HEDGE_SPIKES} fill="#7a5a42" {...o} />
      <circle cx="31" cy="64" r="6" fill="#e5c49c" {...o} /><circle cx="69" cy="64" r="6" fill="#e5c49c" {...o} />
      <path d="M22 101 C20 80 32 62 50 60 C68 62 80 80 78 101Z" fill="#f0d6b4" {...o} />
      <ellipse cx="50" cy="86" rx="13" ry="9" fill="#f8e6cc" />
      <Eyes y={74} dx={10} r={4.6} /><Blush y={84} dx={18} />
      <circle cx="50" cy="81" r="4.4" fill="#2b1d16" /><Smile y={90} w={4} />
    </g>
  ),
  owl: () => (
    <g>
      <path d="M20 101 C14 70 22 40 50 38 C78 40 86 70 80 101Z" fill="#a0764f" {...o} />
      <path d="M34 101 C32 84 38 72 50 70 C62 72 68 84 66 101Z" fill="#f0dfc0" />
      <path d="M42 80 l2.5 2.5 l2.5 -2.5 M53 80 l2.5 2.5 l2.5 -2.5 M47 89 l2.5 2.5 l2.5 -2.5 M38 92 l2.5 2.5 l2.5 -2.5 M57 92 l2.5 2.5 l2.5 -2.5" stroke="#b48a5e" strokeWidth="1.8" fill="none" />
      <path d="M20 100 C14 80 18 60 28 54 C26 72 28 88 34 100Z" fill="#7e5a3a" {...o} />
      <path d="M80 100 C86 80 82 60 72 54 C74 72 72 88 66 100Z" fill="#7e5a3a" {...o} />
      <path d="M24 28 L17 6 L39 20Z" fill="#8a6342" {...o} /><path d="M76 28 L83 6 L61 20Z" fill="#8a6342" {...o} />
      <ellipse cx="50" cy="40" rx="31" ry="26" fill="#a0764f" {...o} />
      <path d="M50 32 C44 20 21 21 21 39 C21 53 40 57 50 49 C60 57 79 53 79 39 C79 21 56 20 50 32Z" fill="#f4e6cc" />
      <circle cx="37" cy="39" r="10" fill="#ffc33d" stroke={OL} strokeWidth="2" /><circle cx="63" cy="39" r="10" fill="#ffc33d" stroke={OL} strokeWidth="2" />
      <Eyes y={40} dx={13} r={5} />
      <path d="M45.5 47 L54.5 47 L50 56Z" fill="#f29a2e" stroke={OL} strokeWidth="1.8" strokeLinejoin="round" />
    </g>
  ),
  frog: () => (
    <g>
      <path d="M12 101 C12 80 28 68 50 68 C72 68 88 80 88 101Z" fill="#6dbb4a" {...o} />
      <circle cx="31" cy="44" r="13" fill="#7fcc58" {...o} /><circle cx="69" cy="44" r="13" fill="#7fcc58" {...o} />
      <ellipse cx="50" cy="62" rx="35" ry="21" fill="#7fcc58" {...o} />
      <circle cx="31" cy="45" r="12" fill="#7fcc58" /><circle cx="69" cy="45" r="12" fill="#7fcc58" />
      <circle cx="31" cy="44" r="8" fill="#fff" stroke={OL} strokeWidth="2" /><circle cx="69" cy="44" r="8" fill="#fff" stroke={OL} strokeWidth="2" />
      <Eyes y={45} dx={19} r={4.2} />
      <ellipse cx="50" cy="93" rx="22" ry="10" fill="#d9f0a8" />
      <path d="M30 66 Q50 80 70 66" stroke={OL} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="46" cy="58" r="1.4" fill={OL} /><circle cx="54" cy="58" r="1.4" fill={OL} />
      <Blush y={68} dx={26} />
      <g fill="#5aa63e"><circle cx="72" cy="82" r="3" /><circle cx="28" cy="86" r="2.5" /></g>
    </g>
  ),
  duck: () => (
    <g>
      <path d="M20 101 C20 82 33 75 50 75 C67 75 80 82 80 101Z" fill="#ffd23f" {...o} />
      <ellipse cx="25" cy="90" rx="8" ry="12" fill="#f5bf2a" {...o} transform="rotate(20 25 90)" />
      <ellipse cx="75" cy="90" rx="8" ry="12" fill="#f5bf2a" {...o} transform="rotate(-20 75 90)" />
      <path d="M50 28 q-3 -11 5 -14 q-1 7 3 11" fill="#ffd23f" {...o} />
      <circle cx="50" cy="52" r="26" fill="#ffdc4f" {...o} />
      <Eyes y={46} dx={11} r={5} /><Blush y={58} dx={20} />
      <path d="M35 61 Q50 53 65 61 Q62 73 50 73 Q38 73 35 61Z" fill="#ff9a3c" {...o} />
      <path d="M38 63 Q50 67 62 63" stroke={OL} strokeWidth="1.6" fill="none" />
    </g>
  ),
  turtle: () => (
    <g>
      <rect x="40" y="52" width="20" height="24" fill="#a6d86f" {...o} />
      <ellipse cx="50" cy="44" rx="21" ry="18" fill="#a6d86f" {...o} />
      <Eyes y={41} dx={8} r={4.4} /><Blush y={50} dx={14} />
      <path d="M45 51 q5 4 10 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M6 101 C6 74 26 60 50 60 C74 60 94 74 94 101Z" fill="#5c9a3b" {...o} />
      <g fill="#7bb84f" stroke="#3f6e2a" strokeWidth="1.8"><path d="M50 66 l10 6 v11 l-10 6 l-10 -6 v-11Z" /><path d="M27 76 l9 5 v10 l-9 5 l-8 -5 v-8Z" /><path d="M73 76 l8 5 v8 l-8 5 l-9 -5 v-10Z" /></g>
      <path d="M9 98 Q50 89 91 98" stroke="#e8d27a" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  ),
  snail: () => (
    <g>
      <path d="M4 101 C6 90 18 85 32 86 L72 86 C84 86 93 92 96 101Z" fill="#f5cc8f" {...o} />
      <circle cx="60" cy="62" r="27" fill="#ee8c6c" {...o} />
      <path d="M60 62 m-3 0 a3 3 0 1 1 6 0 a8 8 0 1 1 -16 0 a13 13 0 1 1 26 0 a18 18 0 1 1 -36 0" fill="none" stroke="#b5583e" strokeWidth="3" />
      <path d="M17 62 L12 42 M27 62 L30 42" stroke={OL} strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="22" cy="76" rx="14" ry="17" fill="#f5cc8f" {...o} />
      <circle cx="12" cy="40" r="5.5" fill="#fff" stroke={OL} strokeWidth="2" /><circle cx="30" cy="40" r="5.5" fill="#fff" stroke={OL} strokeWidth="2" />
      <circle cx="12.8" cy="40.6" r="2.7" fill="#2b1d16" /><circle cx="30.8" cy="40.6" r="2.7" fill="#2b1d16" />
      <Blush y={80} dx={8} cx={22} />
      <path d="M17 84 q5 4 10 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  ladybug: () => (
    <g>
      <path d="M42 26 q-6 -14 -12 -14 M58 26 q6 -14 12 -14" stroke={OL} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <circle cx="30" cy="12" r="3.5" fill={OL} /><circle cx="70" cy="12" r="3.5" fill={OL} />
      <ellipse cx="50" cy="72" rx="37" ry="31" fill="#e8413c" {...o} />
      <path d="M50 44 V101" stroke={OL} strokeWidth="2.4" />
      <g fill="#2b2b2f"><circle cx="34" cy="64" r="6" /><circle cx="66" cy="64" r="6" /><circle cx="29" cy="84" r="5" /><circle cx="71" cy="84" r="5" /><circle cx="42" cy="91" r="4" /><circle cx="58" cy="91" r="4" /></g>
      <circle cx="50" cy="40" r="17" fill="#2b2b2f" {...o} />
      <circle cx="43" cy="39" r="5.5" fill="#fff" /><circle cx="57" cy="39" r="5.5" fill="#fff" />
      <circle cx="44" cy="40" r="3" fill="#111" /><circle cx="58" cy="40" r="3" fill="#111" />
      <path d="M45 47 q5 4 10 0" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  butterfly: () => (
    <g>
      <path d="M50 52 C30 18 4 20 7 42 C9 58 30 61 50 57Z" fill="#ff8fc8" {...o} />
      <path d="M50 52 C70 18 96 20 93 42 C91 58 70 61 50 57Z" fill="#ff8fc8" {...o} />
      <path d="M50 59 C34 62 16 72 23 87 C30 97 46 85 50 67Z" fill="#9b7bff" {...o} />
      <path d="M50 59 C66 62 84 72 77 87 C70 97 54 85 50 67Z" fill="#9b7bff" {...o} />
      <g fill="#fff6a8"><circle cx="24" cy="38" r="5" /><circle cx="76" cy="38" r="5" /><circle cx="32" cy="80" r="4" /><circle cx="68" cy="80" r="4" /></g>
      <ellipse cx="50" cy="68" rx="6" ry="20" fill="#4a3a5a" {...o} />
      <path d="M46 34 q-6 -14 -14 -12 M54 34 q6 -14 14 -12" stroke={OL} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="50" cy="42" r="11" fill="#5a4a6a" {...o} />
      <circle cx="46" cy="41" r="3" fill="#fff" /><circle cx="54" cy="41" r="3" fill="#fff" />
      <circle cx="46.5" cy="41.5" r="1.6" fill="#111" /><circle cx="54.5" cy="41.5" r="1.6" fill="#111" />
      <path d="M46.5 46 q3.5 3 7 0" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
  ),
  fish: () => (
    <g>
      <circle cx="18" cy="30" r="3" fill="none" stroke="#5bb8e8" strokeWidth="2" /><circle cx="26" cy="18" r="4.5" fill="none" stroke="#5bb8e8" strokeWidth="2" />
      <path d="M78 66 L98 48 L98 86Z" fill="#ff8a3a" {...o} />
      <path d="M38 46 Q52 30 64 46Z" fill="#ff8a3a" {...o} />
      <ellipse cx="50" cy="67" rx="35" ry="24" fill="#ffa64a" {...o} />
      <path d="M60 46 Q53 67 60 89" stroke="#fff" strokeWidth="5" fill="none" />
      <circle cx="32" cy="61" r="8" fill="#fff" stroke={OL} strokeWidth="2" />
      <circle cx="31" cy="62" r="4.4" fill="#2b1d16" /><circle cx="32.6" cy="60" r="1.7" fill="#fff" />
      <path d="M18 73 q6 5 12 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="40" cy="74" rx="4" ry="2.4" fill="#ff8f8f" opacity=".6" />
    </g>
  ),
  woodpecker: () => (
    <g>
      <path d="M26 101 C24 82 34 72 50 72 C66 72 76 82 74 101Z" fill="#2f2f36" {...o} />
      <path d="M40 101 C41 90 45 84 50 84 C55 84 59 90 60 101Z" fill="#f7f3ea" />
      <circle cx="50" cy="50" r="25" fill="#f7f3ea" {...o} />
      <path d="M26 46 Q28 24 50 24 Q72 24 74 46 Q62 37 50 39 Q38 37 26 46Z" fill="#e8413c" stroke={OL} strokeWidth="2" strokeLinejoin="round" />
      <path d="M46 25 L54 8 L58 26Z" fill="#e8413c" stroke={OL} strokeWidth="2" strokeLinejoin="round" />
      <path d="M27 58 Q34 62 40 58 M73 58 Q66 62 60 58" stroke="#2f2f36" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Eyes y={50} dx={9} r={4.6} /><Blush y={61} dx={17} />
      <path d="M50 54 L64 59 L50 62Z" fill="#f2b33a" stroke={OL} strokeWidth="1.8" strokeLinejoin="round" />
    </g>
  ),
};
const animalBody = (id) => (MAM[id] ? Mammal(id, MAM[id]) : SPECIAL[id] ? SPECIAL[id]() : null);
function AnimalSvg({ id, className, ...rest }) {
  const body = animalBody(id);
  return <svg viewBox="0 0 100 100" overflow="visible" className={className} aria-hidden="true" {...rest}>{body}</svg>;
}

/* ================= the forest world (3200 x 900 units) ================= */
const WW = 3200, WH = 900, VY = 200, VH = WH - VY; // visible window crops the empty top sky
const FOREST_ANIMALS = [
  { id: "bunny", name: "Bunny", color: "#f4a7c4", hi: "Hop hop! You found me!", anim: "hop", cover: "burrow", x: 190, y: 790 },
  { id: "butterfly", name: "Butterfly", color: "#b79bff", hi: "Flutter flutter! Hello!", anim: "flutter", cover: "flowers", x: 400, y: 730, s: 0.75 },
  { id: "mouse", name: "Mouse", color: "#c9c2bb", hi: "Squeak! Hello, friend!", anim: "wiggle", cover: "stump", x: 570, y: 770, s: 0.8 },
  { id: "ladybug", name: "Ladybug", color: "#ff7b72", hi: "Hello! Count my spots!", anim: "wiggle", cover: "flowers", x: 690, y: 840, s: 0.7 },
  { id: "hedgehog", name: "Hedgehog", color: "#d2a77c", hi: "Hello! I was curled up!", anim: "bob", cover: "leaves", x: 810, y: 815, s: 0.85 },
  { id: "owl", name: "Owl", color: "#c79b6b", hi: "Hoo hoo! Hello!", anim: "blink", cover: "tree", x: 965, y: 790 },
  { id: "fox", name: "Fox", color: "#ff9f5a", hi: "Hello! Thank you for finding me!", anim: "sway", cover: "bush", x: 1115, y: 815 },
  { id: "raccoon", name: "Raccoon", color: "#a9a9b3", hi: "Hi! I love to explore!", anim: "bob", cover: "log", x: 1255, y: 845 },
  { id: "squirrel", name: "Squirrel", color: "#f09a5a", hi: "Yay! I found an acorn!", anim: "hop", cover: "tree", x: 1395, y: 790 },
  { id: "snail", name: "Snail", color: "#f2c27a", hi: "Hello! Slow and steady!", anim: "bob", cover: "mushrooms", x: 1505, y: 850, s: 0.7 },
  { id: "woodpecker", name: "Woodpecker", color: "#ff6b6b", hi: "Tap tap tap! Hello!", anim: "peck", cover: "tree", x: 1615, y: 790, s: 0.9 },
  { id: "bear", name: "Bear cub", color: "#b98a62", hi: "Hello! A big bear hug!", anim: "sway", cover: "rock", x: 1745, y: 830, s: 1.1 },
  { id: "frog", name: "Frog", color: "#8fd36a", hi: "Ribbit! Hello!", anim: "hop", cover: "reeds", x: 1885, y: 790 },
  { id: "duck", name: "Duck", color: "#ffd84a", hi: "Quack quack! Hello!", anim: "float", cover: "water", x: 2025, y: 755 },
  { id: "turtle", name: "Turtle", color: "#7fc36a", hi: "Hello! I carry my house!", anim: "bob", cover: "water", x: 2155, y: 830 },
  { id: "fish", name: "Fish", color: "#ffa64a", hi: "Blub blub! Hello!", anim: "float", cover: "water", x: 2285, y: 775, s: 0.85 },
  { id: "beaver", name: "Beaver", color: "#b07a4e", hi: "Hello! I build dams!", anim: "bob", cover: "log", x: 2470, y: 820 },
  { id: "otter", name: "Otter", color: "#a77d58", hi: "Splash! Hello!", anim: "float", cover: "water", x: 2665, y: 800 },
  { id: "deer", name: "Deer", color: "#d9a06a", hi: "Hello! You are so clever!", anim: "sway", cover: "bush", x: 2885, y: 785, s: 1.1 },
  { id: "badger", name: "Badger", color: "#9a9aa2", hi: "Hello! I dig tunnels!", anim: "bob", cover: "burrow", x: 3085, y: 830 },
];
const FOREST_COVERS = {
  bush: { dy: -80, clip: -25, paw: -175 }, flowers: { dy: -38, clip: -14, paw: -100 }, stump: { dy: -62, clip: -25, paw: -130 },
  leaves: { dy: -30, clip: -12, paw: -100 }, tree: { pop: true, hole: -250, paw: -330 }, log: { dy: -45, clip: -20, paw: -115 },
  mushrooms: { dy: -35, clip: -12, paw: -110 }, rock: { dy: -72, clip: -25, paw: -150 }, reeds: { dy: -60, clip: -15, paw: -185 },
  water: { dy: -8, clip: -6, paw: -120 }, burrow: { dy: -14, clip: -22, paw: -115 },
};

function rng(seed) { return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const DECOR = (() => {
  const r = rng(7);
  const pines = []; for (let x = -20; x < WW + 40; x += 30 + r() * 14) pines.push({ x, h: 90 + r() * 100, y: 560 + r() * 25 });
  const rounds = []; for (let x = 0; x < WW; x += 90 + r() * 70) rounds.push({ x, y: 620 + r() * 20, s: 0.7 + r() * 0.6 });
  const inPond = (x, y) => ((x - 2090) / 330) ** 2 + ((y - 790) / 110) ** 2 < 1;
  const inRiver = (x) => x > 2560 && x < 2780;
  const flowers = []; while (flowers.length < 70) { const x = r() < 0.55 ? r() * 800 : 2350 + r() * 850, y = 690 + r() * 200; if (!inRiver(x)) flowers.push({ x, y, c: ["#ff8fb1", "#fff", "#ffd84a", "#b79bff", "#ff7b72"][Math.floor(r() * 5)], s: 0.7 + r() * 0.6 }); }
  const grass = []; while (grass.length < 170) { const x = r() * WW, y = 660 + r() * 235; if (!inPond(x, y) && !inRiver(x)) grass.push({ x, y, s: 0.7 + r() * 0.8 }); }
  const flies = []; for (let i = 0; i < 20; i++) flies.push({ x: 840 + r() * 860, y: 300 + r() * 420, d: r() * 4 });
  const woods = [870, 1040, 1185, 1310, 1465, 1560, 1700].map((x) => ({ x, s: 0.55 + r() * 0.25 }));
  return { pines, rounds, flowers, grass, flies, woods };
})();

function Blob({ shapes, fill, sw = 4.5 }) {
  const el = (s, i) => s[0] === "c" ? <circle key={i} cx={s[1]} cy={s[2]} r={s[3]} /> : s[0] === "e" ? <ellipse key={i} cx={s[1]} cy={s[2]} rx={s[3]} ry={s[4]} /> : <rect key={i} x={s[1]} y={s[2]} width={s[3]} height={s[4]} rx={s[5] || 0} />;
  return <g><g fill={OL} stroke={OL} strokeWidth={sw * 2} strokeLinejoin="round">{shapes.map(el)}</g><g fill={fill}>{shapes.map(el)}</g></g>;
}
const Flower = ({ x, y, c = "#ff8fb1", s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0 V14" stroke="#4f9a43" strokeWidth="2.5" />
    <g fill={c} stroke={OL} strokeWidth="1.2">{[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 6} cy={Math.sin((a * Math.PI) / 180) * 6} r="4.6" />)}</g>
    <circle r="3.6" fill="#ffc93c" stroke={OL} strokeWidth="1.2" />
  </g>
);
const Mushroom = ({ x, y, s = 1, c = "#e8414f" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-7 0 Q-8 -14 -5 -20 L5 -20 Q8 -14 7 0Z" fill="#fff4e0" stroke={OL} strokeWidth="2.5" />
    <path d="M-22 -18 Q-20 -40 0 -40 Q20 -40 22 -18Z" fill={c} stroke={OL} strokeWidth="2.5" strokeLinejoin="round" />
    <g fill="#fff"><circle cx="-9" cy="-28" r="3.5" /><circle cx="6" cy="-32" r="3" /><circle cx="12" cy="-23" r="2.5" /></g>
  </g>
);
const Grass = ({ x, y, s }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 0 q-4 -12 -11 -18 M0 0 q0 -16 3 -26 M0 0 q5 -11 13 -16" stroke="#4f9a43" strokeWidth="3" fill="none" strokeLinecap="round" />
);
function forestCover(type) {
  switch (type) {
    case "bush": return { front: <g>
      <Blob fill="url(#g-leaf)" shapes={[["c", -62, -46, 46], ["c", 0, -78, 58], ["c", 62, -46, 44], ["r", -100, -50, 200, 50, 24]]} />
      <g fill="#a8dd7c" opacity=".75"><circle cx="-20" cy="-104" r="10" /><circle cx="-74" cy="-66" r="7" /><circle cx="40" cy="-82" r="8" /><circle cx="76" cy="-56" r="6" /></g>
      <g fill="#e8414f" stroke={OL} strokeWidth="1.6"><circle cx="-42" cy="-30" r="6" /><circle cx="-31" cy="-22" r="6" /><circle cx="52" cy="-34" r="6" /><circle cx="14" cy="-46" r="5" /></g></g> };
    case "flowers": return { front: <g>
      <Blob fill="url(#g-leaf2)" shapes={[["c", -42, -26, 28], ["c", 0, -40, 34], ["c", 42, -26, 27], ["r", -68, -30, 136, 30, 14]]} />
      <Flower x={-44} y={-44} c="#ff8fb1" s={1.4} /><Flower x={-6} y={-66} c="#fff" s={1.5} /><Flower x={34} y={-50} c="#ffd84a" s={1.4} /><Flower x={56} y={-26} c="#b79bff" s={1.2} /><Flower x={-60} y={-18} c="#ffd84a" s={1.1} /></g> };
    case "stump": return { front: <g>
      <path d="M-60 0 Q-66 -6 -52 -12 L-48 -82 Q0 -94 48 -82 L52 -12 Q66 -6 60 0Z" fill="url(#g-bark)" stroke={OL} strokeWidth="4.5" strokeLinejoin="round" />
      <path d="M-28 -70 q4 30 -2 60 M10 -74 q-5 34 2 66 M32 -72 q4 26 0 56" stroke="#6e4a30" strokeWidth="3" fill="none" />
      <ellipse cx="0" cy="-84" rx="48" ry="14" fill="url(#g-wood)" stroke={OL} strokeWidth="4.5" />
      <ellipse cx="0" cy="-84" rx="30" ry="8" fill="none" stroke="#b88a5a" strokeWidth="2.5" /><ellipse cx="0" cy="-84" rx="13" ry="3.5" fill="none" stroke="#b88a5a" strokeWidth="2.5" />
      <Mushroom x={62} y={2} s={0.9} c="#f29a2e" /></g> };
    case "leaves": {
      const r = rng(3), ls = []; for (let i = 0; i < 34; i++) { const a = Math.PI + r() * Math.PI, d = r() * 1; ls.push({ x: Math.cos(a) * 70 * d, y: Math.sin(a) * 52 * d, rot: r() * 180, c: ["#e0782f", "#c9552a", "#f2b53a", "#d9662e", "#a8462a"][Math.floor(r() * 5)] }); }
      return { front: <g><path d="M-82 0 Q-78 -58 0 -60 Q78 -58 82 0Z" fill="#c9652d" stroke={OL} strokeWidth="4.5" />
        {ls.map((l, i) => <ellipse key={i} cx={l.x} cy={l.y - 4} rx="13" ry="6.5" fill={l.c} stroke={OL} strokeWidth="1.4" transform={`rotate(${l.rot} ${l.x} ${l.y - 4})`} />)}</g> };
    }
    case "tree": return { front: <g>
      <path d="M-62 0 Q-40 -10 -36 -60 C-34 -160 -34 -280 -32 -380 L32 -380 C34 -280 34 -160 36 -60 Q40 -10 62 0Z" fill="url(#g-barkH)" stroke={OL} strokeWidth="5" strokeLinejoin="round" />
      <path d="M-18 -60 q6 -50 0 -100 M14 -40 q-6 -60 2 -120 M-10 -300 q5 -30 0 -60 M18 -320 q-4 -20 0 -40" stroke="#6e4a30" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <ellipse cx="0" cy="-250" rx="28" ry="34" fill="#7a5234" stroke={OL} strokeWidth="4.5" />
      <ellipse cx="0" cy="-248" rx="21" ry="27" fill="#2a1a10" />
      <Blob fill="url(#g-leafD)" shapes={[["c", -110, -420, 80], ["c", 0, -470, 100], ["c", 110, -420, 80], ["c", -55, -370, 66], ["c", 60, -372, 66]]} />
      <g fill="#8fd06a" opacity=".55"><circle cx="-40" cy="-500" r="18" /><circle cx="-130" cy="-440" r="12" /><circle cx="70" cy="-470" r="14" /></g></g> };
    case "log": return { front: <g>
      <rect x="-92" y="-64" width="164" height="64" rx="30" fill="url(#g-bark)" stroke={OL} strokeWidth="4.5" />
      <path d="M-70 -44 h70 M-60 -22 h90" stroke="#6e4a30" strokeWidth="3.5" strokeLinecap="round" />
      <ellipse cx="72" cy="-32" rx="22" ry="32" fill="url(#g-wood)" stroke={OL} strokeWidth="4.5" />
      <ellipse cx="72" cy="-32" rx="12" ry="18" fill="none" stroke="#b88a5a" strokeWidth="2.5" />
      <Blob fill="#6fae5f" sw={3} shapes={[["e", -40, -64, 26, 9], ["e", -12, -66, 14, 7]]} />
      <Mushroom x={-58} y={-62} s={0.8} /><Mushroom x={-34} y={-66} s={0.6} c="#f29a2e" /></g> };
    case "mushrooms": return { front: <g>
      <Blob fill="#5fa64c" sw={3} shapes={[["e", 0, -6, 70, 12]]} />
      <Mushroom x={-40} y={0} s={1.3} c="#f29a2e" /><Mushroom x={42} y={0} s={1.1} /><Mushroom x={4} y={2} s={1.9} /></g> };
    case "rock": return { front: <g>
      <path d="M-100 0 C-108 -50 -74 -100 -22 -106 C32 -112 90 -84 100 -32 L104 0Z" fill="url(#g-rock)" stroke={OL} strokeWidth="5" strokeLinejoin="round" />
      <path d="M-60 -70 Q-30 -94 6 -92" stroke="#e6e9e3" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M30 -60 l12 18 l-6 16" stroke="#7d857c" strokeWidth="3" fill="none" strokeLinecap="round" />
      <Blob fill="#6fae5f" sw={3} shapes={[["e", 40, -96, 34, 10], ["e", 72, -82, 18, 8]]} /></g> };
    case "reeds": {
      const blades = [-60, -46, -32, -18, -4, 10, 24, 38, 52, 64];
      return { front: <g>
        {blades.map((x, i) => <path key={x} d={`M${x} 0 Q${x + (i % 2 ? 8 : -8)} -80 ${x + (i % 2 ? 14 : -12)} -${130 + (i % 3) * 22}`} stroke={i % 2 ? "#4f9a43" : "#6fb556"} strokeWidth="7" fill="none" strokeLinecap="round" />)}
        {[-46, 10, 52].map((x, i) => <g key={x}><path d={`M${x} -10 V-${150 + i * 12}`} stroke="#5a8a3a" strokeWidth="4" /><rect x={x - 6} y={-(150 + i * 12) - 4} width="12" height="34" rx="6" fill="#8a5a32" stroke={OL} strokeWidth="2.5" /></g>)}
        <Blob fill="#4f9a43" shapes={[["e", -40, -30, 34, 40], ["e", 0, -38, 40, 44], ["e", 42, -30, 34, 38], ["r", -76, -36, 150, 36, 12]]} /></g> };
    }
    case "water": return { front: <g>
      <path d="M-95 -16 q24 -12 48 0 t48 0 t48 0 t48 0 V12 H-95Z" fill="#4fa9d8" opacity=".95" />
      <path d="M-80 -6 q12 -6 24 0 M-10 -4 q12 -6 24 0 M50 -6 q12 -6 24 0" stroke="#d9f3ff" strokeWidth="3.5" fill="none" strokeLinecap="round" /></g> };
    case "burrow": return {
      back: <g><path d="M-104 0 Q-96 -74 0 -70 Q96 -74 104 0Z" fill="url(#g-dirt)" stroke={OL} strokeWidth="4.5" /><ellipse cx="0" cy="-22" rx="46" ry="26" fill="#2a1a10" /></g>,
      front: <g><path d="M-96 0 Q-84 -34 -50 -22 Q0 -8 50 -22 Q84 -34 96 0Z" fill="url(#g-dirt)" stroke={OL} strokeWidth="4.5" strokeLinejoin="round" /><Grass x={-80} y={-2} s={1.2} /><Grass x={78} y={-2} s={1.1} /></g> };
    default: return {};
  }
}

const Cloud = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff" opacity=".92"><circle cx="0" cy="0" r="26" /><circle cx="28" cy="-12" r="32" /><circle cx="60" cy="0" r="24" /><rect x="0" y="-4" width="60" height="28" rx="14" /></g>
);
function ForestFar({ innerRef }) {
  return (
    <g ref={innerRef}>
      <circle cx="560" cy="290" r="150" fill="url(#g-sun)" /><circle cx="560" cy="290" r="38" fill="#fff6b8" />
      {[[120, 270, 0.9], [800, 250, 1.1], [1350, 290, 0.8], [1900, 255, 1], [2500, 280, 0.9], [3000, 260, 1]].map(([x, y, s], i) => <Cloud key={i} x={x} y={y} s={s} />)}
      <path d="M0 520 L180 380 L320 470 L520 330 L700 460 L900 360 L1100 480 L1300 340 L1500 450 L1720 350 L1900 470 L2100 360 L2300 470 L2500 330 L2700 450 L2900 370 L3100 460 L3200 400 V700 H0Z" fill="url(#g-mtn)" />
      <path d="M520 330 L560 362 L540 360 L520 372 L500 358 L484 360Z M1300 340 L1338 370 L1300 376 L1266 368Z M2500 330 L2540 362 L2500 368 L2462 362Z" fill="#fff" opacity=".85" />
      {DECOR.pines.map((p, i) => { const w = 40, { x, y, h } = p; return <path key={i} d={`M${x} ${y - h} L${x + w * 0.5} ${y - h * 0.45} L${x + w * 0.25} ${y - h * 0.45} L${x + w * 0.62} ${y} L${x - w * 0.62} ${y} L${x - w * 0.25} ${y - h * 0.45} L${x - w * 0.5} ${y - h * 0.45}Z`} fill={i % 3 ? "#7aaa8e" : "#6c9e83"} />; })}
      <rect x="-200" y="470" width={WW + 400} height="140" fill="url(#g-fog)" />
    </g>
  );
}
function ForestMid({ innerRef }) {
  return (
    <g ref={innerRef}>
      <path d={`M-200 650 C200 590 500 640 800 610 C1100 580 1400 630 1700 605 C2000 585 2300 625 2600 600 C2900 580 3100 610 ${WW + 200} 600 V900 H-200Z`} fill="#9ccf7c" />
      {DECOR.rounds.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`}>
          <rect x="-5" y="-40" width="10" height="44" fill="#7a5a40" />
          <circle cx="0" cy="-58" r="30" fill="#5f9e5a" /><circle cx="-20" cy="-42" r="20" fill="#5f9e5a" /><circle cx="20" cy="-42" r="20" fill="#5f9e5a" />
          <circle cx="-8" cy="-68" r="9" fill="#7bb871" />
        </g>
      ))}
    </g>
  );
}
function Signpost({ x, y, label }) {
  const w = label.length * 13 + 30;
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="-6" y="-70" width="12" height="74" fill="#8a5a32" stroke={OL} strokeWidth="3" />
      <path d={`M-10 -98 H${w - 22} L${w - 6} -82 L${w - 22} -66 H-10Z`} fill="#c98e55" stroke={OL} strokeWidth="3.5" strokeLinejoin="round" />
      <text x={(w - 30) / 2} y="-75" textAnchor="middle" fontFamily="'Baloo 2', 'Comic Sans MS', sans-serif" fontWeight="800" fontSize="22" fill="#3b2b22">{label}</text>
    </g>
  );
}
function ForestGround() {
  return (
    <g>
      <path d="M0 650 C400 610 700 670 1000 640 C1400 610 1700 660 2000 650 C2300 640 2400 630 2500 625 C2800 600 3000 610 3200 620 V900 H0Z" fill="url(#g-meadow)" />
      <rect x="830" y="0" width="900" height="900" fill="url(#g-dark)" />
      {DECOR.woods.map((t, i) => (
        <g key={i} transform={`translate(${t.x} 700) scale(${t.s})`} opacity=".9">
          <path d="M-30 0 C-24 -100 -22 -260 -20 -360 L20 -360 C22 -260 24 -100 30 0Z" fill="#6b4a32" />
          <circle cx="-80" cy="-400" r="70" fill="#3f7a44" /><circle cx="0" cy="-450" r="90" fill="#46864a" /><circle cx="85" cy="-400" r="70" fill="#3f7a44" />
        </g>
      ))}
      <g className="mf-rays">
        <polygon points="1000,0 1070,0 1300,760 1180,760" fill="url(#g-ray)" />
        <polygon points="1240,0 1290,0 1480,760 1390,760" fill="url(#g-ray)" />
        <polygon points="1480,0 1520,0 1650,760 1580,760" fill="url(#g-ray)" />
      </g>
      <path d="M0 880 C250 840 500 890 780 850 C1000 820 1300 880 1640 855" stroke="#e8cf98" strokeWidth="44" fill="none" strokeLinecap="round" opacity=".85" />
      <path d="M2300 900 C2380 690 2560 630 2800 628 C3000 626 3120 618 3200 622 V900Z" fill="url(#g-hill)" />
      <path d="M2575 610 C2625 690 2560 770 2630 905 L2770 905 C2700 770 2750 690 2700 610Z" fill="url(#g-water)" stroke="#e9f8ff" strokeWidth="4" />
      <path d="M2640 660 q8 10 0 20 M2660 740 q-8 12 2 24 M2690 830 q8 12 -2 24" stroke="#e9f8ff" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="2090" cy="795" rx="335" ry="105" fill="#7cc46f" />
      <ellipse cx="2090" cy="795" rx="312" ry="88" fill="url(#g-water)" stroke="#e9f8ff" strokeWidth="4" />
      <path d="M1880 770 q20 -8 40 0 M2180 820 q20 -8 40 0 M2050 860 q16 -6 32 0" stroke="#e9f8ff" strokeWidth="3" fill="none" strokeLinecap="round" />
      {[[1960, 845, 1], [2230, 860, 0.8], [2380, 790, 0.7], [2100, 720, 0.75]].map(([x, y, s], i) => (
        <g key={i} transform={`translate(${x} ${y}) scale(${s})`}><path d="M0 0 L26 -8 A28 14 0 1 1 26 8Z" fill="#5fae4f" stroke={OL} strokeWidth="2.5" /></g>
      ))}
      {DECOR.flowers.map((f, i) => <Flower key={i} {...f} />)}
      {DECOR.grass.map((g, i) => <Grass key={i} {...g} />)}
      <Mushroom x={720} y={700} s={0.8} /><Mushroom x={1170} y={720} s={0.7} c="#f29a2e" /><Mushroom x={1560} y={725} s={0.9} />
      <Signpost x={40} y={720} label="Meadow" /><Signpost x={845} y={740} label="Deep Woods" /><Signpost x={1800} y={690} label="Pond" /><Signpost x={2420} y={720} label="River Hill" />
      {DECOR.flies.map((f, i) => <circle key={i} className="mf-fly" cx={f.x} cy={f.y} r="4" fill="#fff59a" style={{ animationDelay: `${f.d}s` }} />)}
    </g>
  );
}
function Paw({ y, color }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <g className="mf-paw">
        <circle r="40" fill="none" stroke="#ffe45c" strokeWidth="7" className="mf-paw-ring" />
        <circle r="31" fill="#fffaf0" stroke={OL} strokeWidth="4" />
        <g fill={color} stroke={OL} strokeWidth="2.2"><ellipse cx="0" cy="7" rx="11" ry="9" /><circle cx="-13" cy="-6" r="5" /><circle cx="-5" cy="-14" r="5" /><circle cx="5" cy="-14" r="5" /><circle cx="13" cy="-6" r="5" /></g>
      </g>
    </g>
  );
}

/* ================= sea animal art (viewBox 0 0 100 100) ================= */
const starPts = (cx, cy, R, r, n = 5, rot = -90) => Array.from({ length: n * 2 }, (_, i) => { const a = ((rot + (i * 180) / n) * Math.PI) / 180, d = i % 2 ? r : R; return `${(cx + Math.cos(a) * d).toFixed(1)},${(cy + Math.sin(a) * d).toFixed(1)}`; }).join(" ");
const Wavy = ({ d, c, w = 8 }) => <g><path d={d} stroke={OL} strokeWidth={w + 4.5} fill="none" strokeLinecap="round" /><path d={d} stroke={c} strokeWidth={w} fill="none" strokeLinecap="round" /></g>;
const SideEye = ({ x, y, r = 7 }) => <g><circle cx={x} cy={y} r={r} fill="#fff" stroke={OL} strokeWidth="2" /><circle cx={x - 1} cy={y + 0.5} r={r * 0.58} fill="#2b1d16" /><circle cx={x + r * 0.15} cy={y - r * 0.3} r={r * 0.22} fill="#fff" /></g>;
MAM.seaotter = { fur: "#9b7253", inner: "#6b4a30", muzzle: "#f3e2cb", ear: "small", chest: true, mw: 17,
  face: <ellipse cx="50" cy="60" rx="27" ry="21" fill="#eadbc4" />,
  extra: <g><Whiskers y={69} /><path d="M38 99 Q50 80 62 99Z" fill="#ffd9c2" stroke={OL} strokeWidth="2" /><path d="M50 99 L50 86 M44 98 L48 87 M56 98 L52 87" stroke="#e8a080" strokeWidth="1.4" /><ellipse cx="38" cy="94" rx="6" ry="5" fill="#8a6141" stroke={OL} strokeWidth="2" /><ellipse cx="62" cy="94" rx="6" ry="5" fill="#8a6141" stroke={OL} strokeWidth="2" /></g> };
Object.assign(SPECIAL, {
  clownfish: () => (
    <g>
      <defs><clipPath id="cf-b"><ellipse cx="50" cy="60" rx="32" ry="22" /></clipPath></defs>
      <path d="M76 60 L96 42 Q91 60 96 78Z" fill="#ff8a2a" {...o} />
      <path d="M38 42 Q52 24 66 43Z" fill="#ff8a2a" {...o} />
      <ellipse cx="50" cy="60" rx="32" ry="22" fill="#ff8a2a" {...o} />
      <g clipPath="url(#cf-b)" stroke={OL} strokeWidth="2"><rect x="33" y="30" width="10" height="60" fill="#fff" /><rect x="58" y="30" width="9" height="60" fill="#fff" /></g>
      <path d="M48 80 Q54 92 62 80Z" fill="#ff8a2a" {...o} />
      <SideEye x={27} y={55} /><path d="M17 66 q5 4 10 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="34" cy="68" rx="4" ry="2.4" fill="#ff5a5a" opacity=".45" />
    </g>
  ),
  octopus: () => (
    <g>
      {[[22, -1], [34, 1], [46, -1], [56, 1], [68, -1], [80, 1]].map(([x, d], i) => <Wavy key={i} c="#b874e0" w={9} d={`M${x} 66 q${-7 * d} 12 0 20 q${7 * d} 8 ${-3 * d} 13`} />)}
      <path d="M17 66 C12 30 30 12 50 12 C70 12 88 30 83 66 Q50 80 17 66Z" fill="#c585ea" {...o} />
      <g fill="#dba8f3"><circle cx="34" cy="26" r="5" /><circle cx="66" cy="30" r="4" /><circle cx="50" cy="20" r="3" /></g>
      <Eyes y={46} dx={13} r={6} /><Blush y={58} dx={22} /><path d="M44 61 q6 5 12 0" stroke={OL} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  ),
  crab: () => (
    <g>
      <path d="M24 72 l-16 6 M23 80 l-15 10 M26 86 l-12 12 M76 72 l16 6 M77 80 l15 10 M74 86 l12 12" stroke={OL} strokeWidth="4.5" strokeLinecap="round" />
      <path d="M24 72 l-16 6 M23 80 l-15 10 M26 86 l-12 12 M76 72 l16 6 M77 80 l15 10 M74 86 l12 12" stroke="#e8483a" strokeWidth="2" strokeLinecap="round" />
      <Wavy c="#f0503c" w={6} d="M30 64 Q18 54 20 40" /><Wavy c="#f0503c" w={6} d="M70 64 Q82 54 80 40" />
      <path d="M8 32 Q8 14 24 14 L18 26 L30 27 Q30 42 14 42 Q8 40 8 32Z" fill="#f0503c" {...o} />
      <path d="M92 32 Q92 14 76 14 L82 26 L70 27 Q70 42 86 42 Q92 40 92 32Z" fill="#f0503c" {...o} />
      <path d="M42 54 L39 36 M58 54 L61 36" stroke={OL} strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="50" cy="70" rx="31" ry="21" fill="#f0503c" {...o} />
      <g fill="#ff8a70"><circle cx="36" cy="62" r="3" /><circle cx="64" cy="62" r="3" /><circle cx="50" cy="58" r="2.4" /></g>
      <SideEye x={39} y={33} r={7} /><SideEye x={61} y={33} r={7} />
      <Blush y={74} dx={17} /><path d="M44 74 q6 5 12 0" stroke={OL} strokeWidth="2.2" fill="none" strokeLinecap="round" />
    </g>
  ),
  seaturtle: () => (
    <g>
      <ellipse cx="16" cy="78" rx="16" ry="7" transform="rotate(-30 16 78)" fill="#7cc7a0" {...o} />
      <ellipse cx="84" cy="78" rx="16" ry="7" transform="rotate(30 84 78)" fill="#7cc7a0" {...o} />
      <rect x="40" y="50" width="20" height="24" fill="#8ad3ad" {...o} />
      <ellipse cx="50" cy="42" rx="21" ry="18" fill="#8ad3ad" {...o} />
      <Eyes y={40} dx={8} r={4.4} /><Blush y={48} dx={14} /><path d="M45 49 q5 4 10 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M10 101 C10 74 28 60 50 60 C72 60 90 74 90 101Z" fill="#2f9a8a" {...o} />
      <g fill="#46b39f" stroke="#1f6e63" strokeWidth="1.8"><path d="M50 66 l10 6 v11 l-10 6 l-10 -6 v-11Z" /><path d="M28 77 l9 5 v10 l-9 5 l-8 -5 v-8Z" /><path d="M72 77 l8 5 v8 l-8 5 l-9 -5 v-10Z" /></g>
    </g>
  ),
  seahorse: () => (
    <g>
      <path d="M58 52 Q76 54 70 66 Q64 60 58 62Z" fill="#ffd27a" {...o} />
      <Wavy c="#ffb347" w={17} d="M48 34 C60 40 62 50 52 56 C42 62 44 74 56 78 C66 82 64 94 52 94 C44 94 42 88 46 84" />
      <path d="M50 64 h-8 M51 72 h-7 M55 80 h-6" stroke="#e8902c" strokeWidth="2" strokeLinecap="round" />
      <path d="M58 22 L84 26 Q86 30 84 34 L60 36Z" fill="#ffb347" {...o} />
      <path d="M38 14 L42 4 L46 13 L50 3 L53 13 L58 6 L58 18Z" fill="#ffd27a" {...o} />
      <circle cx="48" cy="28" r="15" fill="#ffb347" {...o} />
      <Eyes y={25} dx={0} cx={50} r={4.6} /><ellipse cx="44" cy="35" rx="4" ry="2.4" fill="#ff7a5a" opacity=".5" />
    </g>
  ),
  whale: () => (
    <g>
      <path d="M44 22 q-6 -12 -14 -14 M50 22 v-16 M56 22 q6 -12 14 -14" stroke="#8fd3ff" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M80 44 Q88 22 99 20 Q93 30 97 38 Q86 36 84 48Z" fill="#5b8fd6" {...o} />
      <path d="M8 62 C8 36 30 24 54 26 C78 28 92 44 92 62 C92 80 74 90 50 90 C26 90 8 82 8 62Z" fill="#5b8fd6" {...o} />
      <path d="M14 70 C30 86 70 88 88 70 C80 84 66 90 50 90 C34 90 20 84 14 70Z" fill="#cfe3ff" />
      <path d="M30 80 v6 M40 82 v7 M50 83 v7 M60 82 v7 M70 80 v6" stroke="#9dbbe6" strokeWidth="1.8" strokeLinecap="round" />
      <Eyes y={54} dx={16} r={5} /><Blush y={64} dx={26} />
      <path d="M34 66 Q50 76 66 66" stroke={OL} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
  starfish: () => (
    <g>
      <polygon points={starPts(50, 58, 44, 19)} fill="#ffad4a" {...o} strokeWidth="3" />
      <g fill="#ffd28a"><circle cx="50" cy="26" r="2.5" /><circle cx="24" cy="50" r="2.5" /><circle cx="76" cy="50" r="2.5" /><circle cx="34" cy="84" r="2.5" /><circle cx="66" cy="84" r="2.5" /></g>
      <Eyes y={54} dx={8} r={4.4} /><Blush y={64} dx={14} /><Smile y={66} w={4} />
    </g>
  ),
  jellyfish: () => (
    <g>
      {[30, 40, 50, 60, 70].map((x, i) => <path key={x} d={`M${x} 58 q${i % 2 ? 6 : -6} 10 0 18 q${i % 2 ? -6 : 6} 8 0 18`} stroke="#f590cf" strokeWidth="4" fill="none" strokeLinecap="round" />)}
      <path d="M16 60 C16 30 32 16 50 16 C68 16 84 30 84 60 Q76 54 67 60 Q58 54 50 60 Q42 54 33 60 Q24 54 16 60Z" fill="#ff9fd6" {...o} />
      <path d="M28 34 Q36 24 48 24" stroke="#ffd6ef" strokeWidth="5" fill="none" strokeLinecap="round" />
      <Eyes y={40} dx={11} r={4.6} /><Blush y={49} dx={20} /><Smile y={51} w={4} />
    </g>
  ),
  dolphin: () => (
    <g>
      <path d="M80 56 Q92 38 99 40 Q92 52 99 64 Q90 66 80 62Z" fill="#6d9fd6" {...o} />
      <path d="M50 36 Q60 16 68 38Z" fill="#6d9fd6" {...o} />
      <path d="M6 58 Q8 47 20 45 Q40 30 64 38 Q83 46 84 58 Q70 74 44 72 Q24 72 15 64 Q4 64 6 58Z" fill="#7fb0e0" {...o} />
      <path d="M14 63 Q30 70 50 68 Q70 66 82 58 Q70 74 44 72 Q24 72 14 63Z" fill="#dcebfa" />
      <path d="M44 66 Q40 80 52 84 Q52 74 56 68Z" fill="#6d9fd6" {...o} />
      <SideEye x={30} y={50} r={5.5} /><path d="M8 60 q9 6 20 2" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="34" cy="60" rx="4" ry="2.3" fill="#ff8f8f" opacity=".5" />
    </g>
  ),
  shark: () => (
    <g>
      <path d="M80 56 Q92 34 99 34 Q94 52 99 70 Q90 68 80 62Z" fill="#8a9bb0" {...o} />
      <path d="M44 38 Q54 10 66 40Z" fill="#8a9bb0" {...o} />
      <path d="M4 58 Q10 42 30 40 Q56 34 74 44 Q86 52 84 60 Q70 76 42 76 Q18 76 8 66 Q2 62 4 58Z" fill="#9aabbf" {...o} />
      <path d="M8 64 Q26 72 46 72 Q70 70 84 60 Q70 76 42 76 Q18 76 8 64Z" fill="#eef2f6" />
      <path d="M44 50 q-3 6 0 12 M50 50 q-3 6 0 12 M56 50 q-3 6 0 12" stroke="#6f8096" strokeWidth="2" fill="none" strokeLinecap="round" />
      <SideEye x={26} y={52} r={5.5} />
      <path d="M8 63 Q20 70 34 64" stroke={OL} strokeWidth="2" fill="#fff" strokeLinejoin="round" />
      <path d="M13 65 l2 3 l2 -3 M19 66.5 l2 3 l2 -3 M25 66.5 l2 3 l2 -3" stroke={OL} strokeWidth="1" fill="#fff" />
      <ellipse cx="34" cy="60" rx="4" ry="2.3" fill="#ff8f8f" opacity=".5" />
    </g>
  ),
  puffer: () => (
    <g>
      <polygon points={starPts(50, 58, 42, 33, 16)} fill="#f2c94a" {...o} strokeWidth="2.4" />
      <path d="M84 58 L98 48 L98 68Z" fill="#f2b33a" {...o} />
      <circle cx="50" cy="58" r="34" fill="#ffe27a" {...o} />
      <path d="M20 68 Q50 96 80 68 Q72 90 50 92 Q28 90 20 68Z" fill="#fff4c4" />
      <g fill="#e8b84a"><circle cx="36" cy="38" r="3" /><circle cx="62" cy="34" r="3" /><circle cx="70" cy="48" r="2.5" /></g>
      <Eyes y={52} dx={12} r={5.4} /><Blush y={63} dx={22} />
      <circle cx="50" cy="68" r="4.2" fill="#e8724a" stroke={OL} strokeWidth="1.8" />
    </g>
  ),
  stingray: () => (
    <g>
      <Wavy c="#8f9fb8" w={3} d="M50 74 Q56 88 70 96" />
      <path d="M50 30 C70 30 96 52 98 62 C80 66 64 70 50 78 C36 70 20 66 2 62 C4 52 30 30 50 30Z" fill="#8f9fb8" {...o} />
      <g fill="#a9b7cc"><circle cx="30" cy="54" r="3" /><circle cx="70" cy="54" r="3" /><circle cx="22" cy="60" r="2" /><circle cx="78" cy="60" r="2" /></g>
      <Eyes y={48} dx={9} r={4.4} /><Blush y={57} dx={16} /><Smile y={60} w={4} />
    </g>
  ),
  seal: () => (
    <g>
      <path d="M20 101 C18 76 30 62 50 62 C70 62 82 76 80 101Z" fill="#9aa6b2" {...o} />
      <ellipse cx="20" cy="90" rx="13" ry="6" transform="rotate(-35 20 90)" fill="#8794a2" {...o} />
      <ellipse cx="80" cy="90" rx="13" ry="6" transform="rotate(35 80 90)" fill="#8794a2" {...o} />
      <ellipse cx="50" cy="48" rx="28" ry="26" fill="#aab5c1" {...o} />
      <circle cx="44" cy="59" r="8" fill="#dbe2e8" /><circle cx="56" cy="59" r="8" fill="#dbe2e8" />
      <g fill={OL}><circle cx="40" cy="58" r="1" /><circle cx="43" cy="62" r="1" /><circle cx="60" cy="58" r="1" /><circle cx="57" cy="62" r="1" /></g>
      <ellipse cx="50" cy="53" rx="5" ry="3.5" fill="#2b1d16" />
      <Eyes y={43} dx={12} r={6} /><Blush y={55} dx={22} />
      <path d="M46 64 q4 3 8 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  squid: () => (
    <g>
      {[[34, -1], [42, 1], [50, -1], [58, 1], [66, -1]].map(([x, d], i) => <Wavy key={i} c="#ff8a8a" w={6} d={`M${x} 64 q${6 * d} 10 0 18 q${-6 * d} 8 ${2 * d} 14`} />)}
      <path d="M50 4 L76 30 L24 30Z" fill="#ff7a7a" {...o} />
      <path d="M30 30 Q30 14 50 10 Q70 14 70 30 L66 66 Q50 72 34 66Z" fill="#ff8a8a" {...o} />
      <g fill="#ffb3b3"><circle cx="42" cy="24" r="3" /><circle cx="58" cy="26" r="2.5" /></g>
      <Eyes y={46} dx={9} r={5} ring /><Blush y={57} dx={13} /><Smile y={60} w={4} />
    </g>
  ),
  clam: () => (
    <g>
      <path d="M12 60 Q50 54 88 60 Q86 92 50 94 Q14 92 12 60Z" fill="#f7a8c4" {...o} />
      <path d="M50 94 V64 M34 92 L40 64 M66 92 L60 64 M22 84 L30 62 M78 84 L70 62" stroke="#e57fa6" strokeWidth="2" />
      <ellipse cx="50" cy="59" rx="34" ry="7" fill="#c2577e" />
      <circle cx="50" cy="58" r="8" fill="#fffaf2" stroke={OL} strokeWidth="2" /><circle cx="53" cy="55" r="2.4" fill="#fff" />
      <path d="M12 56 Q14 18 50 16 Q86 18 88 56 Q50 48 12 56Z" fill="#f7a8c4" {...o} />
      <path d="M50 18 V50 M34 20 L40 50 M66 20 L60 50 M22 30 L30 52 M78 30 L70 52" stroke="#e57fa6" strokeWidth="2" />
      <Eyes y={38} dx={13} r={4.8} /><Blush y={46} dx={22} />
    </g>
  ),
  narwhal: () => (
    <g>
      <path d="M46 30 L62 0 L54 32Z" fill="#fff4d6" {...o} />
      <path d="M52 22 l5 2 M55 15 l4 2 M58 8 l3 2" stroke="#d9c79a" strokeWidth="1.6" />
      <path d="M82 50 Q90 30 99 30 Q94 40 98 48 Q88 46 86 56Z" fill="#9fb8d8" {...o} />
      <ellipse cx="50" cy="62" rx="38" ry="27" fill="#a9c2e0" {...o} />
      <path d="M16 72 C30 88 70 90 86 72 C78 86 64 89 50 89 C36 89 22 84 16 72Z" fill="#e2ecf8" />
      <g fill="#8aa6c8"><circle cx="70" cy="46" r="3" /><circle cx="78" cy="56" r="2.4" /><circle cx="26" cy="48" r="2.4" /></g>
      <Eyes y={56} dx={14} r={5} /><Blush y={66} dx={24} /><Smile y={70} w={6} />
    </g>
  ),
  angelfish: () => (
    <g>
      <defs><clipPath id="af-b"><ellipse cx="50" cy="58" rx="28" ry="22" /></clipPath></defs>
      <path d="M50 14 L72 44 L30 44Z" fill="#ffd84a" {...o} />
      <path d="M50 100 L72 72 L30 72Z" fill="#ffd84a" {...o} />
      <path d="M74 58 L94 42 L94 74Z" fill="#5aa0e8" {...o} />
      <ellipse cx="50" cy="58" rx="28" ry="22" fill="#ffd84a" {...o} />
      <g clipPath="url(#af-b)" fill="#5aa0e8"><rect x="48" y="30" width="7" height="60" /><rect x="64" y="30" width="7" height="60" /></g>
      <SideEye x={34} y={53} r={6.5} /><path d="M23 63 q5 4 10 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="38" cy="64" rx="4" ry="2.3" fill="#ff8f6f" opacity=".5" />
    </g>
  ),
  lobster: () => (
    <g>
      <path d="M44 34 Q30 10 12 4 M56 34 Q70 10 88 4" stroke={OL} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <Wavy c="#e8553c" w={6} d="M36 50 Q22 46 20 32" /><Wavy c="#e8553c" w={6} d="M64 50 Q78 46 80 32" />
      <path d="M8 26 Q6 6 24 8 L19 20 L31 22 Q30 38 14 38 Q8 36 8 26Z" fill="#e8553c" {...o} />
      <path d="M92 26 Q94 6 76 8 L81 20 L69 22 Q70 38 86 38 Q92 36 92 26Z" fill="#e8553c" {...o} />
      <path d="M38 86 L28 99 L50 94 L72 99 L62 86Z" fill="#d9472f" {...o} />
      <ellipse cx="50" cy="62" rx="19" ry="28" fill="#e8553c" {...o} />
      <path d="M34 70 Q50 74 66 70 M35 78 Q50 82 65 78" stroke="#b83a26" strokeWidth="2" fill="none" />
      <path d="M44 38 L42 30 M56 38 L58 30" stroke={OL} strokeWidth="2.6" strokeLinecap="round" />
      <SideEye x={42} y={28} r={5.5} /><SideEye x={58} y={28} r={5.5} />
      <Blush y={56} dx={11} /><Smile y={58} w={4} />
    </g>
  ),
  swordfish: () => (
    <g>
      <path d="M78 58 L97 36 L90 58 L97 80Z" fill="#3f6fc0" {...o} />
      <path d="M38 42 Q46 12 62 43Z" fill="#3f6fc0" {...o} />
      <path d="M17 56 L0 51 L17 62Z" fill="#c8d2e4" {...o} />
      <path d="M15 58 Q22 40 50 40 Q78 42 82 58 Q78 75 50 76 Q22 76 15 58Z" fill="#4f7fd0" {...o} />
      <path d="M18 62 Q40 70 80 60 Q76 75 50 76 Q26 76 18 62Z" fill="#dfe8f8" />
      <path d="M46 70 L40 84 L54 74Z" fill="#3f6fc0" {...o} />
      <SideEye x={29} y={53} r={6} /><path d="M18 64 q6 4 11 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
});

/* ================= the sea world ================= */
const SEA_OBJECTS = [
  { e: "🐚", one: "shell", many: "shells" },
  { e: "🐟", one: "fish", many: "fish" },
  { e: "🐠", one: "fish", many: "fish" },
  { e: "⭐", one: "star", many: "stars" },
  { e: "🦐", one: "shrimp", many: "shrimps" },
];
const SEA_ANIMALS = [
  { id: "crab", name: "Crab", color: "#ff7f6e", hi: "Snip snap! Hello!", anim: "wiggle", cover: "sand", x: 180, y: 830 },
  { id: "starfish", name: "Starfish", color: "#ffb35a", hi: "Hello! I am a star!", anim: "sway", cover: "shell", x: 380, y: 790, s: 0.8 },
  { id: "clam", name: "Clam", color: "#f7a8c4", hi: "Look at my shiny pearl!", anim: "bob", cover: "sand", x: 560, y: 860, s: 0.85 },
  { id: "seal", name: "Seal", color: "#a9b4c0", hi: "Arf arf! Hello!", anim: "bob", cover: "searock", x: 715, y: 790, s: 1.05 },
  { id: "clownfish", name: "Clownfish", color: "#ff9a4a", hi: "Hello! I live in an anemone!", anim: "float", cover: "anemone", x: 905, y: 830, s: 0.8 },
  { id: "angelfish", name: "Angelfish", color: "#ffd84a", hi: "Hello! I love the coral!", anim: "float", cover: "coral", x: 1055, y: 795, s: 0.85 },
  { id: "puffer", name: "Pufferfish", color: "#ffe27a", hi: "Puff! I can get big!", anim: "bob", cover: "coral", x: 1205, y: 850, s: 0.8 },
  { id: "seahorse", name: "Seahorse", color: "#ffbf6a", hi: "Neigh! I'm a seahorse!", anim: "float", cover: "coral", x: 1345, y: 800, s: 0.85 },
  { id: "octopus", name: "Octopus", color: "#c585ea", hi: "Hello! I have eight arms!", anim: "wiggle", cover: "cave", x: 1490, y: 820 },
  { id: "lobster", name: "Lobster", color: "#f07a5e", hi: "Click clack! Hello!", anim: "wiggle", cover: "searock", x: 1635, y: 850, s: 0.9 },
  { id: "seaotter", name: "Sea otter", color: "#b48a66", hi: "Hello! I float on my back!", anim: "float", cover: "kelp", x: 1790, y: 800 },
  { id: "seaturtle", name: "Sea turtle", color: "#5fbfa8", hi: "Hello! I swim far, far away!", anim: "float", cover: "kelp", x: 1945, y: 840 },
  { id: "stingray", name: "Stingray", color: "#a3b2c8", hi: "Hello! I glide like a kite!", anim: "float", cover: "sand", x: 2075, y: 865 },
  { id: "squid", name: "Squid", color: "#ff9a9a", hi: "Swish swish! Hello!", anim: "bob", cover: "kelp", x: 2210, y: 800, s: 0.85 },
  { id: "dolphin", name: "Dolphin", color: "#7fb0e0", hi: "Eee eee! Let's play!", anim: "hop", cover: "searock", x: 2350, y: 810 },
  { id: "jellyfish", name: "Jellyfish", color: "#ff9fd6", hi: "Wobble wobble! Hello!", anim: "flutter", cover: "coral", x: 2495, y: 800, s: 0.8, alt: true },
  { id: "shark", name: "Shark", color: "#9aabbf", hi: "Hello! I'm a friendly shark!", anim: "float", cover: "wreck", x: 2650, y: 840 },
  { id: "swordfish", name: "Swordfish", color: "#5a8ad8", hi: "Whoosh! I'm super fast!", anim: "float", cover: "cave", x: 2810, y: 830 },
  { id: "narwhal", name: "Narwhal", color: "#a9c2e0", hi: "Hello! Look at my horn!", anim: "bob", cover: "chest", x: 2965, y: 850, s: 0.85 },
  { id: "whale", name: "Whale", color: "#5b8fd6", hi: "Hello! I am the biggest!", anim: "float", cover: "searock", x: 3110, y: 815, s: 1.2 },
];
const SEA_COVERS = {
  sand: { dy: -14, clip: -22, paw: -110 }, shell: { dy: -96, clip: -22, paw: -185 }, searock: { dy: -72, clip: -25, paw: -150 },
  anemone: { dy: -88, clip: -15, paw: -200 }, coral: { dy: -100, clip: -20, paw: -225 }, cave: { pop: true, hole: -62, paw: -200 },
  kelp: { dy: -82, clip: -15, paw: -230 }, wreck: { pop: true, hole: -160, paw: -250 }, chest: { dy: -45, clip: -20, paw: -160 },
};
const Coral = ({ x, y, c, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Wavy c={c} w={11} d="M0 0 V-40 M0 -24 Q-18 -30 -20 -52 M0 -32 Q16 -38 18 -60 M-20 -52 Q-26 -62 -22 -70 M18 -60 Q24 -66 20 -76" />
  </g>
);
const Shell = ({ x, y, s = 1, c = "#ffd9c2" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-12 0 Q-14 -14 0 -16 Q14 -14 12 0Z" fill={c} stroke={OL} strokeWidth="2" /><path d="M0 0 V-14 M-6 0 L-5 -13 M6 0 L5 -13" stroke="#e8a080" strokeWidth="1.2" /></g>
);
function seaCover(type, a) {
  switch (type) {
    case "sand": return {
      back: <g><path d="M-104 0 Q-96 -70 0 -66 Q96 -70 104 0Z" fill="url(#g-sand)" stroke={OL} strokeWidth="4.5" /><ellipse cx="0" cy="-22" rx="46" ry="22" fill="#c9a060" /></g>,
      front: <g><path d="M-96 0 Q-84 -34 -50 -22 Q0 -8 50 -22 Q84 -34 96 0Z" fill="url(#g-sand)" stroke={OL} strokeWidth="4.5" strokeLinejoin="round" /><Shell x={-66} y={-6} s={1.1} c="#ffc2d4" /><Shell x={70} y={-4} s={0.9} /></g> };
    case "shell": return { front: <g>
      <path d="M-92 0 Q-104 -96 0 -116 Q104 -96 92 0Z" fill="#ffd9c2" stroke={OL} strokeWidth="5" strokeLinejoin="round" />
      {[-70, -42, -14, 14, 42, 70].map((x) => <path key={x} d={`M0 -4 L${x * 1.2} ${-90 + Math.abs(x) * 0.5}`} stroke="#e8a080" strokeWidth="4" strokeLinecap="round" />)}
      <path d="M-30 0 L-22 -18 H22 L30 0Z" fill="#f2b89a" stroke={OL} strokeWidth="4" strokeLinejoin="round" /></g> };
    case "searock": return { front: <g>
      <path d="M-100 0 C-108 -50 -74 -100 -22 -106 C32 -112 90 -84 100 -32 L104 0Z" fill="url(#g-srock)" stroke={OL} strokeWidth="5" strokeLinejoin="round" />
      <path d="M-60 -70 Q-30 -94 6 -92" stroke="#a9c3cf" strokeWidth="9" fill="none" strokeLinecap="round" />
      <g fill="#f4efe2" stroke={OL} strokeWidth="2">{[[-40, -40], [-20, -60], [30, -50], [55, -30], [10, -80]].map(([x, y], i) => <path key={i} d={`M${x - 8} ${y + 6} L${x} ${y - 8} L${x + 8} ${y + 6}Z`} />)}</g>
      <Wavy c="#4caf6a" w={6} d="M-80 0 q-10 -30 4 -60 q10 -20 -2 -40" /><Wavy c="#4caf6a" w={5} d="M86 0 q10 -24 -2 -48" /></g> };
    case "anemone": {
      const ts = [-64, -50, -36, -22, -8, 6, 20, 34, 48, 62];
      return { front: <g>
        {ts.map((x, i) => <g key={x}><Wavy c={i % 2 ? "#c46fd8" : "#e58ad8"} w={9} d={`M${x * 0.7} -30 Q${x + (i % 2 ? 10 : -10)} -70 ${x * 1.15} -${92 + (i % 3) * 14}`} /><circle cx={x * 1.15} cy={-(92 + (i % 3) * 14)} r="7" fill="#ffd0f2" stroke={OL} strokeWidth="2.5" /></g>)}
        <Blob fill="#a24fbf" shapes={[["e", 0, -26, 60, 30]]} />
        <ellipse cx="0" cy="-34" rx="36" ry="9" fill="#c46fd8" /></g> };
    }
    case "coral": {
      const c1 = a && a.alt ? "#9b7bff" : "#ff7aa8", c2 = a && a.alt ? "#6fd3e8" : "#ffa64a";
      return { front: <g>
        <Coral x={-50} y={-10} c={c2} s={1.5} /><Coral x={44} y={-6} c={c1} s={1.6} /><Coral x={0} y={-30} c={c1} s={1.9} />
        <Blob fill={a && a.alt ? "#7a5ad8" : "#e8608c"} shapes={[["e", -40, -26, 42, 30], ["e", 30, -30, 50, 34], ["r", -90, -30, 180, 30, 14]]} />
        <g fill="#fff" opacity=".5"><circle cx="-50" cy="-36" r="5" /><circle cx="20" cy="-48" r="6" /><circle cx="60" cy="-30" r="4" /></g></g> };
    }
    case "cave": return { front: <g>
      <path d="M-120 0 C-126 -80 -80 -150 0 -154 C80 -150 126 -80 120 0Z" fill="url(#g-srock)" stroke={OL} strokeWidth="5" strokeLinejoin="round" />
      <path d="M-56 0 C-60 -60 -34 -100 0 -102 C34 -100 60 -60 56 0Z" fill="#14324a" stroke={OL} strokeWidth="4" />
      <path d="M-90 -100 Q-60 -136 -10 -140" stroke="#a9c3cf" strokeWidth="9" fill="none" strokeLinecap="round" />
      <Wavy c="#4caf6a" w={6} d="M96 0 q12 -30 -2 -64" /><Wavy c="#3f9a5c" w={5} d="M-100 0 q-10 -26 4 -50" /></g> };
    case "kelp": {
      const bl = [-50, -30, -10, 10, 30, 50];
      return { front: <g>
        <g className="mf-kelp">{bl.map((x, i) => <Wavy key={x} c={i % 2 ? "#5aa34a" : "#7bbf4f"} w={13} d={`M${x} 0 Q${x + (i % 2 ? 18 : -18)} -70 ${x} -${130 + (i % 3) * 30} Q${x + (i % 2 ? -14 : 14)} -${170 + (i % 3) * 30} ${x + 4} -${200 + (i % 3) * 30}`} />)}</g>
        <Blob fill="#4f9a43" shapes={[["e", -40, -32, 34, 40], ["e", 0, -40, 40, 44], ["e", 42, -32, 34, 38], ["r", -76, -38, 150, 38, 12]]} /></g> };
    }
    case "wreck": return { front: <g>
      <path d="M-150 0 L-140 -230 Q0 -250 140 -230 L150 0Z" fill="#8a5a32" stroke={OL} strokeWidth="5" strokeLinejoin="round" />
      <path d="M-146 -80 H146 M-143 -150 H143 M-60 -240 V0 M60 -240 V0" stroke="#6a4224" strokeWidth="4" />
      <circle cx="0" cy="-160" r="40" fill="#c9a24a" stroke={OL} strokeWidth="5" /><circle cx="0" cy="-160" r="30" fill="#14324a" />
      <circle cx="-100" cy="-110" r="18" fill="#c9a24a" stroke={OL} strokeWidth="4" /><circle cx="-100" cy="-110" r="11" fill="#14324a" />
      <Wavy c="#4caf6a" w={6} d="M120 0 q12 -40 -2 -80" /><Shell x={-120} y={-2} s={1.3} /></g> };
    case "chest": return {
      back: <g><path d="M-62 -62 L-56 -120 Q0 -136 56 -120 L62 -62Z" fill="#a8693a" stroke={OL} strokeWidth="4.5" strokeLinejoin="round" /><g fill="#ffd84a" stroke={OL} strokeWidth="2"><circle cx="-30" cy="-66" r="9" /><circle cx="-10" cy="-70" r="9" /><circle cx="14" cy="-66" r="9" /><circle cx="34" cy="-70" r="8" /></g></g>,
      front: <g><rect x="-66" y="-66" width="132" height="66" rx="8" fill="#b8763f" stroke={OL} strokeWidth="5" />
        <path d="M-66 -40 H66" stroke="#d9a650" strokeWidth="8" /><rect x="-12" y="-52" width="24" height="26" rx="4" fill="#ffd84a" stroke={OL} strokeWidth="3" />
        <path d="M-40 -66 V0 M40 -66 V0" stroke="#d9a650" strokeWidth="8" /><Shell x={84} y={-2} s={1.1} c="#ffc2d4" /></g> };
    default: return {};
  }
}
const SEA = (() => {
  const r = rng(11);
  const fishes = []; for (let i = 0; i < 9; i++) fishes.push({ x: r() * 2800, y: 330 + r() * 300, s: 0.6 + r() * 0.6, c: ["#ffb35a", "#ff7aa8", "#6fd3e8", "#ffd84a"][Math.floor(r() * 4)], d: r() * 10, dur: 16 + r() * 12 });
  const bubbles = []; for (let i = 0; i < 40; i++) bubbles.push({ x: r() * WW, y: 700 + r() * 180, r: 3 + r() * 7, d: r() * 8, dur: 5 + r() * 5 });
  const weeds = []; while (weeds.length < 60) { const x = r() * WW; weeds.push({ x, y: 700 + r() * 190, h: 30 + r() * 50, c: r() < 0.5 ? "#4caf6a" : "#6fbf5a" }); }
  const shells = []; for (let i = 0; i < 40; i++) shells.push({ x: r() * WW, y: 720 + r() * 170, s: 0.7 + r() * 0.7, c: ["#ffd9c2", "#ffc2d4", "#fff1d0"][Math.floor(r() * 3)] });
  const reef = []; for (let i = 0; i < 22; i++) reef.push({ x: 820 + r() * 860, y: 700 + r() * 60, c: ["#ff7aa8", "#ffa64a", "#9b7bff", "#ff6b6b"][Math.floor(r() * 4)], s: 0.7 + r() * 0.8 });
  const tallKelp = []; for (let x = 1700; x < 2420; x += 50 + r() * 40) tallKelp.push({ x, h: 260 + r() * 200 });
  const rocks = []; for (let x = -40; x < WW + 80; x += 110 + r() * 90) rocks.push({ x, h: 60 + r() * 90, w: 90 + r() * 80 });
  return { fishes, bubbles, weeds, shells, reef, tallKelp, rocks };
})();
const MiniFish = ({ c, s }) => (
  <g transform={`scale(${s})`}><path d="M12 0 L24 -9 L24 9Z" fill={c} stroke={OL} strokeWidth="2.5" strokeLinejoin="round" /><ellipse cx="0" cy="0" rx="16" ry="10" fill={c} stroke={OL} strokeWidth="2.5" /><circle cx="-7" cy="-2" r="2.5" fill={OL} /></g>
);
function SeaFar({ innerRef }) {
  return (
    <g ref={innerRef}>
      <g className="mf-rays">
        {[300, 900, 1500, 2100, 2700].map((x) => <polygon key={x} points={`${x},200 ${x + 90},200 ${x + 260},760 ${x + 120},760`} fill="url(#g-sray)" />)}
      </g>
      {SEA.rocks.map((k, i) => <path key={i} d={`M${k.x - k.w} 700 Q${k.x - k.w * 0.6} ${700 - k.h} ${k.x} ${690 - k.h} Q${k.x + k.w * 0.6} ${700 - k.h} ${k.x + k.w} 700Z`} fill="#4c9fc4" opacity=".55" />)}
      {[[400, 420], [1300, 380], [2300, 450]].map(([x, y], i) => (
        <g key={i} opacity=".35" fill="#1f6f99">{[0, 1, 2, 3, 4].map((j) => <path key={j} transform={`translate(${x + j * 34} ${y + (j % 2) * 18})`} d="M0 0 q10 -8 20 0 q-10 8 -20 0 M20 0 l8 -6 v12z" />)}</g>
      ))}
    </g>
  );
}
function SeaMid({ innerRef }) {
  return (
    <g ref={innerRef}>
      <path d={`M-200 700 C200 640 500 690 800 660 C1100 630 1400 680 1700 650 C2000 630 2300 670 2600 645 C2900 625 3100 655 ${WW + 200} 645 V900 H-200Z`} fill="#3f93b8" opacity=".7" />
      {SEA.fishes.map((f, i) => <g key={i} transform={`translate(${f.x} ${f.y})`}><g className="mf-swim" style={{ animationDelay: `-${f.d}s`, animationDuration: `${f.dur}s` }}><MiniFish c={f.c} s={f.s} /></g></g>)}
    </g>
  );
}
function SeaGround() {
  return (
    <g>
      <path d="M0 200 H3200 V232 Q3150 222 3100 232 T3000 232 T2900 232 T2800 232 T2700 232 T2600 232 T2500 232 T2400 232 T2300 232 T2200 232 T2100 232 T2000 232 T1900 232 T1800 232 T1700 232 T1600 232 T1500 232 T1400 232 T1300 232 T1200 232 T1100 232 T1000 232 T900 232 T800 232 T700 232 T600 232 T500 232 T400 232 T300 232 T200 232 T100 232 T0 232Z" fill="#c9f1ff" opacity=".7" />
      {DECOR_SEA_KELP}
      <path d="M0 700 C400 670 700 720 1000 690 C1400 660 1700 710 2000 700 C2400 690 2800 670 3200 690 V900 H0Z" fill="url(#g-sand)" />
      <path d="M60 760 q40 -10 80 0 M300 820 q40 -10 80 0 M1000 800 q40 -10 80 0 M1500 860 q40 -10 80 0 M2100 780 q40 -10 80 0 M2700 860 q40 -10 80 0 M2950 770 q40 -10 80 0" stroke="#d8b878" strokeWidth="4" fill="none" strokeLinecap="round" />
      {SEA.reef.map((c, i) => <Coral key={i} x={c.x} y={c.y} c={c.c} s={c.s} />)}
      {SEA.weeds.map((w, i) => <path key={i} className="mf-kelp" d={`M${w.x} ${w.y} q-8 -${w.h / 2} 0 -${w.h} M${w.x + 6} ${w.y} q8 -${w.h / 2.5} 2 -${w.h * 0.8}`} stroke={w.c} strokeWidth="5" fill="none" strokeLinecap="round" />)}
      {SEA.shells.map((s, i) => <Shell key={i} {...s} />)}
      <g transform="translate(2560 700)" opacity=".85"><path d="M0 0 L20 -260 M20 -230 L80 -200 M20 -180 L70 -160" stroke="#6a4224" strokeWidth="10" strokeLinecap="round" /><path d="M24 -250 Q60 -230 30 -200Z" fill="#e8dcc0" opacity=".7" /></g>
      <rect x="2350" y="200" width="850" height="700" fill="url(#g-deep)" />
      <Signpost x={40} y={740} label="Sunny Shallows" /><Signpost x={770} y={760} label="Coral Reef" /><Signpost x={1700} y={740} label="Kelp Forest" /><Signpost x={2440} y={740} label="Deep Blue" />
      {SEA.bubbles.map((b, i) => <circle key={i} className="mf-bubble" cx={b.x} cy={b.y} r={b.r} fill="none" stroke="#e9fbff" strokeWidth="2.2" style={{ animationDelay: `-${b.d}s`, animationDuration: `${b.dur}s` }} />)}
    </g>
  );
}
const DECOR_SEA_KELP = (
  <g>{SEA.tallKelp.map((k, i) => <path key={i} className="mf-kelp" d={`M${k.x} 720 Q${k.x + 30} ${720 - k.h * 0.4} ${k.x} ${720 - k.h * 0.7} Q${k.x - 26} ${720 - k.h * 0.9} ${k.x + 6} ${720 - k.h}`} stroke="#3f8a4a" strokeWidth="16" fill="none" strokeLinecap="round" opacity=".75" />)}</g>
);
function Bubble({ y, color }) {
  return (
    <g transform={`translate(0 ${y})`}>
      <g className="mf-paw">
        <circle r="40" fill="none" stroke="#ffe45c" strokeWidth="7" className="mf-paw-ring" />
        <circle r="31" fill="#e9fbff" stroke={OL} strokeWidth="4" />
        <path d="M-14 -14 a20 20 0 0 1 14 -8" stroke="#fff" strokeWidth="5" fill="none" strokeLinecap="round" />
        <text y="11" textAnchor="middle" fontFamily="'Baloo 2','Comic Sans MS',sans-serif" fontWeight="800" fontSize="34" fill={color} stroke={OL} strokeWidth="1.6">?</text>
      </g>
    </g>
  );
}

/* ================= savanna animal art (viewBox 0 0 100 100) ================= */
const MANE_PTS = (() => { const pts = []; for (let i = 0; i <= 24; i++) { const a = (i * Math.PI * 2) / 24, r = i % 2 ? 32 : 45; pts.push(`${(50 + Math.cos(a) * r).toFixed(1)},${(56 + Math.sin(a) * r * 0.95).toFixed(1)}`); } return pts.join(" "); })();
Object.assign(MAM, {
  lion: { fur: "#e3a74a", inner: "#fff0c4", muzzle: "#fff6dd", ear: "round", mw: 18, chest: true,
    earExtra: <polygon points={MANE_PTS} fill="#c67f2e" {...o} /> },
  cheetah: { fur: "#f0c878", inner: "#fff4da", muzzle: "#fff8e8", ear: "round", mw: 15, chest: true,
    face: <g fill="#2b1d16"><circle cx="30" cy="42" r="3" /><circle cx="70" cy="42" r="3" /><circle cx="22" cy="58" r="2.6" /><circle cx="78" cy="58" r="2.6" /><circle cx="36" cy="30" r="2.4" /><circle cx="64" cy="30" r="2.4" /><circle cx="50" cy="38" r="2.4" /><circle cx="26" cy="72" r="2.4" /><circle cx="74" cy="72" r="2.4" /></g>,
    extra: <path d="M41 58 Q39 66 37 74 M59 58 Q61 66 63 74" stroke="#2b1d16" strokeWidth="2.6" fill="none" strokeLinecap="round" /> },
  leopard: { fur: "#eab857", inner: "#fff2d0", muzzle: "#fff6e0", ear: "round", mw: 15, chest: true,
    face: <g fill="none" stroke="#5a3a1e" strokeWidth="2.4">{[[30, 38], [68, 36], [22, 56], [78, 56], [36, 70], [62, 72], [50, 30]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" />)}</g> },
  hyena: { fur: "#c9b183", inner: "#8a7a5c", muzzle: "#5a4e42", ear: "big", mw: 15, noSmile: true,
    face: <g fill="#5a4e38">{[[32, 36], [64, 34], [24, 58], [76, 58], [46, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="3.2" />)}</g>,
    extra: <path d="M43 70 q7 5 14 0" stroke="#efe6d8" strokeWidth="2" fill="none" strokeLinecap="round" /> },
  jackal: { fur: "#b4915e", inner: "#f3e0bb", muzzle: "#fff4e0", ear: "point", chest: true,
    earExtra: <g fill={OL}><path d="M20 10 L22.6 21 L29.5 15.5Z" /><path d="M80 10 L77.4 21 L70.5 15.5Z" /></g> },
  warthog: { fur: "#8d8068", inner: "#cdb89a", muzzle: "#e8d4b0", ear: "small", mw: 21,
    extra: <g><path d="M38 72 Q28 88 36 92 Q44 84 45 74Z" fill="#f4ead6" stroke={OL} strokeWidth="2" strokeLinejoin="round" /><path d="M62 72 Q72 88 64 92 Q56 84 55 74Z" fill="#f4ead6" stroke={OL} strokeWidth="2" strokeLinejoin="round" /><circle cx="33" cy="62" r="2.6" fill="#6e6252" /><circle cx="67" cy="62" r="2.6" fill="#6e6252" /></g> },
  meerkat: { fur: "#c9a876", inner: "#eadcc0", muzzle: "#f3ead0", ear: "small", mw: 14,
    face: <g fill="#4a3c2c"><ellipse cx="39" cy="55" rx="8" ry="10" /><ellipse cx="61" cy="55" rx="8" ry="10" /></g> },
  mongoose: { fur: "#a89a7a", inner: "#e8dcc0", muzzle: "#f3ead0", ear: "small", mw: 13 },
  baboon: { fur: "#8a6b4a", inner: "#5a4432", muzzle: "#e8a9a0", ear: "small", mw: 20 },
  buffalo: { fur: "#584938", inner: "#3a2e22", muzzle: "#7a6250", ear: "side", mw: 17,
    earExtra: <path d="M18 20 Q8 40 22 52 Q30 38 38 26 M82 20 Q92 40 78 52 Q70 38 62 26" fill="#3a3a3a" {...o} /> },
  gazelle: { fur: "#d9b579", inner: "#f6e3bd", muzzle: "#fdf1da", ear: "side", chest: true,
    earExtra: <path d="M40 32 Q36 18 42 6 M60 32 Q64 18 58 6" stroke="#6e5a3c" strokeWidth="5" strokeLinecap="round" fill="none" /> },
});
Object.assign(SPECIAL, {
  giraffe: () => (
    <g>
      <path d="M18 101 C18 86 30 80 50 80 C70 80 82 86 82 101Z" fill="#f0cf80" {...o} />
      <g fill="#c9933e" opacity=".85"><rect x="26" y="86" width="10" height="9" rx="2" /><rect x="46" y="88" width="11" height="9" rx="2" /><rect x="64" y="86" width="10" height="9" rx="2" /></g>
      <path d="M38 80 C34 50 36 24 44 4 L58 4 C64 24 64 50 60 80Z" fill="#f0cf80" {...o} />
      <g fill="#c9933e" opacity=".85">{[[42, 66], [54, 56], [44, 42], [56, 30], [46, 16]].map(([x, y], i) => <rect key={i} x={x} y={y} width="9" height="8" rx="2" />)}</g>
      <circle cx="50" cy="16" r="15" fill="#f0cf80" {...o} />
      <circle cx="42" cy="4" r="4" fill="#c9933e" {...o} /><circle cx="58" cy="4" r="4" fill="#c9933e" {...o} />
      <Eyes y={14} dx={9} r={4.4} /><Blush y={22} dx={14} />
      <path d="M45 24 q5 4 10 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  zebra: () => (
    <g>
      <path d="M18 101 C18 80 32 72 50 72 C68 72 82 80 82 101Z" fill="#fdfaf2" {...o} />
      <path d="M24 78 Q30 88 24 98 M44 74 Q50 86 44 100 M56 74 Q62 86 56 100 M76 78 Q82 88 76 98" stroke={OL} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M30 16 L22 2 L34 10Z M70 16 L78 2 L66 10Z" fill="#2b2b2f" {...o} />
      <ellipse cx="50" cy="46" rx="29" ry="25" fill="#fdfaf2" {...o} />
      <path d="M26 30 Q34 26 42 30 M58 30 Q66 26 74 30 M22 42 Q30 40 36 44 M64 44 Q70 40 78 42 M30 56 Q38 54 44 58 M56 58 Q62 54 70 56" stroke={OL} strokeWidth="2.4" fill="none" strokeLinecap="round" />
      <path d="M18 28 Q10 20 18 12 Q26 20 24 30Z M82 28 Q90 20 82 12 Q74 20 76 30Z" fill="#2b2b2f" {...o} />
      <Eyes y={44} dx={11} r={5} /><Blush y={56} dx={18} />
      <path d="M45 59 q5 4 10 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  elephant: () => (
    <g>
      <path d="M12 101 C12 78 30 70 50 70 C70 70 88 78 88 101Z" fill="#a9b0b8" {...o} />
      <ellipse cx="22" cy="76" rx="20" ry="26" fill="#9aa2aa" {...o} /><ellipse cx="78" cy="76" rx="20" ry="26" fill="#9aa2aa" {...o} />
      <ellipse cx="50" cy="48" rx="34" ry="30" fill="#b7bec5" {...o} />
      <path d="M42 66 Q36 86 44 98 Q50 100 50 92 Q46 80 50 66Z" fill="#b7bec5" {...o} />
      <Eyes y={46} dx={16} r={5.4} /><Blush y={58} dx={26} />
      <path d="M46 62 q4 3 8 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  hippo: () => (
    <g>
      <path d="M10 101 C10 82 28 76 50 76 C72 76 90 82 90 101Z" fill="#8fae7c" {...o} />
      <ellipse cx="24" cy="54" rx="13" ry="12" fill="#9fc08e" {...o} /><ellipse cx="76" cy="54" rx="13" ry="12" fill="#9fc08e" {...o} />
      <ellipse cx="50" cy="56" rx="38" ry="28" fill="#9fc08e" {...o} />
      <path d="M18 66 Q50 92 82 66 Q78 84 50 86 Q22 84 18 66Z" fill="#fff0da" {...o} />
      <path d="M30 68 l2 8 M42 72 l1 8 M58 72 l-1 8 M70 68 l-2 8" stroke={OL} strokeWidth="2" strokeLinecap="round" />
      <Eyes y={46} dx={17} r={5.4} /><Blush y={62} dx={26} />
    </g>
  ),
  rhino: () => (
    <g>
      <path d="M14 101 C14 80 30 72 50 72 C70 72 86 80 86 101Z" fill="#9a9a90" {...o} />
      <ellipse cx="26" cy="46" rx="11" ry="9" fill="#a8a89e" {...o} /><ellipse cx="74" cy="46" rx="11" ry="9" fill="#a8a89e" {...o} />
      <ellipse cx="50" cy="54" rx="33" ry="26" fill="#a8a89e" {...o} />
      <path d="M40 72 Q36 86 44 92 Q50 92 48 80 Q50 72 46 68Z" fill="#8a8a80" {...o} />
      <path d="M46 40 L50 16 L56 40Z" fill="#8a8a80" {...o} />
      <Eyes y={52} dx={15} r={5} /><Blush y={64} dx={24} />
      <path d="M44 70 q6 4 12 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  ostrich: () => (
    <g>
      <path d="M22 101 C20 78 30 64 50 64 C70 64 80 78 78 101Z" fill="#3a3a40" {...o} />
      <path d="M44 64 Q36 40 42 18 Q46 10 50 10 Q54 10 50 20 Q56 40 56 64Z" fill="#e8c27a" {...o} />
      <circle cx="50" cy="16" r="12" fill="#e8c27a" {...o} />
      <path d="M50 16 L68 14 L50 22Z" fill="#ff9a3c" {...o} />
      <Eyes y={13} dx={7} r={3.6} /><Blush y={19} dx={10} />
      <g fill="#55555e"><ellipse cx="34" cy="90" rx="6" ry="12" /><ellipse cx="66" cy="90" rx="6" ry="12" /></g>
    </g>
  ),
  vulture: () => (
    <g>
      <path d="M20 101 C16 72 28 50 50 50 C72 50 84 72 80 101Z" fill="#5a5a52" {...o} />
      <path d="M14 70 C8 50 16 32 28 28 C22 46 24 62 30 76Z" fill="#45453f" {...o} />
      <path d="M86 70 C92 50 84 32 72 28 C78 46 76 62 70 76Z" fill="#45453f" {...o} />
      <ellipse cx="50" cy="38" rx="22" ry="20" fill="#d9a06a" {...o} />
      <Eyes y={36} dx={10} r={4.6} /><Blush y={48} dx={16} />
      <path d="M38 48 L50 54 L38 58Z" fill="#8a6b4a" stroke={OL} strokeWidth="1.8" strokeLinejoin="round" />
    </g>
  ),
  crocodile: () => (
    <g>
      <path d="M6 82 L94 82 L80 100 L20 100Z" fill="#6fae5a" {...o} />
      <path d="M10 82 Q10 58 50 58 Q90 58 90 82Z" fill="#7fc06a" {...o} />
      <g stroke={OL} strokeWidth="1.6" fill="#5a9a48">{[18, 34, 50, 66, 82].map((x, i) => <path key={i} d={`M${x} 58 L${x - 6} 46 L${x + 6} 46Z`} />)}</g>
      <path d="M10 76 Q4 70 10 64 L26 64 Q30 70 28 76Z" fill="#7fc06a" {...o} />
      <g fill="#fff">{[14, 20, 26].map((x, i) => <rect key={i} x={x} y="64" width="4" height="7" />)}</g>
      <Eyes y={62} dx={13} r={5} ring /><Blush y={72} dx={20} />
      <path d="M30 78 Q50 86 70 78" stroke={OL} strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  ),
  flamingo: () => (
    <g>
      <ellipse cx="46" cy="70" rx="26" ry="24" fill="#ff8fc8" {...o} />
      <path d="M44 48 C36 34 40 16 52 6" stroke="#ff8fc8" strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M44 48 C36 34 40 16 52 6" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="54" cy="6" r="11" fill="#ff8fc8" {...o} />
      <path d="M54 6 L70 2 L62 12Z" fill="#ff6fa0" {...o} />
      <Eyes y={4} dx={6} r={3.4} />
      <ellipse cx="34" cy="98" rx="4" ry="10" fill="#ff6fa0" {...o} />
      <Blush y={72} dx={18} cx={46} />
    </g>
  ),
});

/* ================= the savanna world ================= */
const SAVANNA_OBJECTS = [
  { e: "🌾", one: "grass stalk", many: "grass stalks" },
  { e: "🪨", one: "pebble", many: "pebbles" },
  { e: "🦴", one: "bone", many: "bones" },
  { e: "🪶", one: "feather", many: "feathers" },
  { e: "🌻", one: "sunflower", many: "sunflowers" },
];
const SAVANNA_ANIMALS = [
  { id: "meerkat", name: "Meerkat", color: "#c9a876", hi: "Hello! I'm on watch!", anim: "bob", cover: "mound", x: 190, y: 800, s: 0.8 },
  { id: "mongoose", name: "Mongoose", color: "#a89a7a", hi: "Quick quick! Hello!", anim: "wiggle", cover: "rock", x: 343, y: 825, s: 0.8 },
  { id: "warthog", name: "Warthog", color: "#8d8068", hi: "Snort! Hello!", anim: "bob", cover: "bush", x: 496, y: 845 },
  { id: "jackal", name: "Jackal", color: "#b4915e", hi: "Yip! Hello, friend!", anim: "sway", cover: "grass", x: 649, y: 815 },
  { id: "gazelle", name: "Gazelle", color: "#d9b579", hi: "Boing! Hello!", anim: "hop", cover: "grass", x: 802, y: 795, s: 1.05 },
  { id: "ostrich", name: "Ostrich", color: "#e8c27a", hi: "Hello! I run so fast!", anim: "peck", cover: "bush", x: 955, y: 775, s: 1.1 },
  { id: "vulture", name: "Vulture", color: "#8a8a80", hi: "Hello! I watch from high!", anim: "blink", cover: "rock", x: 1108, y: 770 },
  { id: "baboon", name: "Baboon", color: "#8a6b4a", hi: "Ooh ooh! Hello!", anim: "wiggle", cover: "acacia", x: 1261, y: 800 },
  { id: "hyena", name: "Hyena", color: "#c9b183", hi: "Hee hee! Hello!", anim: "wiggle", cover: "rock", x: 1414, y: 825 },
  { id: "leopard", name: "Leopard", color: "#eab857", hi: "Hello! I love to climb!", anim: "sway", cover: "acacia", x: 1567, y: 790 },
  { id: "cheetah", name: "Cheetah", color: "#f0c878", hi: "Zoom! Hello!", anim: "hop", cover: "grass", x: 1720, y: 810 },
  { id: "lion", name: "Lion", color: "#e3a74a", hi: "Roar! I mean, hello!", anim: "sway", cover: "bush", x: 1873, y: 795, s: 1.1 },
  { id: "zebra", name: "Zebra", color: "#5a5a60", hi: "Hello! Count my stripes!", anim: "bob", cover: "grass", x: 2026, y: 800 },
  { id: "buffalo", name: "Buffalo", color: "#584938", hi: "Hello! I'm strong!", anim: "bob", cover: "mound", x: 2179, y: 835, s: 1.05 },
  { id: "giraffe", name: "Giraffe", color: "#f0cf80", hi: "Hello! I eat the tall leaves!", anim: "sway", cover: "acacia", x: 2332, y: 765, s: 1.05 },
  { id: "rhino", name: "Rhino", color: "#9a9a90", hi: "Hello! Look at my horn!", anim: "bob", cover: "dune", x: 2485, y: 840 },
  { id: "elephant", name: "Elephant", color: "#a9b0b8", hi: "Hello! I love the water!", anim: "sway", cover: "waterhole", x: 2638, y: 820, s: 1.05 },
  { id: "hippo", name: "Hippo", color: "#8fae7c", hi: "Hello! The water is cool!", anim: "float", cover: "waterhole", x: 2791, y: 850 },
  { id: "flamingo", name: "Flamingo", color: "#ff8fc8", hi: "Hello! I stand on one leg!", anim: "float", cover: "reeds", x: 2944, y: 790, s: 0.9 },
  { id: "crocodile", name: "Crocodile", color: "#6fae5a", hi: "Hello! Snap snap!", anim: "blink", cover: "waterhole", x: 3097, y: 865 },
];
const SAVANNA_COVERS = {
  grass: { dy: -38, clip: -14, paw: -100 },
  bush: { dy: -80, clip: -25, paw: -175 },
  rock: { dy: -72, clip: -25, paw: -150 },
  mound: { pop: true, hole: -90, paw: -170 },
  acacia: { pop: true, hole: -205, paw: -275 },
  dune: { dy: -14, clip: -22, paw: -110 },
  waterhole: { dy: -8, clip: -6, paw: -120 },
  reeds: { dy: -60, clip: -15, paw: -185 },
};
const Pebble = ({ x, y, s = 1, c = "#b9ac94" }) => (
  <ellipse cx={x} cy={y} rx={10 * s} ry={7 * s} fill={c} stroke={OL} strokeWidth="2" />
);
const SavGrass = ({ x, y, s }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 0 q-4 -12 -11 -18 M0 0 q0 -16 3 -26 M0 0 q5 -11 13 -16" stroke="#c9a84a" strokeWidth="3" fill="none" strokeLinecap="round" />
);
function savannaCover(type) {
  switch (type) {
    case "grass": {
      const blades = [-44, -30, -16, -2, 12, 26, 40];
      return { front: <g>
        {blades.map((x, i) => <path key={x} d={`M${x} 0 Q${x + (i % 2 ? 6 : -6)} -30 ${x + (i % 2 ? 10 : -10)} -${56 + (i % 3) * 10}`} stroke={i % 2 ? "#c9a84a" : "#dcc06a"} strokeWidth="6" fill="none" strokeLinecap="round" />)}
        <Blob fill="#d9b25e" shapes={[["e", -30, -12, 30, 20], ["e", 20, -14, 32, 22], ["r", -58, -16, 116, 16, 10]]} /></g> };
    }
    case "bush": return { front: <g>
      <Blob fill="#8a9a52" shapes={[["c", -56, -40, 40], ["c", 0, -64, 48], ["c", 56, -40, 38], ["r", -90, -42, 180, 42, 20]]} />
      <path d="M-30 -56 l6 -10 M-10 -70 l4 -10 M20 -66 l6 -10 M44 -50 l6 -10" stroke="#5a6a30" strokeWidth="2.4" fill="none" strokeLinecap="round" /></g> };
    case "rock": return { front: <g>
      <path d="M-96 0 C-102 -46 -70 -92 -18 -98 C30 -104 84 -78 92 -30 L96 0Z" fill="url(#g-rock)" stroke={OL} strokeWidth="5" strokeLinejoin="round" />
      <path d="M-56 -64 Q-28 -86 6 -84" stroke="#e6e9e3" strokeWidth="8" fill="none" strokeLinecap="round" />
      <Pebble x={-70} y={-4} s={0.8} /><Pebble x={66} y={-2} s={0.95} c="#c9b89a" /></g> };
    case "mound": return {
      back: <ellipse cx="0" cy="-8" rx="56" ry="18" fill="#7a5a38" />,
      front: <g><path d="M-70 0 Q-80 -70 -20 -110 Q10 -118 30 -108 Q76 -84 70 0Z" fill="url(#g-mound)" stroke={OL} strokeWidth="4.5" strokeLinejoin="round" />
        <circle cx="-8" cy="-66" r="8" fill="#4a3522" /><circle cx="20" cy="-86" r="6" fill="#4a3522" />
        <path d="M-40 -20 q10 -4 18 2 M10 -36 q10 -4 18 2" stroke="#5e4428" strokeWidth="2.4" fill="none" /></g> };
    case "acacia": return { front: <g>
      <path d="M-14 0 C-16 -70 -16 -170 -14 -230 L14 -230 C16 -170 16 -70 14 0Z" fill="url(#g-barkH)" stroke={OL} strokeWidth="5" strokeLinejoin="round" />
      <ellipse cx="0" cy="-205" rx="16" ry="20" fill="#5a3f26" stroke={OL} strokeWidth="3" /><ellipse cx="0" cy="-203" rx="11" ry="14" fill="#2a1a10" />
      <ellipse cx="0" cy="-260" rx="150" ry="36" fill="url(#g-acacia)" stroke={OL} strokeWidth="4.5" />
      <g fill="#7a9a4a" opacity=".55"><ellipse cx="-80" cy="-266" rx="30" ry="12" /><ellipse cx="60" cy="-270" rx="34" ry="12" /><ellipse cx="10" cy="-250" rx="26" ry="10" /></g></g> };
    case "dune": return { front: <g>
      <path d="M-100 0 Q-90 -36 0 -34 Q90 -36 100 0Z" fill="url(#g-sand)" stroke={OL} strokeWidth="4.5" />
      <Pebble x={-60} y={-6} s={0.8} /><Pebble x={56} y={-4} s={0.9} c="#e0cfa0" /></g> };
    case "waterhole": return { front: <g>
      <path d="M-98 -14 q24 -10 48 0 t48 0 t48 0 V14 H-98Z" fill="#6ca0c4" opacity=".95" />
      <path d="M-82 -4 q12 -6 24 0 M-12 -2 q12 -6 24 0 M48 -4 q12 -6 24 0" stroke="#dff3ff" strokeWidth="3" fill="none" strokeLinecap="round" /></g> };
    case "reeds": {
      const blades = [-50, -36, -22, -8, 6, 20, 34, 48];
      return { front: <g>
        {blades.map((x, i) => <path key={x} d={`M${x} 0 Q${x + (i % 2 ? 7 : -7)} -70 ${x + (i % 2 ? 12 : -10)} -${110 + (i % 3) * 18}`} stroke={i % 2 ? "#a08a3a" : "#c2a850"} strokeWidth="6" fill="none" strokeLinecap="round" />)}
        <Blob fill="#8a9a52" shapes={[["e", -36, -26, 30, 34], ["e", 0, -32, 34, 38], ["e", 38, -26, 30, 32], ["r", -66, -30, 132, 30, 12]]} /></g> };
    }
    default: return {};
  }
}
const SAV = (() => {
  const r = rng(23);
  const acacias = []; for (let x = -40; x < WW + 80; x += 140 + r() * 120) acacias.push({ x, y: 560 + r() * 20, s: 0.5 + r() * 0.35 });
  const grassTufts = []; while (grassTufts.length < 140) grassTufts.push({ x: r() * WW, y: 660 + r() * 220, s: 0.7 + r() * 0.7 });
  const pebbles = []; for (let i = 0; i < 30; i++) pebbles.push({ x: r() * WW, y: 760 + r() * 130, s: 0.6 + r() * 0.6 });
  const dust = []; for (let i = 0; i < 16; i++) dust.push({ x: 600 + r() * 1800, y: 300 + r() * 380, d: r() * 5 });
  return { acacias, grassTufts, pebbles, dust };
})();
function SavannaFar({ innerRef }) {
  return (
    <g ref={innerRef}>
      <circle cx="2500" cy="260" r="140" fill="url(#g-sun)" /><circle cx="2500" cy="260" r="36" fill="#fff6b8" />
      {[[200, 270, 0.9], [900, 250, 1], [1700, 290, 0.85], [2900, 300, 0.9]].map(([x, y, s], i) => <Cloud key={i} x={x} y={y} s={s} />)}
      <path d="M0 540 L300 460 L600 520 L950 440 L1300 510 L1700 450 L2050 520 L2400 460 L2750 520 L3200 470 V700 H0Z" fill="url(#g-mtn)" opacity=".7" />
      {SAV.acacias.map((t, i) => (
        <g key={i} transform={`translate(${t.x} ${t.y}) scale(${t.s})`} opacity=".75">
          <rect x="-4" y="-50" width="8" height="54" fill="#6e4a30" />
          <ellipse cy="-62" rx="56" ry="15" fill="#5f7a3e" />
        </g>
      ))}
      <rect x="-200" y="470" width={WW + 400} height="140" fill="url(#g-fog)" />
    </g>
  );
}
function SavannaMid({ innerRef }) {
  return (
    <g ref={innerRef}>
      <path d={`M-200 700 C200 650 500 690 800 665 C1100 640 1400 680 1700 660 C2000 640 2300 675 2600 655 C2900 635 3100 660 ${WW + 200} 655 V900 H-200Z`} fill="#d9c070" />
      {SAV.dust.map((d, i) => <circle key={i} className="mf-fly" cx={d.x} cy={d.y} r="3" fill="#fff6c8" style={{ animationDelay: `${d.d}s` }} />)}
    </g>
  );
}
function SavannaGround() {
  return (
    <g>
      <path d="M0 650 C400 610 700 665 1000 640 C1400 610 1700 655 2000 648 C2300 638 2600 615 3200 625 V900 H0Z" fill="url(#g-gold)" />
      <rect x="2560" y="0" width="640" height="900" fill="url(#g-dark)" opacity=".5" />
      {SAV.acacias.map((t, i) => (
        <g key={i} transform={`translate(${t.x + 40} 700) scale(${t.s + 0.2})`} opacity=".92">
          <rect x="-7" y="-40" width="14" height="44" fill="#6e4a30" />
          <ellipse cy="-58" rx="90" ry="22" fill="url(#g-acacia)" stroke={OL} strokeWidth="3" />
        </g>
      ))}
      <ellipse cx="2800" cy="800" rx="260" ry="80" fill="#8a7a4a" />
      <ellipse cx="2800" cy="800" rx="235" ry="64" fill="url(#g-water)" stroke="#e9f8ff" strokeWidth="4" />
      {SAV.grassTufts.map((g, i) => <SavGrass key={i} {...g} />)}
      {SAV.pebbles.map((p, i) => <Pebble key={i} {...p} />)}
      <Signpost x={40} y={720} label="Grassland" /><Signpost x={900} y={700} label="Acacia Grove" /><Signpost x={1900} y={700} label="Rocky Kopje" /><Signpost x={2560} y={690} label="Watering Hole" />
    </g>
  );
}


/* ================= Save the Deer (chase game) ================= */
// Gentle chase: the tiger only creeps closer on a wrong answer, never catches Dotty, and there is no timer.
const CHASE_STEPS = 7, GAP_MAX = 230, GAP_MIN = 160, GROUND = 362;
const DeerSide = () => (
  <g>
    <g className="leg2"><path d="M40 62 L36 90 M72 62 L78 90" stroke={OL} strokeWidth="9" strokeLinecap="round" /><path d="M40 62 L36 90 M72 62 L78 90" stroke="#b47640" strokeWidth="5" strokeLinecap="round" /></g>
    <g className="leg1"><path d="M48 62 L50 92 M64 62 L62 92" stroke={OL} strokeWidth="9" strokeLinecap="round" /><path d="M48 62 L50 92 M64 62 L62 92" stroke="#cc8b52" strokeWidth="5" strokeLinecap="round" /></g>
    <path d="M24 46 Q14 38 18 32 Q26 36 28 44Z" fill="#fff" {...o} />
    <ellipse cx="55" cy="52" rx="33" ry="17" fill="#cc8b52" {...o} />
    <path d="M30 60 Q55 72 82 58 Q76 68 55 69 Q36 69 30 60Z" fill="#f3dcc0" />
    <g fill="#fff" opacity=".9"><circle cx="44" cy="44" r="3" /><circle cx="56" cy="40" r="3" /><circle cx="66" cy="46" r="2.6" /><circle cx="50" cy="52" r="2.4" /></g>
    <path d="M76 44 L88 20 L100 26 L88 54Z" fill="#cc8b52" {...o} />
    <ellipse cx="86" cy="12" rx="10" ry="4.5" transform="rotate(-35 86 12)" fill="#cc8b52" {...o} />
    <ellipse cx="96" cy="24" rx="14" ry="11" fill="#cc8b52" {...o} />
    <ellipse cx="107" cy="29" rx="8" ry="6.5" fill="#f3dcc0" {...o} strokeWidth="2" />
    <circle cx="113" cy="27" r="2.6" fill="#2b1d16" />
    <ellipse cx="96" cy="21" rx="3.4" ry="4" fill="#2b1d16" /><circle cx="97.2" cy="19.6" r="1.3" fill="#fff" />
    <ellipse cx="99" cy="30" rx="3.5" ry="2" fill="#ff8f8f" opacity=".55" />
  </g>
);
const TigerSide = () => (
  <g>
    <Wavy c="#f29a3a" w={7} d="M22 48 Q4 44 8 26 Q10 16 20 18" />
    <path d="M12 38 l6 -3 M8 28 l6 1" stroke={OL} strokeWidth="2.6" strokeLinecap="round" />
    <g className="leg2"><path d="M38 64 L32 90 M80 64 L88 90" stroke={OL} strokeWidth="12" strokeLinecap="round" /><path d="M38 64 L32 90 M80 64 L88 90" stroke="#e08a2e" strokeWidth="7.5" strokeLinecap="round" /></g>
    <g className="leg1"><path d="M48 64 L50 92 M72 64 L70 92" stroke={OL} strokeWidth="12" strokeLinecap="round" /><path d="M48 64 L50 92 M72 64 L70 92" stroke="#f29a3a" strokeWidth="7.5" strokeLinecap="round" /></g>
    <ellipse cx="60" cy="54" rx="40" ry="19" fill="#f29a3a" {...o} />
    <path d="M30 62 Q60 76 92 60 Q86 72 60 73 Q38 73 30 62Z" fill="#fff6e6" />
    <path d="M40 37 q4 8 0 16 M52 35 q5 9 0 18 M64 35 q5 9 0 18 M76 37 q4 8 0 15" stroke={OL} strokeWidth="3.4" fill="none" strokeLinecap="round" />
    <circle cx="96" cy="26" r="7" fill="#f29a3a" {...o} /><circle cx="118" cy="24" r="7" fill="#f29a3a" {...o} />
    <circle cx="96" cy="26" r="3" fill="#ffd9b0" /><circle cx="118" cy="24" r="3" fill="#ffd9b0" />
    <circle cx="108" cy="40" r="20" fill="#f29a3a" {...o} />
    <path d="M100 22 q2 6 0 10 M108 21 v8 M116 22 q-2 6 0 10" stroke={OL} strokeWidth="2.6" fill="none" strokeLinecap="round" />
    <ellipse cx="117" cy="49" rx="12" ry="8.5" fill="#fff6e6" />
    <path d="M122 42 L130 42 L126 47Z" fill="#e8607a" stroke={OL} strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M126 47 v3 M120 51 q6 4 12 0" stroke={OL} strokeWidth="1.8" fill="none" strokeLinecap="round" />
    <ellipse cx="108" cy="36" rx="3.6" ry="4.2" fill="#2b1d16" /><circle cx="109.2" cy="34.6" r="1.4" fill="#fff" />
    <path d="M103 30 l8 2" stroke={OL} strokeWidth="2.2" strokeLinecap="round" />
    <ellipse cx="104" cy="47" rx="3.5" ry="2" fill="#ff8f8f" opacity=".5" />
  </g>
);
function ChaseScene({ deerX, tigerX, running, tigerRun, worried, tigerSay, won }) {
  return (
    <svg viewBox="0 0 800 420" className="mf-chase-svg" role="img" aria-label="Dotty the deer running home, the tiger chasing">
      <defs>
        <linearGradient id="c-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd9a0" /><stop offset="1" stopColor="#fff3d6" /></linearGradient>
        <linearGradient id="c-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a8d46a" /><stop offset="1" stopColor="#6fae4a" /></linearGradient>
        <linearGradient id="c-water" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6cc4ea" /><stop offset="1" stopColor="#3d9ccd" /></linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#c-sky)" />
      <circle cx="690" cy="80" r="44" fill="#fff0a8" /><circle cx="690" cy="80" r="70" fill="#fff0a8" opacity=".35" />
      <path d="M0 270 Q120 200 240 250 T480 240 T800 230 V420 H0Z" fill="#d9c27a" opacity=".7" />
      {[40, 130, 230, 330, 430, 520].map((x, i) => (
        <g key={x} transform={`translate(${x} 300) scale(${0.8 + (i % 3) * 0.15})`}><rect x="-6" y="-60" width="12" height="64" fill="#7a5a40" /><circle cy="-76" r="34" fill="#4f8f45" /><circle cx="-24" cy="-58" r="22" fill="#4f8f45" /><circle cx="24" cy="-58" r="22" fill="#4f8f45" /></g>
      ))}
      <rect y="320" width="800" height="100" fill="url(#c-grass)" />
      <path d="M0 360 Q200 346 400 358 T800 352" stroke="#e8cf98" strokeWidth="34" fill="none" strokeLinecap="round" />
      <path d="M600 300 Q590 360 612 420 L668 420 Q648 360 656 300Z" fill="url(#c-water)" stroke="#e9f8ff" strokeWidth="3" />
      <g><rect x="584" y="338" width="92" height="22" rx="4" fill="#b8854f" stroke={OL} strokeWidth="3" />
        <path d="M600 338 v22 M618 338 v22 M636 338 v22 M654 338 v22" stroke="#8a5a32" strokeWidth="2.5" />
        <path d="M586 338 V318 H674 V338" fill="none" stroke="#8a5a32" strokeWidth="5" strokeLinecap="round" /></g>
      <g transform="translate(760 262)"><svg x="-42" y="-10" width="84" height="84" viewBox="0 0 100 100" overflow="visible">{animalBody("deer")}</svg>
        <path d="M0 -26 c-6 -10 -20 -2 -10 8 l10 9 l10 -9 c10 -10 -4 -18 -10 -8z" fill="#ff7a9a" stroke={OL} strokeWidth="2" className="mf-heart" /></g>
      {[[700, 380, "#ff8fb1"], [760, 396, "#ffd84a"], [690, 404, "#fff"], [780, 372, "#b79bff"]].map(([x, y, c], i) => <Flower key={i} x={x} y={y} c={c} s={1.2} />)}
      <g className="mf-mover" style={{ transform: `translate(${tigerX}px, 0px)` }}>
        <g className={tigerRun ? "mf-run" : won ? "mf-sit" : ""}><svg x="-105" y={GROUND - 138} width="210" height="150" viewBox="0 0 140 100" overflow="visible"><TigerSide /></svg></g>
        {tigerSay && <g transform={`translate(50 ${GROUND - 170})`}><rect x="-4" y="-24" width={tigerSay.length * 13 + 22} height="34" rx="14" fill="#fff" stroke={OL} strokeWidth="3" /><text x="8" y="0" fontFamily="'Baloo 2','Comic Sans MS',sans-serif" fontWeight="800" fontSize="22" fill={OL}>{tigerSay}</text></g>}
      </g>
      <g className="mf-mover" style={{ transform: `translate(${deerX}px, 0px)` }}>
        <g className={running ? "mf-run" : ""}><svg x="-90" y={GROUND - 138} width="180" height="150" viewBox="0 0 120 100" overflow="visible"><DeerSide /></svg></g>
        {worried && <text x="34" y={GROUND - 142} className="mf-worry" fontFamily="'Baloo 2','Comic Sans MS',sans-serif" fontWeight="800" fontSize="34" fill="#e8413c" stroke={OL} strokeWidth="1.5">!</text>}
      </g>
      {[[90, 400], [300, 408], [470, 398]].map(([x, y], i) => <g key={i} transform={`translate(${x} ${y})`}><Blob fill="#5fa64c" sw={3} shapes={[["c", -18, -8, 16], ["c", 0, -16, 20], ["c", 18, -8, 15], ["r", -32, -10, 64, 14, 7]]} /></g>)}
    </svg>
  );
}
function ChaseGame({ p, onExit, onStep, recordAnswer, onWin }) {
  const [phase, setPhase] = useState("intro"); // intro | play | won
  const [step, setStep] = useState(0), [gap, setGap] = useState(GAP_MAX);
  const [ch, setCh] = useState(null), [qKey, setQKey] = useState(0);
  const [running, setRunning] = useState(false), [tigerRun, setTigerRun] = useState(false);
  const [worried, setWorried] = useState(false), [tigerSay, setTigerSay] = useState("");
  const [prompt, setPrompt] = useState("Tiger wants to catch Dotty!");
  const alive = useAlive(), timers = useRef([]);
  const later = (fn, ms) => { const t = setTimeout(() => alive.current && fn(), ms); timers.current.push(t); };
  useEffect(() => { promptListener = setPrompt; return () => { timers.current.forEach(clearTimeout); }; }, []);

  const deerX = step >= CHASE_STEPS ? 668 : 300 + step * 46;
  const tigerX = phase === "won" ? 500 : Math.max(60, deerX - gap);
  const skillPool = p.unlocked >= 3 ? ["count", "ba", "add", "ba"] : ["count", "ba"];
  function newQuestion() { setCh(makeChallenge(skillPool[rand(0, skillPool.length - 1)], p)); setQKey((k) => k + 1); }
  function start() {
    tone(660, 0.1); setStep(0); setGap(GAP_MAX); setPhase("play"); setTigerSay("");
    say("Oh no! Tiger wants to catch Dotty! Answer the questions to help Dotty run home!");
    later(newQuestion, 2600);
  }
  const hooves = () => [0, 0.12, 0.24, 0.36].forEach((d, i) => tone(i % 2 ? 330 : 392, 0.06, d, "triangle"));
  function onMiss() {
    tone(150, 0.3, 0, "sawtooth"); setTigerSay("Grr!"); setTigerRun(true); setWorried(true);
    setGap((g) => Math.max(GAP_MIN, g - 30));
    later(() => { setTigerRun(false); setTigerSay(""); }, 900); later(() => setWorried(false), 1400);
  }
  function onSolved({ misses }) {
    recordAnswer(ch.skill, misses);
    const ns = step + 1;
    later(() => {
      setStep(ns); setGap((g) => Math.min(GAP_MAX, g + 28)); setRunning(true); setTigerRun(true); hooves();
      later(() => { setRunning(false); setTigerRun(false); }, 950);
      if (ns >= CHASE_STEPS) {
        later(() => { onWin(); setPhase("won"); setTigerSay("Hmph!"); sparkle(); say("Dotty made it home! Thank you for helping Dotty! Tiger will try again another day."); }, 1100);
      } else {
        say(ns === CHASE_STEPS - 1 ? "Run, Dotty, run! Just one more!" : ["Run, Dotty, run!", "Hop hop! Dotty is getting away!", "Great! Keep going!"][ns % 3]);
        later(newQuestion, 1700);
      }
    }, 900);
  }
  const busyAnim = running;

  return (
    <div className="mf-chase">
      <header className="mf-chase-head">
        <button className="mf-mapbtn" onClick={() => { tone(600, 0.08); onExit(); }} aria-label="World map">🗺</button>
        <span className="mf-title">Save the Deer</span>
        <span className="mf-hooves" aria-label={`${step} of ${CHASE_STEPS} steps`}>{Array.from({ length: CHASE_STEPS }, (_, i) => <span key={i} className={`mf-hoof${i < step ? " on" : ""}`} />)}</span>
      </header>
      <div className="mf-chase-scene"><ChaseScene deerX={deerX} tigerX={tigerX} running={running} tigerRun={tigerRun} worried={worried} tigerSay={tigerSay} won={phase === "won"} /></div>
      <main className="mf-chase-panel">
        {phase === "intro" && (
          <div className="mf-center">
            <p className="mf-big">Help Dotty run home!</p>
            <p className="mf-soft">Every right answer helps Dotty run. Tiger can never catch her.</p>
            <button className="mf-btn go" onClick={start}>▶ Help Dotty</button>
          </div>
        )}
        {phase === "play" && (
          <>
            <div className="mf-prompt" aria-live="polite">
              <p className="mf-say">{prompt}</p>
              <button className="mf-speak" aria-label="Say it again" onClick={() => say(lastPrompt || prompt)}>🔊</button>
            </div>
            {ch && !busyAnim && (
              <div key={qKey}>
                {ch.skill === "count" && <CountActivity ch={ch} onStep={onStep} onSolved={onSolved} onMiss={onMiss} />}
                {ch.skill === "ba" && <BAActivity ch={ch} onStep={onStep} onSolved={onSolved} onMiss={onMiss} />}
                {ch.skill === "add" && <AddActivity ch={ch} onStep={onStep} onSolved={onSolved} onMiss={onMiss} />}
              </div>
            )}
          </>
        )}
        {phase === "won" && (
          <div className="mf-center">
            <p className="mf-big">Dotty is home safe!</p>
            <p className="mf-soft">You saved Dotty {(p.deerSaved || 0)} {(p.deerSaved || 0) === 1 ? "time" : "times"}.</p>
            <div className="mf-row center"><button className="mf-btn go" onClick={start}>Play again 🦌</button><button className="mf-btn ghost" onClick={onExit}>World map</button></div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ================= worlds ================= */
const WORLDS = {
  forest: { id: "forest", name: "Magical Forest", animals: FOREST_ANIMALS, covers: FOREST_COVERS, cover: forestCover, Far: ForestFar, Mid: ForestMid, Ground: ForestGround,
    sky: "url(#g-sky)", bg: "#bfe6f3", marker: "paw", objects: OBJECTS, back: "Back to the forest 🌳", place: "forest", hero: "fox",
    welcome: "Welcome to the forest! Swipe to explore. Tap a paw to find a hiding friend!" },
  sea: { id: "sea", name: "Under the Sea", animals: SEA_ANIMALS, covers: SEA_COVERS, cover: seaCover, Far: SeaFar, Mid: SeaMid, Ground: SeaGround,
    sky: "url(#g-sea)", bg: "#2a8fc4", marker: "bubble", objects: SEA_OBJECTS, back: "Back to the sea 🐚", place: "sea", hero: "clownfish",
    welcome: "Splash! Welcome under the sea! Swipe to swim. Tap a bubble to find a hiding friend!" },
  savanna: { id: "savanna", name: "Sunny Savanna", animals: SAVANNA_ANIMALS, covers: SAVANNA_COVERS, cover: savannaCover, Far: SavannaFar, Mid: SavannaMid, Ground: SavannaGround,
    sky: "url(#g-sky)", bg: "#f0d27a", marker: "paw", objects: SAVANNA_OBJECTS, back: "Back to the savanna 🦁", place: "savanna", hero: "lion",
    welcome: "Welcome to the savanna! Swipe to explore. Tap a paw to find a hiding friend!" },
};

function WorldDefs({ world }) {
  const lin = (id, a, b, h) => <linearGradient id={id} x1="0" y1="0" x2={h ? 1 : 0} y2={h ? 0 : 1}><stop offset="0" stopColor={a} /><stop offset="1" stopColor={b} /></linearGradient>;
  return (
    <defs>
      {lin("g-sky", "#8fd0ee", "#eef8e2")}{lin("g-leaf", "#8bcd62", "#4a9842")}{lin("g-leafD", "#72b858", "#3a7c3a")}{lin("g-leaf2", "#a0da70", "#5aa64a")}
      {lin("g-bark", "#a8774e", "#7a5234")}{lin("g-wood", "#f4d3a2", "#d9aa70")}{lin("g-rock", "#d6dad2", "#8d958c")}{lin("g-dirt", "#bf8b5c", "#8a5c36")}
      {lin("g-meadow", "#a8db78", "#62ab4b")}{lin("g-water", "#9bdcf4", "#3d9ccd")}{lin("g-mtn", "#bdd6de", "#9dbdc6")}{lin("g-hill", "#bfe58e", "#86c565")}
      {lin("g-sand", "#f7e2ad", "#dcb978")}{lin("g-srock", "#8fb0c0", "#5a7f92")}
      {lin("g-gold", "#f0d27a", "#c99a46")}{lin("g-acacia", "#8aab4f", "#4f7a34")}{lin("g-mound", "#c99a5e", "#8a6232")}
      <linearGradient id="g-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8ee0f5" /><stop offset=".3" stopColor="#4fb6dd" /><stop offset="1" stopColor="#1f6fa3" /></linearGradient>
      <linearGradient id="g-deep" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#0d2f5a" stopOpacity="0" /><stop offset=".35" stopColor="#0d2f5a" stopOpacity=".3" /><stop offset="1" stopColor="#0d2f5a" stopOpacity=".5" /></linearGradient>
      <linearGradient id="g-sray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity=".45" /><stop offset="1" stopColor="#ffffff" stopOpacity="0" /></linearGradient>
      <linearGradient id="g-barkH" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7a5234" /><stop offset=".5" stopColor="#a9784f" /><stop offset="1" stopColor="#704a2f" /></linearGradient>
      <linearGradient id="g-dark" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#1f4a2a" stopOpacity="0" /><stop offset=".15" stopColor="#1f4a2a" stopOpacity=".32" /><stop offset=".85" stopColor="#1f4a2a" stopOpacity=".32" /><stop offset="1" stopColor="#1f4a2a" stopOpacity="0" /></linearGradient>
      <linearGradient id="g-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffbe0" stopOpacity=".6" /><stop offset="1" stopColor="#fffbe0" stopOpacity="0" /></linearGradient>
      <linearGradient id="g-fog" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" stopOpacity="0" /><stop offset="1" stopColor="#f4fbef" stopOpacity=".85" /></linearGradient>
      <radialGradient id="g-sun"><stop offset="0" stopColor="#fff7c2" /><stop offset=".35" stopColor="#fff2a0" stopOpacity=".8" /><stop offset="1" stopColor="#fff2a0" stopOpacity="0" /></radialGradient>
      {world.animals.map((a) => { const c = world.covers[a.cover]; return c.pop ? null : <clipPath key={a.id} id={`clip-${a.id}`}><rect x="-300" y="-1000" width="600" height={1000 + c.clip} /></clipPath>; })}
    </defs>
  );
}
function Spot({ a, world, found, fresh, onOpen, onHello }) {
  const cv = world.covers[a.cover], parts = world.cover(a.cover, a), S = 120 * (a.s || 1);
  const Marker = world.marker === "bubble" ? Bubble : Paw;
  return (
    <g transform={`translate(${a.x} ${a.y})`} className="mf-spotg" onClick={() => (found ? onHello(a) : onOpen(a))}
      role="button" tabIndex={0} aria-label={found ? a.name : "Someone is hiding here"} onKeyDown={(e) => { if (e.key === "Enter") found ? onHello(a) : onOpen(a); }}>
      {parts.back}
      {found && !cv.pop && (
        <g clipPath={`url(#clip-${a.id})`}><g className={fresh ? "mf-rise" : ""}><g className={`mf-idle ${a.anim}`}>
          <svg x={-S / 2} y={cv.dy - S} width={S} height={S} viewBox="0 0 100 100" overflow="visible">{animalBody(a.id)}</svg>
        </g></g></g>
      )}
      {parts.front}
      {found && cv.pop && (
        <g className={fresh ? "mf-popin" : ""}><g className={`mf-idle ${a.anim}`}>
          <svg x={-S * 0.34} y={cv.hole + 26 - S * 0.68} width={S * 0.68} height={S * 0.68} viewBox="0 0 100 100" overflow="visible">{animalBody(a.id)}</svg>
        </g></g>
      )}
      {!found && <Marker y={cv.pop ? cv.hole - 80 : cv.paw} color={a.color} />}
    </g>
  );
}

/* ================= overlays ================= */
function Sheet({ a, world, phase, ch, onStep, onSolved, onClose, onBack, progress, prompt, extraLine, allDone }) {
  return (
    <div className="mf-back" onClick={(e) => { if (e.target === e.currentTarget && phase === "ask") onClose(); }}>
      <div className="mf-sheet" style={{ "--theme": a.color }} role="dialog" aria-label={phase === "ask" ? "Question" : a.name}>
        <button className="mf-x" onClick={phase === "ask" ? onClose : onBack} aria-label="Close">✕</button>
        {phase === "ask" && ch && (
          <>
            <div className="mf-peek"><AnimalSvg id={a.id} className="mf-silhouette" /><span className="mf-q">?</span></div>
            <div className="mf-prompt" aria-live="polite">
              <p className="mf-say">{prompt}</p>
              <button className="mf-speak" aria-label="Say it again" onClick={() => say(lastPrompt || prompt)}>🔊</button>
            </div>
            {ch.skill === "count" && <CountActivity ch={ch} onStep={onStep} onSolved={onSolved} />}
            {ch.skill === "ba" && <BAActivity ch={ch} onStep={onStep} onSolved={onSolved} />}
            {ch.skill === "order" && <OrderActivity ch={ch} progress={progress} onStep={onStep} onSolved={onSolved} />}
            {ch.skill === "add" && <AddActivity ch={ch} onStep={onStep} onSolved={onSolved} />}
          </>
        )}
        {phase === "found" && (
          <div className="mf-found">
            <div className="mf-burst" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i} style={{ "--a": `${i * 30}deg` }} />)}</div>
            <button className="mf-hero" onClick={() => { tone(880, 0.12); say(a.hi); }} aria-label={a.name}><AnimalSvg id={a.id} /></button>
            <p className="mf-big">{allDone ? "You found everyone!" : `You found ${a.name}!`}</p>
            {extraLine && <p className="mf-soft">{extraLine}</p>}
            <button className="mf-btn go" onClick={onBack}>{world.back}</button>
          </div>
        )}
      </div>
    </div>
  );
}
function StickerBook({ world, found, onClose }) {
  return (
    <div className="mf-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mf-sheet book" role="dialog" aria-label="Sticker book">
        <button className="mf-x" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="mf-h2">{world.name} friends <span>{found.length} / {world.animals.length}</span></h2>
        <div className="mf-stickers">
          {world.animals.map((a) => {
            const got = found.includes(a.id);
            return (
              <button key={a.id} className={`mf-sticker${got ? " got" : ""}`} style={{ "--theme": a.color }} onClick={() => say(got ? `${a.name}! ${a.hi}` : `Who is this? Find them in the ${world.place}!`)} aria-label={got ? a.name : "Not found yet"}>
                <AnimalSvg id={a.id} className={got ? "" : "mf-silhouette"} />
                <span>{got ? a.name : "?"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
function GrownUps({ p, setP, onClose }) {
  const [confirm, setConfirm] = useState(false);
  const weak = Object.entries(p.weak).filter(([, w]) => w > 0).sort((x, y) => y[1] - x[1]).slice(0, 3).map(([n]) => n);
  const hide = (id) => setP({ ...p, foundBy: { ...p.foundBy, [id]: [] } });
  const hideDinos = () => setP({ ...p, dinos: [] });
  return (
    <div className="mf-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mf-sheet plain" role="dialog" aria-label="Grown-ups">
        <button className="mf-x" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="mf-h2">Grown-ups</h2>
        <table className="mf-table">
          <thead><tr><th>Skill</th><th>First try (last 8)</th><th>Status</th></tr></thead>
          <tbody>{SKILLS.map((s, i) => { const h = p.hist[s].slice(-8); return (
            <tr key={s}><td>{SKILL_NAMES[s]}</td><td>{h.length ? `${Math.round(ratio(h) * 100)}% of ${h.length}` : "–"}</td><td>{mastered(p, s) ? "Confident" : i <= p.unlocked ? "Practising" : "Coming next"}</td></tr>); })}</tbody>
        </table>
        <p className="mf-note"><strong>Numbers to watch:</strong> {weak.length ? weak.join(", ") : "none yet"}</p>
        <p className="mf-note"><strong>Friends found:</strong> {Object.values(WORLDS).map((w) => `${w.name} ${(p.foundBy[w.id] || []).length}/${w.animals.length}`).join(" · ")} · Dino Egg Rescue {(p.dinos || []).length}/{DINO_IDS.length} · Number Drive level {(p.driveLevel || 0) + 1}</p>
        <div className="mf-focus"><span className="mf-label">Practise</span>
          {["auto", ...SKILLS].map((f) => <button key={f} className="mf-pill" aria-pressed={p.focus === f} onClick={() => setP({ ...p, focus: f })}>{f === "auto" ? "Auto" : SKILL_NAMES[f]}</button>)}
        </div>
        <p className="mf-note">Auto starts with counting and before/after, then ordering 1–10, then adding, then mixed review. Numbers she misses come up more often. Maths progress is shared across both worlds.</p>
        <div className="mf-row">
          <button className="mf-btn small ghost" onClick={() => hide("forest")}>Hide forest animals again</button>
          <button className="mf-btn small ghost" onClick={() => hide("sea")}>Hide sea animals again</button>
          <button className="mf-btn small ghost" onClick={() => hide("savanna")}>Hide savanna animals again</button>
          <button className="mf-btn small ghost" onClick={hideDinos}>Hide dinos again</button>
          {!confirm ? <button className="mf-btn small ghost" onClick={() => setConfirm(true)}>Reset all progress</button>
            : <button className="mf-btn small danger" onClick={() => { setP(defaultProgress()); setConfirm(false); }}>Yes, reset everything</button>}
        </div>
      </div>
    </div>
  );
}
function WorldMap({ p, onPick, onGrown, onExit }) {
  const press = useRef(null);
  return (
    <div className="mf-map">
      <div className="mf-map-head">
        <span className="mf-top-l">
          {onExit && <button className="mf-mapbtn" onClick={() => { tone(600, 0.08); onExit(); }} aria-label="Back to Number Garden">🏡</button>}
          <h1 className="mf-map-title">Where shall we go?</h1>
        </span>
        <button className="mf-gear" aria-label="Grown-ups (press and hold)" onPointerDown={() => { press.current = setTimeout(onGrown, 900); }}
          onPointerUp={() => clearTimeout(press.current)} onPointerLeave={() => clearTimeout(press.current)} onKeyDown={(e) => { if (e.key === "Enter") onGrown(); }}>⚙</button>
      </div>
      {Object.values(WORLDS).map((w) => {
        const n = (p.foundBy[w.id] || []).length;
        const peeks = w.animals.slice(0, 4).map((a) => a.id);
        return (
          <button key={w.id} className={`mf-world-card ${w.id}`} onClick={() => onPick(w.id)} aria-label={`${w.name}, ${n} of ${w.animals.length} found`}>
            <span className="mf-card-art" aria-hidden="true">
              <AnimalSvg id={w.hero} className="mf-card-hero" />
              <span className="mf-card-peeks">{peeks.map((id) => <AnimalSvg key={id} id={id} className={(p.foundBy[w.id] || []).includes(id) ? "" : "mf-silhouette"} />)}</span>
            </span>
            <span className="mf-card-name">{w.name}</span>
            <span className="mf-card-count">{n} / {w.animals.length} friends</span>
          </button>
        );
      })}
      <button className="mf-world-card chase" onClick={() => onPick("deer")} aria-label={`Save the Deer, saved ${p.deerSaved || 0} times`}>
        <span className="mf-card-art" aria-hidden="true">
          <svg className="mf-card-chase" viewBox="0 0 280 110" overflow="visible">
            <svg x="0" y="10" width="140" height="100" viewBox="0 0 140 100" overflow="visible"><TigerSide /></svg>
            <svg x="160" y="10" width="120" height="100" viewBox="0 0 120 100" overflow="visible"><DeerSide /></svg>
          </svg>
        </span>
        <span className="mf-card-name">Save the Deer</span>
        <span className="mf-card-count">Saved {p.deerSaved || 0} {(p.deerSaved || 0) === 1 ? "time" : "times"}</span>
      </button>
      <button className="mf-world-card dino" onClick={() => onPick("dino")} aria-label={`Dino Egg Rescue, ${(p.dinos || []).length} of ${DINO_IDS.length} dinos found`}>
        <span className="mf-card-art" aria-hidden="true">
          <DinoSvg id={DINO_IDS[0]} className="mf-card-hero" />
          <span className="mf-card-peeks">{DINO_IDS.slice(0, 4).map((id) => <DinoSvg key={id} id={id} className={(p.dinos || []).includes(id) ? "" : "mf-silhouette"} />)}</span>
        </span>
        <span className="mf-card-name">Dino Egg Rescue</span>
        <span className="mf-card-count">{(p.dinos || []).length} / {DINO_IDS.length} dinos</span>
      </button>
      <button className="mf-world-card drive" onClick={() => onPick("drive")} aria-label={`Number Drive Adventure, level ${(p.driveLevel || 0) + 1}, ${p.driveRounds || 0} drives completed`}>
        <span className="mf-card-art" aria-hidden="true">
          <svg className="mf-card-chase" viewBox="0 0 280 110" overflow="visible">
            <svg x="40" y="10" width="200" height="100" viewBox="-70 -60 140 100" overflow="visible">
              <path d="M-58 18 Q-58 -8 -30 -10 L-10 -34 Q6 -42 24 -34 L40 -10 Q62 -8 62 18Z" fill="#e3443a" stroke={OL} strokeWidth="3" strokeLinejoin="round" />
              <circle cx="-32" cy="22" r="13" fill="#2b1d16" stroke={OL} strokeWidth="2" /><circle cx="32" cy="22" r="13" fill="#2b1d16" stroke={OL} strokeWidth="2" />
              <ellipse cx="0" cy="-16" rx="17" ry="14" fill="#cc8b52" stroke={OL} strokeWidth="2.6" />
              <Eyes y={-18} dx={6} r={3} cx={0} /><Blush y={-11} dx={10} cx={0} />
            </svg>
          </svg>
        </span>
        <span className="mf-card-name">Number Drive Adventure</span>
        <span className="mf-card-count">Level {(p.driveLevel || 0) + 1} · {p.driveRounds || 0} drives</span>
      </button>
    </div>
  );
}

// Shared surface for other adventure screens (currently just DinoRescue.jsx)
// that want the same audio/voice helpers, skill engine, hint-driven
// activities, and art primitives Forest/Sea/Savanna/Chase already use —
// purely additive, every existing internal call site above is untouched.
export {
  tone, chime, soft, sparkle, say, subscribePrompt, getLastPrompt,
  makeChallenge, planSession,
  BAActivity, OrderActivity, AddActivity,
  OL, Eyes, Blush, Blob, Wavy, rng, Cloud, Signpost,
};

/* ================= app ================= */
export default function MagicalForest({ onExit } = {}) {
  const [p, setP] = useState(loadProgress);
  const [worldId, setWorldId] = useState(null);
  const [open, setOpen] = useState(null); // {a, phase, ch, key}
  const [fresh, setFresh] = useState(null);
  const [book, setBook] = useState(false), [grown, setGrown] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [h, setH] = useState(600), [scrolled, setScrolled] = useState(false);
  const [visit, setVisit] = useState(0);
  const worldRef = useRef(null), farRef = useRef(null), midRef = useRef(null), queue = useRef([]), press = useRef(null);
  const pRef = useRef(p); pRef.current = p;
  const W = worldId ? WORLDS[worldId] : null;
  const found = W ? p.foundBy[worldId] || [] : [];

  useEffect(() => { safeSet(PKEY, JSON.stringify(p)); }, [p]);
  useEffect(() => { promptListener = setPrompt; return () => { promptListener = null; }; }, []);
  useEffect(() => {
    const el = worldRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setH(el.clientHeight)); ro.observe(el); setH(el.clientHeight);
    return () => ro.disconnect();
  }, [worldId]);
  const onScroll = () => {
    const el = worldRef.current; if (!el) return;
    const s = el.scrollLeft * (VH / el.clientHeight);
    farRef.current && farRef.current.setAttribute("transform", `translate(${(s * 0.55).toFixed(1)} 0)`);
    midRef.current && midRef.current.setAttribute("transform", `translate(${(s * 0.28).toFixed(1)} 0)`);
    if (!scrolled && el.scrollLeft > 40) setScrolled(true);
  };
  function pickWorld(id) { tone(660, 0.1); setWorldId(id); if (!WORLDS[id]) return; setScrolled(false); setFresh(null); say(WORLDS[id].welcome); }
  function nextSkill() { if (!queue.current.length) queue.current = planSession(pRef.current); return queue.current.shift(); }
  function openSpot(a) { if (open) return; tone(660, 0.1); setOpen({ a, phase: "ask", ch: makeChallenge(nextSkill(), pRef.current, W.objects), key: Date.now() }); }
  const onStep = (num, missed, isOrder) => setP((prev) => {
    const weak = { ...prev.weak, [num]: missed ? (prev.weak[num] || 0) + 1 : Math.max(0, (prev.weak[num] || 0) - 1) };
    const streak = isOrder ? { ...prev.streak, [num]: missed ? 0 : (prev.streak[num] || 0) + 1 } : prev.streak;
    return { ...prev, weak, streak };
  });
  function onSolved({ misses }) {
    const skill = open.ch.skill, a = open.a, wid = worldId;
    const firstTry = skill === "order" ? misses <= 1 : misses === 0;
    setP((prev) => { const np = { ...prev, hist: { ...prev.hist, [skill]: [...prev.hist[skill], firstTry].slice(-10) } }; np.unlocked = nextUnlocked(np); return np; });
    setVisit((v) => v + 1);
    setTimeout(() => {
      setOpen((cur) => (cur && cur.a.id === a.id ? { ...cur, phase: "found" } : cur)); sparkle();
      const last = (pRef.current.foundBy[wid] || []).length + 1 >= WORLDS[wid].animals.length;
      say(last ? `You found ${a.name}! You found every friend in the ${WORLDS[wid].place}!` : `You found ${a.name}! ${a.hi}`);
    }, 1300);
  }
  function backToWorld() {
    const a = open.a, wid = worldId; setOpen(null);
    setP((prev) => { const cur = prev.foundBy[wid] || []; return cur.includes(a.id) ? prev : { ...prev, foundBy: { ...prev.foundBy, [wid]: [...cur, a.id] } }; });
    setFresh(a.id);
    const el = worldRef.current;
    if (el) { const k = el.clientHeight / VH; el.scrollTo({ left: a.x * k - el.clientWidth / 2, behavior: "smooth" }); }
    setTimeout(() => say(a.hi), 700);
  }
  function hello(a) { tone(880, 0.12); say(`${a.name}! ${a.hi}`); setFresh(null); requestAnimationFrame(() => setFresh(a.id)); }

  function recordAnswer(skill, misses) {
    const firstTry = misses === 0;
    setP((prev) => { const np = { ...prev, hist: { ...prev.hist, [skill]: [...prev.hist[skill], firstTry].slice(-10) } }; np.unlocked = nextUnlocked(np); return np; });
  }
  if (worldId === "deer") return (
    <div className="mf-app" style={{ background: "#fff3d6" }}>
      <ChaseGame p={p} onStep={onStep} recordAnswer={recordAnswer} onExit={() => setWorldId(null)}
        onWin={() => setP((prev) => ({ ...prev, deerSaved: (prev.deerSaved || 0) + 1 }))} />
    </div>
  );
  if (worldId === "dino") return (
    <div className="mf-app" style={{ background: "#cdeedd" }}>
      <DinoRescue p={p} onStep={onStep} recordAnswer={recordAnswer} onExit={() => setWorldId(null)}
        onHatch={(id) => setP((prev) => { const dinos = prev.dinos || []; return dinos.includes(id) ? prev : { ...prev, dinos: [...dinos, id] }; })}
        onRoundDone={() => setP((prev) => ({ ...prev, dinoRescued: (prev.dinoRescued || 0) + 1 }))} />
    </div>
  );
  if (worldId === "drive") return (
    <div className="mf-app" style={{ background: "#cdeedd" }}>
      <NumberDriveAdventure p={p} onStep={onStep} recordAnswer={recordAnswer} onExit={() => setWorldId(null)}
        onLevelUp={() => setP((prev) => ({ ...prev, driveLevel: (prev.driveLevel || 0) + 1 }))}
        onRoundDone={() => setP((prev) => ({ ...prev, driveRounds: (prev.driveRounds || 0) + 1 }))} />
    </div>
  );
  if (!W) return (
    <div className="mf-app" style={{ background: "#fff6e0" }}>
      <WorldMap p={p} onPick={pickWorld} onGrown={() => setGrown(true)} onExit={onExit} />
      {grown && <GrownUps p={p} setP={setP} onClose={() => setGrown(false)} />}
    </div>
  );

  const width = Math.round((h * WW) / VH);
  const isAll = open && open.phase === "found" && !found.includes(open.a.id) && found.length + 1 >= W.animals.length;
  const extra = open && open.phase === "found" ? (isAll ? "Press and hold the gear to hide them again." : visit === 6 ? "Six friends today! Maybe a little rest, then explore more later." : "") : "";
  const sorted = [...W.animals].sort((x, y) => x.y - y.y);
  const { Far, Mid, Ground } = W;

  return (
    <div className={`mf-app w-${W.id}`} style={{ background: W.bg }}>
      <div className="mf-world" key={W.id} ref={worldRef} onScroll={onScroll}>
        <svg width={width} height={h} viewBox={`0 ${VY} ${WW} ${VH}`} preserveAspectRatio="xMinYMax meet" className="mf-svg" role="img" aria-label={W.name}>
          <WorldDefs world={W} />
          <rect x="0" y="0" width={WW} height={WH} fill={W.sky} />
          <Far innerRef={farRef} />
          <Mid innerRef={midRef} />
          <Ground />
          {sorted.map((a) => <Spot key={a.id} a={a} world={W} found={found.includes(a.id)} fresh={fresh === a.id} onOpen={openSpot} onHello={hello} />)}
        </svg>
      </div>

      <header className="mf-top">
        <div className="mf-top-l">
          <button className="mf-mapbtn" onClick={() => { tone(600, 0.08); setWorldId(null); setOpen(null); }} aria-label="World map">🗺</button>
          <span className="mf-title">{W.name}</span>
        </div>
        <div className="mf-top-r">
          <button className="mf-bookbtn" onClick={() => { tone(700, 0.08); setBook(true); }} aria-label="Sticker book">📖 <b>{found.length}</b>/{W.animals.length}</button>
          <button className="mf-gear" aria-label="Grown-ups (press and hold)"
            onPointerDown={() => { press.current = setTimeout(() => setGrown(true), 900); }}
            onPointerUp={() => clearTimeout(press.current)} onPointerLeave={() => clearTimeout(press.current)}
            onKeyDown={(e) => { if (e.key === "Enter") setGrown(true); }}>⚙</button>
        </div>
      </header>

      {!scrolled && !open && <div className="mf-swipe" aria-hidden="true">👉</div>}

      {open && <Sheet key={open.key} a={open.a} world={W} phase={open.phase} ch={open.ch} onStep={onStep} onSolved={onSolved} progress={p}
        onClose={() => { setOpen(null); say("Come back soon!"); }} onBack={backToWorld} prompt={prompt} extraLine={extra} allDone={isAll} />}
      {book && <StickerBook world={W} found={found} onClose={() => setBook(false)} />}
      {grown && <GrownUps p={p} setP={setP} onClose={() => setGrown(false)} />}
    </div>
  );
}
