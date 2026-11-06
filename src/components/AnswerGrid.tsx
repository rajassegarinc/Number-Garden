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
  return (
    <div className="answer-grid">
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
