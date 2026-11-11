import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CRITTER_ORDER, getActivity, getBandLabel } from '../data/activities';
import { PATH_LESSONS, generatePathQuestion, type PathQuestion } from '../data/learningPaths';
import { GameHeader } from '../components/GameHeader';
import { AnswerGrid } from '../components/AnswerGrid';
import { PathScene } from '../components/PathScene';
import { PathLesson } from '../components/PathLesson';
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
  // Teach-first paths open with a picture lesson; the quiz starts after it.
  const lesson = PATH_LESSONS[activityId];
  const [lessonIndex, setLessonIndex] = useState<number | null>(lesson ? 0 : null);
  const inLesson = lesson !== undefined && lessonIndex !== null;

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
    if (lesson && lessonIndex !== null) {
      const slide = lesson[lessonIndex];
      speak(`${slide.title}. ${slide.text}`);
      return;
    }
    speak(question.spokenPrompt);
  }, [question, speak, lesson, lessonIndex]);

  useEffect(() => {
    // The lesson reads its own slides; prompts start once the quiz does.
    if (!inLesson) speak(question.spokenPrompt);
    // Only re-run when the question identity or phase changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id, inLesson]);

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
        current={inLesson ? lessonIndex + 1 : questionIndex + 1}
        total={inLesson ? lesson.length : totalQuestions}
        onBack={onExit}
        onHearPrompt={speakPrompt}
        speechSupported={supported}
        childName={childName}
      />

      {inLesson ? (
        <div className="game-screen-body">
          <PathLesson
            slides={lesson}
            index={lessonIndex}
            onIndexChange={setLessonIndex}
            onFinish={() => setLessonIndex(null)}
            speak={speak}
          />
        </div>
      ) : (
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
            key={question.id}
            choices={question.choices}
            selectedId={selectedId}
            revealed={revealed}
            onSelect={handleSelect}
            compact={compact}
          />
        </div>
      )}

      {/* Hidden during the lesson so it doesn't cover the Back button. */}
      {!inLesson && (
        <div className="game-screen-critter">
          <SideCritter kind={critter} mood={!revealed ? 'idle' : wasCorrect ? 'cheer' : 'oops'} />
        </div>
      )}
    </div>
  );
};
