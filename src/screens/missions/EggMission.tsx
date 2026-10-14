import { useEffect, useMemo, useRef, useState } from 'react';
import { CollectQuest } from '../../components/CollectQuest';
import { MissionIntro } from '../../components/MissionIntro';
import { MissionCelebration } from '../../components/MissionCelebration';
import { CelebrationAnimal } from '../../components/CelebrationAnimal';
import { GameHeader } from '../../components/GameHeader';
import { randomInt } from '../../data/questionGenerators';
import { useSpeech } from '../../hooks/useSpeech';
import type { MissionId, NumberSettings } from '../../types';
import './EggMission.css';

interface EggMissionProps {
  settings: NumberSettings;
  soundOn: boolean;
  childName: string | null;
  onExit: () => void;
  recordMissionResult: (missionId: MissionId, starsEarned: number) => void;
}

const ROUND_TARGETS = [2, 3, 5];
const EGG_COLORS = ['#fff6e3', '#ffe3ef', '#e3f3ff', '#eafbe3'];

const Egg = ({ index }: { index: number }) => (
  <svg viewBox="0 0 48 48" width="42" height="42" aria-hidden="true">
    <ellipse cx="24" cy="26" rx="16" ry="19" fill={EGG_COLORS[index % EGG_COLORS.length]} stroke="#e0ad3c" strokeWidth="2" />
    <circle cx="18" cy="18" r="2" fill="#e0ad3c" opacity="0.5" />
    <circle cx="28" cy="24" r="1.6" fill="#e0ad3c" opacity="0.5" />
    <circle cx="20" cy="30" r="1.8" fill="#e0ad3c" opacity="0.5" />
  </svg>
);

const Nest = ({ filled, target }: { filled: number; target: number }) => (
  <svg viewBox="0 0 90 60" width="86" height="58" aria-hidden="true">
    <ellipse cx="45" cy="42" rx="40" ry="16" fill="#c98a52" stroke="#8a5a32" strokeWidth="2.5" />
    <ellipse cx="45" cy="36" rx="32" ry="12" fill="#e8bd8d" stroke="#8a5a32" strokeWidth="2" />
    <path d="M12 42q33 10 66 0" fill="none" stroke="#8a5a32" strokeWidth="2" opacity="0.5" />
    {Array.from({ length: filled }).map((_, i) => (
      <ellipse
        key={i}
        cx={28 + (i % 4) * 12}
        cy={32 - Math.floor(i / 4) * 10}
        rx="7"
        ry="8.5"
        fill={EGG_COLORS[i % EGG_COLORS.length]}
        stroke="#e0ad3c"
        strokeWidth="1.3"
      />
    ))}
    <title>{`${filled} of ${target} eggs`}</title>
  </svg>
);

export const EggMission = ({ settings, soundOn, childName, onExit, recordMissionResult }: EggMissionProps) => {
  const { speak, supported } = useSpeech(soundOn);
  const [stage, setStage] = useState<'intro' | 'play' | 'celebrate'>('intro');
  const [roundIndex, setRoundIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [starsEarned, setStarsEarned] = useState(3);
  const [reacting, setReacting] = useState(false);
  const hintsRef = useRef(0);
  const reactTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const target = Math.min(ROUND_TARGETS[roundIndex], Math.max(2, settings.maxNumber));
  // Re-rolled only when the round or a fresh replay changes, not on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const extra = useMemo(() => randomInt(1, 3), [roundIndex, attempt]);
  const totalItems = target + extra;

  const prompt = `Can you find ${target} egg${target === 1 ? '' : 's'} for the nest?`;

  useEffect(() => {
    if (stage === 'play') speak(prompt);
    // Only re-announce when the round itself (or a fresh replay) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, roundIndex, attempt]);

  useEffect(() => {
    return () => {
      if (reactTimerRef.current) clearTimeout(reactTimerRef.current);
    };
  }, []);

  const startMission = () => {
    setRoundIndex(0);
    hintsRef.current = 0;
    setAttempt((a) => a + 1);
    setStage('play');
  };

  const handleRoundComplete = () => {
    speak('Great job!');
    if (roundIndex + 1 >= ROUND_TARGETS.length) {
      const stars = hintsRef.current === 0 ? 3 : hintsRef.current <= 2 ? 2 : 1;
      setStarsEarned(stars);
      recordMissionResult('eggs', stars);
      setStage('celebrate');
    } else {
      setRoundIndex((r) => r + 1);
    }
  };

  if (stage === 'intro') {
    return (
      <MissionIntro
        guide="parrot"
        title="Bird's Nest"
        message="The bird is waiting! Tap or drag eggs into the nest to help fill it up."
        onStart={startMission}
        onBack={onExit}
      />
    );
  }

  if (stage === 'celebrate') {
    return (
      <MissionCelebration
        guide="parrot"
        message="The bird has all its eggs! Thank you for helping!"
        starsEarned={starsEarned}
        onPlayAgain={startMission}
        onBackToMap={onExit}
      />
    );
  }

  return (
    <div className="egg-mission">
      <GameHeader
        title="Bird's Nest"
        current={roundIndex + 1}
        total={ROUND_TARGETS.length}
        onBack={onExit}
        onHearPrompt={() => speak(prompt)}
        speechSupported={supported}
        childName={childName}
      />
      <p className="egg-mission-prompt">{prompt}</p>
      <CollectQuest
        key={`${roundIndex}-${attempt}`}
        target={target}
        totalItems={totalItems}
        itemAriaLabel="egg"
        renderItem={(index) => <Egg index={index} />}
        containerAriaLabel="nest"
        renderContainer={(filled) => <Nest filled={filled} target={target} />}
        onComplete={handleRoundComplete}
        onHint={() => {
          hintsRef.current += 1;
        }}
        onCollect={() => {
          setReacting(true);
          if (reactTimerRef.current) clearTimeout(reactTimerRef.current);
          reactTimerRef.current = setTimeout(() => setReacting(false), 550);
        }}
        soundOn={soundOn}
      />
      <div className="egg-mission-bird">
        <CelebrationAnimal kind="parrot" pose={reacting ? 'jump' : 'wave'} size={76} />
      </div>
    </div>
  );
};
