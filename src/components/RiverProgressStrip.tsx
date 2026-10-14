import { CelebrationAnimal } from './CelebrationAnimal';
import './RiverProgressStrip.css';

interface RiverProgressStripProps {
  current: number;
  total: number;
}

/**
 * A persistent "crossing the river" visual that sits above the actual
 * number-line question/answer engine in RiverMission. Separate from the
 * per-question answer stones below it — this strip is what makes the baby
 * elephant visibly travel toward its waiting mother over the course of the
 * WHOLE mission (one hop per question answered, right or wrong, so nothing
 * is ever lost — only ever forward progress), rather than the crossing
 * being implied only by a single multiple-choice tap.
 */
export const RiverProgressStrip = ({ current, total }: RiverProgressStripProps) => {
  const safeTotal = Math.max(1, total);
  const pct = Math.min(100, Math.max(0, (current / safeTotal) * 100));
  const stones = Array.from({ length: safeTotal + 1 });

  return (
    <div
      className="river-strip"
      role="img"
      aria-label={`The baby elephant has crossed ${current} of ${safeTotal} stones toward its mother`}
    >
      <div className="river-strip-water" />
      <div className="river-strip-stones">
        {stones.map((_, i) => (
          <span key={i} className={`river-strip-stone ${i <= current ? 'river-strip-stone--crossed' : ''}`} />
        ))}
      </div>
      <div className="river-strip-elephant" style={{ left: `${pct}%` }}>
        <CelebrationAnimal kind="elephant" pose="bounce" size={34} />
      </div>
      <div className="river-strip-mother">
        <CelebrationAnimal kind="elephant" pose="wave" flip size={42} />
      </div>
    </div>
  );
};
