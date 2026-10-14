import { CelebrationAnimal } from './CelebrationAnimal';
import { CelebrationEffects } from './CelebrationEffects';
import { StarRow } from './Stars';
import type { AnimalKind } from '../data/celebrationAnimals';
import './MissionCelebration.css';

interface MissionCelebrationProps {
  guide: AnimalKind;
  secondGuide?: AnimalKind;
  message: string;
  starsEarned: number;
  onPlayAgain: () => void;
  onBackToMap: () => void;
}

/** Shared full-screen "mission complete" celebration used by all three
 * Animal Rescue Adventure missions — confetti, the guide animal(s)
 * bouncing, the earned stars, and a choice to replay or return to the map
 * (missions are always replayable, never locked). */
export const MissionCelebration = ({
  guide,
  secondGuide,
  message,
  starsEarned,
  onPlayAgain,
  onBackToMap,
}: MissionCelebrationProps) => {
  const isPerfect = starsEarned >= 3;

  return (
    <div className="mission-celebration">
      <CelebrationEffects perfect={isPerfect} />

      <div className="mission-celebration-banner">
        <span className="mission-celebration-sparkle" aria-hidden="true">✦</span>
        <h1 className="mission-celebration-text">Mission Complete!</h1>
        <span className="mission-celebration-sparkle" aria-hidden="true">✦</span>
      </div>

      <StarRow earned={starsEarned} />

      <p className="mission-celebration-message">{message}</p>

      <div className="mission-celebration-animals">
        <CelebrationAnimal kind={guide} pose="bounce" size={110} />
        {secondGuide && <CelebrationAnimal kind={secondGuide} pose="wave" flip size={110} />}
      </div>

      <div className="mission-celebration-actions">
        <button type="button" className="mission-celebration-btn mission-celebration-btn--primary" onClick={onPlayAgain}>
          Play Again
        </button>
        <button type="button" className="mission-celebration-btn mission-celebration-btn--secondary" onClick={onBackToMap}>
          Back to Map
        </button>
      </div>
    </div>
  );
};
