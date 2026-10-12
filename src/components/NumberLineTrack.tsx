import { useEffect, useRef } from 'react';
import './NumberLineTrack.css';

interface NumberLineTrackProps {
  min: number;
  max: number;
  given?: number[];
  startValue?: number;
  selectedValue?: number | null;
  revealed?: boolean;
  correctValue?: number;
  onSelect: (value: number) => void;
}

export const NumberLineTrack = ({
  min,
  max,
  given = [],
  startValue,
  selectedValue = null,
  revealed = false,
  correctValue,
  onSelect,
}: NumberLineTrackProps) => {
  const stones = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const containerRef = useRef<HTMLDivElement>(null);

  // The track can scroll horizontally (up to 10 stones won't all fit on a
  // phone at a touch-friendly size), so whenever a new question names a
  // specific stone (the "given" context number, or the jump start), bring
  // it into view instead of leaving the child to discover it's off-screen.
  useEffect(() => {
    const anchor = startValue ?? given[0];
    if (anchor === undefined || !containerRef.current) return;
    const el = containerRef.current.querySelector<HTMLElement>(`[data-stone-value="${anchor}"]`);
    if (!el) return;
    const reduceMotion =
      typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', inline: 'center', block: 'nearest' });
    // Only re-run when the question's own identifying numbers change, not
    // on every selection/reveal re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, startValue, given.join(',')]);

  return (
    <div className="number-line-track-scroll" ref={containerRef}>
      <div className="number-line-track" role="group" aria-label={`Stepping stones from ${min} to ${max}`}>
        {stones.map((value) => {
          const isGiven = given.includes(value);
          const isStart = startValue === value;
          const isSelected = selectedValue === value;
          const showCorrect = revealed && value === correctValue;
          const showWrong = revealed && isSelected && value !== correctValue;

          return (
            <button
              key={value}
              type="button"
              data-stone-value={value}
              className={[
                'number-line-stone',
                isGiven ? 'number-line-stone--given' : '',
                isStart ? 'number-line-stone--start' : '',
                isSelected && !revealed ? 'number-line-stone--selected' : '',
                showCorrect ? 'number-line-stone--correct' : '',
                showWrong ? 'number-line-stone--wrong' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelect(value)}
              disabled={revealed}
              aria-pressed={isSelected}
              aria-label={isStart ? `${value}, starting stone` : `Stepping stone ${value}`}
            >
              {isStart && (
                <span className="number-line-stone-marker" aria-hidden="true">
                  🐾
                </span>
              )}
              {value}
              {isGiven && !isStart && (
                <span className="number-line-stone-flag" aria-hidden="true">
                  🌼
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
