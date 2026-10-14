import type { DecorationId } from '../types';

export interface DecorationMeta {
  id: DecorationId;
  emoji: string;
  label: string;
  /** Total stars (earned anywhere in the app) needed to unlock this. */
  starsRequired: number;
}

// A short, achievable progression — the first piece unlocks almost
// immediately (one mission or a couple of activity levels), so a child sees
// the garden start to fill in right away, not after a long grind. No
// purchases, no streaks: stars are the only currency, and they're already
// earned through ordinary play.
export const DECORATIONS: DecorationMeta[] = [
  { id: 'sunflower', emoji: '🌻', label: 'Sunflower', starsRequired: 3 },
  { id: 'butterfly', emoji: '🦋', label: 'Butterfly Friend', starsRequired: 8 },
  { id: 'kite', emoji: '🪁', label: 'Kite', starsRequired: 15 },
  { id: 'fountain', emoji: '⛲', label: 'Fountain', starsRequired: 25 },
  { id: 'tent', emoji: '🎪', label: 'Garden Tent', starsRequired: 40 },
];

export const getDecoration = (id: DecorationId): DecorationMeta =>
  DECORATIONS.find((d) => d.id === id) ?? DECORATIONS[0];

/** Decorations the child has earned so far, in catalog order — derived
 * purely from totalStars rather than stored separately, so it can never
 * drift out of sync with the star total. */
export const getUnlockedDecorations = (totalStars: number): DecorationMeta[] =>
  DECORATIONS.filter((d) => totalStars >= d.starsRequired);

export const getNextLockedDecoration = (totalStars: number): DecorationMeta | undefined =>
  DECORATIONS.find((d) => totalStars < d.starsRequired);

export const GARDEN_PLOT_COUNT = 6;
