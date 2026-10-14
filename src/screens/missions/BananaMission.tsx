import { useEffect, useMemo, useRef, useState } from 'react';
import { CollectQuest } from '../../components/CollectQuest';
import { MissionIntro } from '../../components/MissionIntro';
import { MissionCelebration } from '../../components/MissionCelebration';
import { CelebrationAnimal } from '../../components/CelebrationAnimal';
import { GameHeader } from '../../components/GameHeader';
import { BananaIcon, BasketIcon } from '../../components/FruitIcons';
import { randomInt } from '../../data/questionGenerators';
import { useSpeech } from '../../hooks/useSpeech';
import type { MissionId, NumberSettings } from '../../types';
import './BananaMission.css';

interface BananaMissionProps {
  settings: NumberSettings;
  soundOn: boolean;
  childName: string | null;
  onExit: () => void;
  recordMissionResult: (missionId: MissionId, starsEarned: number) => void;
}

// Three short rounds with gradually larger quantities — small numbers
// first, per "prioritize counting ... small quantities before increasing
// complexity". Clamped to the parent-configured max number for safety,
// though that ceiling is always >= 5.
const ROUND_TARGETS = [2, 3, 4];

export const BananaMission = ({ settings, soundOn, childName, onExit, recordMissionResult }: BananaMissionProps) => {
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

  const prompt = `Let's collect ${target} banana${target === 1 ? '' : 's'} for the monkey!`;

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
    speak('Great counting!');
    if (roundIndex + 1 >= ROUND_TARGETS.length) {
      const stars = hintsRef.current === 0 ? 3 : hintsRef.current <= 2 ? 2 : 1;
      setStarsEarned(stars);
      recordMissionResult('banana', stars);
      setStage('celebrate');
    } else {
      setRoundIndex((r) => r + 1);
    }
  };

  if (stage === 'intro') {
    return (
      <MissionIntro
        guide="monkey"
        title="Monkey's Bananas"
        message="The monkey is hungry! Tap or drag bananas into the basket to help."
        onStart={startMission}
        onBack={onExit}
      />
    );
  }

  if (stage === 'celebrate') {
    return (
      <MissionCelebration
        guide="monkey"
        message="You helped the monkey collect all the bananas!"
        starsEarned={starsEarned}
        onPlayAgain={startMission}
        onBackToMap={onExit}
      />
    );
  }

  return (
    <div className="banana-mission">
      <GameHeader
        title="Monkey's Bananas"
        current={roundIndex + 1}
        total={ROUND_TARGETS.length}
        onBack={onExit}
        onHearPrompt={() => speak(prompt)}
        speechSupported={supported}
        childName={childName}
      />
      <p className="banana-mission-prompt">{prompt}</p>
      <CollectQuest
        key={`${roundIndex}-${attempt}`}
        target={target}
        totalItems={totalItems}
        itemAriaLabel="banana"
        renderItem={() => <BananaIcon />}
        containerAriaLabel="basket"
        renderContainer={(filled) => <BasketIcon filled={filled} target={target} />}
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
      <div className="banana-mission-monkey">
        <CelebrationAnimal kind="monkey" pose={reacting ? 'jump' : 'wave'} size={76} />
      </div>
    </div>
  );
};
