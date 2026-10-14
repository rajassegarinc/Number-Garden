import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { getActivity, getEffectiveLevelCount, resolveBand } from '../data/activities';
import { generateNumberLineQuestion, getNumberLineStimulus } from '../data/numberLineGenerator';
import type { NumberLineQuestion } from '../data/numberLineGenerator';
import { ANIMAL_SPECS } from '../data/celebrationAnimals';
import type { AnimalKind } from '../data/celebrationAnimals';
import { pickGuideAnimal } from '../data/celebrationSelector';
import { GameHeader } from '../components/GameHeader';
import { NumberLineTrack } from '../components/NumberLineTrack';
import { CelebrationAnimal } from '../components/CelebrationAnimal';
import { useSpeech } from '../hooks/useSpeech';
import type { ActivityId, LevelResult, NumberSettings } from '../types';
import './NumberLineAdventure.css';

interface NumberLineAdventureProps {
  activityId: ActivityId;
  level: number;
  soundOn: boolean;
  settings: NumberSettings;
  childName?: string | null;
  onExit: () => void;
  onLevelComplete: (result: LevelResult) => void;
  /** Overrides the random guide-animal rotation — used by RiverMission to
   * always show the baby elephant instead of a random species. */
  forcedGuide?: AnimalKind;
  /** Rendered between the header and the question body — used by
   * RiverMission to layer its own persistent river-crossing progress strip
   * on top of this engine without duplicating the question/answer logic. */
  topSlot?: ReactNode;
  /** Fired once per answered question (right as the answer is revealed,
   * regardless of correct/incorrect) with how many of the total have now
   * been answered — lets a themed wrapper track overall mission progress. */
  onProgress?: (answered: number, total: number) => void;
}

