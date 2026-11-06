import { LIFE_STAGES, type LifeStage, type PathScene as PathSceneData, type ShapeName } from '../data/learningPaths';
import { LifeStageArt } from './LifeStageArt';
import './PathScene.css';

interface PathSceneProps {
  scene: PathSceneData;
  /** True once the child has answered — some scenes then show the answer in place. */
  revealed: boolean;
}

// Clockwise around a 3x3 grid; corner arrows lead from each stage to the next.
const CYCLE_CELLS = ['↗', 'egg', '↘', 'butterfly', '🔄', 'caterpillar', '↖', 'chrysalis', '↙'] as const;
const isStage = (cell: string): cell is LifeStage => (LIFE_STAGES as readonly string[]).includes(cell);

const SHAPE_COLORS = ['#ff6fa5', '#2fa4e7', '#4caf50', '#ffb703', '#9b6bdf'];

const polygonPoints = (sides: number, r: number, rotate = -90): string =>
  Array.from({ length: sides }, (_, i) => {
    const a = ((rotate + (360 / sides) * i) * Math.PI) / 180;
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  }).join(' ');

export const ShapeSvg = ({ shape, color, size = 120 }: { shape: ShapeName; color: string; size?: number }) => {
  const common = { fill: color, stroke: '#2f3a4a', strokeWidth: 3, strokeLinejoin: 'round' as const };
  let body;
  switch (shape) {
    case 'circle':
      body = <circle cx="50" cy="50" r="40" {...common} />;
      break;
    case 'square':
      body = <rect x="12" y="12" width="76" height="76" {...common} />;
      break;
    case 'rectangle':
      body = <rect x="4" y="26" width="92" height="48" {...common} />;
      break;
    case 'oval':
      body = <ellipse cx="50" cy="50" rx="46" ry="30" {...common} />;
      break;
    case 'diamond':
      body = <polygon points="50,6 86,50 50,94 14,50" {...common} />;
      break;
    case 'triangle':
      body = <polygon points={polygonPoints(3, 44, -90)} transform="translate(0 8)" {...common} />;
      break;
    case 'pentagon':
      body = <polygon points={polygonPoints(5, 44)} {...common} />;
      break;
    case 'hexagon':
      body = <polygon points={polygonPoints(6, 44, 0)} {...common} />;
      break;
    case 'octagon':
      body = <polygon points={polygonPoints(8, 44, 22.5)} {...common} />;
      break;
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`a ${shape}`}>
      {body}
    </svg>
  );
};

const Pie = ({ slices, shaded, highlightOne = false, size = 130 }: { slices: number; shaded: number; highlightOne?: boolean; size?: number }) => {
  const r = 44;
  const paths = Array.from({ length: slices }, (_, i) => {
    const a0 = (i / slices) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / slices) * 2 * Math.PI - Math.PI / 2;
    const x0 = 50 + r * Math.cos(a0);
    const y0 = 50 + r * Math.sin(a0);
    const x1 = 50 + r * Math.cos(a1);
    const y1 = 50 + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const on = i < shaded;
    return (
      <path
        key={i}
        d={slices === 1 ? '' : `M50,50 L${x0},${y0} A${r},${r} 0 ${large} 1 ${x1},${y1} Z`}
        fill={on ? (highlightOne ? '#ffb703' : '#e2564f') : '#fde7b0'}
        stroke="#c98a3c"
        strokeWidth="2"
      />
    );
  });
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`a pizza cut into ${slices} slices, ${shaded} with toppings`}>
      <circle cx="50" cy="50" r="48" fill="#e9b26b" />
      {paths}
    </svg>
  );
};

