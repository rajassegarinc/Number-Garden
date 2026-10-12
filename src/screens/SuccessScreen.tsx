import { useMemo, useState } from 'react';
import { getActivity } from '../data/activities';
import { StarRow } from '../components/Stars';
import { CelebrationAnimal } from '../components/CelebrationAnimal';
import { CelebrationEffects } from '../components/CelebrationEffects';
import { pickCelebrationLineup } from '../data/celebrationSelector';
import { pickEncouragement } from '../data/encouragement';
import { useCelebrationAudio } from '../hooks/useCelebrationAudio';
import type { CelebrationPose } from '../components/CelebrationAnimal';
import type { LevelResult } from '../types';
import './SuccessScreen.css';

const POSES: CelebrationPose[] = ['bounce', 'wave', 'jump'];

interface SuccessScreenProps {
  result: LevelResult;
  childName: string | null;
  soundOn: boolean;
  onNext: () => void;
  onHome: () => void;
}

export const SuccessScreen = ({ result, childName, soundOn, onNext, onHome }: SuccessScreenProps) => {
  const activity = getActivity(result.activityId);
  const hasNextLevel = result.leveledUp;
  const isPerfect = result.total > 0 && result.correct === result.total;

  // Both selected once per mount (i.e. once per celebration) and kept
  // stable across re-renders — re-randomizing on every render would make
  // the lineup flicker and would defeat the rotation history.
  const [lineup] = useState(() => pickCelebrationLineup());
  const [encouragement] = useState(() => pickEncouragement(childName, isPerfect));
  const poses = useMemo(() => lineup.map((_, i) => POSES[i % POSES.length]), [lineup]);

  useCelebrationAudio(soundOn, isPerfect);

  return (
    <div className="success-screen">
      <CelebrationEffects perfect={isPerfect} />

      <div className="success-banner">
        <span className="success-banner-sparkle" aria-hidden="true">✦</span>
        <h1 className="success-banner-text">Great!</h1>
        <span className="success-banner-sparkle" aria-hidden="true">✦</span>
      </div>

      <StarRow earned={result.starsEarned} />

      <p className="success-summary">{encouragement}</p>

      <p className="success-detail">
        You got <strong>{result.correct}</strong> out of <strong>{result.total}</strong> on{' '}
        <strong>{activity?.title}</strong>!
      </p>

      <div className="success-parade">
        {lineup.map((kind, i) => (
          <CelebrationAnimal key={kind} kind={kind} pose={poses[i]} flip={i % 2 === 1} delayIndex={i} size={96} />
        ))}
      </div>

      <div className="success-actions">
        <button type="button" className="success-btn success-btn--primary" onClick={onNext}>
          {hasNextLevel ? 'Next Level' : 'Back to Garden'}
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {hasNextLevel && (
          <button type="button" className="success-btn success-btn--secondary" onClick={onHome}>
            Home
          </button>
        )}
      </div>
    </div>
  );
};
