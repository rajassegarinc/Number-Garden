import { DEFAULT_SETTINGS, resolveBand } from './activities';
import { pickUnique, randomInt } from './questionGenerators';
import type { NumberSettings } from '../types';

export type NumberLineQuestionType = 'next' | 'before' | 'missing' | 'jump';

export interface NumberLineQuestion {
  id: string;
  type: NumberLineQuestionType;
  prompt: string;
  spokenPrompt: string;
  /** The visible stepping-stone range — always exactly the current level's
   * band (≤10 stones), so a large configured maxNumber never floods the
   * screen with stones; it just means later levels. */
  windowMin: number;
  windowMax: number;
  /** Stones to visually mark as the question's context clues. */
  given: number[];
  /** Jump mode only: the stone the animal is standing on before jumping. */
  startValue?: number;
  jumpSize?: number;
  jumpDirection?: 'forward' | 'backward';
  /** The stone the child must tap. */
  correct: number;
}

// Jump questions are only offered from level 2 onward — "locked until the
// simpler activities [next/before/missing] are introduced" per the spec.
const JUMP_UNLOCK_LEVEL = 2;

export const generateNumberLineQuestion = (
  level: number,
  excludedStimuli: Set<number>,
  settings: NumberSettings = DEFAULT_SETTINGS,
): NumberLineQuestion => {
  const { min, max } = resolveBand('number-line', level, settings);
  const pool: NumberLineQuestionType[] =
    level >= JUMP_UNLOCK_LEVEL ? ['next', 'before', 'missing', 'jump'] : ['next', 'before', 'missing'];
  const type = pool[randomInt(0, pool.length - 1)];
  const idBase = `number-line-${type}-${Date.now()}-${Math.random()}`;

  if (type === 'next') {
    const target = pickUnique(min, Math.max(min, max - 1), excludedStimuli);
    const correct = target + 1;
    return {
      id: idBase,
      type,
      prompt: `What number comes after ${target}?`,
      spokenPrompt: `What number comes after ${target}?`,
      windowMin: min,
      windowMax: max,
      given: [target],
      correct,
    };
  }

  if (type === 'before') {
    const target = pickUnique(Math.min(max, min + 1), max, excludedStimuli);
    const correct = target - 1;
    return {
      id: idBase,
      type,
      prompt: `What number comes before ${target}?`,
      spokenPrompt: `What number comes before ${target}?`,
      windowMin: min,
      windowMax: max,
      given: [target],
      correct,
    };
  }

  if (type === 'missing') {
    const seqLen = 3;
    const latestStart = Math.max(min, max - seqLen + 1);
    const start = pickUnique(min, latestStart, excludedStimuli);
    const sequence = [start, start + 1, start + 2];
    const blankIndex = randomInt(0, seqLen - 1);
    const correct = sequence[blankIndex];
    const given = sequence.filter((_, i) => i !== blankIndex);
    const display = sequence.map((n, i) => (i === blankIndex ? '__' : n)).join(', ');
    return {
      id: idBase,
      type,
      prompt: `Which number is missing: ${display}?`,
      spokenPrompt: 'What number is missing from the sequence?',
      windowMin: min,
      windowMax: max,
      given,
      correct,
    };
  }

  // 'jump'
  let start = pickUnique(min, max, excludedStimuli);
  let direction: 'forward' | 'backward' = Math.random() < 0.5 ? 'forward' : 'backward';
  let jumpSize = randomInt(1, 3);
  let landing = direction === 'forward' ? start + jumpSize : start - jumpSize;
  let guard = 0;
  while ((landing < min || landing > max) && guard < 10) {
    direction = Math.random() < 0.5 ? 'forward' : 'backward';
    jumpSize = randomInt(1, 3);
    landing = direction === 'forward' ? start + jumpSize : start - jumpSize;
    guard += 1;
  }
  if (landing < min || landing > max) {
    // Guaranteed-safe fallback (bands are always at least 10 wide, so this
    // never fails): a single step toward whichever end has room. Backward
    // jumps are never attempted past `min`, so the landing can never be
    // negative or outside the visible stones.
    if (start < max) {
      direction = 'forward';
      jumpSize = 1;
      landing = start + 1;
    } else {
      direction = 'backward';
      jumpSize = 1;
      landing = start - 1;
    }
  }

  return {
    id: idBase,
    type,
    prompt: `You are on ${start}. Jump ${direction} ${jumpSize} space${jumpSize > 1 ? 's' : ''}. Where do you land?`,
    spokenPrompt: `You are on ${start}. Jump ${direction} ${jumpSize} space${jumpSize > 1 ? 's' : ''}. Where do you land?`,
    windowMin: min,
    windowMax: max,
    given: [start],
    startValue: start,
    jumpSize,
    jumpDirection: direction,
    correct: landing,
  };
};

/** The number that defines this question's identity, for repeat tracking. */
export const getNumberLineStimulus = (question: NumberLineQuestion): number =>
  question.given[0] ?? question.correct;
