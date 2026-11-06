import { DEFAULT_SETTINGS, MIXED_SOURCE_ACTIVITIES, resolveBand } from './activities';
import type { ActivityId, AnswerChoice, MatchPair, NumberSettings, Question } from '../types';
import { capitalize, numberToWord } from './numberWords';

const COUNT_ICONS = ['🌼', '🐞', '⭐', '🦋', '🍎', '🐝'];
const ADDITION_ICONS = ['❤️', '⭐', '🍎', '🌸', '🐰'];

export const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

export const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

/** Picks a number in [min, max] that isn't in `excluded`, so the same
 * question/number doesn't repeat within a session. Once the pool is
 * exhausted (small bands can't supply unlimited uniques), falls back to the
 * full range but still avoids repeating the single most-recently-used value
 * back-to-back, so repeats at least don't cluster immediately. Does NOT
 * mutate `excluded` — callers add the pick themselves. */
export const pickUnique = (min: number, max: number, excluded: Set<number>): number => {
  const pool: number[] = [];
  for (let n = min; n <= max; n += 1) {
    if (!excluded.has(n)) pool.push(n);
  }
  if (pool.length > 0) return pool[randomInt(0, pool.length - 1)];

  if (max > min && excluded.size > 0) {
    const lastUsed = Array.from(excluded).at(-1);
    const relaxedPool: number[] = [];
    for (let n = min; n <= max; n += 1) {
      if (n !== lastUsed) relaxedPool.push(n);
    }
    if (relaxedPool.length > 0) return relaxedPool[randomInt(0, relaxedPool.length - 1)];
  }
  return randomInt(min, max);
};

/** Picks `count` DISTINCT numbers in [min, max] for a single round (e.g. one
 * ordering round or one matching round), where every value must be visibly
 * unique within that round no matter how full the session-wide `excluded`
 * set already is. Prefers values not yet used anywhere this session; once
 * that's exhausted it still guarantees no duplicate within THIS batch by
 * relaxing only the session-wide preference, never the in-round uniqueness —
 * that relaxation is what previously let two identical numbers appear
 * side-by-side once a small band's session pool ran dry. */
const pickUniqueBatch = (min: number, max: number, count: number, excluded: Set<number>): number[] => {
  const usedThisBatch = new Set<number>();
  const result: number[] = [];

  for (let i = 0; i < count; i += 1) {
    let pool: number[] = [];
    for (let n = min; n <= max; n += 1) {
      if (!usedThisBatch.has(n) && !excluded.has(n)) pool.push(n);
    }
    if (pool.length === 0) {
      for (let n = min; n <= max; n += 1) {
        if (!usedThisBatch.has(n)) pool.push(n);
      }
    }
    if (pool.length === 0) {
      // The band itself has fewer numbers than `count` — truly impossible
      // to avoid a repeat; any in-range value is the best available option.
      pool = [randomInt(min, max)];
    }
    const value = pool[randomInt(0, pool.length - 1)];
    usedThisBatch.add(value);
    result.push(value);
  }

  return result;
};

/** Splits `sum` into two addends, biased toward roughly even halves so
 * neither picture group balloons to an unwieldy size at higher totals (e.g.
 * never 1 + 19 for a sum of 20) — keeps both groups legible on a phone
 * screen. Shared by Picture Addition and Little Market so both teach the
 * same "parts make the whole" split rather than two different ones. */
export const splitAddends = (sum: number): [number, number] => {
  const half = Math.floor(sum / 2);
  const spread = Math.min(2, Math.max(0, half - 1));
  const addLow = Math.max(1, half - spread);
  const addHigh = Math.min(sum - 1, half + spread);
  const addend1 = randomInt(addLow, addHigh);
  const addend2 = sum - addend1;
  return [addend1, addend2];
};

