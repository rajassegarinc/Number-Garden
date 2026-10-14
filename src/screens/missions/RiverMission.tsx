import { useState } from 'react';
import { NumberLineAdventure } from '../NumberLineAdventure';
import { MissionIntro } from '../../components/MissionIntro';
import { MissionCelebration } from '../../components/MissionCelebration';
import { RiverProgressStrip } from '../../components/RiverProgressStrip';
import { getActivity } from '../../data/activities';
import type { LevelResult, MissionId, NumberSettings } from '../../types';
import './RiverMission.css';

const TOTAL_QUESTIONS = getActivity('number-line')?.questionsPerLevel ?? 6;

interface RiverMissionProps {
  level: number;
  settings: NumberSettings;
  soundOn: boolean;
  childName: string | null;
  onExit: () => void;
  recordLevelResult: (result: LevelResult) => void;
  recordMissionResult: (missionId: MissionId, starsEarned: number) => void;
}

/**
 * Mission B: "Help the Baby Elephant Find Its Mother" — a themed shell
 * around the EXISTING Number-Line Adventure engine (reused as-is, per the
 * requirement to integrate it rather than duplicate it). The stepping
 * stones, hopping animation, missing-number and jump questions all come
 * from NumberLineAdventure; this wrapper only adds the river/elephant
 * narrative, the mission's own completion reward, and forces the elephant
 * as the guide instead of the usual random rotation.
 */
export const RiverMission = ({
  level,
  settings,
  soundOn,
  childName,
  onExit,
  recordLevelResult,
  recordMissionResult,
}: RiverMissionProps) => {
  const [stage, setStage] = useState<'intro' | 'play' | 'celebrate'>('intro');
  const [attempt, setAttempt] = useState(0);
  const [lastResult, setLastResult] = useState<LevelResult | null>(null);
  const [crossed, setCrossed] = useState(0);

  const startMission = () => {
    setAttempt((a) => a + 1);
    setCrossed(0);
    setStage('play');
  };

  const handleLevelComplete = (result: LevelResult) => {
    recordLevelResult(result);
    recordMissionResult('river', result.starsEarned);
    setLastResult(result);
    setStage('celebrate');
  };

  if (stage === 'intro') {
    return (
      <MissionIntro
        guide="elephant"
        title="Baby Elephant's River"
        message="A baby elephant is lost! Hop along the stepping stones across the river to find its mother."
        startLabel="Start Crossing!"
        onStart={startMission}
        onBack={onExit}
      />
    );
  }

  if (stage === 'celebrate' && lastResult) {
    return (
      <MissionCelebration
        guide="elephant"
        secondGuide="elephant"
        message="You helped the baby elephant find its mother!"
        starsEarned={lastResult.starsEarned}
        onPlayAgain={startMission}
        onBackToMap={onExit}
      />
    );
  }

  return (
    <div className="river-mission">
      <NumberLineAdventure
        key={attempt}
        activityId="number-line"
        level={level}
        soundOn={soundOn}
        settings={settings}
        childName={childName}
        onExit={onExit}
        onLevelComplete={handleLevelComplete}
        forcedGuide="elephant"
        topSlot={<RiverProgressStrip current={crossed} total={TOTAL_QUESTIONS} />}
        onProgress={(answered) => setCrossed(answered)}
      />
    </div>
  );
};
