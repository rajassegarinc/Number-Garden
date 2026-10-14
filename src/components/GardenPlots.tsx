import { useRef, useState } from 'react';
import { getDecoration } from '../data/decorations';
import { playCollectBlip, playPlaceChime } from '../utils/sfx';
import type { DecorationId, GardenPlotState } from '../types';
import './GardenPlots.css';

const STAGE_EMOJI: Record<'seed' | 'sprout' | 'bloom', string> = {
  seed: '🌱',
  sprout: '🌿',
  bloom: '🌸',
};

interface GardenPlotsProps {
  plots: GardenPlotState[];
  seeds: number;
  heldDecoration: DecorationId | null;
  soundOn: boolean;
  onPlant: (index: number) => void;
  onWater: (index: number) => void;
  onPlaceDecoration: (index: number) => void;
  onClearPlot: (index: number) => void;
  onNeedSeeds: () => void;
}

export const GardenPlots = ({
  plots,
  seeds,
  heldDecoration,
  soundOn,
  onPlant,
  onWater,
  onPlaceDecoration,
  onClearPlot,
  onNeedSeeds,
}: GardenPlotsProps) => {
  const [poppedIndex, setPoppedIndex] = useState<number | null>(null);
  const popTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pop = (index: number) => {
    setPoppedIndex(index);
    if (popTimerRef.current) clearTimeout(popTimerRef.current);
    popTimerRef.current = setTimeout(() => setPoppedIndex(null), 320);
  };

  const handleTap = (index: number) => {
    const plot = plots[index];

    if (heldDecoration) {
      if (plot.kind === 'empty') {
        if (soundOn) playPlaceChime();
        onPlaceDecoration(index);
        pop(index);
      }
      return;
    }

    if (plot.kind === 'empty') {
      if (seeds <= 0) {
        onNeedSeeds();
        return;
      }
      if (soundOn) playCollectBlip();
      onPlant(index);
      pop(index);
      return;
    }

    if (plot.kind === 'plant') {
      if (plot.stage === 'bloom') {
        pop(index);
        return;
      }
      if (soundOn) playPlaceChime();
      onWater(index);
      pop(index);
      return;
    }

    if (plot.kind === 'decoration') {
      onClearPlot(index);
      pop(index);
    }
  };

  return (
    <div className="garden-plots" role="group" aria-label="Your garden">
      {plots.map((plot, index) => {
        const isPopped = poppedIndex === index;
        let content: string;
        let label: string;

        if (plot.kind === 'empty') {
          content = heldDecoration ? '✨' : '➕';
          label = heldDecoration ? 'Empty spot — tap to place your decoration' : 'Empty garden spot — tap to plant a seed';
        } else if (plot.kind === 'plant') {
          content = STAGE_EMOJI[plot.stage];
          label =
            plot.stage === 'bloom'
              ? 'A flower in full bloom'
              : `A growing plant — tap to water it (${plot.stage})`;
        } else {
          const deco = getDecoration(plot.id);
          content = deco.emoji;
          label = `${deco.label} — tap to pick it back up`;
        }

        return (
          <button
            key={index}
            type="button"
            className={`garden-plot ${isPopped ? 'garden-plot--pop' : ''} ${plot.kind === 'empty' && heldDecoration ? 'garden-plot--placeable' : ''}`}
            onClick={() => handleTap(index)}
            aria-label={label}
          >
            <span className="garden-plot-soil" aria-hidden="true" />
            <span className="garden-plot-content" aria-hidden="true">
              {content}
            </span>
          </button>
        );
      })}
    </div>
  );
};
