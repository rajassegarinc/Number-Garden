import { useState } from 'react';
import { ACTIVITIES, getBandLabel, getEffectiveLevelCount } from '../data/activities';
import { StarBadge } from '../components/Stars';
import type { BandStat, ProgressState } from '../types';
import './ParentDashboard.css';

const bandGrade = (stat: BandStat): 'empty' | 'low' | 'mid' | 'high' => {
  if (stat.attempts === 0) return 'empty';
  const rate = stat.correct / stat.attempts;
  if (rate >= 0.8) return 'high';
  if (rate >= 0.5) return 'mid';
  return 'low';
};

interface ParentDashboardProps {
  progress: ProgressState;
  onReset: () => void;
  onBack: () => void;
}

export const ParentDashboard = ({ progress, onReset, onBack }: ParentDashboardProps) => {
  const [confirmingReset, setConfirmingReset] = useState(false);

  const lastPlayed = progress.lastPlayedAt
    ? new Date(progress.lastPlayedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Not yet played';

  return (
    <div className="parent-dashboard">
      <div className="parent-dashboard-header">
        <button type="button" className="parent-dashboard-back" onClick={onBack} aria-label="Back to home">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="parent-dashboard-title">Progress</h1>
        <StarBadge count={progress.totalStars} />
      </div>

      <div className="parent-dashboard-summary">
        <span>Last played: {lastPlayed}</span>
      </div>

      <div className="parent-dashboard-list">
        {ACTIVITIES.map((activity) => {
          const stat = progress.activities[activity.id];
          const accuracy = stat.attemptCount > 0 ? Math.round(stat.bestAccuracy * 100) : null;
          const settings = {
            maxNumber: progress.maxNumber,
            maxAdditionTotal: progress.maxAdditionTotal,
            wordMatchMaxNumber: progress.wordMatchMaxNumber,
          };
          const effectiveLevelCount = getEffectiveLevelCount(activity.id, activity.levelCount, settings);
          return (
            <div key={activity.id} className={`parent-stat-row parent-stat-row--${activity.color}`}>
              <span className="parent-stat-icon" aria-hidden="true">
                {activity.emoji}
              </span>
              <div className="parent-stat-info">
                <span className="parent-stat-title">{activity.title}</span>
                <span className="parent-stat-detail">
                  {effectiveLevelCount > 1 ? `Level ${stat.level} of ${effectiveLevelCount} · ` : ''}
                  {stat.correctCount}/{stat.attemptCount} correct
                  {accuracy !== null ? ` · best ${accuracy}%` : ''}
                </span>
                {effectiveLevelCount > 1 ? (
                  <div className="parent-stat-bands" role="img" aria-label="Accuracy by level">
                    {stat.bandStats.slice(0, effectiveLevelCount).map((bandStat, i) => {
                      const label = getBandLabel(activity.id, i + 1, settings);
                      const grade = bandGrade(bandStat);
                      const rate = bandStat.attempts > 0 ? Math.round((bandStat.correct / bandStat.attempts) * 100) : null;
                      return (
                        <span
                          key={i}
                          className={`parent-band-dot parent-band-dot--${grade}`}
                          title={`${label}: ${rate !== null ? `${rate}% correct` : 'not started'}`}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <span className="parent-stat-mixed-note">Numbers 1-{progress.maxNumber} · no levels, always open</span>
                )}
              </div>
              <span className="parent-stat-stars" aria-label={`${stat.starsEarned} stars`}>
                ⭐ {stat.starsEarned}
              </span>
            </div>
          );
        })}
      </div>

      <div className="parent-dashboard-reset">
        {confirmingReset ? (
          <div className="parent-dashboard-confirm">
            <p>Reset all progress? This can&apos;t be undone.</p>
            <div className="parent-dashboard-confirm-actions">
              <button
                type="button"
                className="parent-dashboard-confirm-btn parent-dashboard-confirm-btn--danger"
                onClick={() => {
                  onReset();
                  setConfirmingReset(false);
                }}
              >
                Yes, reset
              </button>
              <button
                type="button"
                className="parent-dashboard-confirm-btn"
                onClick={() => setConfirmingReset(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="parent-dashboard-reset-btn" onClick={() => setConfirmingReset(true)}>
            Reset progress
          </button>
        )}
      </div>
    </div>
  );
};
