import type { ActivityId, ActivityMeta, NumberSettings } from '../types';

// Colors cycle through the 5 pastel tokens so no two adjacent cards match.
export const ACTIVITIES: ActivityMeta[] = [
  {
    id: 'number-recognition',
    title: 'Listen & Select',
    shortTitle: 'Listen',
    description: 'Hear a number and tap the matching numeral',
    color: 'blue',
    emoji: '🔎',
    mode: 'choice',
    levelCount: 10,
    questionsPerLevel: 6,
  },
  {
    id: 'word-match',
    title: 'Match Number Words',
    shortTitle: 'Match',
    description: 'Drag or tap to match words with numerals',
    color: 'purple',
    emoji: '🔤',
    mode: 'match',
    levelCount: 10,
    questionsPerLevel: 2,
    pairsPerRound: 5,
  },
  {
    id: 'before-after',
    title: 'Before & After',
    shortTitle: 'Before/After',
    description: 'Find the number that comes before or after',
    color: 'pink',
    emoji: '↔️',
    mode: 'choice',
    levelCount: 10,
    questionsPerLevel: 6,
  },
  {
    id: 'missing-number',
    title: 'Missing Number',
    shortTitle: 'Missing',
    description: 'Find the missing number in the sequence',
    color: 'yellow',
    emoji: '🧩',
    mode: 'choice',
    levelCount: 10,
    questionsPerLevel: 6,
  },
  {
    id: 'between-numbers',
    title: 'Between Numbers',
    shortTitle: 'Between',
    description: 'Find the number that fits in between',
    color: 'green',
    emoji: '🔀',
    mode: 'choice',
    levelCount: 10,
    questionsPerLevel: 6,
  },
  {
    id: 'count-objects',
    title: 'Count the Garden',
    shortTitle: 'Count',
    description: 'Count the flowers, bugs and stars',
    color: 'blue',
    emoji: '🌼',
    mode: 'choice',
    levelCount: 10,
    questionsPerLevel: 6,
  },
  {
    id: 'picture-addition',
    title: 'Picture Addition',
    shortTitle: 'Add',
    description: 'Count the pictures and add them up',
    color: 'purple',
    emoji: '➕',
    mode: 'choice',
    levelCount: 4,
    // Level 1 (totals 2-5) only has 4 possible distinct sums — capping
    // questions at 4 means no level ever forces a repeated total.
    questionsPerLevel: 4,
  },
  {
    id: 'number-ordering',
    title: 'Put Them in Order',
    shortTitle: 'Order',
    description: 'Tap the numbers from smallest to largest',
    color: 'pink',
    emoji: '📶',
    mode: 'order',
    levelCount: 10,
    questionsPerLevel: 5,
    orderSize: 4,
  },
  {
    id: 'number-line',
    title: 'Number-Line Adventure',
    shortTitle: 'Number Line',
    description: 'Hop along the stepping stones',
    color: 'purple',
    emoji: '🐸',
    mode: 'numberline',
    levelCount: 10,
    questionsPerLevel: 6,
  },
  {
    id: 'mixed-challenge',
    title: 'Mixed Challenge',
    shortTitle: 'Mixed',
    description: 'A bit of everything, lots of numbers',
    color: 'yellow',
    emoji: '🎉',
    mode: 'choice',
    levelCount: 1,
    questionsPerLevel: 8,
  },
];

export const getActivity = (id: string): ActivityMeta | undefined =>
  ACTIVITIES.find((activity) => activity.id === id);

// Decade progression bands, extended to 1-100 so the configurable max number
// (up to 100) always has real bands to grow into: 1-10, 11-20, ... 91-100.
export const LEVEL_BANDS: Array<[number, number]> = Array.from({ length: 10 }, (_, i) => [
  i * 10 + 1,
  i * 10 + 10,
]);

export const getBandIndex = (level: number): number =>
  Math.min(Math.max(level - 1, 0), LEVEL_BANDS.length - 1);

