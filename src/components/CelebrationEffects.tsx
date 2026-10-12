import { useState } from 'react';
import './CelebrationEffects.css';

const CONFETTI_COLORS = ['#ff6fa5', '#ffb703', '#2fa4e7', '#4caf50', '#9b6bdf'];

interface ConfettiPiece {
  id: number;
  left: number;
  delay: number;
  duration: number;
  color: string;
  rotate: number;
}

interface StarPiece {
  id: number;
  left: number;
  top: number;
  delay: number;
  size: number;
}

const buildConfetti = (count: number): ConfettiPiece[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    duration: 1.3 + Math.random() * 0.6,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    rotate: Math.random() * 360,
  }));

const buildStars = (count: number): StarPiece[] =>
  Array.from({ length: count }, (_, i) => ({
    id: i,
    left: 8 + Math.random() * 84,
    top: 5 + Math.random() * 70,
    delay: Math.random() * 2,
    size: 10 + Math.random() * 10,
  }));

interface CelebrationEffectsProps {
  perfect?: boolean;
}

/** Confetti burst + gentle floating stars, generated once per mount (so the
 * lineup stays stable across re-renders) and purely CSS-animated. */
export const CelebrationEffects = ({ perfect = false }: CelebrationEffectsProps) => {
  const [confetti] = useState<ConfettiPiece[]>(() => buildConfetti(perfect ? 26 : 18));
  const [stars] = useState<StarPiece[]>(() => buildStars(perfect ? 9 : 6));

  return (
    <div className="celebration-effects" aria-hidden="true">
      {confetti.map((piece) => (
        <span
          key={piece.id}
          className="celebration-confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            background: piece.color,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
      {stars.map((star) => (
        <span
          key={star.id}
          className={`celebration-float-star ${perfect ? 'celebration-float-star--gold' : ''}`}
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            animationDelay: `${star.delay}s`,
            fontSize: star.size,
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
};
