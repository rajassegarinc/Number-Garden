import './ProgressBar.css';

interface ProgressBarProps {
  current: number;
  total: number;
}

export const ProgressBar = ({ current, total }: ProgressBarProps) => {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <div className="progress-bar-wrap">
      <div
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Question ${current} of ${total}`}
      >
        <div className="progress-bar-fill" style={{ transform: `translateX(${pct - 100}%)` }} />
      </div>
      <span className="progress-bar-label" aria-hidden="true">
        {current}/{total}
      </span>
    </div>
  );
};
