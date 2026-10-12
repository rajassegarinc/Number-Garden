import { ProgressBar } from './ProgressBar';
import { AudioButton } from './AudioButton';
import './GameHeader.css';

interface GameHeaderProps {
  title: string;
  current: number;
  total: number;
  onBack: () => void;
  onHearPrompt: () => void;
  speechSupported: boolean;
  childName?: string | null;
}

export const GameHeader = ({
  title,
  current,
  total,
  onBack,
  onHearPrompt,
  speechSupported,
  childName,
}: GameHeaderProps) => (
  <header className="game-header-wrap">
    <div className="game-header">
      <button type="button" className="game-header-back" onClick={onBack} aria-label="Back to home">
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
      <ProgressBar current={current} total={total} />
      <AudioButton onPress={onHearPrompt} supported={speechSupported} label={`Hear: ${title}`} />
    </div>
    <div className="game-header-subrow">
      {childName && <span className="game-header-name">Hi, {childName}!</span>}
      <span className="game-header-activity">{title}</span>
    </div>
  </header>
);
