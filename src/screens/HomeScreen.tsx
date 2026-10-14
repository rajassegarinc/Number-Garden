import { ACTIVITIES } from '../data/activities';
import { MISSIONS } from '../data/missions';
import { ActivityCard } from '../components/ActivityCard';
import { CelebrationAnimal } from '../components/CelebrationAnimal';
import { Mascot } from '../components/Mascot';
import { StarBadge } from '../components/Stars';
import type { ActivityId, ProgressState } from '../types';
import './HomeScreen.css';

interface HomeScreenProps {
  progress: ProgressState;
  onSelectActivity: (id: ActivityId) => void;
  onOpenSettings: () => void;
  onOpenAdventure: () => void;
  onOpenGarden: () => void;
  onOpenWorlds: () => void;
}

export const HomeScreen = ({ progress, onSelectActivity, onOpenSettings, onOpenAdventure, onOpenGarden, onOpenWorlds }: HomeScreenProps) => {
  const missionsCompleted = MISSIONS.filter((m) => progress.missions[m.id].completed).length;
  return (
    <div className="home-screen">
      <div className="home-header">
        <div className="home-greeting">
          <span className="home-greeting-hi">{progress.childName ? 'Welcome back,' : 'Hello!'}</span>
          <span className="home-greeting-name">
            {progress.childName ? `${progress.childName}!` : 'Ready to count?'}
          </span>
        </div>
        <div className="home-header-actions">
          <StarBadge count={progress.totalStars} />
          <button
            type="button"
            className="home-settings-btn"
            onClick={onOpenSettings}
            aria-label="Parent settings"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="2" />
              <path
                d="M19.4 13.5a7.6 7.6 0 000-3l2-1.6-2-3.4-2.4 1a7.6 7.6 0 00-2.6-1.5L14 2h-4l-.4 2.5a7.6 7.6 0 00-2.6 1.5l-2.4-1-2 3.4 2 1.6a7.6 7.6 0 000 3l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 002.6 1.5L10 22h4l.4-2.5a7.6 7.6 0 002.6-1.5l2.4 1 2-3.4-2-1.6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>

      <div className="home-hero">
        <Mascot mood="happy" size={110} />
        <div className="home-hero-card">
          <h1 className="home-hero-title">Number Garden</h1>
          <p className="home-hero-sub">Numbers 1 to {progress.maxNumber}</p>
        </div>
      </div>

      <button type="button" className="home-adventure-banner" onClick={onOpenAdventure}>
        <span className="home-adventure-animals">
          {MISSIONS.map((mission) => (
            <CelebrationAnimal key={mission.id} kind={mission.guide} pose="wave" size={44} />
          ))}
        </span>
        <span className="home-adventure-text">
          <span className="home-adventure-title">🌟 Animal Rescue Adventure</span>
          <span className="home-adventure-sub">
            {missionsCompleted === MISSIONS.length
              ? 'All missions complete — play again!'
              : `Help the animals! ${missionsCompleted}/${MISSIONS.length} missions done`}
          </span>
        </span>
        <span className="home-adventure-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <button type="button" className="home-garden-banner" onClick={onOpenGarden}>
        <span className="home-garden-icon" aria-hidden="true">🌻</span>
        <span className="home-garden-text">
          <span className="home-garden-title">My Garden</span>
          <span className="home-garden-sub">Plant seeds, grow flowers, visit your animal friend</span>
        </span>
        <span className="home-garden-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <button type="button" className="home-world-banner" onClick={onOpenWorlds}>
        <span className="home-world-icon" aria-hidden="true">🗺</span>
        <span className="home-world-text">
          <span className="home-world-title">Number Adventures</span>
          <span className="home-world-sub">Explore the Magical Forest, Under the Sea, and Save the Deer</span>
        </span>
        <span className="home-world-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      <div className="home-activity-list">
        {ACTIVITIES.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            progress={progress.activities[activity.id]}
            settings={{
              maxNumber: progress.maxNumber,
              maxAdditionTotal: progress.maxAdditionTotal,
              wordMatchMaxNumber: progress.wordMatchMaxNumber,
            }}
            onSelect={onSelectActivity}
          />
        ))}
      </div>
    </div>
  );
};
