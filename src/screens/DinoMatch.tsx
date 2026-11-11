import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { getActivity } from '../data/activities';
import { shuffle } from '../data/questionGenerators';
import { GameHeader } from '../components/GameHeader';
import { Dino } from '../components/Dino';
import { useSpeech } from '../hooks/useSpeech';
import { burstFrom, celebrate, cheerAt, oops } from '../motion/fx';
import type { ActivityId, LevelResult, NumberSettings } from '../types';
import './DinoMatch.css';

interface DinoMatchProps {
  activityId: ActivityId;
  level: number;
  soundOn: boolean;
  settings: NumberSettings;
  childName?: string | null;
  onExit: () => void;
  onLevelComplete: (result: LevelResult) => void;
}

interface LevelConfig {
  min: number;
  max: number;
  /** How many dinosaur + nest pairs per round. */
  pairs: number;
  /** Pick numbers that sit next to each other (5, 6, 7, 8): much harder to tell apart. */
  neighbours?: boolean;
}

const LEVELS: LevelConfig[] = [
  { min: 1, max: 4, pairs: 3 },
  { min: 1, max: 6, pairs: 3 },
  { min: 1, max: 10, pairs: 4 },
  { min: 3, max: 10, pairs: 4, neighbours: true },
];

const PRAISE = ['You found the mummy!', 'Rawr! That is right!', 'The eggs are hatching!', 'Stomp stomp, well done!'];

interface RoundData {
  /** Numbers in the left-to-right order the dinosaurs stand in. */
  dinos: number[];
  /** Numbers in the order the nests are laid out. */
  nests: number[];
  /** Which dinosaur look goes with which number this round. */
  looks: Record<number, number>;
}

const buildRound = (level: number, settings: NumberSettings, previous: number[]): RoundData => {
  const config = LEVELS[Math.min(Math.max(level - 1, 0), LEVELS.length - 1)];
  const max = Math.max(config.pairs, Math.min(config.max, settings.maxNumber));
  const min = Math.min(config.min, max - config.pairs + 1);
  let numbers: number[];
  if (config.neighbours) {
    const start = min + Math.floor(Math.random() * (max - config.pairs - min + 2));
    numbers = Array.from({ length: config.pairs }, (_, i) => start + i);
  } else {
    const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
    // Prefer numbers that were not in the previous round so rounds feel fresh.
    const fresh = shuffle(pool.filter((n) => !previous.includes(n)));
    const rest = shuffle(pool.filter((n) => previous.includes(n)));
    numbers = [...fresh, ...rest].slice(0, config.pairs);
  }
  const lookOrder = shuffle([0, 1, 2, 3]);
  const looks: Record<number, number> = {};
  numbers.forEach((n, i) => {
    looks[n] = lookOrder[i % lookOrder.length];
  });
  const dinos = shuffle(numbers);
  let nests = shuffle(numbers);
  // Never line the nests up in the same order as the dinosaurs.
  if (numbers.length > 1 && nests.every((n, i) => n === dinos[i])) nests = [...nests.slice(1), nests[0]];
  return { dinos, nests, looks };
};

type DinoReaction = { n: number; kind: 'no' } | null;

