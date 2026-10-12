import { useCallback, useMemo, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';
import { CRITTER_ORDER, getActivity, getEffectiveLevelCount } from '../data/activities';
import { generateMatchPairs, shuffle } from '../data/questionGenerators';
import { GameHeader } from '../components/GameHeader';
import { SideCritter } from '../components/SideCritter';
import { useSpeech } from '../hooks/useSpeech';
import type { ActivityId, LevelResult, MatchPair, NumberSettings } from '../types';
import './MatchingRound.css';

interface MatchingRoundProps {
  activityId: ActivityId;
  level: number;
  soundOn: boolean;
  settings: NumberSettings;
  childName?: string | null;
  onExit: () => void;
  onLevelComplete: (result: LevelResult) => void;
}

const DRAG_THRESHOLD = 6;

interface DragState {
  pairId: string;
  pointerId: number;
  originX: number;
  originY: number;
  x: number;
  y: number;
  isDragging: boolean;
  width: number;
  height: number;
}

export const MatchingRound = ({
  activityId,
  level,
  soundOn,
  settings,
  childName,
  onExit,
  onLevelComplete,
}: MatchingRoundProps) => {
  const activity = getActivity(activityId);
  const pairsPerRound = activity?.pairsPerRound ?? 5;
  const totalRounds = activity?.questionsPerLevel ?? 2;
  const { speak, supported } = useSpeech(soundOn);

  // Stable Set held in state (never replaced) since it's read during the
  // pairs state's lazy initializer below.
  const [excludedSet] = useState<Set<number>>(() => new Set());
  const correctFirstTryRef = useRef(0);
  const attemptsRef = useRef<Record<string, number>>({});

  const [roundIndex, setRoundIndex] = useState(0);
  const [pairs, setPairs] = useState<MatchPair[]>(() =>
    generateMatchPairs(activityId, level, excludedSet, pairsPerRound, settings),
  );
  const [wordOrder, setWordOrder] = useState<MatchPair[]>(() => shuffle(pairs));
  const [numeralOrder, setNumeralOrder] = useState<MatchPair[]>(() => shuffle(pairs));
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const [selectedNumeralId, setSelectedNumeralId] = useState<string | null>(null);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [hoverWordId, setHoverWordId] = useState<string | null>(null);
  const [wrongId, setWrongId] = useState<string | null>(null);
  const [roundDone, setRoundDone] = useState(false);
  const [drag, setDrag] = useState<DragState | null>(null);

  const dragRef = useRef<DragState | null>(null);
  // Tracks whether the interaction since the last pointerdown on a numeral
  // turned into a drag, so the trailing "click" some browsers fire right
  // after a drag-release doesn't also run the tap-to-select logic. Reset on
  // every new pointerdown (never left dangling), so it can't leak into a
  // later, unrelated tap if a browser happens not to fire that trailing
  // click at all (observed in Chromium when pointermove preventDefault()s).
  const lastWasDragRef = useRef(false);
  const wrongTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const critter = useMemo(() => CRITTER_ORDER[(level - 1) % CRITTER_ORDER.length], [level]);

  const startNewRound = useCallback(
    (nextRoundIndex: number) => {
      const nextPairs = generateMatchPairs(activityId, level, excludedSet, pairsPerRound, settings);
      setPairs(nextPairs);
      setWordOrder(shuffle(nextPairs));
      setNumeralOrder(shuffle(nextPairs));
      setMatchedIds(new Set());
      setSelectedNumeralId(null);
      setSelectedWordId(null);
      setHoverWordId(null);
      setWrongId(null);
      setRoundDone(false);
      attemptsRef.current = {};
      setRoundIndex(nextRoundIndex);
    },
    [activityId, level, pairsPerRound, excludedSet, settings],
  );

  const resetRound = () => {
    setWordOrder(shuffle(pairs));
    setNumeralOrder(shuffle(pairs));
    setMatchedIds(new Set());
    setSelectedNumeralId(null);
    setSelectedWordId(null);
    setHoverWordId(null);
    setWrongId(null);
    setRoundDone(false);
    attemptsRef.current = {};
  };

  const flashWrong = (id: string) => {
    setWrongId(id);
    if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    wrongTimerRef.current = setTimeout(() => setWrongId(null), 520);
  };

  const attemptMatch = (numeralPairId: string, wordPairId: string) => {
    if (matchedIds.has(numeralPairId) || matchedIds.has(wordPairId)) return;

    if (numeralPairId === wordPairId) {
      const attempts = attemptsRef.current[numeralPairId] ?? 0;
      if (attempts === 0) correctFirstTryRef.current += 1;
      setMatchedIds((prev) => {
        const next = new Set(prev);
        next.add(numeralPairId);
        if (next.size === pairs.length) setRoundDone(true);
        return next;
      });
      speak('Great match!');
    } else {
      attemptsRef.current[numeralPairId] = (attemptsRef.current[numeralPairId] ?? 0) + 1;
      flashWrong(wordPairId);
      speak('Not quite, try again!');
    }
    setSelectedNumeralId(null);
    setSelectedWordId(null);
    setHoverWordId(null);
  };

  const handleNumeralPointerDown = (e: ReactPointerEvent<HTMLButtonElement>, pairId: string) => {
    if (matchedIds.has(pairId)) return;
    lastWasDragRef.current = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const state: DragState = {
      pairId,
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

  const handleNumeralPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
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

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const wordEl = el?.closest('[data-word-id]') as HTMLElement | null;
      const candidateId = wordEl?.dataset.wordId ?? null;
      setHoverWordId(candidateId && !matchedIds.has(candidateId) ? candidateId : null);
    }
  };

  const handleNumeralPointerUp = (e: ReactPointerEvent<HTMLButtonElement>, pairId: string) => {
    const state = dragRef.current;
    if (!state || state.pointerId !== e.pointerId) return;

    if (state.isDragging && hoverWordId) {
      attemptMatch(pairId, hoverWordId);
    }

    dragRef.current = null;
    setDrag(null);
    setHoverWordId(null);
  };

  const handleNumeralPointerCancel = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setDrag(null);
    setHoverWordId(null);
  };

  // Handles both a real click/tap (mouse, touch) and keyboard activation
  // (Enter/Space), which only ever fires a "click" — never pointer events —
  // so tap-to-select has to live here, not in the pointer handlers above.
  const handleNumeralClick = (e: ReactMouseEvent<HTMLButtonElement>, pairId: string) => {
    // detail > 0 means this click came from a real mouse/touch press rather
    // than keyboard activation (which always reports detail 0) — only a
    // pointer-originated click can be the trailing click some browsers fire
    // right after a drag-release, so only that case gets suppressed here.
    if (e.detail > 0 && lastWasDragRef.current) return;
    if (matchedIds.has(pairId)) return;
    if (selectedWordId) {
      // A word was already selected (tap-to-select, word-first) — this tap
      // on a numeral completes the pair, whichever order the child used.
      attemptMatch(pairId, selectedWordId);
    } else {
      setSelectedNumeralId((current) => (current === pairId ? null : pairId));
    }
  };

  const handleWordTap = (wordPairId: string) => {
    if (matchedIds.has(wordPairId)) return;
    if (selectedNumeralId) {
      // A numeral was already selected — this tap on a word completes the pair.
      attemptMatch(selectedNumeralId, wordPairId);
    } else {
      // Tap-to-select, word-first (the primary flow): toggle so the child
      // can change their mind before tapping a numeral.
      setSelectedWordId((current) => (current === wordPairId ? null : wordPairId));
    }
  };

  const handleFinishRound = () => {
    const isLastRound = roundIndex + 1 >= totalRounds;
    if (isLastRound) {
      const totalPairs = pairsPerRound * totalRounds;
      const accuracy = totalPairs > 0 ? correctFirstTryRef.current / totalPairs : 0;
      const starsEarned = accuracy === 1 ? 3 : accuracy >= 0.7 ? 2 : 1;
      const effectiveLevelCount = getEffectiveLevelCount(activityId, activity?.levelCount ?? 5, settings);
      const leveledUp = accuracy >= 0.7 && level < effectiveLevelCount;
      onLevelComplete({
        activityId,
        level,
        correct: correctFirstTryRef.current,
        total: totalPairs,
        starsEarned,
        leveledUp,
      });
    } else {
      startNewRound(roundIndex + 1);
    }
  };

  if (!activity) return null;

  const draggedPair = drag ? pairs.find((p) => p.id === drag.pairId) : null;

  return (
    <div className="matching-round" onPointerMove={handleNumeralPointerMove}>
      <GameHeader
        title={activity.title}
        current={roundIndex + 1}
        total={totalRounds}
        onBack={onExit}
        onHearPrompt={() => speak('Match the number word to the correct number')}
        speechSupported={supported}
        childName={childName}
      />

      <p className="matching-round-prompt">Drag or tap to match the word with its number</p>

      <div className="matching-round-board">
        <div className="matching-round-column">
          {wordOrder.map((pair) => {
            const isMatched = matchedIds.has(pair.id);
            const isHovered = hoverWordId === pair.id;
            const isWrong = wrongId === pair.id;
            const isSelected = selectedWordId === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                data-word-id={pair.id}
                className={[
                  'matching-word-card',
                  isMatched ? 'matching-word-card--matched' : '',
                  isHovered ? 'matching-word-card--hover' : '',
                  isWrong ? 'matching-word-card--wrong' : '',
                  isSelected ? 'matching-word-card--selected' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleWordTap(pair.id)}
                disabled={isMatched}
                aria-pressed={isSelected}
                aria-label={isMatched ? `${pair.word}, matched with ${pair.value}` : `Word: ${pair.word}`}
              >
                <span>{pair.word}</span>
                {isMatched && <span className="matching-word-card-result">{pair.value} ✓</span>}
              </button>
            );
          })}
        </div>

        <div className="matching-round-column">
          {numeralOrder.map((pair) => {
            const isMatched = matchedIds.has(pair.id);
            const isSelected = selectedNumeralId === pair.id;
            const isBeingDragged = drag?.pairId === pair.id;
            return (
              <button
                key={pair.id}
                type="button"
                className={[
                  'matching-numeral-card',
                  isMatched ? 'matching-numeral-card--matched' : '',
                  isSelected ? 'matching-numeral-card--selected' : '',
                  isBeingDragged ? 'matching-numeral-card--dragging' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={isMatched}
                aria-label={isMatched ? `${pair.value}, matched` : `Number ${pair.value}`}
                aria-pressed={isSelected}
                onPointerDown={(e) => handleNumeralPointerDown(e, pair.id)}
                onPointerUp={(e) => handleNumeralPointerUp(e, pair.id)}
                onPointerCancel={handleNumeralPointerCancel}
                onClick={(e) => handleNumeralClick(e, pair.id)}
              >
                {isMatched ? '✓' : pair.value}
              </button>
            );
          })}
        </div>
      </div>

      {draggedPair && drag && (
        <div
          className="matching-drag-ghost"
          style={{
            left: drag.x - drag.width / 2,
            top: drag.y - drag.height / 2,
            width: drag.width,
            height: drag.height,
          }}
          aria-hidden="true"
        >
          {draggedPair.value}
        </div>
      )}

      <div className="matching-round-controls">
        <button type="button" className="matching-round-btn matching-round-btn--ghost" onClick={resetRound}>
          Reset round
        </button>
        {roundDone && (
          <button type="button" className="matching-round-btn matching-round-btn--primary" onClick={handleFinishRound}>
            {roundIndex + 1 >= totalRounds ? 'Finish' : 'Next round'}
          </button>
        )}
      </div>

      <div className="matching-round-critter">
        <SideCritter kind={critter} />
      </div>
    </div>
  );
};
