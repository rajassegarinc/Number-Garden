import { useEffect, useState } from 'react';
import { Scenery } from './components/Scenery';
import { BottomNavigation } from './components/BottomNavigation';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { MatchingRound } from './screens/MatchingRound';
import { OrderingGame } from './screens/OrderingGame';
import { FlowerLine } from './screens/FlowerLine';
import { CaterpillarTrail } from './screens/CaterpillarTrail';
import { NumberLineAdventure } from './screens/NumberLineAdventure';
import { SuccessScreen } from './screens/SuccessScreen';
import { ParentDashboard } from './screens/ParentDashboard';
import { ParentSettings } from './screens/ParentSettings';
import { AdventureMap } from './screens/AdventureMap';
import { AdventuresScreen } from './screens/adventures/AdventuresScreen';
import { BananaMission } from './screens/missions/BananaMission';
import { RiverMission } from './screens/missions/RiverMission';
import { EggMission } from './screens/missions/EggMission';
import { GardenHub } from './screens/GardenHub';
import { MarketMission } from './screens/MarketMission';
import { LearningPaths } from './screens/LearningPaths';
import { PathGame } from './screens/PathGame';
import { useProgress } from './hooks/useProgress';
import { getActivity, getEffectiveLevelCount } from './data/activities';
import { setFxSound } from './motion/fx';
import type { ActivityId, LevelResult, MissionId, Screen } from './types';
import './App.css';