export const DinoMatch = ({
  activityId,
  level,
  soundOn,
  settings,
  childName,
  onExit,
  onLevelComplete,
}: DinoMatchProps) => {
  const activity = getActivity(activityId);
  const totalRounds = activity?.questionsPerLevel ?? 3;
  const { speak, supported } = useSpeech(soundOn);

  const [roundIndex, setRoundIndex] = useState(0);
  const [round, setRound] = useState<RoundData>(() => buildRound(level, settings, []));
  const [matched, setMatched] = useState<number[]>([]);
  const [selectedNest, setSelectedNest] = useState<number | null>(null);
  const [selectedDino, setSelectedDino] = useState<number | null>(null);
  const [reaction, setReaction] = useState<DinoReaction>(null);
  const [wrongNest, setWrongNest] = useState<number | null>(null);
  /** Count-along hint: which nest is being counted and how many eggs are lit so far. */
  const [counting, setCounting] = useState<{ n: number; lit: number } | null>(null);
  const [glowDino, setGlowDino] = useState<number | null>(null);
  /** Where each matched nest flies to (offset to its dinosaur), keyed by number. */
  const [flights, setFlights] = useState<Record<number, { dx: number; dy: number }>>({});
  const [entering, setEntering] = useState(true);
  const [roundDone, setRoundDone] = useState(false);

  const stageRef = useRef<HTMLDivElement>(null);
  const missesRef = useRef<Record<number, number>>({});
  const firstTryRef = useRef(0);
  const totalPairsRef = useRef(0);
  const timersRef = useRef<number[]>([]);
  const hintTimersRef = useRef<number[]>([]);

  const later = (fn: () => void, ms: number) => {
    timersRef.current.push(window.setTimeout(fn, ms));
  };

  const stopHint = () => {
    hintTimersRef.current.forEach((t) => window.clearTimeout(t));
    hintTimersRef.current = [];
    setCounting(null);
  };

  useEffect(
    () => () => {
      timersRef.current.forEach((t) => window.clearTimeout(t));
      hintTimersRef.current.forEach((t) => window.clearTimeout(t));
    },
    [],
  );

  const promptText = 'Count the eggs. Then tap the dinosaur with the same number!';

  // Each round: the dinosaurs walk on, then the prompt is read out.
  useEffect(() => {
    setEntering(true);
    const walk = window.setTimeout(() => setEntering(false), 1500);
    const talk = window.setTimeout(
      () => speak(roundIndex === 0 ? `The eggs are ready to hatch! ${promptText}` : 'More eggs! Who is the mummy?'),
      500,
    );
    return () => {
      window.clearTimeout(walk);
      window.clearTimeout(talk);
    };
    // Only when a new round starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundIndex]);

  /** Lights the eggs up one at a time while counting aloud. Teaches, rather than just telling. */
  const countAlong = (n: number, thenGlow: boolean) => {
    stopHint();
    setCounting({ n, lit: 0 });
    for (let i = 1; i <= n; i++) {
      hintTimersRef.current.push(
        window.setTimeout(() => {
          setCounting({ n, lit: i });
          speak(String(i));
        }, 500 + (i - 1) * 700),
      );
    }
    hintTimersRef.current.push(
      window.setTimeout(
        () => {
          speak(`${n} eggs! Find number ${n}.`);
          if (thenGlow) setGlowDino(n);
        },
        500 + n * 700 + 200,
      ),
    );
  };

  const finishRound = () => {
    setRoundDone(true);
    celebrate(true);
    speak('All the babies found their mummies!');
    later(() => {
      const isLast = roundIndex + 1 >= totalRounds;
      if (isLast) {
        const total = totalPairsRef.current;
        const correct = firstTryRef.current;
        const accuracy = total > 0 ? correct / total : 0;
        const starsEarned = accuracy === 1 ? 3 : accuracy >= 0.7 ? 2 : 1;
        const leveledUp = accuracy >= 0.7 && level < (activity?.levelCount ?? LEVELS.length);
        onLevelComplete({ activityId, level, correct, total, starsEarned, leveledUp });
        return;
      }
      missesRef.current = {};
      setMatched([]);
      setFlights({});
      setSelectedNest(null);
      setSelectedDino(null);
      setGlowDino(null);
      setRoundDone(false);
      setRound(buildRound(level, settings, round.dinos));
      setRoundIndex(roundIndex + 1);
    }, 2800);
  };

  const attempt = (nest: number, dino: number) => {
    stopHint();
    setSelectedNest(null);
    setSelectedDino(null);
    const stage = stageRef.current;
    const dinoEl = stage?.querySelector(`[data-dino="${dino}"]`) ?? null;
    const nestEl = stage?.querySelector(`[data-nest="${nest}"]`) ?? null;

    if (nest === dino) {
      if ((missesRef.current[nest] ?? 0) === 0) firstTryRef.current += 1;
      totalPairsRef.current += 1;
      if (dinoEl && nestEl) {
        const a = nestEl.getBoundingClientRect();
        const b = dinoEl.getBoundingClientRect();
        setFlights((prev) => ({
          ...prev,
          [nest]: {
            dx: b.left + b.width / 2 - (a.left + a.width / 2),
            dy: b.top + b.height * 0.7 - (a.top + a.height / 2),
          },
        }));
      }
      const nextMatched = [...matched, nest];
      setMatched(nextMatched);
      setGlowDino(null);
      // Stars + chime land as the nest reaches its mummy.
      later(() => cheerAt(dinoEl), 380);
      later(() => burstFrom(dinoEl, 'hearts'), 900);
      speak(`${nest}! ${PRAISE[Math.floor(Math.random() * PRAISE.length)]}`);
      if (nextMatched.length === round.dinos.length) later(finishRound, 1700);
      return;
    }

    const misses = (missesRef.current[nest] ?? 0) + 1;
    missesRef.current[nest] = misses;
    oops();
    setReaction({ n: dino, kind: 'no' });
    setWrongNest(nest);
    later(() => {
      setReaction(null);
      setWrongNest(null);
    }, 750);
    if (misses === 1) {
      speak('Not that one. Count the eggs again!');
    } else {
      // Second miss: count the eggs together. Third: also show which dinosaur.
      later(() => countAlong(nest, misses >= 3), 500);
    }
  };

  const tapNest = (n: number) => {
    if (roundDone || matched.includes(n)) return;
    if (selectedDino !== null) {
      attempt(n, selectedDino);
      return;
    }
    stopHint();
    setSelectedNest((current) => (current === n ? null : n));
  };

  const tapDino = (n: number) => {
    if (roundDone || matched.includes(n)) return;
    if (selectedNest !== null) {
      attempt(selectedNest, n);
      return;
    }
    stopHint();
    setSelectedDino((current) => (current === n ? null : n));
    speak(String(n));
  };

  if (!activity) return null;

  const hintLine =
    selectedNest !== null
      ? 'Now tap the dinosaur with that number'
      : selectedDino !== null
        ? `Now find the nest with ${selectedDino} ${selectedDino === 1 ? 'egg' : 'eggs'}`
        : roundDone
          ? 'All the babies are home!'
          : 'Tap a nest and count the eggs';

  return (
    <div className="dino-match" ref={stageRef}>
      <GameHeader
        title={activity.title}
        current={roundIndex + 1}
        total={totalRounds}
        onBack={onExit}
        onHearPrompt={() => speak(promptText)}
        speechSupported={supported}
        childName={childName}
      />

      <div className="dm-body">
        <div className="dm-meadow" key={`dinos-${roundIndex}`}>
          {round.dinos.map((n, i) => {
            const isMatched = matched.includes(n);
            const mood = isMatched || roundDone ? 'happy' : reaction?.n === n ? 'no' : 'idle';
            return (
              <button
                key={n}
                type="button"
                data-dino={n}
                className={[
                  'dm-dino',
                  selectedDino === n ? 'dm-dino--selected' : '',
                  glowDino === n ? 'dm-dino--glow' : '',
                  isMatched ? 'dm-dino--matched' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ animationDelay: `${i * 0.16}s` }}
                onClick={() => tapDino(n)}
                aria-label={`Dinosaur number ${n}${isMatched ? ', matched' : ''}`}
                aria-pressed={selectedDino === n}
              >
                {/* Re-keyed per mood so the jump / head-shake replays each time. */}
                <Dino
                  key={`${mood}-${roundDone ? 'party' : 'play'}`}
                  variant={round.looks[n]}
                  number={n}
                  mood={mood}
                  walking={entering}
                  size={round.dinos.length > 3 ? 86 : 104}
                />
                {isMatched && (
                  <span className="dm-baby" aria-hidden="true">
                    <Dino variant={round.looks[n]} mood="happy" size={38} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <p className="dm-hint" key={hintLine} aria-live="polite">
          {hintLine}
        </p>

        <div className={`dm-nests dm-nests--${round.nests.length}`} key={`nests-${roundIndex}`}>
          {round.nests.map((n, i) => {
            const isMatched = matched.includes(n);
            const flight = flights[n];
            const style: CSSProperties & Record<'--dx' | '--dy', string> = {
              animationDelay: isMatched ? '0s' : `${0.5 + i * 0.1}s`,
              '--dx': `${flight?.dx ?? 0}px`,
              '--dy': `${flight?.dy ?? -80}px`,
            };
            return (
              <button
                key={n}
                type="button"
                data-nest={n}
                className={[
                  'dm-nest',
                  selectedNest === n ? 'dm-nest--selected' : '',
                  wrongNest === n ? 'dm-nest--wrong' : '',
                  isMatched ? 'dm-nest--gone' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={style}
                onClick={() => tapNest(n)}
                disabled={isMatched}
                aria-label={`A nest with ${n} ${n === 1 ? 'egg' : 'eggs'}`}
                aria-pressed={selectedNest === n}
              >
                <span className="dm-eggs">
                  {Array.from({ length: n }).map((_, e) => {
                    const lit = counting?.n === n && e < counting.lit;
                    return (
                      <span
                        key={e}
                        className={`dm-egg ${lit ? 'dm-egg--lit' : ''} ${selectedNest === n ? 'dm-egg--wiggle' : ''}`}
                        style={{ animationDelay: `${(e % 5) * 0.08}s` }}
                      />
                    );
                  })}
                </span>
                {counting?.n === n && counting.lit > 0 && <span className="dm-count">{counting.lit}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