const Clock = ({ hour, minute }: { hour: number; minute: number }) => {
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minuteAngle = minute * 6;
  return (
    <svg viewBox="0 0 120 120" width="180" height="180" role="img" aria-label="a clock face">
      <circle cx="60" cy="60" r="56" fill="#ffffff" stroke="#2fa4e7" strokeWidth="6" />
      {Array.from({ length: 60 }, (_, i) => {
        const a = (i * 6 * Math.PI) / 180;
        const inner = i % 5 === 0 ? 46 : 49;
        return (
          <line
            key={i}
            x1={60 + inner * Math.sin(a)}
            y1={60 - inner * Math.cos(a)}
            x2={60 + 51 * Math.sin(a)}
            y2={60 - 51 * Math.cos(a)}
            stroke="#b9c4d0"
            strokeWidth={i % 5 === 0 ? 2 : 1}
          />
        );
      })}
      {Array.from({ length: 12 }, (_, i) => {
        const n = i + 1;
        const a = (n * 30 * Math.PI) / 180;
        return (
          <text key={n} x={60 + 38 * Math.sin(a)} y={60 - 38 * Math.cos(a) + 4.5} textAnchor="middle" className="path-clock-num">
            {n}
          </text>
        );
      })}
      <line x1="60" y1="60" x2="60" y2="32" stroke="#2f3a4a" strokeWidth="6" strokeLinecap="round" transform={`rotate(${hourAngle} 60 60)`} />
      <line x1="60" y1="60" x2="60" y2="16" stroke="#ff6fa5" strokeWidth="3.5" strokeLinecap="round" transform={`rotate(${minuteAngle} 60 60)`} />
      <circle cx="60" cy="60" r="4" fill="#2f3a4a" />
    </svg>
  );
};

const Beads = ({ count, className }: { count: number; className: string }) => (
  <span className={className}>
    {Array.from({ length: count }, (_, i) => (
      <span key={i} className="path-bead" />
    ))}
  </span>
);

const TenFrame = ({ filled, empty }: { filled: number; empty: number }) => (
  <div className="path-tenframe">
    {Array.from({ length: 10 }, (_, i) => (
      <span
        key={i}
        className={`path-tenframe-cell ${i < filled ? 'path-tenframe-cell--on' : i < filled + empty ? 'path-tenframe-cell--off' : 'path-tenframe-cell--none'}`}
      />
    ))}
  </div>
);

