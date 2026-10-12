import { getBandLabel, getEffectiveLevelCount } from '../data/activities';
import type { ActivityMeta, ActivityProgress, NumberSettings } from '../types';
import './ActivityCard.css';

interface ActivityCardProps {
  activity: ActivityMeta;
  progress: ActivityProgress;
  settings: NumberSettings;
  onSelect: (id: ActivityMeta['id']) => void;
}

export const ActivityCard = ({ activity, progress, settings, onSelect }: ActivityCardProps) => {
  const effectiveLevelCount = getEffectiveLevelCount(activity.id, activity.levelCount, settings);
  const level = Math.min(progress.level, effectiveLevelCount);
  const levelLabel =
    effectiveLevelCount > 1
      ? `${getBandLabel(activity.id, level, settings)} (level ${level} of ${effectiveLevelCount})`
      : getBandLabel(activity.id, level, settings);

  return (
    <button
      type="button"
      className={`activity-card activity-card--${activity.color}`}
      onClick={() => onSelect(activity.id)}
      aria-label={`${activity.title}. ${activity.description}. ${levelLabel}.`}
    >
      <span className="activity-card-icon" aria-hidden="true">
        {activity.emoji}
      </span>
      <span className="activity-card-text">
        <span className="activity-card-title">{activity.title}</span>
        <span className="activity-card-desc">{activity.description}</span>
        <span className="activity-card-level">{levelLabel}</span>
      </span>
      {progress.starsEarned > 0 && (
        <span className="activity-card-stars" aria-hidden="true">
          ⭐ {progress.starsEarned}
        </span>
      )}
      <span className="activity-card-chevron" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="22" height="22">
          <path
            d="M9 5l7 7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
};
