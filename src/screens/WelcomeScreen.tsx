import { useState } from 'react';
import type { FormEvent } from 'react';
import { Mascot } from '../components/Mascot';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onSubmit: (name: string) => void;
}

export const WelcomeScreen = ({ onSubmit }: WelcomeScreenProps) => {
  const [name, setName] = useState('');
  const [touched, setTouched] = useState(false);

  const trimmed = name.trim();
  const isInvalid = touched && trimmed.length === 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (trimmed.length === 0) return;
    onSubmit(trimmed);
  };

  return (
    <div className="welcome-screen">
      <Mascot mood="excited" size={140} />
      <h1 className="welcome-title">What&apos;s your name?</h1>
      <p className="welcome-sub">Let&apos;s get your Number Garden ready!</p>

      <form className="welcome-form" onSubmit={handleSubmit}>
        <label className="visually-hidden" htmlFor="welcome-name-input">
          Your name
        </label>
        <input
          id="welcome-name-input"
          className="welcome-input"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Type your name"
          maxLength={24}
          autoFocus
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? 'welcome-name-error' : undefined}
        />
        {isInvalid && (
          <p id="welcome-name-error" className="welcome-error" role="alert">
            Please type your name first.
          </p>
        )}
        <button type="submit" className="welcome-btn">
          Let&apos;s Start!
        </button>
      </form>
    </div>
  );
};