const FEEDBACK_DELAY_MS = 1100;
const HOP_STEP_MS = 260;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const NumberLineAdventure = ({
  activityId,
  level,
  soundOn,
  settings,
  childName,
  onExit,
  onLevelComplete,
  forcedGuide,
  topSlot,
  onProgress,
}: NumberLineAdventureProps) => {
  const activity = getActivity(activityId);
  const totalQuestions = activity?.questionsPerLevel ?? 6;
  const { speak, supported } = useSpeech(soundOn);

  const [screenMode, setScreenMode] = useState<'quiz' | 'explore'>('quiz');

  // Stable Set held in state (never replaced) since it's read during the
  // question state's lazy initializer below — same pattern as GameScreen.
  const [usedStimuli] = useState<Set<number>>(() => new Set());

  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<NumberLineQuestion>(() => {
    const first = generateNumberLineQuestion(level, usedStimuli, settings);
    usedStimuli.add(getNumberLineStimulus(first));
    return first;
  });
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [hopPosition, setHopPosition] = useState<number | null>(null);

  const [exploreValue, setExploreValue] = useState<number | null>(null);
  const exploreBand = useMemo(() => resolveBand(activityId, level, settings), [activityId, level, settings]);

  // Picked once per mount (i.e. once per round/session, same pattern as the
  // victory-screen lineup) and kept stable — rotates the next time this
  // activity is entered, never mid-question.
  const [guide] = useState(() => forcedGuide ?? pickGuideAnimal());
  const guideName = `the ${ANIMAL_SPECS[guide].name}`;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hopTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    if (question.type === 'jump' && question.startValue !== undefined) {
      setHopPosition(question.startValue);
    } else {
      setHopPosition(null);
    }
  }, [question]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      // Clearing whatever has accumulated in the ref by unmount time is the
      // intended behavior here, not a stale-closure bug.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      hopTimersRef.current.forEach(clearTimeout);
    };
  }, []);

  const speakPrompt = () => speak(question.spokenPrompt);

  useEffect(() => {
    if (screenMode === 'quiz') speakPrompt();
    // Only re-run when the question identity or screen mode changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, screenMode]);

  const animateHop = (from: number, to: number) => {
    if (prefersReducedMotion()) {
      setHopPosition(to);
      return;
    }
    const path: number[] = [];
    let cur = from;
    while (cur !== to) {
      cur += to > cur ? 1 : -1;
      path.push(cur);
    }
    path.forEach((pos, i) => {
      hopTimersRef.current.push(setTimeout(() => setHopPosition(pos), (i + 1) * HOP_STEP_MS));
    });
  };

  const handleSelect = (value: number) => {
    if (revealed) return;
    setSelectedValue(value);
    setRevealed(true);
    const correct = value === question.correct;
    onProgress?.(questionIndex + 1, totalQuestions);

    if (question.type === 'jump' && question.startValue !== undefined) {
      animateHop(question.startValue, question.correct);
    }

    if (correct) {
      setCorrectCount((c) => c + 1);
      speak('Great hop!');
    } else {
      speak('Let\'s try the next one!');
    }

    timerRef.current = setTimeout(() => {
      const nextIndex = questionIndex + 1;
      if (nextIndex >= totalQuestions) {
        const finalCorrect = correct ? correctCount + 1 : correctCount;
        const accuracy = finalCorrect / totalQuestions;
        const starsEarned = accuracy === 1 ? 3 : accuracy >= 0.7 ? 2 : 1;
        const effectiveLevelCount = getEffectiveLevelCount(activityId, activity?.levelCount ?? 5, settings);
        const leveledUp = accuracy >= 0.7 && level < effectiveLevelCount;
        onLevelComplete({
          activityId,
          level,
          correct: finalCorrect,
          total: totalQuestions,
          starsEarned,
          leveledUp,
        });
        return;
      }
      setQuestionIndex(nextIndex);
      const next = generateNumberLineQuestion(level, usedStimuli, settings);
      usedStimuli.add(getNumberLineStimulus(next));
      setQuestion(next);
      setSelectedValue(null);
      setRevealed(false);
    }, FEEDBACK_DELAY_MS + (question.type === 'jump' ? HOP_STEP_MS * 3 : 0));
  };

  const handleExploreTap = (value: number) => {
    setExploreValue(value);
    speak(String(value));
  };

  if (!activity) return null;

  return (
    <div className="number-line-screen">
      <GameHeader
        title={activity.title}
        current={questionIndex + 1}
        total={totalQuestions}
        onBack={onExit}
        onHearPrompt={speakPrompt}
        speechSupported={supported}
        childName={childName}
      />

      {topSlot}

      <div className="number-line-body">
        <button
          type="button"
          className="number-line-mode-toggle"
          onClick={() => setScreenMode((m) => (m === 'quiz' ? 'explore' : 'quiz'))}
        >
          {screenMode === 'quiz' ? '🔍 Explore the Line' : '▶ Back to Questions'}
        </button>

        {screenMode === 'explore' ? (
          <>
            <p className="number-line-guide-caption">🔍 Explore with {guideName}!</p>
            <p className="number-line-prompt">Tap a stepping stone to hear its number!</p>
            <div className="number-line-explore-display" aria-live="polite">
              {exploreValue ?? '?'}
            </div>
            <NumberLineTrack
              min={exploreBand.min}
              max={exploreBand.max}
              selectedValue={exploreValue}
              onSelect={handleExploreTap}
            />
          </>
        ) : (
          <>
            <p className="number-line-guide-caption">Help {guideName} find the answer!</p>
            <p className="number-line-prompt">{question.prompt}</p>
            <NumberLineTrack
              min={question.windowMin}
              max={question.windowMax}
              given={question.given}
              startValue={question.type === 'jump' ? (hopPosition ?? question.startValue) : undefined}
              selectedValue={selectedValue}
              revealed={revealed}
              correctValue={question.correct}
              onSelect={handleSelect}
            />
          </>
        )}
      </div>

      <div className="number-line-guide">
        <CelebrationAnimal kind={guide} pose="wave" size={68} />
      </div>
    </div>
  );
};
