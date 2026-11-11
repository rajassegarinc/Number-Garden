import { useRef, useState } from 'react';
import { burstFrom } from '../motion/fx';
import './Mascot.css';

export type MascotMood = 'happy' | 'excited' | 'thinking' | 'encouraging';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  label?: string;
}

export const Mascot = ({ mood = 'happy', size = 140, label = 'Ellie the elephant' }: MascotProps) => {
  // Tapping Ellie makes her giggle-hop and puff out a few hearts. Purely a
  // toy: it never changes game state.
  const [poked, setPoked] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const poke = () => {
    if (poked) return;
    setPoked(true);
    burstFrom(ref.current, 'hearts');
  };

  return (
    <div
      ref={ref}
      className={`mascot mascot--${mood} ${poked ? 'mascot--poked' : ''}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label}
      onPointerDown={poke}
      onAnimationEnd={(e) => {
        if (e.animationName === 'mascot-giggle') setPoked(false);
      }}
    >
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        <ellipse cx="100" cy="182" rx="52" ry="10" fill="#1f6fb2" opacity="0.12" />

        <path
          d="M46 118c-18 6-26 22-18 34 6 9 20 11 28 3 4 10 16 15 26 10"
          fill="#4fb0ea"
          stroke="#2f8fd1"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M154 118c18 6 26 22 18 34-6 9-20 11-28 3-4 10-16 15-26 10"
          fill="#4fb0ea"
          stroke="#2f8fd1"
          strokeWidth="3"
          strokeLinejoin="round"
        />

        <g className="mascot-ear mascot-ear--l">
          <ellipse cx="60" cy="86" rx="26" ry="30" fill="#5ec1f5" stroke="#2f8fd1" strokeWidth="3" />
          <ellipse cx="60" cy="88" rx="14" ry="17" fill="#eaf8ff" />
        </g>
        <g className="mascot-ear mascot-ear--r">
          <ellipse cx="140" cy="86" rx="26" ry="30" fill="#5ec1f5" stroke="#2f8fd1" strokeWidth="3" />
          <ellipse cx="140" cy="88" rx="14" ry="17" fill="#eaf8ff" />
        </g>

        <ellipse cx="100" cy="110" rx="58" ry="52" fill="#5ec1f5" stroke="#2f8fd1" strokeWidth="3.5" />

        <circle cx="76" cy="104" r="20" fill="#fbeedc" opacity="0.5" />
        <circle cx="124" cy="104" r="20" fill="#fbeedc" opacity="0.5" />

        <g className="mascot-eyes">
          <circle cx="80" cy="100" r="7" fill="#214a63" />
          <circle cx="120" cy="100" r="7" fill="#214a63" />
          <circle cx="82.5" cy="97.5" r="2.2" fill="#ffffff" />
          <circle cx="122.5" cy="97.5" r="2.2" fill="#ffffff" />
        </g>

        <path
          d="M100 118c0 0-4 10-2 22 1 10 8 16 14 14s6-10 2-16"
          fill="#5ec1f5"
          stroke="#2f8fd1"
          strokeWidth="3.5"
          strokeLinejoin="round"
          className="mascot-trunk"
        />

        <ellipse cx="78" cy="128" rx="7" ry="5" fill="#ff9ec4" opacity="0.7" />
        <ellipse cx="122" cy="128" rx="7" ry="5" fill="#ff9ec4" opacity="0.7" />

        {mood === 'excited' && (
          <g className="mascot-sparkle">
            <path d="M160 50l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#ffd166" />
            <path d="M34 60l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#ffd166" />
          </g>
        )}
      </svg>
    </div>
  );
};
