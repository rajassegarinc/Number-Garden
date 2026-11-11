import './Dino.css';

/** How the dinosaur is feeling. Drives the face and the body animation. */
export type DinoMood = 'idle' | 'happy' | 'no';

interface DinoLook {
  body: string;
  dark: string;
  accent: string;
  feature: 'spikes' | 'horn' | 'plates' | 'crest';
  name: string;
}

export const DINO_LOOKS: DinoLook[] = [
  { body: '#6fcf7c', dark: '#4aa85a', accent: '#f6a23c', feature: 'spikes', name: 'green' },
  { body: '#b08be8', dark: '#8a63c9', accent: '#ff8fc0', feature: 'horn', name: 'purple' },
  { body: '#ffa85c', dark: '#e0843a', accent: '#5ecbd0', feature: 'plates', name: 'orange' },
  { body: '#5ecbd0', dark: '#39a3a9', accent: '#ffd166', feature: 'crest', name: 'blue' },
];

interface DinoProps {
  /** Index into DINO_LOOKS (wraps). */
  variant: number;
  /** Number painted on the tummy. Omit for babies. */
  number?: number;
  mood?: DinoMood;
  /** Legs stride and the body bobs, for walking on stage. */
  walking?: boolean;
  size?: number;
}

/**
 * A fully animated cartoon dinosaur drawn as layered SVG groups (tail,
 * legs, body, head, eyes) so each part can move by itself: it breathes,
 * blinks and wags its tail when idle, strides when walking, jumps with
 * squeezed-shut happy eyes when it is right, and shakes its head kindly
 * when it is not. Animation is transform/opacity only.
 */
export const Dino = ({ variant, number, mood = 'idle', walking = false, size = 110 }: DinoProps) => {
  const look = DINO_LOOKS[((variant % DINO_LOOKS.length) + DINO_LOOKS.length) % DINO_LOOKS.length];
  return (
    <div
      className={`dino dino--${mood} ${walking ? 'dino--walking' : ''}`}
      style={{ width: size, height: size * (120 / 140) }}
      role="img"
      aria-label={number !== undefined ? `${look.name} dinosaur number ${number}` : `baby ${look.name} dinosaur`}
    >
      <svg viewBox="0 0 140 120" width="100%" height="100%" overflow="visible">
        <ellipse className="dino-shadow" cx="66" cy="113" rx="40" ry="6" fill="#2f3a4a" opacity="0.14" />
        <g className="dino-all">
          <path
            className="dino-tail"
            d="M40 80 C 20 84, 6 72, 3 54 C 12 66, 26 68, 42 60 Z"
            fill={look.body}
          />
          <rect className="dino-leg dino-leg--far-a" x="52" y="84" width="14" height="26" rx="7" fill={look.dark} />
          <rect className="dino-leg dino-leg--far-b" x="78" y="84" width="14" height="26" rx="7" fill={look.dark} />

          <g className="dino-torso">
            {look.feature === 'spikes' && (
              <g fill={look.accent}>
                <path d="M34 60l6 -11 5 9z" />
                <path d="M46 53l7 -12 5 10z" />
                <path d="M59 49l7 -12 5 11z" />
                <path d="M72 51l6 -11 5 11z" />
              </g>
            )}
            {look.feature === 'plates' && (
              <g fill={look.accent}>
                <path d="M32 60q2 -14 10 -12q6 4 2 10z" />
                <path d="M45 52q3 -17 12 -14q7 5 2 12z" />
                <path d="M60 49q4 -16 12 -12q6 6 0 13z" />
              </g>
            )}
            <ellipse cx="62" cy="72" rx="32" ry="24" fill={look.body} />
            {number !== undefined && (
              <>
                <circle cx="62" cy="76" r="17" fill="#fffbe9" />
                <text
                  x="62"
                  y={number >= 10 ? 83 : 85}
                  textAnchor="middle"
                  fontFamily="'Baloo 2', 'Nunito', system-ui, sans-serif"
                  fontWeight="800"
                  fontSize={number >= 10 ? 21 : 26}
                  fill="#2f3a4a"
                >
                  {number}
                </text>
              </>
            )}
            {number === undefined && <ellipse cx="62" cy="80" rx="18" ry="12" fill="#fffbe9" opacity="0.8" />}
          </g>

          <rect className="dino-leg dino-leg--near-a" x="42" y="86" width="15" height="26" rx="7.5" fill={look.body} />
          <rect className="dino-leg dino-leg--near-b" x="70" y="86" width="15" height="26" rx="7.5" fill={look.body} />

          <g className="dino-head">
            {look.feature === 'horn' && <ellipse cx="90" cy="27" rx="11" ry="16" fill={look.accent} />}
            {look.feature === 'crest' && (
              <path d="M100 22 C 90 4, 72 6, 70 16 C 82 13, 90 20, 96 30 Z" fill={look.accent} />
            )}
            <path d="M76 60 C 80 44, 88 34, 98 30 L 112 46 C 102 50, 97 60, 94 74 Z" fill={look.body} />
            <ellipse cx="106" cy="34" rx="20" ry="15.5" fill={look.body} />
            <ellipse cx="119" cy="39" rx="12" ry="10" fill={look.body} />
            {look.feature === 'horn' && <path d="M119 30l4 -14 6 13z" fill="#fffbe9" />}
            <circle cx="104" cy="42" r="4" fill="#ff9ec4" opacity="0.65" />
            <circle cx="125" cy="35" r="1.5" fill={look.dark} />
            {mood === 'happy' ? (
              <path d="M99 31q6 -8 12 0" stroke="#2f3a4a" strokeWidth="3" fill="none" strokeLinecap="round" />
            ) : (
              <g className="dino-eye">
                <circle cx="105" cy="29" r="6" fill="#ffffff" />
                <circle cx="106.5" cy="29.5" r="3.4" fill="#2f3a4a" />
                <circle cx="107.6" cy="28.2" r="1.1" fill="#ffffff" />
              </g>
            )}
            {mood === 'happy' ? (
              <path d="M111 42q8 10 16 0z" fill="#2f3a4a" />
            ) : mood === 'no' ? (
              <path d="M113 45q6 -3 12 0" stroke="#2f3a4a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M112 44q7 5 14 -1" stroke="#2f3a4a" strokeWidth="2.6" fill="none" strokeLinecap="round" />
            )}
          </g>
          <ellipse className="dino-arm" cx="86" cy="78" rx="5" ry="9" fill={look.dark} transform="rotate(-25 86 78)" />
        </g>
      </svg>
    </div>
  );
};
