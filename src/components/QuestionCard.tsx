import type { Question } from '../types';
import { AudioButton } from './AudioButton';
import './QuestionCard.css';

interface QuestionCardProps {
  question: Question;
  onHearWord?: () => void;
  speechSupported: boolean;
}

export const QuestionCard = ({ question, onHearWord, speechSupported }: QuestionCardProps) => {
  return (
    <div className="question-card">
      <p className="question-card-prompt">{question.prompt}</p>

      {question.displayNumber !== undefined && question.countIcon === undefined && (
        <div className="question-card-numeral">{question.displayNumber}</div>
      )}

      {question.displayWord !== undefined && (
        <div className="question-card-word-row">
          <span className="question-card-word">{question.displayWord}</span>
          {onHearWord && (
            <AudioButton onPress={onHearWord} supported={speechSupported} label="Hear the number" size="lg" />
          )}
        </div>
      )}

      {question.countIcon && question.displayNumber !== undefined && (
        <div
          className="question-card-count-grid"
          role="img"
          aria-label={`${question.displayNumber} ${question.countIcon}`}
        >
          {Array.from({ length: question.displayNumber }).map((_, i) => (
            <span key={i} className="question-card-count-item" style={{ animationDelay: `${0.15 + i * 0.05}s` }}>
              {question.countIcon}
            </span>
          ))}
        </div>
      )}

      {question.addend1 !== undefined && question.addend2 !== undefined && (
        <div
          className="question-card-addition"
          role="img"
          aria-label={`${question.addend1} ${question.additionIcon} plus ${question.addend2} ${question.additionIcon}, equals what`}
        >
          <div className="question-card-addition-group">
            {Array.from({ length: question.addend1 }).map((_, i) => (
              <span key={i} className="question-card-addition-item" style={{ animationDelay: `${0.15 + i * 0.07}s` }}>
                {question.additionIcon}
              </span>
            ))}
          </div>
          <span
            className="question-card-addition-op pop-in"
            style={{ animationDelay: `${0.2 + question.addend1 * 0.07}s` }}
          >
            +
          </span>
          <div className="question-card-addition-group">
            {Array.from({ length: question.addend2 }).map((_, i) => (
              <span
                key={i}
                className="question-card-addition-item"
                style={{ animationDelay: `${0.35 + (question.addend1 + i) * 0.07}s` }}
              >
                {question.additionIcon}
              </span>
            ))}
          </div>
          <span
            className="question-card-addition-op pop-in"
            style={{ animationDelay: `${0.45 + (question.addend1 + question.addend2) * 0.07}s` }}
          >
            =
          </span>
          <span
            className="question-card-addition-mark pop-in"
            style={{ animationDelay: `${0.55 + (question.addend1 + question.addend2) * 0.07}s` }}
          >
            ?
          </span>
        </div>
      )}

      {question.sequence && question.blankIndex !== undefined && (
        <div className="question-card-sequence" role="img" aria-label="Number sequence with a missing number">
          {question.sequence.map((n, i) => (
            <span
              key={i}
              className={`question-card-sequence-item ${i === question.blankIndex ? 'question-card-sequence-item--blank' : 'pop-in'}`}
              style={i === question.blankIndex ? undefined : { animationDelay: `${0.12 + i * 0.06}s` }}
            >
              {i === question.blankIndex ? '?' : n}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
