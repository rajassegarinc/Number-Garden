import { useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { GameHeader } from '../components/GameHeader';
import { TenFrameDots } from '../components/TenFrameDots';
import { CelebrationEffects } from '../components/CelebrationEffects';
import { useSpeech } from '../hooks/useSpeech';
import { randomInt, shuffle } from '../data/questionGenerators';
import type { ActivityId, LevelResult, NumberSettings } from '../types';
import './CaterpillarTrail.css';

interface CaterpillarTrailProps {
  activityId: ActivityId;
  level: number;
  soundOn: boolean;
  settings: NumberSettings;
  childName?: string | null;
  onExit: () => void;
  onLevelComplete: (result: LevelResult) => void;
}

type Phase = 'gate' | 'playing' | 'ending';
type MissStage = 0 | 1 | 2 | 3;
type Overlay = 'none' | 'compare' | 'demo';

const TRAIL_SIZE = 10;
const MIN_BLANKS = 4;
const MAX_BLANKS = 6;
const DRAG_THRESHOLD = 6;
const COMPARE_DISPLAY_MS = 1800;
const DEMO_STEP_MS = 260;
const DEMO_END_PAUSE_MS = 1000;
const TRANSFORM_DELAY_MS = 500;
const CELEBRATION_MS = 1800;

const PRAISE = ["You've got it!", 'The caterpillar is happy!', 'Wonderful!', "You're on a roll!", 'Great spotting!'];

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const countList = (n: number) => Array.from({ length: n }, (_, i) => i + 1).join(', ');

const buildCountingSentence = (wrongValue: number, expectedValue: number) =>
  `${countList(wrongValue)}... ${wrongValue} dots. ${countList(expectedValue)}... ${expectedValue} dots. ` +
  `${expectedValue} is fewer, so ${expectedValue} is smaller.`;

interface DragState {
  value: number;
  pointerId: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
  isDragging: boolean;
  width: number;
  height: number;
}

export const CaterpillarTrail = ({ activityId, soundOn, childName, onExit, onLevelComplete }: CaterpillarTrailProps) => {
  const { speak, supported } = useSpeech(soundOn);

  const [phase, setPhase] = useState<Phase>('gate');
  const [trayOrder, setTrayOrder] = useState<number[]>([]);
  // The positions that start the round empty — everything else is already
  // shown filled in, so the child only ever has to place the gaps, not all 10.
  const [blankPositions, setBlankPositions] = useState<number[]>([]);
  const [filledBlanks, setFilledBlanks] = useState<Set<number>>(new Set());
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [missStage, setMissStage] = useState<MissStage>(0);
  const [wrongValue, setWrongValue] = useState<number | null>(null);
  const [overlay, setOverlay] = useState<Overlay>('none');
  const [comparePhase, setComparePhase] = useState<'display' | 'choose'>('display');
  const [compareWrongLeft, setCompareWrongLeft] = useState(true);
  const [demoLit, setDemoLit] = useState(0);
  const [shakeValue, setShakeValue] = useState<number | null>(null);
  const [nudgeSegment, setNudgeSegment] = useState<number | null>(null);
  const [promptText, setPromptText] = useState("Tap Start to help the caterpillar!");
  const [transformed, setTransformed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);

  const firstTryMapRef = useRef<Record<number, boolean>>({});
  const praiseIndexRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);
  const lastWasDragRef = useRef(false);

  const compareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nudgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const transformTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (compareTimerRef.current) clearTimeout(compareTimerRef.current);
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
      if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
      if (transformTimerRef.current) clearTimeout(transformTimerRef.current);
      if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    },
    [],
  );

  const blankSet = useMemo(() => new Set(blankPositions), [blankPositions]);
  const expectedValue = blankPositions.reduce(
    (min, p) => (!filledBlanks.has(p) && p < min ? p : min),
    Infinity,
  );

  const randomPraise = () => {
    const msg = PRAISE[praiseIndexRef.current % PRAISE.length];
    praiseIndexRef.current += 1;
    return msg;
  };

  const startRound = () => {
    const blankCount = randomInt(MIN_BLANKS, MAX_BLANKS);
    const blanks = shuffle(Array.from({ length: TRAIL_SIZE }, (_, i) => i + 1)).slice(0, blankCount);
    setBlankPositions(blanks);
    setFilledBlanks(new Set());
    setTrayOrder(shuffle(blanks));
    setSelectedValue(null);
    setMissStage(0);
    setWrongValue(null);
    setOverlay('none');
    setShakeValue(null);
    setNudgeSegment(null);
    setTransformed(false);
    setShowCelebration(false);
    firstTryMapRef.current = {};

    const msg = "Some numbers are already there! Let's fill in the missing ones, smallest first!";
    setPromptText(msg);
    speak(msg);
    setPhase('playing');
  };

  const completeLevel = () => {
    const totalBlanks = blankPositions.length;
    const firstTryCount = Object.values(firstTryMapRef.current).filter(Boolean).length;
    const accuracy = totalBlanks > 0 ? firstTryCount / totalBlanks : 0;
    const starsEarned = accuracy === 1 ? 3 : accuracy >= 0.7 ? 2 : 1;
    onLevelComplete({
      activityId,
      level: 1,
      correct: firstTryCount,
      total: totalBlanks,
      starsEarned,
      leveledUp: false,
    });
  };

  const finishRound = () => {
    setPhase('ending');
    transformTimerRef.current = setTimeout(() => {
      setTransformed(true);
      setShowCelebration(true);
      speak('Hooray! A beautiful butterfly!');
      celebrationTimerRef.current = setTimeout(() => {
        setShowCelebration(false);
        completeLevel();
      }, CELEBRATION_MS);
    }, TRANSFORM_DELAY_MS);
  };

  const clearHintTimers = () => {
    if (compareTimerRef.current) clearTimeout(compareTimerRef.current);
    if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    if (demoTimeoutRef.current) clearTimeout(demoTimeoutRef.current);
  };

  const handleCorrect = (value: number) => {
    if (firstTryMapRef.current[value] === undefined) firstTryMapRef.current[value] = true;

    clearHintTimers();
    setOverlay('none');
    setMissStage(0);
    setWrongValue(null);
    setSelectedValue(null);

    const nextFilled = new Set(filledBlanks);
    nextFilled.add(value);
    setFilledBlanks(nextFilled);
    const praise = randomPraise();

    if (nextFilled.size >= blankPositions.length) {
      speak(`${value} is on the trail! ${praise}`);
      finishRound();
    } else {
      const instruction = 'Which is the smallest one left?';
      speak(`${value} is on the trail! ${praise} ${instruction}`);
      setPromptText(instruction);
    }
  };

  const runDemoAnimation = (wrongVal: number, expectedVal: number) => {
    const total = wrongVal + expectedVal;
    clearHintTimers();

    if (prefersReducedMotion()) {
      setDemoLit(total);
      demoTimeoutRef.current = setTimeout(() => setOverlay('none'), DEMO_END_PAUSE_MS + 200);
      return;
    }

    let lit = 0;
    demoIntervalRef.current = setInterval(() => {
      lit += 1;
      setDemoLit(lit);
      if (lit >= total) {
        if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
        demoTimeoutRef.current = setTimeout(() => setOverlay('none'), DEMO_END_PAUSE_MS);
      }
    }, DEMO_STEP_MS);
  };

  const handleWrong = (value: number) => {
    firstTryMapRef.current[expectedValue] = false;
    const newStage = Math.min(missStage + 1, 3) as MissStage;
    setMissStage(newStage);
    setWrongValue(value);
    setSelectedValue(null);

    setShakeValue(value);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShakeValue((v) => (v === value ? null : v)), 420);

    if (newStage === 1) {
      const msg = 'Look carefully. Which has fewer dots?';
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
      const msg =
        expectedValue === 1
          ? '1 is the smallest number. Tap the glowing number.'
          : `After ${expectedValue - 1} comes ${expectedValue}. Tap the glowing number.`;
      setPromptText(msg);
      speak(msg);
      setOverlay('none');
    }
  };

  const nudgeToActiveSegment = () => {
    setSelectedValue(null);
    setNudgeSegment(expectedValue);
    const msg =
      expectedValue === 1
        ? "Let's start with the very first spot!"
        : `Not that spot yet — find the next empty segment after ${expectedValue - 1}.`;
    speak(msg);
    if (nudgeTimerRef.current) clearTimeout(nudgeTimerRef.current);
    nudgeTimerRef.current = setTimeout(() => setNudgeSegment(null), 700);
  };

  const attemptPlacement = (value: number, targetPos: number) => {
    if (overlay !== 'none' || phase !== 'playing') return;
    const isOpenBlank = blankSet.has(targetPos) && !filledBlanks.has(targetPos);
    if (!isOpenBlank) {
      setSelectedValue(null);
      return;
    }
    if (targetPos !== expectedValue) {
      nudgeToActiveSegment();
      return;
    }
    if (value === expectedValue) handleCorrect(value);
    else handleWrong(value);
  };

  const handleTileTap = (value: number) => {
    if (overlay !== 'none' || phase !== 'playing') return;
    setSelectedValue((current) => (current === value ? null : value));
  };

  const handleSegmentTap = (position: number) => {
    if (selectedValue === null) return;
    attemptPlacement(selectedValue, position);
  };

  const handleTilePointerDown = (e: ReactPointerEvent<HTMLButtonElement>, value: number) => {
    if (overlay !== 'none' || phase !== 'playing') return;
    lastWasDragRef.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const state: DragState = {
      value,
      pointerId: e.pointerId,
      originX: e.clientX,
      originY: e.clientY,
      x: e.clientX,
      y: e.clientY,
      isDragging: false,
      width: rect.width,
      height: rect.height,
    };
    dragRef.current = state;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleTrailPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;
    const dx = e.clientX - state.originX;
    const dy = e.clientY - state.originY;
    if (!state.isDragging && Math.hypot(dx, dy) > DRAG_THRESHOLD) {
      state.isDragging = true;
      lastWasDragRef.current = true;
    }
    if (state.isDragging) {
      e.preventDefault();
      state.x = e.clientX;
      state.y = e.clientY;
      setDrag({ ...state });
    }
  };

  const handleTilePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    if (state.isDragging) {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const segmentEl = el?.closest('[data-segment-pos]') as HTMLElement | null;
      const pos = segmentEl?.dataset.segmentPos ? Number(segmentEl.dataset.segmentPos) : null;
      if (pos !== null) attemptPlacement(state.value, pos);
    }

    dragRef.current = null;
    setDrag(null);
  };

  const handleTilePointerCancel = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDrag(null);
  };

  const handleTileClick = (value: number) => {
    if (lastWasDragRef.current) {
      lastWasDragRef.current = false;
      return;
    }
    handleTileTap(value);
  };

  const handleCompareTap = (tappedIsExpected: boolean) => {
    if (comparePhase !== 'choose') return;
    if (tappedIsExpected) handleCorrect(expectedValue);
    else if (wrongValue !== null) handleWrong(wrongValue);
  };

  const remainingTiles = trayOrder.filter((v) => !filledBlanks.has(v));
  const draggedValue = drag?.value ?? null;

  return (
    <div className="caterpillar-trail" onPointerMove={handleTrailPointerMove}>
      <GameHeader
        title="Caterpillar Number Trail"
        current={Math.min(filledBlanks.size + (phase === 'playing' ? 1 : 0), blankPositions.length)}
        total={blankPositions.length}
        onBack={onExit}
        onHearPrompt={() => speak(promptText)}
        speechSupported={supported}
        childName={childName}
      />

      {phase === 'gate' && (
        <div className="caterpillar-gate">
          <span className="caterpillar-gate-emoji" aria-hidden="true">
            🐛
          </span>
          <p className="caterpillar-gate-text">
            Help the caterpillar find its way! Some numbers are already on its back — fill in the ones that are
            missing, smallest to largest.
          </p>
          <button type="button" className="caterpillar-gate-btn" onClick={startRound}>
            🍃 Start the Trail!
          </button>
        </div>
      )}

      {(phase === 'playing' || phase === 'ending') && (
        <>
          <p className="caterpillar-prompt" aria-live="polite">
            {promptText}
          </p>

          <div className={`caterpillar-body-wrap ${transformed ? 'caterpillar-body-wrap--transformed' : ''}`}>
            {!transformed && (
              <div className="caterpillar-segment-row">
                {Array.from({ length: TRAIL_SIZE }, (_, i) => i + 1).map((position) => {
                  const planted = !blankSet.has(position) || filledBlanks.has(position);
                  const isActive = phase === 'playing' && position === expectedValue;
                  const isNudging = nudgeSegment === position;
                  return (
                    <button
                      key={position}
                      type="button"
                      data-segment-pos={position}
                      className={[
                        'caterpillar-segment',
                        position === 1 ? 'caterpillar-segment--head' : '',
                        planted ? 'caterpillar-segment--planted' : '',
                        isActive ? 'caterpillar-segment--active' : '',
                        isNudging ? 'caterpillar-segment--nudge' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => handleSegmentTap(position)}
                      aria-label={planted ? `Segment ${position}: ${position}` : `Segment ${position}: empty`}
                    >
                      {position === 1 && (
                        <span className="caterpillar-face" aria-hidden="true">
                          <span className="caterpillar-antenna caterpillar-antenna--left" />
                          <span className="caterpillar-antenna caterpillar-antenna--right" />
                        </span>
                      )}
                      {planted ? (
                        <span className="caterpillar-segment-number">{position}</span>
                      ) : (
                        <span className="caterpillar-segment-outline" aria-hidden="true" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {transformed && (
              <div className="caterpillar-butterfly" aria-hidden="true">
                🦋
              </div>
            )}
          </div>

          {phase === 'playing' && (
            <div className="caterpillar-tray">
              {remainingTiles.map((value) => {
                const isSelected = selectedValue === value;
                const isGlowing = missStage === 3 && value === expectedValue;
                const isShaking = shakeValue === value;
                const isBeingDragged = draggedValue === value;
                return (
                  <button
                    key={value}
                    type="button"
                    className={[
                      'caterpillar-tile',
                      isSelected ? 'caterpillar-tile--selected' : '',
                      isGlowing ? 'caterpillar-tile--glow' : '',
                      isShaking ? 'caterpillar-tile--shake' : '',
                      isBeingDragged ? 'caterpillar-tile--dragging' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onPointerDown={(e) => handleTilePointerDown(e, value)}
                    onPointerUp={handleTilePointerUp}
                    onPointerCancel={handleTilePointerCancel}
                    onClick={() => handleTileClick(value)}
                    aria-pressed={isSelected}
                    aria-label={isGlowing ? `Number ${value}, tap this one` : `Number ${value}`}
                  >
                    <span className="caterpillar-tile-number">{value}</span>
                    <TenFrameDots value={value} />
                  </button>
                );
              })}
            </div>
          )}

          {draggedValue !== null && drag && (
            <div
              className="caterpillar-drag-ghost"
              style={{
                left: drag.x - drag.width / 2,
                top: drag.y - drag.height / 2,
                width: drag.width,
                height: drag.height,
              }}
              aria-hidden="true"
            >
              {draggedValue}
            </div>
          )}
        </>
      )}

      {showCelebration && <CelebrationEffects perfect />}

      {overlay === 'compare' && wrongValue !== null && (
        <div className="caterpillar-overlay-backdrop" role="dialog" aria-label="Compare the two numbers">
          <div className="caterpillar-compare">
            <p className="caterpillar-overlay-prompt">Look carefully. Which has fewer dots?</p>
            <div className="caterpillar-compare-cards">
              {[compareWrongLeft ? wrongValue : expectedValue, compareWrongLeft ? expectedValue : wrongValue].map(
                (cardValue) => {
                  const isExpected = cardValue === expectedValue;
                  return (
                    <button
                      key={cardValue}
                      type="button"
                      className={`caterpillar-compare-card ${comparePhase === 'choose' ? 'caterpillar-compare-card--active' : ''}`}
                      onClick={() => handleCompareTap(isExpected)}
                      disabled={comparePhase !== 'choose'}
                      aria-label={`Number ${cardValue}`}
                    >
                      <span className="caterpillar-tile-number">{cardValue}</span>
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
        <div className="caterpillar-overlay-backdrop" role="dialog" aria-label="Counting demonstration">
          <div className="caterpillar-demo">
            <p className="caterpillar-overlay-prompt">Let's count together!</p>
            <div className="caterpillar-demo-cards">
              <div className="caterpillar-demo-card">
                <span className="caterpillar-tile-number">{wrongValue}</span>
                <TenFrameDots value={wrongValue} litCount={Math.min(demoLit, wrongValue)} size="lg" />
              </div>
              <div className="caterpillar-demo-card">
                <span className="caterpillar-tile-number">{expectedValue}</span>
                <TenFrameDots
                  value={expectedValue}
                  litCount={Math.max(0, Math.min(demoLit - wrongValue, expectedValue))}
                  size="lg"
                />
              </div>
            </div>
            {demoLit >= wrongValue + expectedValue && (
              <p className="caterpillar-demo-conclusion">
                {expectedValue} is fewer, so {expectedValue} is smaller.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
