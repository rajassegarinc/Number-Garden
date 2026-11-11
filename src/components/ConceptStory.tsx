import { useEffect, useState } from 'react';
import type { ActivityId } from '../types';
import './ConceptStory.css';

/**
 * A short (about 6 second) animated "watch first" scene that SHOWS the
 * maths idea before the questions start: things hop in and get counted,
 * two groups slide together, a bunny hops along a number line. Narrated
 * with the same speech hook as the rest of the app, skippable with one
 * tap, and shown at most once a day per activity so it stays a treat
 * rather than a delay.
 */
export type StoryKind = 'count' | 'add' | 'after' | 'missing' | 'between';

export const STORY_FOR: Partial<Record<ActivityId, StoryKind>> = {
  'count-objects': 'count',
  'picture-addition': 'add',
  'before-after': 'after',
  'missing-number': 'missing',
  'between-numbers': 'between',
};

const STORAGE_KEY = 'number-garden-story-seen';

const today = () => new Date().toDateString();

const readSeen = (): Record<string, string> => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, string>) : {};
  } catch {
    return {};
  }
};

/** True when this activity has a story and it hasn't been watched today. */
export const shouldShowStory = (activityId: ActivityId): boolean =>
  STORY_FOR[activityId] !== undefined && readSeen()[activityId] !== today();

export const markStorySeen = (activityId: ActivityId): void => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readSeen(), [activityId]: today() }));
  } catch {
    // Private mode / storage full: the story just shows again next time.
  }
};

interface Beat {
  /** Milliseconds after the previous beat. */
  wait: number;
  say?: string;
  caption: string;
}

const ICONS = ['🍎', '🌼', '🐞', '🦋', '🍓'];
const ICON_NAMES: Record<string, string> = {
  '🍎': 'apples',
  '🌼': 'flowers',
  '🐞': 'ladybirds',
  '🦋': 'butterflies',
  '🍓': 'strawberries',
};

const buildBeats = (kind: StoryKind, name: string): Beat[] => {
  switch (kind) {
    case 'count':
      return [
        { wait: 500, say: "Let's count together!", caption: "Let's count!" },
        { wait: 1500, say: '1', caption: '1' },
        { wait: 950, say: '2', caption: '2' },
        { wait: 950, say: '3', caption: '3' },
        { wait: 1100, say: `3 ${name}!`, caption: `3 ${name}!` },
      ];
    case 'add':
      return [
        { wait: 500, say: `Here are 2 ${name}.`, caption: '2' },
        { wait: 1700, say: 'Here comes 1 more.', caption: '2 and 1 more' },
        { wait: 1700, say: 'Put them together.', caption: 'Together…' },
        { wait: 1500, say: '2 and 1 make 3!', caption: '2 + 1 = 3' },
      ];
    case 'after':
      return [
        { wait: 500, say: 'Bunny is on number 3.', caption: 'Bunny is on 3' },
        { wait: 1900, say: 'Hop! After 3 comes 4.', caption: 'After 3 comes 4' },
        { wait: 2000, say: 'Hop back! Before 4 comes 3.', caption: 'Before 4 comes 3' },
      ];
    case 'missing':
      return [
        { wait: 500, say: 'One number is hiding!', caption: 'Who is hiding?' },
        { wait: 1700, say: '1, 2…', caption: '1, 2 …' },
        { wait: 1500, say: '3! Here it is.', caption: '3 was hiding!' },
        { wait: 1600, say: '1, 2, 3, 4, 5.', caption: '1, 2, 3, 4, 5' },
      ];
    case 'between':
      return [
        { wait: 500, say: 'Look, a gap between 4 and 6.', caption: 'A gap between 4 and 6' },
        { wait: 2100, say: '5 lives in the middle!', caption: '5 lives in the middle' },
        { wait: 1700, say: '4, 5, 6.', caption: '4, 5, 6' },
      ];
  }
};

interface ConceptStoryProps {
  kind: StoryKind;
  speak: (text: string) => void;
  onDone: () => void;
}

