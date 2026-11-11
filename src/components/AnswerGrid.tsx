import { useEffect, useRef } from 'react';
import { cheerAt, oops } from '../motion/fx';
import type { AnswerChoice } from '../types';
import './AnswerGrid.css';

const COLORS = ['pink', 'blue', 'green', 'purple', 'yellow'] as const;

interface AnswerGridProps {
  choices: AnswerChoice[];
  selectedId: string | null;
  revealed: boolean;
  onSelect: (choice: AnswerChoice) => void;
  /** Smaller text for word answers (e.g. "quarter past 3") that would overflow the big numeral size. */
  compact?: boolean;
}

export const AnswerGrid = ({ choices, selectedId, revealed, onSelect, compact = false }: AnswerGridProps) => {
  const gridRef = useRef<HTMLDivElement>(null);

  // Juicy feedback the moment the answer is revealed: stars + chime from
  // the tapped button when it was right, a soft boop when it wasn't.
  useEffect(() => {
    if (!revealed || selectedId === null) return;
    const picked = choices.find((c) => c.id === selectedId);
    if (!picked) return;
    if (picked.isCorrect) {
      cheerAt(gridRef.current?.querySelector('.answer-choice--correct') ?? null);
    } else {
      oops();
    }
    // Fire once per reveal, not on every re-render of the same answer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed, selectedId]);

  return (
    <div className="answer-grid" ref={gridRef}>
      {choices.map((choice, index) => {
        const isSelected = choice.id === selectedId;
        const showCorrect = revealed && choice.isCorrect;
        const showWrong = revealed && isSelected && !choice.isCorrect;

        return (
          <button
            key={choice.id}
            type="button"
            className={[
              'answer-choice',
              compact ? 'answer-choice--compact' : '',
              `answer-choice--${COLORS[index % COLORS.length]}`,
              showCorrect ? 'answer-choice--correct' : '',
              showWrong ? 'answer-choice--wrong' : '',
              revealed && !showCorrect && !showWrong ? 'answer-choice--dim' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ animationDelay: `${0.12 + index * 0.06}s` }}
            onClick={() => onSelect(choice)}
            disabled={revealed}
            aria-label={`Answer ${choice.label}`}
            aria-pressed={isSelected}
          >
            {choice.label}
            {showCorrect && (
              <span className="answer-choice-mark" aria-hidden="true">
                ✓
              </span>
            )}
            {showWrong && (
              <span className="answer-choice-mark" aria-hidden="true">
                ✗
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
