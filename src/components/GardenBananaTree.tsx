import { useState } from 'react';
import { CollectQuest } from './CollectQuest';
import { BananaIcon, BasketIcon } from './FruitIcons';
import './GardenBananaTree.css';

const BATCH_SIZE = 3;

interface GardenBananaTreeProps {
  soundOn: boolean;
  onEarnSeed: () => void;
}

/** An ambient, never-ending collection toy — no target to fail, no round
 * counter. Finishing a small batch quietly earns a seed and a fresh batch
 * grows, so there's always something to do here without it ever "ending". */
export const GardenBananaTree = ({ soundOn, onEarnSeed }: GardenBananaTreeProps) => {
  const [batch, setBatch] = useState(0);

  return (
    <div className="garden-banana-tree">
      <p className="garden-banana-tree-label">🌴 Tap or drag bananas into the basket!</p>
      <CollectQuest
        key={batch}
        target={BATCH_SIZE}
        totalItems={BATCH_SIZE}
        itemAriaLabel="banana"
        renderItem={() => <BananaIcon />}
        containerAriaLabel="basket"
        renderContainer={(filled) => <BasketIcon filled={filled} target={BATCH_SIZE} />}
        onComplete={() => {
          onEarnSeed();
          setTimeout(() => setBatch((b) => b + 1), 700);
        }}
        soundOn={soundOn}
      />
    </div>
  );
};
