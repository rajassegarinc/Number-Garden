import { CelebrationAnimal } from './CelebrationAnimal';
import type { AnimalKind } from '../data/celebrationAnimals';
import './MissionIntro.css';

interface MissionIntroProps {
  guide: AnimalKind;
  title: string;
  message: string;
  startLabel?: string;
  onStart: () => void;
  onBack: () => void;
}

/** Shared "before you play" card for each Animal Rescue Adventure mission —
 * sets the scene with the guide animal and a short, friendly instruction
 * before the actual gameplay begins. */
export const MissionIntro = ({ guide, title, message, startLabel = "Let's Go!", onStart, onBack }: MissionIntroProps) => (
  <div className="mission-intro">
    <button type="button" className="mission-intro-back" onClick={onBack} aria-label="Back to adventure map">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>

    <div className="mission-intro-card">
      <CelebrationAnimal kind={guide} pose="wave" size={120} />
      <h1 className="mission-intro-title">{title}</h1>
      <p className="mission-intro-message">{message}</p>
      <button type="button" className="mission-intro-start" onClick={onStart}>
        {startLabel}
      </button>
    </div>
  </div>
);
