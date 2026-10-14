import { useState } from 'react';
import { MonkeyFriend } from '../components/MonkeyFriend';
import { GardenBananaTree } from '../components/GardenBananaTree';
import { GardenPlots } from '../components/GardenPlots';
import { DecorationTray } from '../components/DecorationTray';
import type { DecorationId, GardenPlotState } from '../types';
import './GardenHub.css';

interface GardenHubProps {
  seeds: number;
  plots: GardenPlotState[];
  totalStars: number;
  soundOn: boolean;
  onBack: () => void;
  onOpenMarket: () => void;
  addSeeds: (count: number) => void;
  plantSeed: (index: number) => void;
  waterPlot: (index: number) => void;
  placeDecoration: (index: number, decorationId: DecorationId) => void;
  clearPlot: (index: number) => void;
}

export const GardenHub = ({
  seeds,
  plots,
  totalStars,
  soundOn,
  onBack,
  onOpenMarket,
  addSeeds,
  plantSeed,
  waterPlot,
  placeDecoration,
  clearPlot,
}: GardenHubProps) => {
  const [heldDecoration, setHeldDecoration] = useState<DecorationId | null>(null);
  const [needSeedsHint, setNeedSeedsHint] = useState(false);

  const showNeedSeedsHint = () => {
    setNeedSeedsHint(true);
    setTimeout(() => setNeedSeedsHint(false), 1800);
  };

  return (
    <div className="garden-hub">
      <div className="garden-hub-header">
        <button type="button" className="garden-hub-back" onClick={onBack} aria-label="Back to home">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="garden-hub-title">My Garden</h1>
        <span className="garden-hub-seeds" aria-label={`${seeds} seeds`}>
          🌱 {seeds}
        </span>
      </div>

      <MonkeyFriend soundOn={soundOn} />

      <section className="garden-hub-section">
        <h2 className="garden-hub-heading">Your Garden Plots</h2>
        {needSeedsHint && <p className="garden-hub-need-seeds">Collect bananas below to earn more seeds! 🌱</p>}
        <GardenPlots
          plots={plots}
          seeds={seeds}
          heldDecoration={heldDecoration}
          soundOn={soundOn}
          onPlant={plantSeed}
          onWater={waterPlot}
          onPlaceDecoration={(index) => {
            if (heldDecoration) placeDecoration(index, heldDecoration);
            setHeldDecoration(null);
          }}
          onClearPlot={clearPlot}
          onNeedSeeds={showNeedSeedsHint}
        />
      </section>

      <section className="garden-hub-section">
        <DecorationTray totalStars={totalStars} held={heldDecoration} onHold={setHeldDecoration} />
      </section>

      <section className="garden-hub-section">
        <h2 className="garden-hub-heading">Banana Tree</h2>
        <GardenBananaTree soundOn={soundOn} onEarnSeed={() => addSeeds(1)} />
      </section>

      <button type="button" className="garden-hub-market" onClick={onOpenMarket}>
        <span className="garden-hub-market-icon" aria-hidden="true">🛒</span>
        <span className="garden-hub-market-text">
          <span className="garden-hub-market-title">Little Market</span>
          <span className="garden-hub-market-sub">Help fill the baskets and practise adding!</span>
        </span>
        <span className="garden-hub-market-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="20" height="20">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </div>
  );
};