const pickDistractors = (
  correct: number,
  min: number,
  max: number,
  count: number,
): number[] => {
  const distractors = new Set<number>();
  let guard = 0;
  while (distractors.size < count && guard < 200) {
    guard += 1;
    const spread = randomInt(1, Math.max(3, Math.ceil((max - min) / 6)));
    const candidate = Math.random() < 0.5 ? correct - spread : correct + spread;
    if (candidate >= min && candidate <= max && candidate !== correct) {
      distractors.add(candidate);
    }
  }
  // Fallback: fill with any valid number in range if spread search was too narrow.
  while (distractors.size < count) {
    const candidate = randomInt(min, max);
    if (candidate !== correct) distractors.add(candidate);
  }
  return Array.from(distractors);
};

export const buildNumeralChoices = (
  correct: number,
  min: number,
  max: number,
  total = 4,
): AnswerChoice[] => {
  const distractors = pickDistractors(correct, min, max, total - 1);
  const values = shuffle([correct, ...distractors]);
  return values.map((value, index) => ({
    id: `choice-${index}-${value}`,
    label: String(value),
    value,
    isCorrect: value === correct,
  }));
};

const generateByType = (
  activityId: ActivityId,
  level: number,
  excludedStimuli: Set<number>,
  settings: NumberSettings,
): Question => {
  const { min, max } = resolveBand(activityId, level, settings);

  switch (activityId) {
    case 'number-recognition': {
      const target = pickUnique(min, max, excludedStimuli);
      return {
        id: `${activityId}-${target}-${Date.now()}-${Math.random()}`,
        prompt: 'Tap the number you hear',
        spokenPrompt: String(target),
        displayWord: capitalize(numberToWord(target)),
        choices: buildNumeralChoices(target, min, max),
      };
    }
    case 'before-after': {
      const askBefore = Math.random() < 0.5;
      if (askBefore) {
        const safeMin = Math.max(min, 2);
        const target = pickUnique(safeMin, max, excludedStimuli);
        const correct = target - 1;
        return {
          id: `${activityId}-before-${target}-${Date.now()}-${Math.random()}`,
          prompt: `What comes before ${target}?`,
          spokenPrompt: `What comes before ${target}?`,
          displayNumber: target,
          choices: buildNumeralChoices(correct, Math.max(min - 1, 1), max),
        };
      }
      const safeMax = Math.max(min, max - 1);
      const target = pickUnique(min, safeMax, excludedStimuli);
      const correct = target + 1;
      return {
        id: `${activityId}-after-${target}-${Date.now()}-${Math.random()}`,
        prompt: `What comes after ${target}?`,
        spokenPrompt: `What comes after ${target}?`,
        displayNumber: target,
        choices: buildNumeralChoices(correct, min, Math.min(max + 1, settings.maxNumber)),
      };
    }
    case 'missing-number': {
      // A run of 5 consecutive numbers, clamped to stay inside 1-50, with
      // one position blanked out for the child to fill in.
      const seqLen = 5;
      const latestStart = Math.max(min, max - seqLen + 1);
      const startMin = Math.min(min, latestStart);
      const start = pickUnique(startMin, latestStart, excludedStimuli);
      const sequence = Array.from({ length: seqLen }, (_, i) => start + i);
      const blankIndex = randomInt(0, seqLen - 1);
      const correct = sequence[blankIndex];
      const seqMin = Math.max(1, start - 2);
      const seqMax = Math.min(settings.maxNumber, start + seqLen + 1);
      return {
        id: `${activityId}-${start}-${Date.now()}-${Math.random()}`,
        prompt: 'Which number is missing?',
        spokenPrompt: `What number is missing from the sequence?`,
        sequence,
        blankIndex,
        choices: buildNumeralChoices(correct, seqMin, seqMax),
      };
    }
    case 'between-numbers': {
      // A short (3) or long (5) run of consecutive numbers with the blank
      // always in an interior position, so it's flanked by visible numbers
      // on both sides — e.g. "1, __, 3" or "1, 2, __, 4, 5".
      const seqLen = Math.random() < 0.5 ? 3 : 5;
      const latestStart = Math.max(min, max - seqLen + 1);
      const startMin = Math.min(min, latestStart);
      const start = pickUnique(startMin, latestStart, excludedStimuli);
      const sequence = Array.from({ length: seqLen }, (_, i) => start + i);
      const blankIndex = randomInt(1, seqLen - 2);
      const correct = sequence[blankIndex];
      const seqMin = Math.max(1, start - 2);
      const seqMax = Math.min(settings.maxNumber, start + seqLen + 1);
      return {
        id: `${activityId}-${start}-${Date.now()}-${Math.random()}`,
        prompt: 'Which number fits in between?',
        spokenPrompt: 'What number fits in between the others?',
        sequence,
        blankIndex,
        choices: buildNumeralChoices(correct, seqMin, seqMax),
      };
    }
    case 'count-objects': {
      const target = pickUnique(min, max, excludedStimuli);
      const icon = COUNT_ICONS[randomInt(0, COUNT_ICONS.length - 1)];
      return {
        id: `${activityId}-${target}-${Date.now()}-${Math.random()}`,
        prompt: 'How many do you count?',
        spokenPrompt: `How many ${icon} do you count?`,
        displayNumber: target,
        countIcon: icon,
        choices: buildNumeralChoices(target, min, max),
      };
    }
    case 'picture-addition': {
      const sum = pickUnique(min, max, excludedStimuli);
      const [addend1, addend2] = splitAddends(sum);
      const icon = ADDITION_ICONS[randomInt(0, ADDITION_ICONS.length - 1)];
      return {
        id: `${activityId}-${sum}-${Date.now()}-${Math.random()}`,
        prompt: 'Count the pictures. What is the total?',
        spokenPrompt: `${addend1} plus ${addend2}. What is the total?`,
        addend1,
        addend2,
        additionIcon: icon,
        choices: buildNumeralChoices(sum, min, max),
      };
    }
    case 'mixed-challenge': {
      const subType = MIXED_SOURCE_ACTIVITIES[randomInt(0, MIXED_SOURCE_ACTIVITIES.length - 1)];
      return generateByType(subType, level, excludedStimuli, settings);
    }
    default:
      throw new Error(`generateByType does not support activity: ${activityId}`);
  }
};