export const PathScene = ({ scene, revealed }: PathSceneProps) => {
  switch (scene.kind) {
    case 'compare': {
      const side = (n: number) =>
        scene.pictures ? (
          <div className="path-compare-pics" aria-label={`${n} apples`}>
            {Array.from({ length: n }, (_, i) => (
              <span key={i}>🍎</span>
            ))}
          </div>
        ) : (
          <span className="path-compare-num">{n}</span>
        );
      return (
        <div className="path-scene path-compare">
          <div className="path-compare-side">
            {side(scene.left)}
            {scene.pictures && <span className="path-compare-label">{scene.left}</span>}
          </div>
          <div className={`path-compare-croc ${revealed ? 'path-compare-croc--chomp' : ''}`}>
            <span className="path-compare-croc-icon" aria-hidden="true">
              🐊
            </span>
            <span className="path-compare-symbol">{revealed ? scene.answer : '?'}</span>
          </div>
          <div className="path-compare-side">
            {side(scene.right)}
            {scene.pictures && <span className="path-compare-label">{scene.right}</span>}
          </div>
        </div>
      );
    }

    case 'bond':
    case 'bond-pick': {
      const whole = scene.whole;
      const part = scene.kind === 'bond' ? String(scene.part) : '?';
      const missing = scene.kind === 'bond' ? (revealed ? String(scene.missing) : '?') : '?';
      return (
        <div className="path-scene path-bond">
          <svg viewBox="0 0 200 130" width="220" height="143" role="img" aria-label={`number bond for ${whole}`}>
            <line x1="100" y1="34" x2="48" y2="96" stroke="#8a6a3c" strokeWidth="5" />
            <line x1="100" y1="34" x2="152" y2="96" stroke="#8a6a3c" strokeWidth="5" />
            <circle cx="100" cy="32" r="28" fill="#ffb703" stroke="#2f3a4a" strokeWidth="3" />
            <text x="100" y="42" textAnchor="middle" className="path-bond-num">{whole}</text>
            <circle cx="48" cy="98" r="26" fill="#dcf0ff" stroke="#2f3a4a" strokeWidth="3" />
            <text x="48" y="108" textAnchor="middle" className="path-bond-num">{part}</text>
            <circle cx="152" cy="98" r="26" fill={missing === '?' ? '#fff6cf' : '#bdeab8'} stroke="#2f3a4a" strokeWidth="3" />
            <text x="152" y="108" textAnchor="middle" className="path-bond-num">{missing}</text>
          </svg>
          {scene.kind === 'bond' && (
            <div className="path-bond-frames">
              {Array.from({ length: Math.ceil(whole / 10) }, (_, f) => {
                const start = f * 10;
                const filled = Math.max(0, Math.min(10, scene.part - start));
                const empty = Math.max(0, Math.min(10 - filled, whole - start - filled));
                return <TenFrame key={f} filled={filled} empty={empty} />;
              })}
            </div>
          )}
        </div>
      );
    }

    case 'frogs': {
      const left = scene.total - scene.away;
      return (
        <div className="path-scene path-pond" role="img" aria-label={`${scene.total} lily pads, ${left} frogs left`}>
          {!scene.askAway && (
            <div className="path-pond-hoppers" aria-hidden="true">
              {Array.from({ length: scene.away }, (_, i) => (
                <span key={i} className="path-pond-hopper" style={{ animationDelay: `${i * 0.15}s` }}>
                  🐸
                </span>
              ))}
              <span className="path-pond-hop-label">hop away!</span>
            </div>
          )}
          <div className="path-pond-pads">
            {Array.from({ length: scene.total }, (_, i) => (
              <span key={i} className="path-pond-pad">
                {i < left ? '🐸' : <span className="path-pond-ripple">💦</span>}
              </span>
            ))}
          </div>
        </div>
      );
    }

    case 'place-value':
      return (
        <div
          className="path-scene path-pv"
          role="img"
          aria-label={`${scene.hundreds} hives, ${scene.tens} honey bars, ${scene.ones} nectar drops`}
        >
          {scene.hundreds > 0 && (
            <div className="path-pv-group">
              <div className="path-pv-items">
                {Array.from({ length: scene.hundreds }, (_, i) => (
                  <span key={i} className="path-pv-hundred">
                    {Array.from({ length: 100 }, (_, j) => (
                      <span key={j} className="path-bead path-bead--tiny" />
                    ))}
                  </span>
                ))}
              </div>
              <span className="path-pv-caption">🏠 hives (100)</span>
            </div>
          )}
          {scene.tens > 0 && (
            <div className="path-pv-group">
              <div className="path-pv-items">
                {Array.from({ length: scene.tens }, (_, i) => (
                  <Beads key={i} count={10} className="path-pv-ten" />
                ))}
              </div>
              <span className="path-pv-caption">🍯 bars (10)</span>
            </div>
          )}
          {scene.ones > 0 && (
            <div className="path-pv-group">
              <Beads count={scene.ones} className="path-pv-ones" />
              <span className="path-pv-caption">💧 drops (1)</span>
            </div>
          )}
        </div>
      );

    case 'numeral':
      return (
        <div className="path-scene path-numeral-wrap">
          <span className="path-numeral">{scene.value}</span>
          {scene.caption && <span className="path-numeral-caption">{scene.caption}</span>}
        </div>
      );

    case 'pattern':
      return (
        <div className="path-scene path-pattern" role="img" aria-label="a pattern with the last item missing">
          {scene.items.map((item, i) => {
            const blank = item === '?';
            return (
              <span key={i} className={`path-pattern-item ${blank ? 'path-pattern-item--blank' : ''}`}>
                {blank && revealed ? scene.answer : item}
              </span>
            );
          })}
        </div>
      );

    case 'skip':
      return (
        <div className="path-scene path-skip">
          <span className="path-skip-roo" aria-hidden="true">
            {scene.icon ?? '🦘'}
          </span>
          <div className="path-skip-stones">
            {scene.values.map((v, i) => {
              const blank = i === scene.blankIndex;
              return (
                <span key={i} className={`path-skip-stone ${blank ? 'path-skip-stone--blank' : ''}`}>
                  {blank && !revealed ? '?' : v}
                </span>
              );
            })}
          </div>
        </div>
      );

    case 'jumps': {
      const total = scene.jumps * scene.step;
      const w = 300;
      const pad = 16;
      const x = (n: number) => pad + (n / total) * (w - pad * 2);
      return (
        <div className="path-scene path-jumps">
          <svg viewBox={`0 0 ${w} 110`} width="100%" style={{ maxWidth: w }} role="img" aria-label={`${scene.jumps} jumps of ${scene.step}`}>
            {Array.from({ length: scene.jumps }, (_, i) => {
              const x0 = x(i * scene.step);
              const x1 = x((i + 1) * scene.step);
              return (
                <g key={i}>
                  <path d={`M${x0},74 Q${(x0 + x1) / 2},${20} ${x1},74`} fill="none" stroke="#9b6bdf" strokeWidth="3" strokeDasharray="5 4" />
                  <text x={(x0 + x1) / 2} y="36" textAnchor="middle" className="path-jumps-label">+{scene.step}</text>
                </g>
              );
            })}
            <line x1={pad} y1="80" x2={w - pad} y2="80" stroke="#2f3a4a" strokeWidth="3" strokeLinecap="round" />
            {Array.from({ length: scene.jumps + 1 }, (_, i) => (
              <line key={i} x1={x(i * scene.step)} y1="72" x2={x(i * scene.step)} y2="88" stroke="#2f3a4a" strokeWidth="3" />
            ))}
            <text x={x(0)} y="104" textAnchor="middle" className="path-jumps-num">0</text>
            <text x={x(total)} y="104" textAnchor="middle" className="path-jumps-num">{revealed ? total : '?'}</text>
            <text x={x(revealed ? total : 0)} y="66" textAnchor="middle" fontSize="22" className="path-jumps-roo">🦘</text>
          </svg>
        </div>
      );
    }

    case 'pairs': {
      const columns = Math.ceil(scene.count / 2);
      return (
        <div className="path-scene path-pairs" role="img" aria-label={`${scene.count} ducklings in pairs`}>
          {Array.from({ length: columns }, (_, c) => {
            const single = c === columns - 1 && scene.count % 2 === 1;
            return (
              <span key={c} className={`path-pairs-col ${single && revealed ? 'path-pairs-col--alone' : ''}`}>
                <span>{scene.icon}</span>
                <span className={single ? 'path-pairs-empty' : ''}>{single ? '' : scene.icon}</span>
              </span>
            );
          })}
        </div>
      );
    }

    case 'numbers':
      return (
        <div className="path-scene path-numbers">
          {scene.values.map((v) => (
            <span key={v} className="path-numbers-egg">
              <span aria-hidden="true">🥚</span>
              <span className="path-numbers-val">{v}</span>
            </span>
          ))}
        </div>
      );

    case 'pie':
      return (
        <div className="path-scene">
          <Pie slices={scene.slices} shaded={scene.shaded} size={160} />
        </div>
      );

    case 'pie-compare': {
      const label = (d: number) => ({ 2: '½', 3: '⅓', 4: '¼', 6: '⅙', 8: '⅛' })[d] ?? `1/${d}`;
      return (
        <div className="path-scene path-pie-compare">
          {[scene.a, scene.b].map((d) => (
            <div key={d} className="path-pie-compare-item">
              <Pie slices={d} shaded={1} highlightOne size={120} />
              <span className="path-pie-compare-label">{label(d)}</span>
            </div>
          ))}
        </div>
      );
    }

    case 'share': {
      const each = scene.items / scene.friends;
      return (
        <div className="path-scene path-share">
          <div className="path-share-basket" aria-label={`${scene.items} treats`}>
            {Array.from({ length: revealed ? 0 : scene.items }, (_, i) => (
              <span key={i}>{scene.icon}</span>
            ))}
            {revealed && <span className="path-share-done">🧺</span>}
          </div>
          <div className="path-share-friends">
            {Array.from({ length: scene.friends }, (_, f) => (
              <div key={f} className="path-share-friend">
                <span className="path-share-face">{scene.friend}</span>
                <span className="path-share-plate">
                  {revealed &&
                    Array.from({ length: each }, (_, i) => (
                      <span key={i} className="path-share-treat" style={{ animationDelay: `${i * 0.1 + f * 0.05}s` }}>
                        {scene.icon}
                      </span>
                    ))}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    case 'clock':
      return (
        <div className="path-scene path-clock">
          <span className="path-clock-rooster" aria-hidden="true">
            🐓
          </span>
          <Clock hour={scene.hour} minute={scene.minute} />
        </div>
      );

    case 'lengths':
      return (
        <div className="path-scene path-lengths">
          {scene.bars.map((bar, i) => (
            <div key={i} className="path-lengths-row">
              <span className="path-lengths-dot" style={{ background: bar.color }} />
              <span className="path-lengths-bar" style={{ width: `${bar.length * 10}%`, background: bar.color }} />
            </div>
          ))}
        </div>
      );

    case 'ladybugs':
      return (
        <div className="path-scene path-ladybugs" role="img" aria-label={`an object ${scene.length} ladybugs long`}>
          <div className="path-ladybugs-item" style={{ width: scene.length * 30 }}>
            <span className="path-ladybugs-stick" />
            <span className="path-ladybugs-icon">{scene.item}</span>
          </div>
          <div className="path-ladybugs-row">
            {Array.from({ length: scene.length }, (_, i) => (
              <span key={i} className="path-ladybugs-bug">
                🐞
              </span>
            ))}
          </div>
        </div>
      );

    case 'seesaw': {
      const tilt = scene.heavier === 'left' ? -12 : 12;
      return (
        <div className="path-scene path-seesaw">
          <svg viewBox="0 0 240 130" width="260" height="141" role="img" aria-label={`a seesaw tipping to the ${scene.heavier}`}>
            <polygon points="120,80 98,122 142,122" fill="#9b6bdf" stroke="#2f3a4a" strokeWidth="3" strokeLinejoin="round" />
            <g transform={`rotate(${tilt} 120 80)`}>
              <rect x="14" y="74" width="212" height="12" rx="6" fill="#c98a52" stroke="#2f3a4a" strokeWidth="3" />
              <text x="40" y="66" textAnchor="middle" fontSize="40">{scene.left}</text>
              <text x="200" y="66" textAnchor="middle" fontSize="40">{scene.right}</text>
            </g>
          </svg>
        </div>
      );
    }

    case 'shape':
      return (
        <div className="path-scene">
          <ShapeSvg shape={scene.shape} color={SHAPE_COLORS[scene.shape.length % SHAPE_COLORS.length]} size={140} />
        </div>
      );

    case 'shape-hunt':
      return (
        <div className="path-scene path-hunt">
          {scene.shapes.map((shape, i) => (
            <span key={i} className="path-hunt-item" style={{ transform: `rotate(${((i * 37) % 40) - 20}deg)` }}>
              <ShapeSvg shape={shape} color={SHAPE_COLORS[i % SHAPE_COLORS.length]} size={52} />
            </span>
          ))}
        </div>
      );

    case 'solid':
      return (
        <div className="path-scene">
          <span className="path-solid">{scene.icon}</span>
        </div>
      );

    case 'tally': {
      const groups = Math.floor(scene.count / 5);
      const rest = scene.count % 5;
      return (
        <div className="path-scene path-tally" role="img" aria-label="tally marks">
          {Array.from({ length: groups + (rest ? 1 : 0) }, (_, g) => {
            const marks = g < groups ? 4 : rest;
            return (
              <svg key={g} viewBox="0 0 60 60" width="60" height="60">
                {Array.from({ length: marks }, (_, m) => (
                  <line key={m} x1={10 + m * 12} y1="8" x2={10 + m * 12} y2="52" stroke="#2f3a4a" strokeWidth="4" strokeLinecap="round" />
                ))}
                {g < groups && <line x1="2" y1="44" x2="56" y2="14" stroke="#e2564f" strokeWidth="4" strokeLinecap="round" />}
              </svg>
            );
          })}
        </div>
      );
    }

    case 'graph':
      return (
        <div className="path-scene path-graph" role="img" aria-label="a picture graph of bugs found">
          {scene.rows.map((row) => (
            <div key={row.icon} className="path-graph-row">
              <span className="path-graph-key">{row.icon}</span>
              <span className="path-graph-cells">
                {Array.from({ length: 7 }, (_, i) => (
                  <span key={i} className={`path-graph-cell ${i < row.count ? 'path-graph-cell--on' : ''}`}>
                    {i < row.count ? row.icon : ''}
                  </span>
                ))}
              </span>
            </div>
          ))}
          <div className="path-graph-row path-graph-axis">
            <span className="path-graph-key" />
            <span className="path-graph-cells">
              {Array.from({ length: 7 }, (_, i) => (
                <span key={i} className="path-graph-cell path-graph-cell--axis">
                  {i + 1}
                </span>
              ))}
            </span>
          </div>
        </div>
      );
    case 'lifecycle-stage':
      return (
        <div className="path-scene path-life">
          <LifeStageArt stage={scene.stage} size={150} />
        </div>
      );

    case 'lifecycle-next': {
      const next = LIFE_STAGES[(LIFE_STAGES.indexOf(scene.stage) + 1) % LIFE_STAGES.length];
      return (
        <div className="path-scene path-life path-life-next">
          <LifeStageArt stage={scene.stage} size={110} />
          <span className="path-life-arrow" aria-hidden="true">
            ➜
          </span>
          {revealed ? (
            <LifeStageArt stage={next} size={110} />
          ) : (
            <span className="path-life-blank">?</span>
          )}
        </div>
      );
    }

    case 'lifecycle-cycle':
      return (
        <div className="path-scene path-life-cycle" role="img" aria-label="the butterfly life cycle with one stage missing">
          {CYCLE_CELLS.map((cell) => {
            if (!isStage(cell)) {
              return (
                <span key={cell} className="path-life-cycle-arrow" aria-hidden="true">
                  {cell}
                </span>
              );
            }
            const hidden = cell === scene.missing && !revealed;
            return (
              <span key={cell} className={`path-life-cycle-stage ${hidden ? 'path-life-blank' : ''}`}>
                {hidden ? '?' : <LifeStageArt stage={cell} size={76} />}
              </span>
            );
          })}
        </div>
      );

    case 'leaves':
      return (
        <div className="path-scene path-leaves" role="img" aria-label={`${scene.first} leaves and ${scene.second} more leaves`}>
          <LifeStageArt stage="caterpillar" size={70} />
          <span className="path-leaves-group">
            {Array.from({ length: scene.first }, (_, i) => (
              <span key={i}>🍃</span>
            ))}
          </span>
          <span className="path-leaves-op">+</span>
          <span className="path-leaves-group">
            {Array.from({ length: scene.second }, (_, i) => (
              <span key={i}>🍃</span>
            ))}
          </span>
        </div>
      );
  }
};
