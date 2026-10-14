import { useEffect, useRef, useState } from 'react';
import { GameHeader } from '../components/GameHeader';
import { AudioButton } from '../components/AudioButton';
import { TenFrameDots } from '../components/TenFrameDots';
import { CelebrationEffects } from '../components/CelebrationEffects';
import { useSpeech } from '../hooks/useSpeech';
import { useFlowerLineStats, type FlowerLineRoundRecord } from '../hooks/useFlowerLineStats';
import { shuffle } from '../data/questionGenerators';
import type { ActivityId, LevelResult, NumberSettings } from '../types';
import './FlowerLine.css';

interface FlowerLineProps {
  activityId: ActivityId;
  level: number;
  soundOn: boolean;
  settings: NumberSettings;
  childName?: string | null;
  onExit: () => void;
  onLevelComplete: (result: LevelResult) => void;
}

type Phase = 'gate' | 'warmup-offer' | 'warmup-transition' | 'playing' | 'ending';
type MissStage = 0 | 1 | 2 | 3;
type Overlay = 'none' | 'compare' | 'demo';

const PRAISE = [
  'You found it!',
  'Your garden is growing!',
  'Lovely planting!',
  "You're on a roll!",
  'Look at that garden!',
];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const countList = (n: number) => Array.from({ length: n }, (_, i) => i + 1).join(', ');

const buildCountingSentence = (wrongValue: number, expectedValue: number) =>
  `${countList(wrongValue)}... ${wrongValue} flowers. ${countList(expectedValue)}... ${expectedValue} flowers. ` +
  `${expectedValue} is fewer, so ${expectedValue} is smaller.`;

const COMPARE_DISPLAY_MS = 1800;
const DEMO_STEP_MS = 260;
const DEMO_END_PAUSE_MS = 1000;
const CELEBRATION_MS = 1300;
const COUNT_ALONG_STEP_MS = 750;

interface FlowerCardProps {
  value: number;
  dotsHidden: boolean;
  isGlowing: boolean;
  isDimmed: boolean;
  isShaking: boolean;
  onTap: (value: number) => void;
}

const FlowerCard = ({ value, dotsHidden, isGlowing, isDimmed, isShaking, onTap }: FlowerCardProps) => (
  <button
    type="button"
    className={[
      'flower-card',
      isGlowing ? 'flower-card--glow' : '',
      isDimmed ? 'flower-card--dimmed' : '',
      isShaking ? 'flower-card--shake' : '',
    ]
      .filter(Boolean)
      .join(' ')}
    onClick={() => onTap(value)}
    aria-label={isGlowing ? `Flower card ${value}, tap this one` : `Flower card ${value}`}
  >
    <span className="flower-card-number">{value}</span>
    {!dotsHidden && <TenFrameDots value={value} />}
  </button>
);

interface PotProps {
  position: number;
  planted: boolean;
  isNext: boolean;
  isCountAlong: boolean;
}

const Pot = ({ position, planted, isNext, isCountAlong }: PotProps) => (
  <div
    className={[
      'flower-pot',
      planted ? 'flower-pot--planted' : '',
      isNext ? 'flower-pot--next' : '',
      isCountAlong ? 'flower-pot--countalong' : '',
    ]
      .filter(Boolean)
      .join(' ')}
    role="img"
    aria-label={planted ? `Pot ${position}: planted` : `Pot ${position}: empty`}
  >
    <span className="flower-pot-soil" aria-hidden="true" />
    {planted ? (
      <>
        <span className="flower-pot-flower" aria-hidden="true">
          🌷
        </span>
        <span className="flower-pot-number">{position}</span>
      </>
    ) : (
      <span className="flower-pot-outline" aria-hidden="true" />
    )}
  </div>
);

interface GrownUpsPanelProps {
  rounds: FlowerLineRoundRecord[];
  onClose: () => void;
}

