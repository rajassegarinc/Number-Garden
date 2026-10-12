import { useState } from 'react';
import type { FormEvent } from 'react';
import { ADDITION_TOTAL_OPTIONS, MAX_NUMBER_MAX, MAX_NUMBER_MIN, MAX_NUMBER_STEP } from '../data/activities';
import './ParentSettings.css';

interface ParentSettingsProps {
  childName: string | null;
  maxNumber: number;
  maxAdditionTotal: number;
  wordMatchMaxNumber: number;
  onBack: () => void;
  onSetChildName: (name: string) => void;
  onSetMaxNumber: (value: number) => void;
  onSetMaxAdditionTotal: (value: number) => void;
  onSetWordMatchMaxNumber: (value: number) => void;
}

export const ParentSettings = ({
  childName,
  maxNumber,
  maxAdditionTotal,
  wordMatchMaxNumber,
  onBack,
  onSetChildName,
  onSetMaxNumber,
  onSetMaxAdditionTotal,
  onSetWordMatchMaxNumber,
}: ParentSettingsProps) => {
  const [nameDraft, setNameDraft] = useState(childName ?? '');
  const [saved, setSaved] = useState(false);

  const handleNameSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = nameDraft.trim();
    if (!trimmed) return;
    onSetChildName(trimmed);
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  const adjustMaxNumber = (delta: number) => {
    const next = Math.min(MAX_NUMBER_MAX, Math.max(MAX_NUMBER_MIN, maxNumber + delta));
    onSetMaxNumber(next);
  };

  const adjustWordMatchMaxNumber = (delta: number) => {
    const next = Math.min(MAX_NUMBER_MAX, Math.max(MAX_NUMBER_MIN, wordMatchMaxNumber + delta));
    onSetWordMatchMaxNumber(next);
  };

  return (
    <div className="parent-settings">
      <div className="parent-settings-header">
        <button type="button" className="parent-settings-back" onClick={onBack} aria-label="Back to home">
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
        <h1 className="parent-settings-title">Parent Settings</h1>
      </div>

      <section className="parent-settings-card">
        <h2 className="parent-settings-card-title">Child&apos;s name</h2>
        <form className="parent-settings-name-form" onSubmit={handleNameSubmit}>
          <label className="visually-hidden" htmlFor="settings-name-input">
            Child&apos;s name
          </label>
          <input
            id="settings-name-input"
            className="parent-settings-input"
            type="text"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            maxLength={24}
          />
          <button type="submit" className="parent-settings-save-btn">
            {saved ? 'Saved!' : 'Save'}
          </button>
        </form>
        <p className="parent-settings-hint">Changing the name keeps all stars and progress.</p>
      </section>

      <section className="parent-settings-card">
        <h2 className="parent-settings-card-title">Highest number</h2>
        <p className="parent-settings-hint">
          Numbers used across recognition, counting, before/after, ordering, and other number activities.
        </p>
        <div className="parent-settings-stepper">
          <button
            type="button"
            className="parent-settings-step-btn"
            onClick={() => adjustMaxNumber(-MAX_NUMBER_STEP)}
            disabled={maxNumber <= MAX_NUMBER_MIN}
            aria-label="Decrease highest number"
          >
            −
          </button>
          <span className="parent-settings-step-value" aria-live="polite">
            {maxNumber}
          </span>
          <button
            type="button"
            className="parent-settings-step-btn"
            onClick={() => adjustMaxNumber(MAX_NUMBER_STEP)}
            disabled={maxNumber >= MAX_NUMBER_MAX}
            aria-label="Increase highest number"
          >
            +
          </button>
        </div>
      </section>

      <section className="parent-settings-card">
        <h2 className="parent-settings-card-title">Match Number Words — highest number</h2>
        <p className="parent-settings-hint">Numbers used just for the Match Number Words activity, set separately.</p>
        <div className="parent-settings-stepper">
          <button
            type="button"
            className="parent-settings-step-btn"
            onClick={() => adjustWordMatchMaxNumber(-MAX_NUMBER_STEP)}
            disabled={wordMatchMaxNumber <= MAX_NUMBER_MIN}
            aria-label="Decrease Match Number Words highest number"
          >
            −
          </button>
          <span className="parent-settings-step-value" aria-live="polite">
            {wordMatchMaxNumber}
          </span>
          <button
            type="button"
            className="parent-settings-step-btn"
            onClick={() => adjustWordMatchMaxNumber(MAX_NUMBER_STEP)}
            disabled={wordMatchMaxNumber >= MAX_NUMBER_MAX}
            aria-label="Increase Match Number Words highest number"
          >
            +
          </button>
        </div>
      </section>

      <section className="parent-settings-card">
        <h2 className="parent-settings-card-title">Highest addition total</h2>
        <p className="parent-settings-hint">The biggest sum Picture Addition will ever ask for.</p>
        <div className="parent-settings-options">
          {ADDITION_TOTAL_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`parent-settings-option ${
                maxAdditionTotal === option ? 'parent-settings-option--active' : ''
              }`}
              aria-pressed={maxAdditionTotal === option}
              onClick={() => onSetMaxAdditionTotal(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
