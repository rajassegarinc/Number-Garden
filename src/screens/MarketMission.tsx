import { useEffect, useMemo, useState } from 'react';
import { CollectQuest } from '../components/CollectQuest';
import { MissionIntro } from '../components/MissionIntro';
import { MissionCelebration } from '../components/MissionCelebration';
import { GameHeader } from '../components/GameHeader';
import { AppleIcon, BasketIcon, OrangeIcon } from '../components/FruitIcons';
import { resolveBand } from '../data/activities';
import { randomInt, splitAddends } from '../data/questionGenerators';
import { useSpeech } from '../hooks/useSpeech';
import type { NumberSettings } from '../types';
import './MarketMission.css';

interface MarketMissionProps {
  settings: NumberSettings;
  soundOn: boolean;
  childName: string | null;
  onExit: () => void;
  onComplete: () => void;
}

/**
 * Little Market: reuses the SAME addend-split logic as the Picture
 * Addition activity (`splitAddends`) and the same band-resolution helper
 * (`resolveBand`), just acting it out physically — the child drags/taps two
 * small fruit piles into one basket instead of picking a numeral, so
 * "parts make the whole" is something they do, not just answer.
 */
export const MarketMission = ({ settings, soundOn, childName, onExit, onComplete }: MarketMissionProps) => {
  const { speak, supported } = useSpeech(soundOn);
  const [stage, setStage] = useState<'intro' | 'play' | 'celebrate'>('intro');
  const [attempt, setAttempt] = useState(0);

  const { min, max } = resolveBand('picture-addition', 1, settings);
  // Re-rolled only for a fresh attempt, not on every render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const sum = useMemo(() => randomInt(min, max), [attempt]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const [addend1, addend2] = useMemo(() => splitAddends(sum), [sum]);

  const prompt = `${addend1} apple${addend1 === 1 ? '' : 's'} plus ${addend2} orange${addend2 === 1 ? '' : 's'} — let's fill the basket!`;

  useEffect(() => {
    if (stage === 'play') speak(prompt);
    // Only re-announce when a fresh attempt starts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, attempt]);

  const startMission = () => {
    setAttempt((a) => a + 1);
    setStage('play');
  };

  const handleComplete = () => {
    speak(`${addend1} plus ${addend2} makes ${sum}! Great adding!`);
    onComplete();
    setStage('celebrate');
  };

  if (stage === 'intro') {
    return (
      <MissionIntro
        guide="monkey"
        title="Little Market"
        message="Help fill the market basket! Combine the apples and oranges to practise adding."
        onStart={startMission}
        onBack={onExit}
      />
    );
  }

  if (stage === 'celebrate') {
    return (
      <MissionCelebration
        guide="monkey"
        message={`${addend1} + ${addend2} = ${sum}! You filled the basket!`}
        starsEarned={3}
        onPlayAgain={startMission}
        onBackToMap={onExit}
      />
    );
  }

  return (
    <div className="market-mission">
      <GameHeader
        title="Little Market"
        current={1}
        total={1}
        onBack={onExit}
        onHearPrompt={() => speak(prompt)}
        speechSupported={supported}
        childName={childName}
      />
      <p className="market-mission-prompt">{prompt}</p>
      <div className="market-mission-equation" aria-hidden="true">
        {Array.from({ length: addend1 }).map((_, i) => (
          <span key={`a-${i}`}>🍎</span>
        ))}
        <span className="market-mission-equation-op">+</span>
        {Array.from({ length: addend2 }).map((_, i) => (
          <span key={`o-${i}`}>🍊</span>
        ))}
        <span className="market-mission-equation-op">= ?</span>
      </div>
      <CollectQuest
        key={attempt}
        target={sum}
        totalItems={sum}
        itemAriaLabel="fruit"
        renderItem={(index) => (index < addend1 ? <AppleIcon /> : <OrangeIcon />)}
        containerAriaLabel="basket"
        renderContainer={(filled) => <BasketIcon filled={filled} target={sum} fillColor="#ff8f6b" strokeColor="#d64545" />}
        onComplete={handleComplete}
        soundOn={soundOn}
      />
    </div>
  );
};