const GrownUpsPanel = ({ rounds, onClose }: GrownUpsPanelProps) => (
  <div className="flower-grownups-backdrop" role="dialog" aria-label="Grown-ups panel" aria-modal="true">
    <div className="flower-grownups-panel">
      <div className="flower-grownups-header">
        <h2>Grown-ups</h2>
        <button type="button" className="flower-grownups-close" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
      {rounds.length === 0 ? (
        <p className="flower-grownups-empty">No rounds played yet.</p>
      ) : (
        <ul className="flower-grownups-list">
          {rounds.slice(0, 8).map((round) => {
            const pct = round.total > 0 ? Math.round((round.firstTryCount / round.total) * 100) : 0;
            const when = new Date(round.at).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
            });
            return (
              <li key={round.at} className="flower-grownups-row">
                <span className="flower-grownups-when">{when}</span>
                <span className="flower-grownups-pct">{pct}% first-try</span>
                <span className="flower-grownups-hard">
                  {round.struggledNumbers.length > 0 ? `Tricky: ${round.struggledNumbers.join(', ')}` : 'All smooth!'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  </div>
);

interface GrownUpsTriggerProps {
  onOpen: () => void;
}

const GrownUpsTrigger = ({ onOpen }: GrownUpsTriggerProps) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const start = () => {
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      onOpen();
    }, 650);
  };
  const cancel = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  return (
    <button
      type="button"
      className="flower-grownups-trigger"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onClick={(e) => {
        if (firedRef.current) e.preventDefault();
      }}
      aria-label="Grown-ups panel, press and hold"
    >
      🌻
    </button>
  );
};

export const FlowerLine = ({
  activityId,
  soundOn,
  childName,
  onExit,
  onLevelComplete,
}: FlowerLineProps) => {
  const { speak, supported } = useSpeech(soundOn);
  const { stats, dotsHiddenFor, consumeWarmupOffer, recordRound } = useFlowerLineStats();

  const [phase, setPhase] = useState<Phase>(() => (stats.pendingWarmupOffer ? 'warmup-offer' : 'gate'));
  const [isWarmup, setIsWarmup] = useState(false);
  const [roundSize, setRoundSize] = useState(10);
  const [trayOrder, setTrayOrder] = useState<number[]>([]);
  const [placedCount, setPlacedCount] = useState(0);
  const [missStage, setMissStage] = useState<MissStage>(0);
  const [wrongValue, setWrongValue] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [comparePhase, setComparePhase] = useState<'display' | 'choose'>('display');
  const [compareWrongLeft, setCompareWrongLeft] = useState(true);
  const [demoLit, setDemoLit] = useState(0);
  const [dimmedAbove, setDimmedAbove] = useState<number | null>(null);
  const [shakeValue, setShakeValue] = useState<number | null>(null);
  const [promptText, setPromptText] = useState('Tap Start to play!');
  const [showCelebration, setShowCelebration] = useState(false);
  const [countAlongIndex, setCountAlongIndex] = useState(-1);
  const [showGrownUps, setShowGrownUps] = useState(false);

  const firstTryMapRef = useRef<Record<number, boolean>>({});
  const maxHintStageRef = useRef(0);
  const stage3NumbersRef = useRef<Set<number>>(new Set());
  const praiseIndexRef = useRef(0);

  const compareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countAlongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (compareTimerRef.current) clearTimeout(compareTimerRef.current);
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
      if (countAlongTimerRef.current) clearTimeout(countAlongTimerRef.current);
    },
    [],
  );

  const expectedValue = placedCount + 1;

  const randomPraise = () => {
    const msg = PRAISE[praiseIndexRef.current % PRAISE.length];
    praiseIndexRef.current += 1;
    return msg;
  };

  const startRound = (size: number, warmup: boolean) => {
    setRoundSize(size);
    setIsWarmup(warmup);
    setTrayOrder(shuffle(Array.from({ length: size }, (_, i) => i + 1)));
    setPlacedCount(0);
    setMissStage(0);
    setWrongValue(null);
    setOverlay('none');
    setDimmedAbove(null);
    setShakeValue(null);
    setCountAlongIndex(-1);
    setShowCelebration(false);

    const map: Record<number, boolean> = {};
    for (let n = 1; n <= size; n += 1) map[n] = true;
    firstTryMapRef.current = map;
    maxHintStageRef.current = 0;
    stage3NumbersRef.current = new Set();

    const msg = warmup ? "Let's warm up with numbers 1 to 5!" : "Let's find the tiniest number!";
    setPromptText(msg);
    speak(msg);
    setPhase('playing');
  };

  const handleStart = () => startRound(10, false);

  const handleWarmupYes = () => {
    consumeWarmupOffer();
    startRound(5, true);
  };

  const handleWarmupNo = () => {
    consumeWarmupOffer();
    startRound(10, false);
  };

  const finishRound = () => {
    if (isWarmup) {
      setPhase('warmup-transition');
      const msg = "Great warm-up! Now let's do 1 to 10!";
      setPromptText(msg);
      speak(msg);
      setTimeout(() => startRound(10, false), 1600);
      return;
    }

    recordRound({
      total: roundSize,
      firstTryMap: firstTryMapRef.current,
      maxHintStage: maxHintStageRef.current,
      stage3Count: stage3NumbersRef.current.size,
    });

    setPhase('ending');
    setShowCelebration(true);
    celebrationTimerRef.current = setTimeout(() => {
      setShowCelebration(false);
      runCountAlong();
    }, CELEBRATION_MS);
  };

  const completeLevel = () => {
    const firstTryCount = Object.values(firstTryMapRef.current).filter(Boolean).length;
    const accuracy = roundSize > 0 ? firstTryCount / roundSize : 0;
    const starsEarned = accuracy === 1 ? 3 : accuracy >= 0.7 ? 2 : 1;
    onLevelComplete({
      activityId,
      level: 1,
      correct: firstTryCount,
      total: roundSize,
      starsEarned,
      leveledUp: false,
    });
  };

  const runCountAlong = () => {
    let i = 0;
    const step = () => {
      setCountAlongIndex(i);
      speak(String(i + 1));
      i += 1;
      if (i < roundSize) {
        countAlongTimerRef.current = setTimeout(step, COUNT_ALONG_STEP_MS);
      } else {
        countAlongTimerRef.current = setTimeout(completeLevel, COUNT_ALONG_STEP_MS + 150);
      }
    };
    step();
  };

  const handleCorrect = (value: number) => {
    setOverlay('none');
    setMissStage(0);
    setWrongValue(null);
    setDimmedAbove(null);
    if (compareTimerRef.current) clearTimeout(compareTimerRef.current);
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);

    const nextPlaced = placedCount + 1;
    setPlacedCount(nextPlaced);
    const praise = randomPraise();

    if (nextPlaced >= roundSize) {
      speak(`${value} is planted! ${praise}`);
      finishRound();
    } else {
      const instruction = 'Which is the smallest one left?';
      speak(`${value} is planted! ${praise} ${instruction}`);
      setPromptText(instruction);
    }
  };

  const runDemoAnimation = (wrongVal: number, expectedVal: number) => {
    const total = wrongVal + expectedVal;
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);

    if (prefersReducedMotion()) {
      setDemoLit(total);
      demoTimeoutRef.current = setTimeout(() => {
        setOverlay('none');
        setDimmedAbove(wrongVal);
      }, DEMO_END_PAUSE_MS + 200);
      return;
    }

    let lit = 0;
    demoIntervalRef.current = setInterval(() => {
      lit += 1;
      setDemoLit(lit);
      if (lit >= total) {
        if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
        demoTimeoutRef.current = setTimeout(() => {
          setOverlay('none');
          setDimmedAbove(wrongVal);
        }, DEMO_END_PAUSE_MS);
      }
    }, DEMO_STEP_MS);
  };

  const handleWrong = (value: number) => {
    firstTryMapRef.current[expectedValue] = false;
    const newStage = Math.min(missStage + 1, 3) as MissStage;
    setMissStage(newStage);
    setWrongValue(value);
    maxHintStageRef.current = Math.max(maxHintStageRef.current, newStage);

    setShakeValue(value);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShakeValue((v) => (v === value ? null : v)), 420);

    if (newStage === 1) {
      const msg = 'Look carefully. Which has fewer flowers?';
      setPromptText(msg);
      speak(msg);
      setCompareWrongLeft(Math.random() < 0.5);
      setOverlay('compare');
      setComparePhase('display');
      if (compareTimerRef.current) clearTimeout(compareTimerRef.current);
      compareTimerRef.current = setTimeout(() => setComparePhase('choose'), COMPARE_DISPLAY_MS);
    } else if (newStage === 2) {
      const msg = buildCountingSentence(value, expectedValue);
      setPromptText(msg);
      speak(msg);
      setOverlay('demo');
      setDemoLit(0);
      runDemoAnimation(value, expectedValue);
    } else {
      stage3NumbersRef.current.add(expectedValue);
      const msg =
        expectedValue === 1
          ? '1 is the smallest number. Tap the glowing flower.'
          : `After ${expectedValue - 1} comes ${expectedValue}. Tap the glowing flower.`;
      setPromptText(msg);
      speak(msg);
      setOverlay('none');
    }
  };

  const handleCardTap = (value: number) => {
    if (phase !== 'playing') return;
    if (overlay !== 'none') return;
    if (value === expectedValue) handleCorrect(value);
    else handleWrong(value);
  };

  const handleCompareTap = (tappedIsExpected: boolean) => {
    if (comparePhase !== 'choose') return;
    if (tappedIsExpected) handleCorrect(expectedValue);
    else if (wrongValue !== null) handleWrong(wrongValue);
  };

  const remainingCards = trayOrder.filter((v) => v > placedCount);
  const activeCardCount = Math.min(placedCount + (phase === 'playing' ? 1 : 0), roundSize);

  return (
    <div className="flower-line">
      <GameHeader
        title="Flower Line"
        current={activeCardCount}
        total={roundSize}
        onBack={onExit}
        onHearPrompt={() => speak(promptText)}
        speechSupported={supported}
        childName={childName}
      />

      <GrownUpsTrigger onOpen={() => setShowGrownUps(true)} />

      {phase === 'gate' && (
        <div className="flower-line-gate">
          <p className="flower-line-gate-text">Put the flowers in order from smallest to largest!</p>
          <button type="button" className="flower-line-gate-btn" onClick={handleStart}>
            🌷 Start Planting!
          </button>
        </div>
      )}

      {phase === 'warmup-offer' && (
        <div className="flower-line-gate">
          <p className="flower-line-gate-text">
            That was tricky last time! Want to warm up with numbers 1 to 5 first?
          </p>
          <AudioButton
            size="lg"
            onPress={() => speak('That was tricky last time! Want to warm up with numbers 1 to 5 first?')}
            supported={supported}
            label="Hear the question"
          />
          <div className="flower-line-gate-actions">
            <button type="button" className="flower-line-gate-btn" onClick={handleWarmupYes}>
              Yes, warm up!
            </button>
            <button type="button" className="flower-line-gate-btn flower-line-gate-btn--secondary" onClick={handleWarmupNo}>
              No, 1 to 10!
            </button>
          </div>
        </div>
      )}

      {phase === 'warmup-transition' && (
        <div className="flower-line-gate">
          <p className="flower-line-gate-text">🌼 Great warm-up! Now let's do 1 to 10! 🌼</p>
        </div>
      )}

      {(phase === 'playing' || phase === 'ending') && (
        <>
          <p className="flower-line-prompt" aria-live="polite">
            {promptText}
          </p>

          <div className="flower-pot-row">
            {Array.from({ length: roundSize }, (_, i) => i + 1).map((position) => (
              <Pot
                key={position}
                position={position}
                planted={position <= placedCount}
                isNext={phase === 'playing' && position === placedCount + 1}
                isCountAlong={countAlongIndex === position - 1}
              />
            ))}
          </div>

          {phase === 'playing' && (
            <div className="flower-card-tray">
              {remainingCards.map((value) => (
                <FlowerCard
                  key={value}
                  value={value}
                  dotsHidden={!isWarmup && dotsHiddenFor(value)}
                  isGlowing={missStage === 3 && value === expectedValue}
                  isDimmed={dimmedAbove !== null && value > dimmedAbove}
                  isShaking={shakeValue === value}
                  onTap={handleCardTap}
                />
              ))}
            </div>
          )}
        </>
      )}

      {showCelebration && <CelebrationEffects />}

      {overlay === 'compare' && wrongValue !== null && (
        <div className="flower-overlay-backdrop" role="dialog" aria-label="Compare the two numbers">
          <div className="flower-compare">
            <p className="flower-overlay-prompt">Look carefully. Which has fewer flowers?</p>
            <div className="flower-compare-cards">
              {[compareWrongLeft ? wrongValue : expectedValue, compareWrongLeft ? expectedValue : wrongValue].map(
                (cardValue) => {
                  const isExpected = cardValue === expectedValue;
                  return (
                    <button
                      key={cardValue}
                      type="button"
                      className={`flower-compare-card ${comparePhase === 'choose' ? 'flower-compare-card--active' : ''}`}
                      onClick={() => handleCompareTap(isExpected)}
                      disabled={comparePhase !== 'choose'}
                      aria-label={`Flower card ${cardValue}`}
                    >
                      <span className="flower-card-number">{cardValue}</span>
                      <TenFrameDots value={cardValue} size="lg" />
                    </button>
                  );
                },
              )}
            </div>
          </div>
        </div>
      )}

      {overlay === 'demo' && wrongValue !== null && (
        <div className="flower-overlay-backdrop" role="dialog" aria-label="Counting demonstration">
          <div className="flower-demo">
            <p className="flower-overlay-prompt">Let's count together!</p>
            <div className="flower-demo-cards">
              <div className="flower-demo-card">
                <span className="flower-card-number">{wrongValue}</span>
                <TenFrameDots value={wrongValue} litCount={Math.min(demoLit, wrongValue)} size="lg" />
              </div>
              <div className="flower-demo-card">
                <span className="flower-card-number">{expectedValue}</span>
                <TenFrameDots
                  value={expectedValue}
                  litCount={Math.max(0, Math.min(demoLit - wrongValue, expectedValue))}
                  size="lg"
                />
              </div>
            </div>
            {demoLit >= wrongValue + expectedValue && (
              <p className="flower-demo-conclusion">
                {expectedValue} is fewer, so {expectedValue} is smaller.
              </p>
            )}
          </div>
        </div>
      )}

      {showGrownUps && <GrownUpsPanel rounds={stats.rounds} onClose={() => setShowGrownUps(false)} />}
    </div>
  );
};
