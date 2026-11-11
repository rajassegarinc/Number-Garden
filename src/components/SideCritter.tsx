import './SideCritter.css';

export type CritterKind = 'monkey' | 'tiger' | 'giraffe' | 'lion';

const CRITTERS: Record<CritterKind, { face: string; ear: string; label: string; extra?: string }> = {
  monkey: { face: '#c98a52', ear: '#e8bd8d', label: 'a friendly monkey' },
  tiger: { face: '#f4a93c', ear: '#fcd49b', label: 'a friendly tiger' },
  giraffe: { face: '#f2c75c', ear: '#fde8a8', label: 'a friendly giraffe' },
  lion: { face: '#e8a63e', ear: '#f7cf7e', label: 'a friendly lion' },
};

/** How the critter is feeling: it blinks and sways when idle, jumps for a
 * right answer and gives a kind little head-tilt for a wrong one. */
export type CritterMood = 'idle' | 'cheer' | 'oops';

interface SideCritterProps {
  kind: CritterKind;
  size?: number;
  mood?: CritterMood;
}

export const SideCritter = ({ kind, size = 84, mood = 'idle' }: SideCritterProps) => {
  const c = CRITTERS[kind];
  return (
    <div
      className={`side-critter side-critter--${mood}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={c.label}
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%" overflow="visible">
        <ellipse className="side-critter-shadow" cx="60" cy="112" rx="34" ry="6" fill="#2f3a4a" opacity="0.14" />
        <g className="side-critter-body">
        <ellipse className="side-critter-ear side-critter-ear--l" cx="30" cy="40" rx="18" ry="18" fill={c.ear} />
        <ellipse className="side-critter-ear side-critter-ear--r" cx="90" cy="40" rx="18" ry="18" fill={c.ear} />
        <circle cx="60" cy="62" r="42" fill={c.face} />
        {kind === 'giraffe' && (
          <>
            <circle cx="46" cy="52" r="5" fill="#c9822a" />
            <circle cx="70" cy="46" r="4" fill="#c9822a" />
            <circle cx="40" cy="70" r="4" fill="#c9822a" />
          </>
        )}
        {kind === 'tiger' && (
          <>
            <path d="M30 42q6 10 0 18" stroke="#b5731f" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M90 42q-6 10 0 18" stroke="#b5731f" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        )}
        {kind === 'lion' && (
          <circle cx="60" cy="62" r="52" fill="none" stroke="#c97a1f" strokeWidth="10" strokeDasharray="10 8" opacity="0.5" />
        )}
        <ellipse cx="60" cy="70" rx="22" ry="18" fill="#fff3df" />
        {mood === 'cheer' ? (
          // Happy squeezed-shut eyes.
          <g stroke="#2f3a4a" strokeWidth="3.5" fill="none" strokeLinecap="round">
            <path d="M42 60q6 -8 12 0" />
            <path d="M66 60q6 -8 12 0" />
          </g>
        ) : (
          <g className="side-critter-eyes">
            <circle cx="48" cy="58" r="6" fill="#2f3a4a" />
            <circle cx="72" cy="58" r="6" fill="#2f3a4a" />
            <circle cx="49.5" cy="56" r="1.8" fill="#fff" />
            <circle cx="73.5" cy="56" r="1.8" fill="#fff" />
          </g>
        )}
        <ellipse cx="60" cy="72" rx="6" ry="4" fill="#2f3a4a" />
        {mood === 'cheer' ? (
          <path d="M48 79q12 14 24 0z" fill="#2f3a4a" />
        ) : mood === 'oops' ? (
          <ellipse cx="60" cy="84" rx="4" ry="3.2" fill="#2f3a4a" />
        ) : (
          <path d="M50 80q10 8 20 0" stroke="#2f3a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
        )}
        </g>
      </svg>
    </div>
  );
};

