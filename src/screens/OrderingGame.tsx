import { useEffect, useMemo, useRef, useState } from 'react';
import { CRITTER_ORDER, getActivity, getEffectiveLevelCount } from '../data/activities';
import { generateOrderingSet } from '../data/questionGenerators';
import { GameHeader } from '../components/GameHeader';
import { SideCritter } from '../components/SideCritter';
import { useSpeech } from '../hooks/useSpeech';
import type { ActivityId, LevelResult, NumberSettings } from '../types';
import './OrderingGame.css';

interface OrderingGameProps {
  activityId: ActivityId;
  level: number;
  soundOn: boolean;
  settings: NumberSettings;
  childName?: string | null;
  onExit: () => void;
  onLevelComplete: (result: LevelResult) => void;
}

const ADVANCE_DELAY_MS = 900;

export const OrderingGame = ({
  activityId,
  level,
  soundOn,
  settings,
  childName,
  onExit,
  onLevelComplete,
}: OrderingGameProps) => {
  const activity = getActivity(activityId);
  const orderSize = activity?.orderSize ?? 4;
  const totalRounds = activity?.questionsPerLevel ?? 5;
  const { speak, supported } = useSpeech(soundOn);

  // Stable Set held in state (never replaced) since it's read during the
  // values state's lazy initializer below.
  const [excludedSet] = useState<Set<number>>(() => new Set());
  const perfectRoundsRef = useRef(0);
  const hadMistakeRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [roundIndex, setRoundIndex] = useState(0);
  const [values, setValues] = useState<number[]>(() =>
    generateOrderingSet(activityId, level, excludedSet, orderSize, settings),
  );
  const [selected, setSelected] = useState<number[]>([]);
  const [wrongValue, setWrongValue] = useState<number | null>(null);
  const [roundComplete, setRoundComplete] = useState(false);

  const critter = useMemo(() => CRITTER_ORDER[(level - 1) % CRITTER_ORDER.length], [level]);
  const sortedAsc = useMemo(() => [...values].sort((a, b) => a - b), [values]);
  const expectedValue = sortedAsc[selected.length];

  useEffect(() => {
    speak('Tap the numbers from smallest to largest');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const finishLevel = () => {
    const accuracy = totalRounds > 0 ? perfectRoundsRef.current / totalRounds : 0;
    const starsEarned = accuracy === 1 ? 3 : accuracy >= 0.7 ? 2 : 1;
    const effectiveLevelCount = getEffectiveLevelCount(activityId, activity?.levelCount ?? 5, settings);
    const leveledUp = accuracy >= 0.7 && level < effectiveLevelCount;
    onLevelComplete({
      activityId,
      level,
      correct: perfectRoundsRef.current,
      total: totalRounds,
      starsEarned,
      leveledUp,
    });
  };

  const startNextRound = () => {
    const nextIndex = roundIndex + 1;
    if (nextIndex >= totalRounds) {
      finishLevel();
      return;
    }
    setRoundIndex(nextIndex);
    setValues(generateOrderingSet(activityId, level, excludedSet, orderSize, settings));
    setSelected([]);
    setRoundComplete(false);
    hadMistakeRef.current = false;
  };

  const handleTap = (value: number) => {
    if (roundComplete || selected.includes(value)) return;

    if (value === expectedValue) {
      const nextSelected = [...selected, value];
      setSelected(nextSelected);
      if (nextSelected.length === values.length) {
        if (!hadMistakeRef.current) perfectRoundsRef.current += 1;
        setRoundComplete(true);
        speak('Perfect order!');
        timerRef.current = setTimeout(startNextRound, ADVANCE_DELAY_MS);
      } else {
        speak(String(value));
      }
    } else {
      hadMistakeRef.current = true;
      setWrongValue(value);
      speak('Try the smallest number left!');
      setTimeout(() => setWrongValue(null), 480);
    }
  };

  if (!activity) return null;

  return (
    <div className="ordering-game">
      <GameHeader
        title={activity.title}
        current={roundIndex + 1}
        total={totalRounds}
        onBack={onExit}
        onHearPrompt={() => speak('Tap the numbers from smallest to largest')}
        speechSupported={supported}
        childName={childName}
      />

      <div className="ordering-game-body">
        <p className="ordering-game-prompt">Tap the numbers from smallest to largest</p>

        <div className="ordering-game-chips">
          {values.map((value) => {
            const position = selected.indexOf(value);
            const isSelected = position !== -1;
            const isWrong = wrongValue === value;
            return (
              <button
                key={value}
                type="button"
                className={[
                  'ordering-chip',
                  isSelected ? 'ordering-chip--selected' : '',
                  isWrong ? 'ordering-chip--wrong' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleTap(value)}
                disabled={isSelected}
                aria-label={isSelected ? `${value}, placed number ${position + 1}` : `Number ${value}`}
              >
                {value}
                {isSelected && <span className="ordering-chip-badge">{position + 1}</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div className="ordering-game-critter">
        <SideCritter kind={critter} />
      </div>
    </div>
  );
};