function App() {
  const {
    progress,
    recordLevelResult,
    recordMissionResult,
    addSeeds,
    plantSeed,
    waterPlot,
    placeDecoration,
    clearPlot,
    toggleSound,
    resetProgress,
    setMaxNumber,
    setMaxAdditionTotal,
    setWordMatchMaxNumber,
    setChildName,
  } = useProgress();
  const [screen, setScreen] = useState<Screen>('home');
  const [activeActivity, setActiveActivity] = useState<ActivityId | null>(null);
  const [activeMission, setActiveMission] = useState<MissionId | null>(null);
  const [lastResult, setLastResult] = useState<LevelResult | null>(null);

  // Shared tap/answer sounds follow the same mute button as everything else.
  useEffect(() => {
    setFxSound(progress.soundOn);
  }, [progress.soundOn]);

  const goHome = () => {
    setScreen('home');
    setActiveActivity(null);
    setActiveMission(null);
    setLastResult(null);
  };

  const goToAdventureMap = () => {
    setScreen('adventure');
    setActiveMission(null);
  };

  const goToGarden = () => {
    setScreen('garden');
    setActiveMission(null);
  };

  const goToAdventures = () => {
    setScreen('adventures');
    setActiveMission(null);
  };

  const goToPaths = () => {
    setScreen('paths');
    setActiveActivity(null);
    setLastResult(null);
  };

  const handleSelectActivity = (id: ActivityId) => {
    setActiveActivity(id);
    setScreen('game');
  };

  const handleSelectMission = (id: MissionId) => {
    setActiveMission(id);
    setScreen('mission');
  };

  const handleLevelComplete = (result: LevelResult) => {
    recordLevelResult(result);
    setLastResult(result);
    setScreen('success');
  };

  const handleSuccessNext = () => {
    if (lastResult?.leveledUp && activeActivity) {
      setScreen('game');
    } else {
      exitActivity();
    }
  };

  const settings = {
    maxNumber: progress.maxNumber,
    maxAdditionTotal: progress.maxAdditionTotal,
    wordMatchMaxNumber: progress.wordMatchMaxNumber,
  };
  const activeMeta = activeActivity ? getActivity(activeActivity) : undefined;
  // Learning-path games return to the Learning Paths map rather than home.
  const exitActivity = activeMeta?.group === 'path' ? goToPaths : goHome;
  const activeLevelCount = activeMeta ? getEffectiveLevelCount(activeMeta.id, activeMeta.levelCount, settings) : 1;
  const activeLevel = activeActivity
    ? Math.min(progress.activities[activeActivity].level, activeLevelCount)
    : 1;

  if (!progress.childName) {
    return (
      <div className="app-shell">
        <Scenery />
        <main className="app-content">
          <WelcomeScreen onSubmit={setChildName} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Scenery />
      <main className={`app-content ${screen !== 'game' && screen !== 'mission' && screen !== 'market' && screen !== 'adventures' ? 'app-content--with-nav' : ''}`}>
        {/* Keyed so every screen change fades in (see motion/motion.css). */}
        <div className="screen-enter" key={`${screen}-${activeActivity ?? ''}-${activeMission ?? ''}`}>
        {screen === 'home' && (
          <HomeScreen
            progress={progress}
            onSelectActivity={handleSelectActivity}
            onOpenSettings={() => setScreen('settings')}
            onOpenAdventure={goToAdventureMap}
            onOpenGarden={goToGarden}
            onOpenWorlds={goToAdventures}
            onOpenPaths={goToPaths}
          />
        )}

        {screen === 'paths' && (
          <LearningPaths progress={progress} onSelectActivity={handleSelectActivity} onBack={goHome} />
        )}

        {screen === 'game' && activeActivity && activeMeta?.mode === 'path' && (
          <PathGame
            key={`${activeActivity}-${activeLevel}-${lastResult?.correct ?? 'start'}`}
            activityId={activeActivity}
            level={activeLevel}
            soundOn={progress.soundOn}
            childName={progress.childName}
            onExit={goToPaths}
            onLevelComplete={handleLevelComplete}
          />
        )}

        {screen === 'adventures' && <AdventuresScreen onBack={goHome} />}

        {screen === 'adventure' && (
          <AdventureMap progress={progress} onSelectMission={handleSelectMission} onBack={goHome} />
        )}

        {screen === 'garden' && (
          <GardenHub
            seeds={progress.garden.seeds}
            plots={progress.garden.plots}
            totalStars={progress.totalStars}
            soundOn={progress.soundOn}
            onBack={goHome}
            onOpenMarket={() => setScreen('market')}
            addSeeds={addSeeds}
            plantSeed={plantSeed}
            waterPlot={waterPlot}
            placeDecoration={placeDecoration}
            clearPlot={clearPlot}
          />
        )}

        {screen === 'market' && (
          <MarketMission
            settings={settings}
            soundOn={progress.soundOn}
            childName={progress.childName}
            onExit={goToGarden}
            onComplete={() => addSeeds(1)}
          />
        )}

        {screen === 'mission' && activeMission === 'banana' && (
          <BananaMission
            settings={settings}
            soundOn={progress.soundOn}
            childName={progress.childName}
            onExit={goToAdventureMap}
            recordMissionResult={recordMissionResult}
          />
        )}

        {screen === 'mission' && activeMission === 'eggs' && (
          <EggMission
            settings={settings}
            soundOn={progress.soundOn}
            childName={progress.childName}
            onExit={goToAdventureMap}
            recordMissionResult={recordMissionResult}
          />
        )}

        {screen === 'mission' && activeMission === 'river' && (
          <RiverMission
            level={Math.min(
              progress.activities['number-line'].level,
              getEffectiveLevelCount('number-line', getActivity('number-line')?.levelCount ?? 10, settings),
            )}
            settings={settings}
            soundOn={progress.soundOn}
            childName={progress.childName}
            onExit={goToAdventureMap}
            recordLevelResult={recordLevelResult}
            recordMissionResult={recordMissionResult}
          />
        )}

        {screen === 'game' && activeActivity && activeMeta?.mode === 'match' && (
          <MatchingRound
            key={`${activeActivity}-${activeLevel}-${lastResult?.correct ?? 'start'}`}
            activityId={activeActivity}
            level={activeLevel}
            soundOn={progress.soundOn}
            settings={settings}
            childName={progress.childName}
            onExit={goHome}
            onLevelComplete={handleLevelComplete}
          />
        )}

        {screen === 'game' && activeActivity && activeMeta?.mode === 'order' && (
          <OrderingGame
            key={`${activeActivity}-${activeLevel}-${lastResult?.correct ?? 'start'}`}
            activityId={activeActivity}
            level={activeLevel}
            soundOn={progress.soundOn}
            settings={settings}
            childName={progress.childName}
            onExit={goHome}
            onLevelComplete={handleLevelComplete}
          />
        )}

        {screen === 'game' && activeActivity && activeMeta?.mode === 'flowerline' && (
          <FlowerLine
            key={`${activeActivity}-${activeLevel}-${lastResult?.correct ?? 'start'}`}
            activityId={activeActivity}
            level={activeLevel}
            soundOn={progress.soundOn}
            settings={settings}
            childName={progress.childName}
            onExit={goHome}
            onLevelComplete={handleLevelComplete}
          />
        )}

        {screen === 'game' && activeActivity && activeMeta?.mode === 'caterpillar' && (
          <CaterpillarTrail
            key={`${activeActivity}-${activeLevel}-${lastResult?.correct ?? 'start'}`}
            activityId={activeActivity}
            level={activeLevel}
            soundOn={progress.soundOn}
            settings={settings}
            childName={progress.childName}
            onExit={goHome}
            onLevelComplete={handleLevelComplete}
          />
        )}

        {screen === 'game' && activeActivity && activeMeta?.mode === 'numberline' && (
          <NumberLineAdventure
            key={`${activeActivity}-${activeLevel}-${lastResult?.correct ?? 'start'}`}
            activityId={activeActivity}
            level={activeLevel}
            soundOn={progress.soundOn}
            settings={settings}
            childName={progress.childName}
            onExit={goHome}
            onLevelComplete={handleLevelComplete}
          />
        )}

        {screen === 'game' && activeActivity && activeMeta?.mode === 'choice' && (
          <GameScreen
            key={`${activeActivity}-${activeLevel}-${lastResult?.correct ?? 'start'}`}
            activityId={activeActivity}
            level={activeLevel}
            soundOn={progress.soundOn}
            settings={settings}
            childName={progress.childName}
            onExit={goHome}
            onLevelComplete={handleLevelComplete}
          />
        )}

        {screen === 'success' && lastResult && (
          <SuccessScreen
            result={lastResult}
            childName={progress.childName}
            soundOn={progress.soundOn}
            onNext={handleSuccessNext}
            onHome={exitActivity}
          />
        )}

        {screen === 'parent' && (
          <ParentDashboard progress={progress} onReset={resetProgress} onBack={goHome} />
        )}

        {screen === 'settings' && (
          <ParentSettings
            childName={progress.childName}
            maxNumber={progress.maxNumber}
            maxAdditionTotal={progress.maxAdditionTotal}
            wordMatchMaxNumber={progress.wordMatchMaxNumber}
            onBack={goHome}
            onSetChildName={setChildName}
            onSetMaxNumber={setMaxNumber}
            onSetMaxAdditionTotal={setMaxAdditionTotal}
            onSetWordMatchMaxNumber={setWordMatchMaxNumber}
          />
        )}
        </div>
      </main>

      {screen !== 'game' && screen !== 'mission' && screen !== 'market' && screen !== 'adventures' && (
        <div className="app-nav">
          <BottomNavigation
            screen={screen}
            soundOn={progress.soundOn}
            onHome={goHome}
            onProgress={() => setScreen('parent')}
            onToggleSound={toggleSound}
          />
        </div>
      )}
    </div>
  );
}

export default App;