// A parent can cap how high numbers go while the app is running (Parent
// Settings), so every number-range helper below takes these limits and
// defaults to the full 1-100 / totals-to-10 range when omitted.
export const MAX_NUMBER_MIN = 5;
export const MAX_NUMBER_MAX = 100;
export const MAX_NUMBER_STEP = 5;
export const ADDITION_TOTAL_OPTIONS = [5, 10, 20, 50] as const;
export const DEFAULT_SETTINGS: NumberSettings = { maxNumber: 50, maxAdditionTotal: 10, wordMatchMaxNumber: 50 };

/** The configured number ceiling that applies to this activity: word-match
 * has its own independent cap, everything else (other than addition, which
 * uses totals instead of a plain ceiling) shares the general maxNumber. */
const numberCeilingFor = (activityId: ActivityId, settings: NumberSettings): number =>
  activityId === 'word-match' ? settings.wordMatchMaxNumber : settings.maxNumber;

/** How many levels are actually reachable for this activity under the configured settings. */
export const getEffectiveLevelCount = (
  activityId: ActivityId,
  levelCount: number,
  settings: NumberSettings = DEFAULT_SETTINGS,
): number => {
  if (activityId === 'mixed-challenge') return 1;
  if (activityId === 'picture-addition') {
    const reachable = ADDITION_LEVEL_MAX.filter((sum) => sum <= settings.maxAdditionTotal).length;
    return Math.min(levelCount, Math.max(1, reachable));
  }
  const ceiling = numberCeilingFor(activityId, settings);
  const reachable = LEVEL_BANDS.filter(([bandMin]) => bandMin <= ceiling).length;
  return Math.min(levelCount, Math.max(1, reachable));
};

// Picture Addition doesn't use the number bands above — it progresses by
// addition total instead: up to 5, then 10, then 20, then 50.
export const ADDITION_LEVEL_MAX = [5, 10, 20, 50];

export const getAdditionMaxSum = (level: number): number => {
  const index = Math.min(Math.max(level - 1, 0), ADDITION_LEVEL_MAX.length - 1);
  return ADDITION_LEVEL_MAX[index];
};

export const getBandLabel = (
  activityId: ActivityId,
  level: number,
  settings: NumberSettings = DEFAULT_SETTINGS,
): string => {
  if (activityId === 'mixed-challenge') return `Numbers 1-${settings.maxNumber}`;
  if (activityId === 'picture-addition') {
    return `Totals up to ${Math.min(getAdditionMaxSum(level), settings.maxAdditionTotal)}`;
  }
  const [min, max] = LEVEL_BANDS[getBandIndex(level)];
  return `Numbers ${min}-${Math.min(max, numberCeilingFor(activityId, settings))}`;
};

/** The number range a question/round should draw from for this activity + level. */
export const resolveBand = (
  activityId: ActivityId,
  level: number,
  settings: NumberSettings = DEFAULT_SETTINGS,
): { min: number; max: number } => {
  if (activityId === 'mixed-challenge') return { min: 1, max: settings.maxNumber };
  if (activityId === 'picture-addition') {
    return { min: 2, max: Math.min(getAdditionMaxSum(level), settings.maxAdditionTotal) };
  }
  const [min, max] = LEVEL_BANDS[getBandIndex(level)];
  if (activityId === 'count-objects') {
    // Counting is capped lower than the band ceiling — rendering 50+ icons on
    // a phone screen isn't practical or how counting manipulatives usually
    // work, so counting plateaus at 20 objects from level 2 onward.
    return { min: 1, max: Math.min(max, 20, settings.maxNumber) };
  }
  return { min, max: Math.min(max, numberCeilingFor(activityId, settings)) };
};

/** Real activity types mixed-challenge draws its questions from (choice-mode only). */
export const MIXED_SOURCE_ACTIVITIES: ActivityId[] = [
  'number-recognition',
  'before-after',
  'missing-number',
  'between-numbers',
  'count-objects',
  'picture-addition',
];

export const CRITTER_ORDER = ['monkey', 'tiger', 'giraffe', 'lion'] as const;
