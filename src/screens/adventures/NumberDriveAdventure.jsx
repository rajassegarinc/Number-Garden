// NumberDriveAdventure.jsx — "Number Drive Adventure": a baby deer drives a red
// convertible along a winding road, answering number questions (1–10) to move
// forward to the finish line. Primary skill: ordering numbers smallest-first,
// with the round length growing from 2 numbers up to the full 1–10 range as
// the player's drive level rises. Secondary checkpoints reuse the shared
// before/after and addition activities from MagicalForest.jsx, plus a small
// "missing number" checkpoint defined here. Five unlockable road themes are
// purely cosmetic re-skins of one scene. No timers, no losing — wrong answers
// trigger a brief, gentle roadside mishap (haystack / mud / roadblock) and the
// same question is kept so the child can simply try again.
// Rendered from inside MagicalForest.jsx exactly like ChaseGame ("Save the
// Deer") and DinoRescue — same `.mf-chase*` shell classes, no new chrome.
// Usage: <NumberDriveAdventure p={progress} onStep={fn} recordAnswer={fn}
//   onExit={fn} onLevelUp={fn} onRoundDone={fn} />
import { useEffect, useRef, useState } from "react";
import {
  tone, chime, soft, sparkle, say, subscribePrompt, getLastPrompt,
  makeChallenge,
  BAActivity, AddActivity,
  OL, Eyes, Blush, Blob, Cloud, Signpost,
} from "./MagicalForest.jsx";
import "./NumberDriveAdventure.css";

/* ================= tiny local helpers (not exported elsewhere) ================= */
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const choicesFor = (ans, lo = 1, hi = 10) => { const set = new Set([ans]); for (const x of shuffle([ans - 1, ans + 1, ans - 2, ans + 2])) { if (set.size >= 3) break; if (x >= lo && x <= hi) set.add(x); } return shuffle([...set]); };
function useAlive() { const r = useRef(true); useEffect(() => { r.current = true; return () => { r.current = false; }; }, []); return r; }
const PRAISE = ["Yes!", "Vroom, great driving!", "You found it!", "That's it!", "Lovely steering!"];
const pickPraise = () => PRAISE[rand(0, PRAISE.length - 1)];

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

/* ================= progression ================= */
const ROUTE_SKILLS = ["order", "ba", "order", "missing", "order", "add"];
const ORDER_LENGTHS = [2, 2, 3, 3, 4, 5, 6, 7, 8, 10];
const lengthForLevel = (level) => ORDER_LENGTHS[Math.min(Math.max(level, 0), ORDER_LENGTHS.length - 1)];
const ENV_IDS = ["forest", "bridge", "beach", "mountain", "cloud"];
const ENV_META = {
  forest: { name: "Forest Road", sky: ["#bfe8cf", "#eef8e2"], ground: ["#a8d46a", "#6fae4a"], road: "#c9a24a", line: "#fff4df", props: ["pine", "bush", "pine", "bush"] },
  bridge: { name: "Rainbow Bridge Road", sky: ["#d7ecff", "#fff2fa"], ground: ["#bfe2c9", "#8fcf9f"], road: "#d9a26a", line: "#fff4df", props: ["flower", "bush", "flower", "flower"] },
  beach: { name: "Beach Road", sky: ["#bdeeff", "#fff7dc"], ground: ["#f3e0a8", "#e9c876"], road: "#d8c38d", line: "#fff", props: ["palm", "wave", "palm", "wave"] },
  mountain: { name: "Mountain Road", sky: ["#dbe9ef", "#f3f8f5"], ground: ["#d7e3dd", "#aebfb6"], road: "#b7b2a6", line: "#fff", props: ["peak", "pine", "peak", "pine"] },
  cloud: { name: "Cloud Kingdom Road", sky: ["#f6d9ff", "#dcecff"], ground: ["#f1d9f7", "#d9b9f0"], road: "#f4e0ff", line: "#fff", props: ["puff", "star", "puff", "star"] },
};
const unlockedEnvIds = (level) => ENV_IDS.slice(0, Math.min(ENV_IDS.length, 1 + Math.floor(Math.max(level, 0) / 2)));

