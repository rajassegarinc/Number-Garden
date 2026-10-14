import { MISSIONS } from '../data/missions';
import { CelebrationAnimal } from '../components/CelebrationAnimal';
import type { MissionId, ProgressState } from '../types';
import './AdventureMap.css';

interface AdventureMapProps {
  progress: ProgressState;
  onSelectMission: (id: MissionId) => void;
  onBack: () => void;
}

export const AdventureMap = ({ progress, onSelectMission, onBack }: AdventureMapProps) => (
  <div className="adventure-map">
    <div className="adventure-map-header">
      <button type="button" className="adventure-map-back" onClick={onBack} aria-label="Back to home">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <h1 className="adventure-map-title">Animal Rescue Adventure</h1>
    </div>

    <p className="adventure-map-sub">Pick a friend to help! Play any mission, any time.</p>

    <div className="adventure-map-list">
      {MISSIONS.map((mission) => {
        const missionProgress = progress.missions[mission.id];
        return (
          <button
            key={mission.id}
            type="button"
            className={`adventure-card adventure-card--${mission.color}`}
            onClick={() => onSelectMission(mission.id)}
            aria-label={`${mission.title}. ${mission.blurb}${missionProgress.completed ? '. Completed' : ''}`}
          >
            <span className="adventure-card-animal">
              <CelebrationAnimal kind={mission.guide} pose="bounce" size={72} />
            </span>
            <span className="adventure-card-text">
              <span className="adventure-card-title">{mission.title}</span>
              <span className="adventure-card-blurb">{mission.blurb}</span>
            </span>
            <span className="adventure-card-status" aria-hidden="true">
              {missionProgress.completed ? (
                <span className="adventure-card-stars">⭐ {missionProgress.starsEarned}</span>
              ) : (
                <span className="adventure-card-new">Play</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  </div>
);
