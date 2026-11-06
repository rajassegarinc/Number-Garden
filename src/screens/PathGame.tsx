import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CRITTER_ORDER, getActivity, getBandLabel } from '../data/activities';
import { generatePathQuestion, type PathQuestion } from '../data/learningPaths';
import { GameHeader } from '../components/GameHeader';
import { AnswerGrid } from '../components/AnswerGrid';
import { PathScene } from '../components/PathScene';
import { SideCritter } from '../components/SideCritter';
import { useSpeech } from '../hooks/useSpeech';
import type { ActivityId, AnswerChoice, LevelResult } from '../types';
import './GameScreen.css';
import './PathGame.css';

interface PathGameProps {
  activityId: ActivityId;
  level: number;
  soundOn: boolean;
  childName?: string | null;
  onExit: () => void;
  onLevelComplete: (result: LevelResult) => void;
}

// A little longer than GameScreen so the scene's "answer reveal" (croc
// chomp, shared treats, filled bond) has time to land before moving on.
const FEEDBACK_DELAY_MS = 1600;

export const PathGame = ({ activityId, level, soundOn, childName, onExit, onLevelComplete }: PathGameProps) => {
  const activity = getActivity(activityId);
  const totalQuestions = activity?.questionsPerLevel ?? 6;
  const { speak, supported } = useSpeech(soundOn);

  // Stable Set of question keys asked this level (App remounts on a new level).
  const [usedKeys] = useState<Set<string>>(() => new Set());
  const [questionIndex, setQuestionIndex] = useState(0);
  const [question, setQuestion] = useState<PathQuestion>(() => {
    const first = generatePathQuestion(activityId, level, usedKeys);
    usedKeys.add(first.key);
    return first;
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const critter = useMemo(() => CRITTER_ORDER[(level - 1) % CRITTER_ORDER.length], [level]);
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
    const correct = choice.isCorrect;
    if (correct) {
      setCorrectCount((c) => c + 1);
      speak(`Great job! ${question.explain}`);
    } else {
      speak(`Good try! ${question.explain}`);
    }

    timerRef.current = setTimeout(() => {
      const nextIndex = questionIndex + 1;
      if (nextIndex >= totalQuestions) {
        const finalCorrect = correct ? correctCount + 1 : correctCount;
        const accuracy = finalCorrect / totalQuestions;
        const starsEarned = accuracy === 1 ? 3 : accuracy >= 0.7 ? 2 : 1;
        const leveledUp = accuracy >= 0.7 && level < (activity?.levelCount ?? 1);
        onLevelComplete({ activityId, level, correct: finalCorrect, total: totalQuestions, starsEarned, leveledUp });
        return;
      }
      setQuestionIndex(nextIndex);
      const next = generatePathQuestion(activityId, level, usedKeys);
      usedKeys.add(next.key);
      setQuestion(next);
      setSelectedId(null);
      setRevealed(false);
    }, FEEDBACK_DELAY_MS);
  };

  if (!activity) return null;

  const compact = question.choices.some((c) => c.label.length > 4);
  const wasCorrect = revealed && question.choices.find((c) => c.id === selectedId)?.isCorrect;

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
        <div className="path-game-card">
          <span className="path-game-level">
            {activity.emoji} Level {level}: {getBandLabel(activityId, level)}
          </span>
          <p className="path-game-prompt">{question.prompt}</p>
          <PathScene scene={question.scene} revealed={revealed} />
          <p className={`path-game-feedback ${revealed ? 'path-game-feedback--show' : ''}`} aria-live="polite">
            {revealed ? `${wasCorrect ? '🎉 Great job!' : '🌱 Good try!'} ${question.explain}` : ' '}
          </p>
        </div>

        <AnswerGrid
          choices={question.choices}
          selectedId={selectedId}
          revealed={revealed}
          onSelect={handleSelect}
          compact={compact}
        />
      </div>

      <div className="game-screen-critter">
        <SideCritter kind={critter} />
      </div>
    </div>
  );
};
