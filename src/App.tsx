import { useState } from 'react';
import { Scenery } from './components/Scenery';
import { BottomNavigation } from './components/BottomNavigation';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { MatchingRound } from './screens/MatchingRound';
import { OrderingGame } from './screens/OrderingGame';
import { NumberLineAdventure } from './screens/NumberLineAdventure';
import { SuccessScreen } from './screens/SuccessScreen';
import { ParentDashboard } from './screens/ParentDashboard';
import { ParentSettings } from './screens/ParentSettings';
import { useProgress } from './hooks/useProgress';
import { getActivity, getEffectiveLevelCount } from './data/activities';
import type { ActivityId, LevelResult, Screen } from './types';
import './App.css';

function App() {
  const {
    progress,
    recordLevelResult,
    toggleSound,
    resetProgress,
    setMaxNumber,
    setMaxAdditionTotal,
    setWordMatchMaxNumber,
    setChildName,
  } = useProgress();
  const [screen, setScreen] = useState<Screen>('home');
  const [activeActivity, setActiveActivity] = useState<ActivityId | null>(null);
  const [lastResult, setLastResult] = useState<LevelResult | null>(null);

  const goHome = () => {
    setScreen('home');
    setActiveActivity(null);
    setLastResult(null);
  };

  const handleSelectActivity = (id: ActivityId) => {
    setActiveActivity(id);
    setScreen('game');
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
      goHome();
    }
  };

  const settings = {
    maxNumber: progress.maxNumber,
    maxAdditionTotal: progress.maxAdditionTotal,
    wordMatchMaxNumber: progress.wordMatchMaxNumber,
  };
  const activeMeta = activeActivity ? getActivity(activeActivity) : undefined;
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
      <main className={`app-content ${screen !== 'game' ? 'app-content--with-nav' : ''}`}>
        {screen === 'home' && (
          <HomeScreen
            progress={progress}
            onSelectActivity={handleSelectActivity}
            onOpenSettings={() => setScreen('settings')}
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
            onHome={goHome}
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
      </main>

      {screen !== 'game' && (
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
