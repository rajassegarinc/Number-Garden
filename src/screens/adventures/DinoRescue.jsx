// DinoRescue.jsx — "Dino Egg Rescue": a 5-nest rescue round in a gentle Dino
// Valley (volcano puffing harmless smoke, palms, ferns, a river). No timers,
// no losing. Reuses MagicalForest.jsx's audio/voice helpers, skill engine
// (makeChallenge/planSession), and hint-driven activities (BAActivity /
// OrderActivity / AddActivity) as-is; the drag-or-tap "fill the nest"
// counting activity is a thin wrapper around the existing CollectQuest
// component. Rendered from inside MagicalForest.jsx exactly like ChaseGame
// ("Save the Deer") — same `.mf-chase*` shell classes, no new chrome.
// Usage: <DinoRescue p={progress} onStep={fn} recordAnswer={fn} onExit={fn}
//   onHatch={(id) => ...} onRoundDone={() => ...} />
import { useEffect, useRef, useState } from "react";
import { CollectQuest } from "../../components/CollectQuest";
import {
  tone, chime, sparkle, say, subscribePrompt, getLastPrompt,
  makeChallenge, planSession,
  BAActivity, OrderActivity, AddActivity,
  OL, Eyes, Blush, Blob, Wavy,
} from "./MagicalForest.jsx";
import "./DinoRescue.css";

// A literal, not `stroke: OL`: MagicalForest.jsx and this file import each
// other (this file needs its shared helpers; MagicalForest.jsx needs
// DinoSvg/DINO_IDS for the world-map card), and in that circular-import
// evaluation order, MagicalForest.jsx's own `const OL = ...` hasn't run yet
// by the time this module's top-level code executes — function declarations
// are hoisted and safe to use early, but a `const` read here hits OL's
// temporal dead zone. OL is used safely everywhere else below (inside
// component bodies, which only ever run after the whole module graph has
// finished loading) — just not in this one eagerly-evaluated object.
const o = { stroke: "#3b2b22", strokeWidth: 2.6, strokeLinejoin: "round", strokeLinecap: "round" };
const ROUND_SIZE = 5;
const DINO_OBJECTS = [{ e: "🥚", one: "egg", many: "eggs" }];

/* ================= the 12 baby dinosaurs (viewBox 0 0 100 100) ================= */
const DINO_META = {
  trex: { name: "Tiny Rex", color: "#e3745a", hi: "Rawr! I mean, hello!", anim: "hop" },
  triceratops: { name: "Spike", color: "#8aab63", hi: "Hello! Look at my frill!", anim: "bob" },
  stego: { name: "Plated Pip", color: "#6b8fae", hi: "Hello! Careful of my spikes!", anim: "sway" },
  longneck: { name: "Stretch", color: "#9ab86f", hi: "Hello! I reach the tall leaves!", anim: "sway" },
  ptero: { name: "Flappy", color: "#c9a24a", hi: "Hello! I can fly!", anim: "flutter" },
  anky: { name: "Clubby", color: "#8a7a5c", hi: "Hello! My tail is a club!", anim: "bob" },
  para: { name: "Honker", color: "#d9a06a", hi: "Hello! Honk honk!", anim: "wiggle" },
  spino: { name: "Finny", color: "#5a8fae", hi: "Hello! I love the water!", anim: "sway" },
  raptor: { name: "Zippy", color: "#b4915e", hi: "Hello! I'm quick quick!", anim: "hop" },
  diplo: { name: "Longtail", color: "#7fae8a", hi: "Hello! I have a very long tail!", anim: "sway" },
  pachy: { name: "Dome", color: "#a9896a", hi: "Hello! My head is extra hard!", anim: "bob" },
  iguan: { name: "Thumbs", color: "#c9b183", hi: "Hello! Look at my thumb spike!", anim: "wiggle" },
};
export const DINO_IDS = Object.keys(DINO_META);

