import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CRITTER_ORDER, getActivity, getEffectiveLevelCount } from '../data/activities';
import { generateQuestion, getQuestionStimulus, validateAnswer } from '../data/questionGenerators';
import { GameHeader } from '../components/GameHeader';
import { QuestionCard } from '../components/QuestionCard';
import { AnswerGrid } from '../components/AnswerGrid';
import { SideCritter } from '../components/SideCritter';
import { useSpeech } from '../hooks/useSpeech';
import type { ActivityId, AnswerChoice, LevelResult, NumberSettings, Question } from '../types';
import './GameScreen.css';

interface GameScreenProps {
  activityId: ActivityId;
  level: number;
  soundOn: boolean;
  settings: NumberSettings;
  childName?: string | null;
  onExit: () => void;
  onLevelComplete: (result: LevelResult) => void;
}

const FEEDBACK_DELAY_MS = 900;

export const GameScreen = ({
  activityId,
  level,
  soundOn,
  settings,
  childName,
  onExit,
  onLevelComplete,
}: GameScreenProps) => {
  const activity = getActivity(activityId);
  const totalQuestions = activity?.questionsPerLevel ?? 6;
  const { speak, supported } = useSpeech(soundOn);

  // Tracks every stimulus number already asked this level so questions
  // don't repeat within a session (reset naturally when GameScreen remounts
  // for a new level/activity, since App keys it on both). A stable Set held
  // in state (never replaced, only mutated) rather than a ref, since its
  // first value is read during the question state's lazy initializer below.
  const [usedStimuli] = useState<Set<number>>(() => new Set());

  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<Question>(() => {
    const first = generateQuestion(activityId, level, usedStimuli, settings);
    usedStimuli.add(getQuestionStimulus(first));
    return first;
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const critter = useMemo(
    () => CRITTER_ORDER[(level - 1) % CRITTER_ORDER.length],
    [level],
  );
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const speakPrompt = useCallback(() => {
    speak(question.spokenPrompt);
  }, [question, speak]);

  useEffect(() => {
    speakPrompt();
    // Only re-run when the question identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const handleSelect = (choice: AnswerChoice) => {
    if (revealed) return;
    setSelectedId(choice.id);
    setRevealed(true);
    const correct = validateAnswer(question, choice.id);
    if (correct) {
      setCorrectCount((c) => c + 1);
      speak('Great job!');
    } else {
      speak('Try the next one!');
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
      const next = generateQuestion(activityId, level, usedStimuli, settings);
      usedStimuli.add(getQuestionStimulus(next));
      setQuestion(next);
      setSelectedId(null);
      setRevealed(false);
    }, FEEDBACK_DELAY_MS);
  };

  if (!activity) return null;

  return (
    <div className="game-screen">
      <GameHeader
        title={activity.title}
        current={questionIndex + 1}
        total={totalQuestions}
        onBack={onExit}
        onHearPrompt={speakPrompt}
        speechSupported={supported}
        childName={childName}
      />

      <div className="game-screen-body">
        <QuestionCard
          question={question}
          onHearWord={question.displayWord ? () => speak(question.spokenPrompt) : undefined}
          speechSupported={supported}
        />

        <AnswerGrid
          choices={question.choices}
          selectedId={selectedId}
          revealed={revealed}
          onSelect={handleSelect}
        />
      </div>

      <div className="game-screen-critter">
        <SideCritter kind={critter} />
      </div>
    </div>
  );
};