export const ConceptStory = ({ kind, speak, onDone }: ConceptStoryProps) => {
  const [icon] = useState(() => ICONS[Math.floor(Math.random() * ICONS.length)]);
  const [beats] = useState(() => buildBeats(kind, ICON_NAMES[icon]));
  // -1 = nothing on stage yet; then one beat at a time.
  const [beat, setBeat] = useState(-1);
  const finished = beat >= beats.length - 1;

  useEffect(() => {
    const timers: number[] = [];
    let elapsed = 0;
    beats.forEach((b, i) => {
      elapsed += b.wait;
      timers.push(
        window.setTimeout(() => {
          setBeat(i);
          if (b.say) speak(b.say);
        }, elapsed),
      );
    });
    // Little ones may not tap the button: carry on by ourselves after a pause.
    timers.push(window.setTimeout(onDone, elapsed + 2800));
    return () => timers.forEach((t) => window.clearTimeout(t));
    // The script is fixed for the life of the scene.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const caption = beat >= 0 ? beats[beat].caption : '';

  return (
    <div className="story" role="group" aria-label="Watch first">
      <span className="story-badge">🎬 Watch first!</span>

      <div className={`story-stage story-stage--${kind}`} aria-hidden="true">
        {kind === 'count' && (
          <div className="story-row">
            {[1, 2, 3].map((n) => (
              <span
                key={n}
                className={`story-item ${beat >= n ? 'story-item--in' : ''} ${beat === n ? 'story-item--now' : ''} ${
                  beat >= 4 ? 'story-item--party' : ''
                }`}
                style={{ animationDelay: beat >= 4 ? `${(n - 1) * 0.1}s` : undefined }}
              >
                {icon}
                <span className="story-item-tag">{n}</span>
              </span>
            ))}
          </div>
        )}

        {kind === 'add' && (
          <div className={`story-row story-row--add ${beat >= 2 ? 'story-row--joined' : ''}`}>
            <span className={`story-group ${beat >= 0 ? 'story-group--in' : ''}`}>
              <span className="story-item story-item--in">{icon}</span>
              <span className="story-item story-item--in">{icon}</span>
            </span>
            <span className={`story-plus ${beat >= 1 && beat < 2 ? 'story-plus--in' : ''}`}>+</span>
            <span className={`story-group story-group--right ${beat >= 1 ? 'story-group--in' : ''}`}>
              <span className="story-item story-item--in">{icon}</span>
            </span>
          </div>
        )}

        {(kind === 'after' || kind === 'missing' || kind === 'between') && (
          <StoryLine kind={kind} beat={beat} />
        )}
      </div>

      <p className="story-caption" key={caption} aria-live="polite">
        {caption || ' '}
      </p>

      <button type="button" className={`story-go ${finished ? 'story-go--ready' : ''}`} onClick={onDone}>
        {finished ? 'My turn! ▶' : 'Skip ▶'}
      </button>
    </div>
  );
};

const StoryLine = ({ kind, beat }: { kind: 'after' | 'missing' | 'between'; beat: number }) => {
  const tiles = kind === 'between' ? [4, 5, 6] : [1, 2, 3, 4, 5];
  const hiddenValue = kind === 'missing' ? 3 : kind === 'between' ? 5 : null;
  const revealAt = kind === 'missing' ? 2 : 1;
  const revealed = hiddenValue === null || beat >= revealAt;
  // Bunny only appears in the before/after scene: tile index 2 is "3".
  const bunnyIndex = kind === 'after' ? (beat === 1 ? 3 : 2) : null;
  // "1, 2…" then the full count: light the tiles up one after another.
  const sweep = (kind === 'missing' && beat === 3) || (kind === 'between' && beat === 2);

  return (
    <div className="story-line">
      {bunnyIndex !== null && beat >= 0 && (
        <span className="story-bunny" style={{ transform: `translateX(calc(${bunnyIndex} * var(--step)))` }}>
          <span className="story-bunny-hop" key={`${bunnyIndex}-${beat}`}>
            🐰
          </span>
        </span>
      )}
      {tiles.map((n, i) => {
        const isHidden = n === hiddenValue;
        const lit =
          (kind === 'after' && beat >= 0 && i === bunnyIndex) ||
          (isHidden && revealed) ||
          (kind === 'missing' && beat === 1 && n <= 2);
        return (
          <span
            key={n}
            className={[
              'story-tile',
              isHidden && !revealed ? 'story-tile--gap' : '',
              isHidden && revealed ? 'story-tile--drop' : '',
              lit ? 'story-tile--lit' : '',
              sweep ? 'story-tile--sweep' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            style={sweep ? { animationDelay: `${i * 0.22}s` } : undefined}
          >
            {isHidden && !revealed ? '?' : n}
          </span>
        );
      })}
    </div>
  );
};
