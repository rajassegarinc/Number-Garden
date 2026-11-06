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
    orderDirection: 'asc',
  },
  {
    id: 'number-ordering-desc',
    title: 'Biggest to Smallest',
    shortTitle: 'Order ↓',
    description: 'Tap the numbers from largest to smallest',
    color: 'yellow',
    emoji: '📉',
    mode: 'order',
    levelCount: 10,
    questionsPerLevel: 5,
    orderSize: 4,
    orderDirection: 'desc',
  },
  {
    id: 'flower-line',
    title: 'Flower Line',
    shortTitle: 'Flower Line',
    description: 'Plant the flowers in order, smallest to largest',
    color: 'green',
    emoji: '🌷',
    mode: 'flowerline',
    levelCount: 1,
    questionsPerLevel: 10,
  },
  {
    id: 'caterpillar-trail',
    title: 'Caterpillar Number Trail',
    shortTitle: 'Caterpillar',
    description: 'Drag numbers onto the caterpillar, smallest to largest',
    color: 'pink',
    emoji: '🐛',
    mode: 'caterpillar',
    levelCount: 1,
    questionsPerLevel: 10,
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
  // Learning paths — skill-based progressions shown on the Learning Paths
  // map (in this suggested order) rather than the home activity list.
  {
    id: 'path-compare',
    title: 'Hungry Crocodile',
    shortTitle: 'Compare',
    description: 'The crocodile always eats the bigger number',
    color: 'green',
    emoji: '🐊',
    mode: 'path',
    group: 'path',
    levelCount: 3,
    questionsPerLevel: 6,
    levelLabels: ['Compare pictures', 'Numbers to 20', 'Numbers to 100'],
  },
  {
    id: 'path-bonds',
    title: 'Number Bonds Bridge',
    shortTitle: 'Bonds',
    description: 'Find the stones that make the whole',
    color: 'blue',
    emoji: '🧩',
    mode: 'path',
    group: 'path',
    levelCount: 4,
    questionsPerLevel: 6,
    levelLabels: ['Make 5', 'Make 10', 'Make 20', 'Pairs that make 10'],
  },
  {
    id: 'path-subtraction',
    title: 'Frog Pond Subtraction',
    shortTitle: 'Subtract',
    description: 'Some frogs hop away — how many are left?',
    color: 'green',
    emoji: '🐸',
    mode: 'path',
    group: 'path',
    levelCount: 4,
    questionsPerLevel: 6,
    levelLabels: ['Take away within 5', 'Take away within 10', 'Take away within 20', 'How many hopped?'],
  },
  {
    id: 'path-place-value',
    title: 'Bee Hive Place Value',
    shortTitle: 'Place Value',
    description: 'Nectar drops, honey bars and whole hives',
    color: 'yellow',
    emoji: '🐝',
    mode: 'path',
    group: 'path',
    levelCount: 4,
    questionsPerLevel: 6,
    levelLabels: ['Tens & ones to 30', 'Tens & ones to 99', 'Hundreds', 'Trading ten ones'],
  },
  {
    id: 'path-patterns',
    title: 'Flower Bed Patterns',
    shortTitle: 'Patterns',
    description: 'What comes next in the pattern?',
    color: 'pink',
    emoji: '🌈',
    mode: 'path',
    group: 'path',
    levelCount: 4,
    questionsPerLevel: 6,
    levelLabels: ['AB patterns', 'AAB & ABB patterns', 'ABC patterns', 'Growing numbers'],
  },
  {
    id: 'path-skip-counting',
    title: 'Skip-Counting Kangaroo',
    shortTitle: 'Skip Count',
    description: 'Big jumps by 10s, 5s and 2s',
    color: 'purple',
    emoji: '🦘',
    mode: 'path',
    group: 'path',
    levelCount: 4,
    questionsPerLevel: 6,
    levelLabels: ['Jumps of 10', 'Jumps of 5', 'Jumps of 2', 'Groups of jumps'],
  },
  {
    id: 'path-even-odd',
    title: 'Duckling Partners',
    shortTitle: 'Even/Odd',
    description: 'Does every duckling have a partner?',
    color: 'yellow',
    emoji: '🐥',
    mode: 'path',
    group: 'path',
    levelCount: 3,
    questionsPerLevel: 6,
    levelLabels: ['Pair the ducklings', 'Even or odd to 20', 'Spot the even number'],
  },
  {
    id: 'path-fractions',
    title: 'Picnic Fractions',
    shortTitle: 'Fractions',
    description: 'Share the picnic fairly with friends',
    color: 'pink',
    emoji: '🍕',
    mode: 'path',
    group: 'path',
    levelCount: 3,
    questionsPerLevel: 6,
    levelLabels: ['Halves, thirds & quarters', 'Fair sharing', 'Which piece is bigger?'],
  },
  {
    id: 'path-time',
    title: "Rooster's Clock",
    shortTitle: 'Time',
    description: 'Help the rooster read the clock',
    color: 'blue',
    emoji: '⏰',
    mode: 'path',
    group: 'path',
    levelCount: 4,
    questionsPerLevel: 6,
    levelLabels: ["O'clock", 'Half past', 'Quarter past & to', 'Five-minute times'],
  },
  {
    id: 'path-measure',
    title: 'Measure & Weigh',
    shortTitle: 'Measure',
    description: 'Longer, shorter, heavier, lighter',
    color: 'purple',
    emoji: '📏',
    mode: 'path',
    group: 'path',
    levelCount: 3,
    questionsPerLevel: 6,
    levelLabels: ['Longer or shorter', 'Measure with ladybugs', 'Heavier or lighter'],
  },
  {
    id: 'path-shapes',
    title: 'Shape Garden',
    shortTitle: 'Shapes',
    description: 'Name, count and find shapes',
    color: 'blue',
    emoji: '🔷',
    mode: 'path',
    group: 'path',
    levelCount: 4,
    questionsPerLevel: 6,
    levelLabels: ['Name the shape', 'Count the sides', 'Find the shapes', '3D shapes'],
  },
  {
    id: 'path-graphs',
    title: 'Garden Graph Detective',
    shortTitle: 'Graphs',
    description: 'Tally marks and picture graphs',
    color: 'green',
    emoji: '📊',
    mode: 'path',
    group: 'path',
    levelCount: 4,
    questionsPerLevel: 6,
    levelLabels: ['Tally marks', 'Which has the most?', 'Read the graph', 'How many more?'],
  },
  {
    id: 'path-butterfly',
    title: 'Butterfly Life Cycle',
    shortTitle: 'Butterfly',
    description: 'Egg, caterpillar, chrysalis, butterfly!',
    color: 'pink',
    emoji: '🦋',
    mode: 'path',
    group: 'path',
    levelCount: 4,
    questionsPerLevel: 6,
    levelLabels: ['Name the stage', 'What comes next?', 'Complete the cycle', 'Butterfly facts'],
  },
];

export const HOME_ACTIVITIES = ACTIVITIES.filter((activity) => activity.group !== 'path');
export const PATH_ACTIVITIES = ACTIVITIES.filter((activity) => activity.group === 'path');

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
  // Learning paths progress by skill, so parent number caps don't shorten them.
  if (getActivity(activityId)?.group === 'path') return levelCount;
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
  const labels = getActivity(activityId)?.levelLabels;
  if (labels) return labels[Math.min(Math.max(level - 1, 0), labels.length - 1)];
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