function makeOrderChallenge(n) {
  const chosen = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).slice(0, n);
  const sorted = [...chosen].sort((a, b) => a - b);
  let cards = shuffle(chosen);
  if (n > 1) while (cards[0] === sorted[0]) cards = shuffle(chosen);
  return { skill: "order", cards, sorted };
}
function makeMissingChallenge() {
  const start = rand(1, 7);
  const seq = [start, start + 1, start + 2, start + 3];
  const gapIndex = rand(0, 3);
  const ans = seq[gapIndex];
  return { skill: "missing", seq, gapIndex, ans, choices: choicesFor(ans) };
}

/* ================= checkpoint: Number Order Road (drag + tap) ================= */
function OrderRoadActivity({ ch, progress, roadColor, onStep, onSolved, onMiss }) {
  const alive = useAlive();
  const { sorted } = ch;
  const n = sorted.length;
  const [pool, setPool] = useState(ch.cards), [placed, setPlaced] = useState([]);
  const [stepMiss, setStepMiss] = useState(0), [total, setTotal] = useState(0), [maxHint, setMaxHint] = useState(0);
  const [cmp, setCmp] = useState(null), [demoLit, setDemoLit] = useState({ a: 0, b: 0 });
  const [busy, setBusy] = useState(false), [done, setDone] = useState(false), [wob, setWob] = useState(null);
  const [drag, setDrag] = useState(null);
  const dragRef = useRef(null);
  const target = sorted[placed.length];
  const showDots = (k) => (progress.streak[k] || 0) < 2;
  useEffect(() => { say(n === 2 ? "Which number is smaller? Drive it onto the road first." : "Put the numbers on the road, smallest first!"); }, []);

  function place(k) {
    chime(placed.length); onStep(k, stepMiss > 0, true);
    const np = [...placed, k]; setPlaced(np); setPool((p) => p.filter((x) => x !== k)); setCmp(null); setStepMiss(0); setDemoLit({ a: 0, b: 0 });
    if (np.length === n) {
      setDone(true); chime(4); say("All the signs are in place!");
      setTimeout(() => { if (alive.current) onSolved({ misses: total, maxHint }); }, 800);
    } else say(`${pickPraise()} Which number comes next?`);
  }
  async function demo(wrong) {
    setBusy(true); say("Let's count the dots."); await sleep(900);
    for (let i = 1; i <= target; i++) { if (!alive.current) return; setDemoLit({ a: i, b: 0 }); tone(392 + i * 35, 0.12); say(String(i), { show: false, rate: 0.95 }); await sleep(550); }
    await sleep(350);
    for (let i = 1; i <= wrong; i++) { if (!alive.current) return; setDemoLit({ a: target, b: i }); tone(392 + i * 35, 0.12); say(String(i), { show: false, rate: 1 }); await sleep(420); }
    if (!alive.current) return; say(`${target} has fewer. ${target} is smaller!`); setBusy(false);
  }
  function pick(k) {
    if (busy || done || !pool.includes(k)) return;
    if (k === target) return place(k);
    const m = stepMiss + 1; setStepMiss(m); setTotal((t) => t + 1); setMaxHint((h) => Math.max(h, Math.min(m, 3))); soft(); onMiss && onMiss();
    setWob(null); requestAnimationFrame(() => setWob(k));
    if (m === 1) { setCmp({ wrong: k, pair: shuffle([k, target]) }); say("Look carefully. Which has fewer dots?"); }
    else if (m === 2) demo(cmp ? cmp.wrong : k);
    else say("Drive the glowing number onto the road.");
  }
  function missDrop(k) {
    const m = stepMiss + 1; setStepMiss(m); setTotal((t) => t + 1); setMaxHint((h) => Math.max(h, Math.min(m, 3))); soft(); onMiss && onMiss();
    setWob(null); requestAnimationFrame(() => setWob(k));
    say("That spot isn't next. Try the glowing marker.");
  }
  function startDrag(e, k) {
    if (busy || done || cmp) return;
    e.preventDefault();
    const d = { k, startX: e.clientX, startY: e.clientY, moved: false };
    dragRef.current = d; setDrag({ k, dx: 0, dy: 0 });
    const move = (ev) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - d.startX, dy = ev.clientY - d.startY;
      if (!d.moved && Math.hypot(dx, dy) > 10) d.moved = true;
      setDrag({ k, dx, dy });
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      dragRef.current = null; setDrag(null);
      if (!d.moved) { pick(k); return; }
      const el = document.elementFromPoint(ev.clientX, ev.clientY);
      const slotEl = el && el.closest && el.closest("[data-nd-slot]");
      if (!slotEl) return;
      const slotIndex = Number(slotEl.getAttribute("data-nd-slot"));
      if (slotIndex !== placed.length) return missDrop(k);
      pick(k);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div className="mf-act nd-order" style={{ "--road": roadColor }}>
      <div className="nd-road-slots" aria-label={`Road markers, ${placed.length} of ${n} placed`}>
        {sorted.map((k, i) => {
          const has = placed.includes(k);
          return (
            <div key={k} data-nd-slot={i} className={`nd-slot${!has && i === placed.length && !done ? " next" : ""}${has ? " filled" : ""}`}>
              {has ? <span className="nd-sign">{k}</span> : <span className="nd-sign-empty" aria-hidden="true" />}
            </div>
          );
        })}
      </div>
      {cmp ? (
        <div className="mf-compare">
          {cmp.pair.map((k) => (
            <button key={k} className={`mf-card big${stepMiss >= 3 && k === target ? " glow" : ""}${wob === k ? " wobble" : ""}`}
              onClick={() => pick(k)} disabled={busy} aria-label={`Number ${k}`} onAnimationEnd={(e) => { if (e.animationName === "mf-wobble") setWob(null); }}>
              <span className="mf-num">{k}</span><Dots n={k} lit={k === target ? demoLit.a : k === cmp.wrong ? demoLit.b : 0} />
            </button>
          ))}
        </div>
      ) : !done && (
        <div className="nd-bed" aria-label="Drag or tap the smallest number left">
          {pool.map((k) => (
            <button key={k}
              className={`nd-tile${stepMiss >= 3 && k === target ? " glow" : ""}${wob === k ? " wobble" : ""}${drag && drag.k === k ? " dragging" : ""}`}
              style={drag && drag.k === k ? { transform: `translate(${drag.dx}px, ${drag.dy}px)` } : undefined}
              onPointerDown={(e) => startDrag(e, k)}
              onAnimationEnd={(e) => { if (e.animationName === "mf-wobble") setWob(null); }}
              aria-label={`Number ${k}`}>
              <span className="nd-num">{k}</span>{showDots(k) && <Dots n={k} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================= checkpoint: missing number ================= */
function MissingNumberActivity({ ch, onStep, onSolved, onMiss }) {
  const { seq, gapIndex, ans, choices } = ch;
  const [misses, setMisses] = useState(0), [maxHint, setMaxHint] = useState(0), [solved, setSolved] = useState(false);
  useEffect(() => { say("A road sign fell down! Which number belongs there?"); }, []);
  function pick(c) {
    if (c === ans) { setSolved(true); chime(); onStep(ans, misses > 0, false); say(`${pickPraise()} ${ans} belongs there!`); onSolved({ misses, maxHint }); return true; }
    onMiss && onMiss(); const m = misses + 1; setMisses(m); setMaxHint((h) => Math.max(h, Math.min(m, 3))); soft();
    if (m === 1) say(`Count along: ${seq.map((v, i) => (i === gapIndex ? "?" : v)).join(", ")}.`);
    else say("Tap the glowing sign.");
    return false;
  }
  return (
    <div className="mf-act">
      <div className="mf-stones">
        {seq.map((v, i) => (
          <span key={i} className={`mf-stone${i === gapIndex ? " gap" : ""}`}>{i === gapIndex ? (solved ? ans : "?") : v}</span>
        ))}
      </div>
      <Choices label="Which number is missing?" choices={choices} answer={ans} glow={misses >= 2} onPick={pick} disabled={solved} />
    </div>
  );
}

/* ================= road scene art ================= */
const GROUND = 330;
function Prop({ kind, x, y, s = 1 }) {
  switch (kind) {
    case "pine": return (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <rect x="-4" y="-26" width="8" height="30" fill="#8a6b42" />
        <path d="M0 -92 L26 -40 H-26Z M0 -72 L22 -24 H-22Z M0 -50 L18 -4 H-18Z" fill="#4f9a52" stroke={OL} strokeWidth="2.4" strokeLinejoin="round" />
      </g>
    );
    case "bush": return <g transform={`translate(${x} ${y}) scale(${s})`}><Blob fill="#6fae4a" sw={3} shapes={[["c", -14, -6, 15], ["c", 7, -14, 17], ["c", 24, -4, 13]]} /></g>;
    case "flower": return (
      <g transform={`translate(${x} ${y - 10}) scale(${s})`}>
        <path d="M0 0 V22" stroke="#4f9a43" strokeWidth="3" />
        <g fill={["#ff8fb1", "#ffd84a", "#b79bff", "#fff"][Math.abs(Math.round(x)) % 4]} stroke={OL} strokeWidth="1.4">
          {[0, 72, 144, 216, 288].map((a) => <circle key={a} cx={Math.cos((a * Math.PI) / 180) * 8} cy={Math.sin((a * Math.PI) / 180) * 8} r="6.4" />)}
        </g>
        <circle r="5" fill="#ffc93c" stroke={OL} strokeWidth="1.4" />
      </g>
    );
    case "palm": return (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M0 0 Q-10 -56 6 -92" stroke="#8a6b42" strokeWidth="9" fill="none" strokeLinecap="round" />
        <g stroke="#4f9a52" strokeWidth="8" fill="none" strokeLinecap="round">
          <path d="M6 -92 Q-26 -102 -40 -88" /><path d="M6 -92 Q30 -106 46 -94" /><path d="M6 -92 Q-12 -118 -30 -120" /><path d="M6 -92 Q22 -120 38 -116" />
        </g>
      </g>
    );
    case "wave": return <g transform={`translate(${x} ${y + 30}) scale(${s})`}><path d="M-30 0 q10 -10 20 0 t20 0 t20 0" stroke="#6cc4ea" strokeWidth="5" fill="none" strokeLinecap="round" /></g>;
    case "peak": return (
      <g transform={`translate(${x} ${y}) scale(${s})`}>
        <path d="M0 -84 L34 0 H-34Z" fill="#b7b2a6" stroke={OL} strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M0 -84 L12 -52 L-6 -50 L4 -36 L-12 -34Z" fill="#fff" />
      </g>
    );
    case "puff": return <g transform={`translate(${x} ${y - 20}) scale(${s})`}><Blob fill="#fff" sw={2.5} shapes={[["c", -16, 0, 18], ["c", 10, -10, 22], ["c", 32, 2, 16]]} /></g>;
    case "star": return <text x={x} y={y - 30} fontSize={18 * s} textAnchor="middle" aria-hidden="true">✨</text>;
    default: return null;
  }
}
function CarDeer({ driving }) {
  return (
    <g className={driving ? "nd-driving" : ""}>
      <g className="nd-dust" aria-hidden="true"><circle cx="-38" cy="16" r="9" /><circle cx="-52" cy="20" r="6.5" /><circle cx="-64" cy="14" r="4.5" /></g>
      <path d="M-58 18 Q-58 -8 -30 -10 L-10 -34 Q6 -42 24 -34 L40 -10 Q62 -8 62 18Z" fill="#e3443a" stroke={OL} strokeWidth="3" strokeLinejoin="round" />
      <path d="M-20 -10 L-6 -30 Q6 -36 18 -30 L30 -10Z" fill="#bfe8ff" stroke={OL} strokeWidth="2.4" strokeLinejoin="round" opacity=".9" />
      <circle className="nd-wheel" cx="-32" cy="22" r="13" fill="#2b1d16" stroke={OL} strokeWidth="2" />
      <circle className="nd-wheel" cx="32" cy="22" r="13" fill="#2b1d16" stroke={OL} strokeWidth="2" />
      <circle cx="-32" cy="22" r="5" fill="#8a8a8a" /><circle cx="32" cy="22" r="5" fill="#8a8a8a" />
      <g transform="translate(0 -20)">
        <ellipse cx="0" cy="4" rx="17" ry="14" fill="#cc8b52" stroke={OL} strokeWidth="2.6" />
        <path d="M-14 -8 L-20 -22 L-6 -14Z M14 -8 L20 -22 L6 -14Z" fill="#cc8b52" stroke={OL} strokeWidth="2.4" strokeLinejoin="round" />
        <Eyes y={2} dx={6} r={3} cx={0} /><Blush y={9} dx={10} cx={0} />
      </g>
    </g>
  );
}
function TigerWave() {
  return (
    <g>
      <Blob fill="#f29a3a" sw={3} shapes={[["e", 0, 10, 26, 20]]} />
      <circle cx="0" cy="-14" r="18" fill="#f29a3a" stroke={OL} strokeWidth="2.6" />
      <path d="M-10 -26 q3 7 0 12 M10 -26 q-3 7 0 12" stroke={OL} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <Eyes y={-16} dx={6} r={3} cx={0} /><Blush y={-9} dx={10} cx={0} />
      <g className="nd-wave" style={{ transformBox: "fill-box", transformOrigin: "0% 100%" }}>
        <path d="M14 -24 q14 -18 24 -4" stroke="#f29a3a" strokeWidth="7" fill="none" strokeLinecap="round" />
      </g>
    </g>
  );
}
function MishapProp({ kind }) {
  if (kind === "haystack") return (
    <g className="nd-mishap">
      <ellipse cx="0" cy="14" rx="30" ry="16" fill="#e8c35a" stroke={OL} strokeWidth="2.4" />
      <path d="M-20 8 q6 -10 12 0 M0 6 q6 -10 12 0 M-10 14 q6 -10 12 0" stroke="#c9a23e" strokeWidth="2" fill="none" />
    </g>
  );
  if (kind === "mud") return (
    <g className="nd-mishap">
      <ellipse cx="0" cy="22" rx="36" ry="10" fill="#8a5c36" opacity=".85" />
      <path d="M-18 22 q8 -4 16 0 M2 22 q8 -4 16 0" stroke="#6e4526" strokeWidth="2" fill="none" />
    </g>
  );
  return (
    <g className="nd-mishap">
      <rect x="-6" y="-10" width="12" height="24" fill="#e3443a" stroke={OL} strokeWidth="2" />
      <rect x="-18" y="-2" width="36" height="9" fill="#fff" stroke={OL} strokeWidth="2" />
    </g>
  );
}
function RoadScene({ env, carX, driving, mishap }) {
  const t = ENV_META[env];
  return (
    <svg viewBox="0 0 800 420" className="mf-chase-svg" role="img" aria-label={`${t.name}: a deer driving a red car along a winding road toward a finish line`}>
      <defs>
        <linearGradient id="nd-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.sky[0]} /><stop offset="1" stopColor={t.sky[1]} /></linearGradient>
        <linearGradient id="nd-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={t.ground[0]} /><stop offset="1" stopColor={t.ground[1]} /></linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#nd-sky)" />
      <Cloud x={120} y={70} s={0.9} /><Cloud x={620} y={50} s={0.75} />
      <rect y="300" width="800" height="120" fill="url(#nd-ground)" />
      {t.props.map((kind, i) => <Prop key={i} kind={kind} x={60 + i * 230} y={318} s={0.85 + (i % 2) * 0.15} />)}
      <path d="M0 356 Q200 336 400 352 T800 344" stroke={t.road} strokeWidth="56" fill="none" strokeLinecap="round" />
      <path d="M0 356 Q200 336 400 352 T800 344" stroke={t.line} strokeWidth="4" strokeDasharray="22 18" fill="none" strokeLinecap="round" />
      <Signpost x={50} y={300} label={t.name} />
      <g transform="translate(230 300) scale(0.82)"><TigerWave /></g>
      <g transform="translate(772 300)">
        <rect x="-3" y="-96" width="6" height="100" fill="#8a5a32" />
        <path d="M-3 -96 h40 v30 h-40Z" fill="#fff" stroke={OL} strokeWidth="2.6" />
        <path d="M-3 -96 h20 v15 h-20Z M17 -81 h20 v15 h-20Z" fill="#3b2b22" />
      </g>
      <g className={`mf-mover${mishap ? " wobble" : ""}`} style={{ transform: `translate(${carX}px, 0px)` }}>
        <g transform={`translate(0 ${GROUND})`}>
          <CarDeer driving={driving} />
          {mishap && <MishapProp kind={mishap} />}
        </g>
      </g>
    </svg>
  );
}

/* ================= app ================= */
const ROAD_X_MIN = 70, ROAD_X_MAX = 700, ROAD_X_FINISH = 745;

export default function NumberDriveAdventure({ p, onStep, recordAnswer, onExit, onLevelUp, onRoundDone }) {
  const unlocked = unlockedEnvIds(p.driveLevel || 0);
  const [env, setEnv] = useState(unlocked[unlocked.length - 1]);
  const [phase, setPhase] = useState("intro"); // intro | drive | finish
  const [legIndex, setLegIndex] = useState(0);
  const [ch, setCh] = useState(null), [legKey, setLegKey] = useState(0);
  const [driving, setDriving] = useState(false), [mishap, setMishap] = useState(null);
  const [prompt, setPrompt] = useState("Ready to drive?");
  const alive = useAlive(), timers = useRef([]);
  const later = (fn, ms) => { const t = setTimeout(() => alive.current && fn(), ms); timers.current.push(t); };
  useEffect(() => subscribePrompt(setPrompt), []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    if (phase !== "drive" || legIndex >= ROUTE_SKILLS.length) return;
    const skill = ROUTE_SKILLS[legIndex];
    if (skill === "order") setCh(makeOrderChallenge(lengthForLevel(p.driveLevel || 0)));
    else if (skill === "missing") setCh(makeMissingChallenge());
    else setCh(makeChallenge(skill, p));
    setLegKey((k) => k + 1);
    // Each checkpoint's challenge is only picked once, when we arrive there.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [legIndex, phase]);

  function start() {
    tone(660, 0.1); setLegIndex(0); setMishap(null); setPhase("drive");
    say(`Let's drive the ${ENV_META[env].name}! Answer each checkpoint to help the car move forward.`);
  }
  function triggerMishap() {
    const kinds = ["haystack", "mud", "roadblock"];
    setMishap(kinds[rand(0, kinds.length - 1)]);
    later(() => setMishap(null), 850);
  }
  function onLegSolved({ misses }) {
    recordAnswer(ch.skill === "missing" ? "ba" : ch.skill, misses);
    const ns = legIndex + 1;
    setDriving(true); tone(660, 0.07);
    later(() => {
      setDriving(false); setLegIndex(ns);
      if (ns >= ROUTE_SKILLS.length) {
        later(() => { onLevelUp(); onRoundDone(); setPhase("finish"); sparkle(); say("You made it to the finish line! Great driving!"); }, 250);
      } else say(["Vroom! Keep driving!", "Great steering!", "On to the next checkpoint!"][ns % 3]);
    }, 850);
  }

  const carX = phase === "finish" ? ROAD_X_FINISH : ROAD_X_MIN + legIndex * ((ROAD_X_MAX - ROAD_X_MIN) / ROUTE_SKILLS.length);

  return (
    <div className="mf-chase nd-app">
      <header className="mf-chase-head">
        <button className="mf-mapbtn" onClick={() => { tone(600, 0.08); onExit(); }} aria-label="World map">🗺</button>
        <span className="mf-title">Number Drive Adventure</span>
        {phase === "drive" && (
          <span className="mf-hooves" aria-label={`${legIndex} of ${ROUTE_SKILLS.length} checkpoints`}>
            {ROUTE_SKILLS.map((_, i) => <span key={i} className={`mf-hoof${i < legIndex ? " on" : ""}`} />)}
          </span>
        )}
      </header>
      <div className="mf-chase-scene">
        <div className="nd-scene-wrap">
          <RoadScene env={env} carX={carX} driving={driving} mishap={mishap} />
          <div className="nd-butterflies" aria-hidden="true"><span>🦋</span><span>🦋</span></div>
        </div>
      </div>

      <main className="mf-chase-panel">
        {phase === "intro" && (
          <div className="mf-center">
            <p className="mf-big">Help the baby deer drive to the finish line!</p>
            <p className="mf-soft">Answer each checkpoint to move the car forward. There's no clock and no losing — just drive at your own pace.</p>
            <div className="nd-envpicker" role="group" aria-label="Choose a road">
              {ENV_IDS.map((id) => {
                const isUnlocked = unlocked.includes(id);
                return (
                  <button key={id} disabled={!isUnlocked} aria-pressed={env === id}
                    className={`nd-envbtn${env === id ? " on" : ""}${!isUnlocked ? " locked" : ""}`}
                    style={{ background: `linear-gradient(${ENV_META[id].sky[0]}, ${ENV_META[id].ground[1]})` }}
                    onClick={() => isUnlocked && (tone(500, 0.08), setEnv(id))}
                    aria-label={isUnlocked ? ENV_META[id].name : `${ENV_META[id].name}, locked`}>
                    <span>{isUnlocked ? ENV_META[id].name : `🔒 ${ENV_META[id].name}`}</span>
                  </button>
                );
              })}
            </div>
            <button className="mf-btn go" onClick={start}>▶ Start Drive</button>
          </div>
        )}
        {phase === "drive" && (
          <>
            <div className="mf-prompt" aria-live="polite">
              <p className="mf-say">{prompt}</p>
              <button className="mf-speak" aria-label="Say it again" onClick={() => say(getLastPrompt() || prompt)}>🔊</button>
            </div>
            {ch && !driving && (
              <div key={legKey}>
                {ch.skill === "order" && <OrderRoadActivity ch={ch} progress={p} roadColor={ENV_META[env].road} onStep={onStep} onSolved={onLegSolved} onMiss={triggerMishap} />}
                {ch.skill === "ba" && <BAActivity ch={ch} onStep={onStep} onSolved={onLegSolved} onMiss={triggerMishap} />}
                {ch.skill === "missing" && <MissingNumberActivity ch={ch} onStep={onStep} onSolved={onLegSolved} onMiss={triggerMishap} />}
                {ch.skill === "add" && <AddActivity ch={ch} onStep={onStep} onSolved={onLegSolved} onMiss={triggerMishap} />}
              </div>
            )}
          </>
        )}
        {phase === "finish" && (
          <div className="mf-center">
            <div className="nd-confetti" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} style={{ "--i": i }} />)}</div>
            <span className="nd-trophy" aria-hidden="true">🏆</span>
            <p className="mf-big">You reached the finish line!</p>
            <p className="mf-soft">{ENV_META[env].name} complete. Come back for a new road, or try this one again!</p>
            <div className="mf-row center">
              <button className="mf-btn go" onClick={start}>Drive again 🚗</button>
              <button className="mf-btn ghost" onClick={() => setPhase("intro")}>Choose a road</button>
              <button className="mf-btn ghost" onClick={onExit}>World map</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