const DINO_ART = {
  trex: () => (
    <g>
      <path d="M14 101 C14 76 30 66 50 66 C70 66 86 76 86 101Z" fill="#e3745a" {...o} />
      <path d="M30 30 l6 -14 M44 24 l3 -15 M56 24 l-3 -15 M70 30 l-6 -14" stroke="#c45f44" strokeWidth="5" strokeLinecap="round" fill="none" />
      <ellipse cx="50" cy="46" rx="32" ry="28" fill="#ef8a6e" {...o} />
      <path d="M28 62 Q50 78 72 62 Q68 76 50 78 Q32 76 28 62Z" fill="#fff4ea" {...o} />
      <g fill="#fff">{[36, 43, 50, 57, 64].map((x, i) => <path key={i} d={`M${x} 64 l3 6 l3 -6Z`} />)}</g>
      <Eyes y={42} dx={14} r={5.6} /><Blush y={55} dx={24} />
    </g>
  ),
  triceratops: () => (
    <g>
      <path d="M14 101 C14 80 30 72 50 72 C70 72 86 80 86 101Z" fill="#8aab63" {...o} />
      <path d="M14 56 C8 30 26 10 50 10 C74 10 92 30 86 56 C72 46 60 44 50 44 C40 44 28 46 14 56Z" fill="#9cbd73" {...o} />
      <g fill="#7a9a52">{[22, 34, 50, 66, 78].map((x, i) => <circle key={i} cx={x} cy={i % 2 ? 26 : 20} r="4" />)}</g>
      <ellipse cx="50" cy="56" rx="29" ry="25" fill="#9cbd73" {...o} />
      <path d="M50 36 L56 18 L44 18Z" fill="#e8dcc0" {...o} />
      <path d="M30 48 L22 38 M70 48 L78 38" stroke="#e8dcc0" strokeWidth="7" strokeLinecap="round" fill="none" />
      <Eyes y={54} dx={14} r={5.4} /><Blush y={66} dx={22} />
      <path d="M45 69 q5 4 10 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  stego: () => (
    <g>
      <path d="M16 101 C16 82 30 74 50 74 C70 74 84 82 84 101Z" fill="#6b8fae" {...o} />
      <g fill="#7ea2bf" stroke={OL} strokeWidth="2.4">{[-30, -16, 0, 16, 30].map((x, i) => <path key={i} d={`M${50 + x} 76 L${50 + x - 9} 46 L${50 + x + 9} 46Z`} />)}</g>
      <ellipse cx="50" cy="56" rx="30" ry="26" fill="#7ea2bf" {...o} />
      <Eyes y={54} dx={14} r={5.2} /><Blush y={66} dx={22} />
      <path d="M45 69 q5 4 10 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  longneck: () => (
    <g>
      <path d="M18 101 C18 86 30 80 50 80 C70 80 82 86 82 101Z" fill="#9ab86f" {...o} />
      <path d="M36 80 C32 54 34 28 42 6 L58 6 C66 28 68 54 64 80Z" fill="#9ab86f" {...o} />
      <circle cx="50" cy="14" r="14" fill="#9ab86f" {...o} />
      <Eyes y={12} dx={8} r={4.2} /><Blush y={20} dx={12} />
      <path d="M45 22 q5 4 10 0" stroke={OL} strokeWidth="2" fill="none" strokeLinecap="round" />
    </g>
  ),
  ptero: () => (
    <g>
      <path d="M30 101 C30 86 38 78 50 78 C62 78 70 86 70 101Z" fill="#c9a24a" {...o} />
      <path d="M34 70 C8 60 -4 36 6 20 C18 34 30 46 42 54Z" fill="#d9b568" {...o} />
      <path d="M66 70 C92 60 104 36 94 20 C82 34 70 46 58 54Z" fill="#d9b568" {...o} />
      <ellipse cx="50" cy="52" rx="20" ry="18" fill="#d9b568" {...o} />
      <path d="M50 42 L68 36 L50 48Z" fill="#e8724a" {...o} />
      <path d="M38 18 Q44 2 56 10" stroke="#c9a24a" strokeWidth="7" fill="none" strokeLinecap="round" />
      <Eyes y={48} dx={9} r={4.6} /><Blush y={58} dx={14} />
    </g>
  ),
  anky: () => (
    <g>
      <ellipse cx="86" cy="90" rx="13" ry="11" fill="#8a7a5c" {...o} />
      <path d="M70 92 Q84 86 86 90" stroke="#8a7a5c" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M10 101 C10 76 28 64 50 64 C72 64 90 76 90 101Z" fill="#8a7a5c" {...o} />
      <g fill="#a08f6c" stroke={OL} strokeWidth="2">{[[-26, 78], [0, 70], [26, 78]].map(([x, y], i) => <path key={i} d={`M${50 + x - 10} ${y + 8} L${50 + x} ${y - 6} L${50 + x + 10} ${y + 8}Z`} />)}</g>
      <ellipse cx="42" cy="56" rx="24" ry="20" fill="#a08f6c" {...o} />
      <Eyes y={54} dx={11} r={5} cx={42} /><Blush y={64} dx={18} cx={42} />
    </g>
  ),
  para: () => (
    <g>
      <path d="M16 101 C16 80 30 72 50 72 C70 72 84 80 84 101Z" fill="#d9a06a" {...o} />
      <path d="M56 46 Q78 30 70 8 Q58 14 54 32Z" fill="#e8b57e" {...o} />
      <ellipse cx="50" cy="54" rx="27" ry="24" fill="#e8b57e" {...o} />
      <path d="M34 66 Q50 78 66 66 Q62 76 50 78 Q38 76 34 66Z" fill="#fff4e4" {...o} />
      <Eyes y={52} dx={12} r={5.2} /><Blush y={64} dx={20} />
    </g>
  ),
  spino: () => (
    <g>
      <path d="M14 101 C14 80 30 72 50 72 C70 72 86 80 86 101Z" fill="#5a8fae" {...o} />
      <path d="M30 72 Q26 36 50 16 Q74 36 70 72Z" fill="#6fa6c4" {...o} />
      <path d="M38 68 Q50 50 62 68" stroke="#4a7a94" strokeWidth="3" fill="none" />
      <ellipse cx="50" cy="56" rx="26" ry="22" fill="#6fa6c4" {...o} />
      <path d="M50 56 L70 52 L50 62Z" fill="#9ac23c" {...o} />
      <Eyes y={54} dx={12} r={5} /><Blush y={64} dx={18} />
    </g>
  ),
  raptor: () => (
    <g>
      <path d="M22 101 C22 82 34 72 50 72 C66 72 78 82 78 101Z" fill="#b4915e" {...o} />
      <path d="M56 44 Q74 40 76 24 Q64 26 58 36Z" fill="#c7a876" {...o} />
      <ellipse cx="46" cy="52" rx="24" ry="20" fill="#c7a876" {...o} />
      <path d="M28 56 l-8 10 l4 2 l-2 8" fill="none" stroke={OL} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <Eyes y={50} dx={11} r={5} cx={46} /><Blush y={60} dx={17} cx={46} />
    </g>
  ),
  diplo: () => (
    <g>
      <path d="M18 101 C18 86 30 80 50 80 C70 80 82 86 82 101Z" fill="#7fae8a" {...o} />
      <path d="M70 84 Q94 82 98 68" stroke="#7fae8a" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M34 80 C30 56 32 32 42 8 L56 8 C62 32 62 56 58 80Z" fill="#7fae8a" {...o} />
      <circle cx="48" cy="14" r="12" fill="#7fae8a" {...o} />
      <Eyes y={12} dx={7} r={3.8} cx={48} /><Blush y={19} dx={11} cx={48} />
    </g>
  ),
  pachy: () => (
    <g>
      <path d="M18 101 C18 80 32 72 50 72 C68 72 82 80 82 101Z" fill="#a9896a" {...o} />
      <circle cx="50" cy="40" r="26" fill="#bfa27e" {...o} />
      <path d="M30 32 Q50 18 70 32" stroke="#a9896a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <ellipse cx="50" cy="58" rx="24" ry="18" fill="#bfa27e" {...o} />
      <Eyes y={54} dx={12} r={5} /><Blush y={64} dx={18} />
    </g>
  ),
  iguan: () => (
    <g>
      <path d="M16 101 C16 80 30 72 50 72 C70 72 84 80 84 101Z" fill="#c9b183" {...o} />
      <path d="M20 82 l-10 6 l4 4 l-10 4" fill="none" stroke={OL} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <ellipse cx="50" cy="54" rx="27" ry="23" fill="#d9c398" {...o} />
      <path d="M50 40 Q56 28 50 18 Q44 28 50 40Z" fill="#c9b183" {...o} />
      <Eyes y={52} dx={13} r={5.2} /><Blush y={64} dx={20} />
    </g>
  ),
};
export function DinoSvg({ id, className, ...rest }) {
  const body = DINO_ART[id] ? DINO_ART[id]() : null;
  return <svg viewBox="0 0 100 100" overflow="visible" className={className} aria-hidden="true" {...rest}>{body}</svg>;
}
// Prefers a species never found before; once the whole collection is
// complete, still avoids repeating one already hatched earlier in this same
// round (ROUND_SIZE < DINO_IDS.length, so there's always a candidate) —
// otherwise two dinos could share a key in the wander row below.
function pickNextDino(found, wander) {
  const neverFound = DINO_IDS.filter((id) => !found.includes(id));
  const pool = neverFound.length ? neverFound : DINO_IDS;
  const notWanderingYet = pool.filter((id) => !wander.includes(id));
  const candidates = notWanderingYet.length ? notWanderingYet : pool;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/* ================= egg + hatch ================= */
function Egg({ cracked }) {
  return (
    <g className={`dr-egg${cracked ? " dr-egg-cracked" : ""}`}>
      <g className="dr-egg-half dr-egg-top">
        <path d="M-26 0 Q-30 -46 0 -50 Q30 -46 26 0 Q10 -6 0 -2 Q-10 -6 -26 0Z" fill="#fdf3dd" stroke={OL} strokeWidth="2.6" strokeLinejoin="round" />
        <g fill="#e8d4a0"><circle cx="-10" cy="-30" r="3" /><circle cx="8" cy="-20" r="2.4" /><circle cx="-4" cy="-14" r="2" /></g>
      </g>
      <g className="dr-egg-half dr-egg-bottom">
        <path d="M-26 0 Q-10 10 0 6 Q10 10 26 0 Q22 24 0 26 Q-22 24 -26 0Z" fill="#fdf3dd" stroke={OL} strokeWidth="2.6" strokeLinejoin="round" />
        <g fill="#e8d4a0"><circle cx="12" cy="12" r="2.6" /><circle cx="-6" cy="18" r="2" /></g>
      </g>
    </g>
  );
}
function HatchScene({ dinoId }) {
  const [cracked, setCracked] = useState(false);
  useEffect(() => { const t = setTimeout(() => setCracked(true), 60); return () => clearTimeout(t); }, []);
  return (
    <svg viewBox="-60 -60 120 140" className="dr-hatch-svg" role="img" aria-label="An egg cracking open">
      <Egg cracked={cracked} />
      <g className="dr-hatch-baby">
        <DinoSvg id={dinoId} className={`dr-baby mf-idle ${DINO_META[dinoId].anim}`} />
      </g>
    </svg>
  );
}

/* ================= nest type A: fill the nest (drag/tap) ================= */
function NestFillActivity({ ch, onStep, onSolved }) {
  const n = ch.n, obj = ch.obj;
  const countRef = useRef(0);
  useEffect(() => { countRef.current = 0; say(`Can you find ${n} ${n === 1 ? obj.one : obj.many} for the nest? Tap or drag them in!`); }, [n, obj]);
  return (
    <CollectQuest
      target={n}
      totalItems={n}
      itemAriaLabel={obj.one}
      containerAriaLabel="Nest"
      renderItem={() => <span className="dr-egg-item" aria-hidden="true">{obj.e}</span>}
      renderContainer={() => <span className="dr-nest" aria-hidden="true">🪺</span>}
      onCollect={() => { countRef.current += 1; say(String(countRef.current), { show: false }); }}
      onComplete={() => { onStep(n, false); onSolved({ misses: 0 }); }}
      soundOn={true}
    />
  );
}

/* ================= valley scenery (fixed scene, like Save the Deer) ================= */
function Volcano({ x, y }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-120 0 L-20 -160 Q0 -180 20 -160 L120 0Z" fill="#8a7055" stroke={OL} strokeWidth="4" strokeLinejoin="round" />
      <path d="M-70 0 L-20 -92 Q0 -102 20 -92 L70 0Z" fill="#a5886a" />
      <ellipse cx="0" cy="-160" rx="22" ry="10" fill="#5a4636" stroke={OL} strokeWidth="3" />
      {[0, 1, 2, 3].map((i) => <circle key={i} className="dr-smoke" cx={0} cy={-170} r="12" fill="#e9e4da" style={{ animationDelay: `${i * 2.4}s` }} />)}
    </g>
  );
}
const PalmTree = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M0 0 Q-10 -60 6 -100" stroke="#8a6b42" strokeWidth="10" fill="none" strokeLinecap="round" />
    <g stroke="#4f9a52" strokeWidth="9" fill="none" strokeLinecap="round">
      <path d="M6 -100 Q-30 -112 -46 -96" /><path d="M6 -100 Q34 -116 52 -102" />
      <path d="M6 -100 Q-16 -130 -36 -132" /><path d="M6 -100 Q28 -132 44 -128" />
      <path d="M6 -100 Q6 -136 6 -140" />
    </g>
  </g>
);
const Fern = ({ x, y, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <Wavy c="#4caf6a" w={7} d="M0 0 q-6 -20 -2 -34 M0 0 q0 -24 4 -38 M0 0 q8 -18 16 -28" />
  </g>
);
function DinoScene() {
  return (
    <svg viewBox="0 0 800 420" className="mf-chase-svg" role="img" aria-label="A gentle dinosaur valley with a volcano, palm trees, ferns, and a river">
      <defs>
        <linearGradient id="dr-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe8cf" /><stop offset="1" stopColor="#eef8e2" /></linearGradient>
        <linearGradient id="dr-water" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#6cc4ea" /><stop offset="1" stopColor="#3d9ccd" /></linearGradient>
        <linearGradient id="dr-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a8d46a" /><stop offset="1" stopColor="#6fae4a" /></linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#dr-sky)" />
      <Volcano x={640} y={300} />
      <rect y="300" width="800" height="120" fill="url(#dr-ground)" />
      <path d="M260 420 Q280 300 330 300 Q380 300 400 420Z" fill="url(#dr-water)" stroke="#e9f8ff" strokeWidth="3" />
      {[90, 170, 500, 560].map((x, i) => <PalmTree key={i} x={x} y={320} s={0.8 + (i % 3) * 0.15} />)}
      {[40, 130, 220, 440, 620, 710].map((x, i) => <Fern key={i} x={x} y={400} s={0.7 + (i % 2) * 0.2} />)}
      <Blob fill="#9a9a90" sw={3} shapes={[["e", 450, 400, 30, 14], ["e", 490, 404, 22, 12]]} />
    </svg>
  );
}

/* ================= Dino Nest sticker book ================= */
function DinoBook({ found, onClose }) {
  return (
    <div className="mf-back" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mf-sheet book" role="dialog" aria-label="Dino Nest">
        <button className="mf-x" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="mf-h2">Dino Nest <span>{found.length} / {DINO_IDS.length}</span></h2>
        <div className="mf-stickers">
          {DINO_IDS.map((id) => {
            const got = found.includes(id);
            const meta = DINO_META[id];
            return (
              <button key={id} className={`mf-sticker${got ? " got" : ""}`} style={{ "--theme": meta.color }}
                onClick={() => say(got ? `${meta.name}! ${meta.hi}` : "Who is this? Hatch more eggs to find out!")}
                aria-label={got ? meta.name : "Not found yet"}>
                <DinoSvg id={id} className={got ? "" : "mf-silhouette"} />
                <span>{got ? meta.name : "?"}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function buildPlan(p) {
  const base = planSession(p);
  const out = [];
  for (let i = 0; i < ROUND_SIZE; i++) out.push(base[i % base.length]);
  return out;
}

/* ================= app ================= */
export default function DinoRescue({ p, onStep, recordAnswer, onHatch, onRoundDone, onExit }) {
  // Re-built on "Play again" (via setPlan below) so a replay reflects what
  // was just practised, not the plan from when the round first opened.
  const [plan, setPlan] = useState(() => buildPlan(p));
  const [nestIndex, setNestIndex] = useState(0);
  const [ch, setCh] = useState(null);
  const [phase, setPhase] = useState("ask"); // ask | hatch | round-done
  const [hatchedId, setHatchedId] = useState(null);
  const [wander, setWander] = useState([]);
  const [book, setBook] = useState(false);
  const [prompt, setPrompt] = useState("");
  const foundRef = useRef(p.dinos || []);

  useEffect(() => subscribePrompt(setPrompt), []);
  useEffect(() => { say("Oh no! The dino eggs rolled around the valley! Let's carry them home to their nests."); }, []);
  useEffect(() => {
    let t;
    const rumble = () => { tone(70, 0.6, 0, "sine"); t = setTimeout(rumble, 14000 + Math.random() * 10000); };
    t = setTimeout(rumble, 6000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (nestIndex >= plan.length) { setPhase("round-done"); return; }
    setCh(makeChallenge(plan[nestIndex], p, DINO_OBJECTS));
    setPhase("ask");
    // Each nest's challenge is only picked once, when we arrive at it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nestIndex]);

  function onSolved({ misses }) {
    recordAnswer(ch.skill, misses);
    const id = pickNextDino(foundRef.current, wander);
    setHatchedId(id);
    setPhase("hatch");
    chime();
    setTimeout(() => {
      sparkle();
      say(`${DINO_META[id].name} hatched! ${DINO_META[id].hi}`);
      onHatch(id);
      setWander((w) => [...w, id]);
    }, 700);
  }
  function nextNest() { setNestIndex((i) => i + 1); }
  function playAgain() { onRoundDone(); setWander([]); setPlan(buildPlan(p)); setNestIndex(0); }

  const found = p.dinos || [];
  foundRef.current = found;
  const allFound = [...new Set([...found, ...wander])];

  return (
    <div className="mf-chase dr-app">
      <header className="mf-chase-head">
        <button className="mf-mapbtn" onClick={() => { tone(600, 0.08); onExit(); }} aria-label="World map">🗺</button>
        <span className="mf-title">Dino Egg Rescue</span>
        <button className="mf-bookbtn" onClick={() => { tone(700, 0.08); setBook(true); }} aria-label="Dino Nest">📖 <b>{allFound.length}</b>/{DINO_IDS.length}</button>
        <span className="mf-hooves" aria-label={`${nestIndex} of ${plan.length} nests`}>
          {plan.map((_, i) => <span key={i} className={`mf-hoof${i < nestIndex ? " on" : ""}`} />)}
        </span>
      </header>
      <div className="mf-chase-scene"><DinoScene /></div>
      <div className="dr-wander">
        {wander.map((id) => <DinoSvg key={id} id={id} className={`dr-wanderer mf-idle ${DINO_META[id].anim}`} />)}
      </div>

      <main className="mf-chase-panel">
        {phase === "ask" && ch && (
          <>
            <div className="mf-prompt" aria-live="polite">
              <p className="mf-say">{prompt}</p>
              <button className="mf-speak" aria-label="Say it again" onClick={() => say(getLastPrompt() || prompt)}>🔊</button>
            </div>
            <div className="dr-skin">
              {ch.skill === "count" && <NestFillActivity ch={ch} onStep={onStep} onSolved={onSolved} />}
              {ch.skill === "ba" && <BAActivity ch={ch} onStep={onStep} onSolved={onSolved} markerEmoji="🥚" />}
              {ch.skill === "order" && <OrderActivity ch={ch} progress={p} onStep={onStep} onSolved={onSolved} />}
              {ch.skill === "add" && <AddActivity ch={ch} onStep={onStep} onSolved={onSolved} markerEmoji="🦖" />}
            </div>
          </>
        )}
        {phase === "hatch" && hatchedId && (
          <div className="mf-center">
            <HatchScene dinoId={hatchedId} />
            <p className="mf-big">{DINO_META[hatchedId].name} hatched!</p>
            <button className="mf-btn go" onClick={nextNest}>{nestIndex + 1 >= plan.length ? "See the valley" : "Next nest"}</button>
          </div>
        )}
        {phase === "round-done" && (
          <div className="mf-center">
            <p className="mf-big">All the eggs are safe!</p>
            <p className="mf-soft">You've rescued {allFound.length} of {DINO_IDS.length} dino friends.</p>
            <div className="mf-row center">
              <button className="mf-btn go" onClick={playAgain}>Play again 🥚</button>
              <button className="mf-btn ghost" onClick={onExit}>World map</button>
            </div>
          </div>
        )}
      </main>

      {book && <DinoBook found={allFound} onClose={() => { setBook(false); say("Come back soon!"); }} />}
    </div>
  );
}
