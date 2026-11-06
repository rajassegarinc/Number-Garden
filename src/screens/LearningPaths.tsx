import { getActivity } from '../data/activities';
import { PATH_SIDE_QUESTS, PATH_TRAIL } from '../data/learningPaths';
import { ActivityCard } from '../components/ActivityCard';
import type { ActivityId, ProgressState } from '../types';
import './AdventureMap.css';
import './LearningPaths.css';

interface LearningPathsProps {
  progress: ProgressState;
  onSelectActivity: (id: ActivityId) => void;
  onBack: () => void;
}

export const LearningPaths = ({ progress, onSelectActivity, onBack }: LearningPathsProps) => {
  const settings = {
    maxNumber: progress.maxNumber,
    maxAdditionTotal: progress.maxAdditionTotal,
    wordMatchMaxNumber: progress.wordMatchMaxNumber,
  };
  // The first trail stop the child hasn't played yet gets a "next" glow.
  const nextId = PATH_TRAIL.find((id) => progress.activities[id].attemptCount === 0);

  const renderCard = (id: ActivityId) => {
    const activity = getActivity(id);
    if (!activity) return null;
    return (
      <ActivityCard
        activity={activity}
        progress={progress.activities[id]}
        settings={settings}
        onSelect={onSelectActivity}
      />
    );
  };

  return (
    <div className="adventure-map">
      <div className="adventure-map-header">
        <button type="button" className="adventure-map-back" onClick={onBack} aria-label="Back to home">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="adventure-map-title">Learning Paths</h1>
      </div>

      <p className="adventure-map-sub">Follow the trail from top to bottom, or jump to any path you like!</p>

      <ol className="paths-trail">
        {PATH_TRAIL.map((id, index) => {
          const played = progress.activities[id].attemptCount > 0;
          return (
            <li
              key={id}
              className={`paths-stop ${played ? 'paths-stop--played' : ''} ${id === nextId ? 'paths-stop--next' : ''}`}
            >
              <span className="paths-stop-marker" aria-hidden="true">
                {played ? '✓' : index + 1}
              </span>
              <div className="paths-stop-card">{renderCard(id)}</div>
            </li>
          );
        })}
      </ol>

      <h2 className="paths-side-title">🗺 Side quests</h2>
      <div className="paths-side-list">
        {PATH_SIDE_QUESTS.map((id) => (
          <div key={id}>{renderCard(id)}</div>
        ))}
      </div>
    </div>
  );
};
