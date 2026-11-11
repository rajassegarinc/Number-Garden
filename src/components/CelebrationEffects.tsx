import { useEffect, useState } from 'react';
import { celebrate } from '../motion/fx';
import './CelebrationEffects.css';

interface StarPiece {
  id: number;
  left: number;
  top: number;
  delay: number;
  size: number;
}

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

/** Confetti cannons (drawn on the shared particle canvas) + gentle floating
 * stars, generated once per mount so the lineup stays stable across
 * re-renders. */
export const CelebrationEffects = ({ perfect = false }: CelebrationEffectsProps) => {
  const [stars] = useState<StarPiece[]>(() => buildStars(perfect ? 9 : 6));

  useEffect(() => {
    // Slight delay so the cannons fire after the screen has faded in.
    const timer = window.setTimeout(() => celebrate(perfect), 250);
    return () => window.clearTimeout(timer);
  }, [perfect]);

  return (
    <div className="celebration-effects" aria-hidden="true">
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