export const generateQuestion = (
  activityId: ActivityId,
  level: number,
  excludedStimuli: Set<number>,
  settings: NumberSettings = DEFAULT_SETTINGS,
): Question => generateByType(activityId, level, excludedStimuli, settings);

/** The number that defines this question's identity, for repeat tracking. */
export const getQuestionStimulus = (question: Question): number => {
  if (question.sequence && question.blankIndex !== undefined) {
    return question.sequence[0];
  }
  if (question.displayNumber !== undefined && question.countIcon === undefined) {
    return question.displayNumber;
  }
  return question.choices.find((c) => c.isCorrect)?.value ?? -1;
};

export const validateAnswer = (question: Question, choiceId: string): boolean => {
  const choice = question.choices.find((c) => c.id === choiceId);
  return Boolean(choice?.isCorrect);
};

/** Generates `count` unique word/numeral pairs for a drag-and-drop matching round. */
export const generateMatchPairs = (
  activityId: ActivityId,
  level: number,
  excludedStimuli: Set<number>,
  count: number,
  settings: NumberSettings = DEFAULT_SETTINGS,
): MatchPair[] => {
  const { min, max } = resolveBand(activityId, level, settings);
  const values = pickUniqueBatch(min, max, count, excludedStimuli);
  values.forEach((value) => excludedStimuli.add(value));
  return values.map((value) => ({
    id: `pair-${value}-${Date.now()}-${Math.random()}`,
    value,
    word: capitalize(numberToWord(value)),
  }));
};

/** Generates `count` unique numbers (shuffled) for an ordering round. */
export const generateOrderingSet = (
  activityId: ActivityId,
  level: number,
  excludedStimuli: Set<number>,
  count: number,
  settings: NumberSettings = DEFAULT_SETTINGS,
): number[] => {
  const { min, max } = resolveBand(activityId, level, settings);
  const values = pickUniqueBatch(min, max, count, excludedStimuli);
  values.forEach((value) => excludedStimuli.add(value));
  return shuffle(values);
};
