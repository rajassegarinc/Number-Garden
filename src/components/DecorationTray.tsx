import { getNextLockedDecoration, getUnlockedDecorations } from '../data/decorations';
import type { DecorationId } from '../types';
import './DecorationTray.css';

interface DecorationTrayProps {
  totalStars: number;
  held: DecorationId | null;
  onHold: (id: DecorationId | null) => void;
}

export const DecorationTray = ({ totalStars, held, onHold }: DecorationTrayProps) => {
  const unlocked = getUnlockedDecorations(totalStars);
  const next = getNextLockedDecoration(totalStars);

  return (
    <div className="decoration-tray">
      <p className="decoration-tray-label">
        {held ? 'Tap an empty spot in your garden to place it!' : 'Your decorations — tap one, then tap a spot'}
      </p>
      <div className="decoration-tray-row">
        {unlocked.length === 0 && !next && <span className="decoration-tray-empty">Earn stars to unlock decorations!</span>}
        {unlocked.map((deco) => (
          <button
            key={deco.id}
            type="button"
            className={`decoration-chip ${held === deco.id ? 'decoration-chip--held' : ''}`}
            onClick={() => onHold(held === deco.id ? null : deco.id)}
            aria-label={`${deco.label}${held === deco.id ? ', selected' : ''}`}
            aria-pressed={held === deco.id}
          >
            <span aria-hidden="true">{deco.emoji}</span>
          </button>
        ))}
        {next && (
          <div className="decoration-chip decoration-chip--locked" aria-label={`${next.label} unlocks at ${next.starsRequired} stars`}>
            <span aria-hidden="true">🔒</span>
            <span className="decoration-chip-req">{next.starsRequired}⭐</span>
          </div>
        )}
      </div>
    </div>
  );
};
