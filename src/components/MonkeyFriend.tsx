import { useRef, useState } from 'react';
import { CelebrationAnimal } from './CelebrationAnimal';
import type { AnimalKind } from '../data/celebrationAnimals';
import { playCollectBlip } from '../utils/sfx';
import './MonkeyFriend.css';

const REACTIONS = ['Hee hee!', 'Hi there!', 'Wheee!', "Let's play!"];

interface MonkeyFriendProps {
  kind?: AnimalKind;
  soundOn: boolean;
}

/** A purely ambient, no-goal interaction — tap the animal and it reacts.
 * Nothing is scored or required; it exists so the garden has something
 * that's fun to poke at just because it's fun, not every interaction being
 * goal-directed. */
export const MonkeyFriend = ({ kind = 'monkey', soundOn }: MonkeyFriendProps) => {
  const [reacting, setReacting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = () => {
    if (soundOn) playCollectBlip();
    setReacting(true);
    setMessage(REACTIONS[Math.floor(Math.random() * REACTIONS.length)]);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setReacting(false);
      setMessage(null);
    }, 900);
  };

  return (
    <button
      type="button"
      className={`monkey-friend ${reacting ? 'monkey-friend--reacting' : ''}`}
      onClick={handleTap}
      aria-label="Tap your garden friend to say hi"
    >
      {message && <span className="monkey-friend-bubble">{message}</span>}
      <CelebrationAnimal kind={kind} pose={reacting ? 'jump' : 'bounce'} size={88} />
    </button>
  );
};
