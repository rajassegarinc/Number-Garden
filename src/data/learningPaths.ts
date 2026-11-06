import { buildNumeralChoices, randomInt, shuffle } from './questionGenerators';
import type { ActivityId, AnswerChoice } from '../types';

/** What the path scene draws above the answer buttons. Each learning path
 * has its own picture kind so the child "sees" the maths (beads, frogs, pie
 * slices, a clock face) rather than reading it as plain numerals. */
export type PathScene =
  | { kind: 'compare'; left: number; right: number; pictures: boolean; answer: '>' | '<' | '=' }
  | { kind: 'bond'; whole: number; part: number; missing: number }
  | { kind: 'bond-pick'; whole: number }
  | { kind: 'frogs'; total: number; away: number; askAway: boolean }
  | { kind: 'place-value'; hundreds: number; tens: number; ones: number }
  | { kind: 'numeral'; value: number; caption?: string }
  | { kind: 'pattern'; items: string[]; answer: string }
  | { kind: 'skip'; values: number[]; blankIndex: number; icon?: string }
  | { kind: 'jumps'; jumps: number; step: number }
  | { kind: 'pairs'; count: number; icon: string }
  | { kind: 'numbers'; values: number[] }
  | { kind: 'pie'; slices: number; shaded: number }
  | { kind: 'pie-compare'; a: number; b: number }
  | { kind: 'share'; items: number; friends: number; icon: string; friend: string }
  | { kind: 'clock'; hour: number; minute: number }
  | { kind: 'lengths'; bars: Array<{ color: string; length: number }> }
  | { kind: 'ladybugs'; length: number; item: string }
  | { kind: 'seesaw'; left: string; right: string; heavier: 'left' | 'right' }
  | { kind: 'shape'; shape: ShapeName }
  | { kind: 'shape-hunt'; shapes: ShapeName[] }
  | { kind: 'solid'; icon: string }
  | { kind: 'tally'; count: number }
  | { kind: 'graph'; rows: Array<{ icon: string; count: number }> }
  | { kind: 'lifecycle-stage'; stage: LifeStage }
  | { kind: 'lifecycle-next'; stage: LifeStage }
  | { kind: 'lifecycle-cycle'; missing: LifeStage }
  | { kind: 'leaves'; first: number; second: number };

/** The four stages of a butterfly's life, in order (the cycle wraps round). */
export const LIFE_STAGES = ['egg', 'caterpillar', 'chrysalis', 'butterfly'] as const;
export type LifeStage = (typeof LIFE_STAGES)[number];

export type ShapeName =
  | 'circle'
  | 'square'
  | 'triangle'
  | 'rectangle'
  | 'oval'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'octagon';

export interface PathQuestion {
  id: string;
  /** Identity used to avoid repeating the same question within a level. */
  key: string;
  prompt: string;
  spokenPrompt: string;
  scene: PathScene;
  choices: AnswerChoice[];
  /** Spoken after a correct answer, to reinforce the idea in words. */
  explain: string;
}

const pick = <T,>(arr: readonly T[]): T => arr[randomInt(0, arr.length - 1)];

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random()}`;

/** Builds up to `total` shuffled tap choices from text labels: the correct
 * one plus the first distinct distractors. */
const labelChoices = (correct: string, distractors: string[], total = 4): AnswerChoice[] => {
  const unique = Array.from(new Set(distractors.filter((d) => d !== correct))).slice(0, total - 1);
  return shuffle([correct, ...unique]).map((label, index) => ({
    id: `choice-${index}-${label}`,
    label,
    value: index,
    isCorrect: label === correct,
  }));
};

const numberChoices = (correct: number, min: number, max: number): AnswerChoice[] =>
  buildNumeralChoices(correct, Math.max(0, min), Math.max(max, correct + 3));

// ── 🐊 Hungry Crocodile ────────────────────────────────────────────────
const compareQuestion = (level: number): PathQuestion => {
  const max = level === 1 ? 10 : level === 2 ? 20 : 100;
  const left = randomInt(1, max);
  const right = Math.random() < 0.2 ? left : randomInt(1, max);
  const answer = left > right ? '>' : left < right ? '<' : '=';
  const words = { '>': 'is greater than', '<': 'is less than', '=': 'is equal to' } as const;
  return {
    id: uid('compare'),
    key: `${left}-${right}`,
    prompt: 'Which way does the hungry crocodile open its mouth?',
    spokenPrompt: `${left} and ${right}. The crocodile always eats the bigger number. Which sign fits?`,
    scene: { kind: 'compare', left, right, pictures: level === 1, answer },
    choices: labelChoices(answer, ['>', '<', '=']),
    explain: `${left} ${words[answer]} ${right}!`,
  };
};

// ── 🧩 Number Bonds Bridge ─────────────────────────────────────────────
const bondsQuestion = (level: number): PathQuestion => {
  if (level === 4) {
    const a = randomInt(1, 9);
    const correct = `${a} + ${10 - a}`;
    const wrong = new Set<string>();
    while (wrong.size < 3) {
      const x = randomInt(1, 9);
      const y = randomInt(1, 9);
      if (x + y !== 10) wrong.add(`${x} + ${y}`);
    }
    return {
      id: uid('bond-pick'),
      key: `pick-${a}`,
      prompt: 'Which pair of stones makes 10?',
      spokenPrompt: 'Which pair of stepping stones makes 10?',
      scene: { kind: 'bond-pick', whole: 10 },
      choices: labelChoices(correct, Array.from(wrong)),
      explain: `${a} and ${10 - a} make 10!`,
    };
  }
  const whole = level === 1 ? 5 : level === 2 ? 10 : 20;
  const part = randomInt(level === 3 ? 2 : 1, whole - (level === 3 ? 2 : 1));
  const missing = whole - part;
  return {
    id: uid('bond'),
    key: `${whole}-${part}`,
    prompt: `${part} and what make ${whole}?`,
    spokenPrompt: `${part} and what number make ${whole}?`,
    scene: { kind: 'bond', whole, part, missing },
    choices: numberChoices(missing, 0, whole),
    explain: `${part} and ${missing} make ${whole}!`,
  };
};

// ── 🐸 Frog Pond Subtraction ───────────────────────────────────────────
const subtractionQuestion = (level: number): PathQuestion => {
  const [min, max] = level === 1 ? [2, 5] : level === 2 ? [6, 10] : level === 3 ? [11, 20] : [3, 10];
  const total = randomInt(min, max);
  const away = randomInt(1, total - 1);
  const left = total - away;
  const askAway = level === 4;
  if (askAway) {
    return {
      id: uid('frogs-away'),
      key: `away-${total}-${away}`,
      prompt: `${total} frogs were on the pond. Now ${left} are left. How many hopped away?`,
      spokenPrompt: `There were ${total} frogs. Now there are ${left}. How many frogs hopped away?`,
      scene: { kind: 'frogs', total, away, askAway },
      choices: numberChoices(away, 0, total),
      explain: `${total} take away ${away} leaves ${left}!`,
    };
  }
  return {
    id: uid('frogs'),
    key: `${total}-${away}`,
    prompt: `${total} frogs. ${away} hop away. How many are left?`,
    spokenPrompt: `${total} frogs are on the lily pads. ${away} hop away. How many are left?`,
    scene: { kind: 'frogs', total, away, askAway },
    choices: numberChoices(left, 0, total),
    explain: `${total} take away ${away} is ${left}!`,
  };
};

// ── 🐝 Bee Hive Place Value ────────────────────────────────────────────
const placeValueQuestion = (level: number): PathQuestion => {
  if (level === 4) {
    // Un-traded ones: the child must bundle ten drops into a bar mentally.
    const tens = randomInt(1, 6);
    const ones = randomInt(10, 18);
    const value = tens * 10 + ones;
    return {
      id: uid('pv-trade'),
      key: `trade-${tens}-${ones}`,
      prompt: 'Bundle ten drops into a honey bar. What number is this?',
      spokenPrompt: `${tens} honey bars and ${ones} nectar drops. Trade ten drops for a bar. What number is it?`,
      scene: { kind: 'place-value', hundreds: 0, tens, ones },
      choices: numberChoices(value, value - 10, value + 10),
      explain: `${plural(tens, 'ten')} and ${ones} ones make ${value}!`,
    };
  }
  const max = level === 1 ? 30 : level === 2 ? 99 : 999;
  const value = randomInt(level === 3 ? 100 : 11, max);
  const hundreds = Math.floor(value / 100);
  const tens = Math.floor((value % 100) / 10);
  const ones = value % 10;

  if (Math.random() < 0.35) {
    const askTens = level < 3 || Math.random() < 0.5;
    const correct = askTens ? tens : hundreds;
    const unit = askTens ? 'tens' : 'hundreds';
    return {
      id: uid('pv-digit'),
      key: `digit-${value}`,
      prompt: `How many ${unit} are in ${value}?`,
      spokenPrompt: `How many ${unit} are in ${value}?`,
      scene: { kind: 'numeral', value, caption: unit === 'tens' ? '🍯 = 10' : '🏠 = 100' },
      choices: numberChoices(correct, 0, 9),
      explain: `${value} has ${plural(correct, unit.slice(0, -1))}!`,
    };
  }
  return {
    id: uid('pv'),
    key: `${value}`,
    prompt: 'Count the hives, honey bars and drops. What number is it?',
    spokenPrompt: 'Count the hives, the honey bars, and the nectar drops. What number is it?',
    scene: { kind: 'place-value', hundreds, tens, ones },
    choices: labelChoices(
      String(value),
      // Swapped digits and off-by-ten are the classic place-value slips.
      [
        String(hundreds * 100 + ones * 10 + tens),
        String(value + 10),
        String(Math.max(1, value - 10)),
        String(value + 1),
      ],
    ),
    explain:
      hundreds > 0
        ? `${plural(hundreds, 'hundred')}, ${plural(tens, 'ten')} and ${plural(ones, 'one')} make ${value}!`
        : `${plural(tens, 'ten')} and ${plural(ones, 'one')} make ${value}!`,
  };
};

// ── 🌈 Flower Bed Patterns ─────────────────────────────────────────────
const PATTERN_ICONS = ['🌷', '🌻', '🌸', '🍄', '🐞', '🦋', '🍀', '🐝', '🍎', '⭐'];
const PATTERN_UNITS: Record<number, number[][]> = {
  1: [[0, 1]],
  2: [
    [0, 0, 1],
    [0, 1, 1],
  ],
  3: [[0, 1, 2]],
};

const patternsQuestion = (level: number): PathQuestion => {
  if (level === 4) {
    const step = pick([2, 3, 5, 10]);
    const start = step === 10 ? randomInt(0, 4) * 10 : randomInt(1, 6);
    const values = Array.from({ length: 5 }, (_, i) => start + i * step);
    const answer = values[4];
    return {
      id: uid('grow'),
      key: `grow-${start}-${step}`,
      prompt: 'The flowers grow by the same amount each time. What comes next?',
      spokenPrompt: `${values.slice(0, 4).join(', ')}. What comes next?`,
      scene: { kind: 'skip', values, blankIndex: 4, icon: '🌱' },
      choices: numberChoices(answer, answer - step - 2, answer + step + 2),
      explain: `It grows by ${step} each time, so ${answer} comes next!`,
    };
  }
  const unit = pick(PATTERN_UNITS[level]);
  const icons = shuffle(PATTERN_ICONS).slice(0, 3);
  const length = unit.length * 2 + randomInt(1, unit.length);
  const items = Array.from({ length }, (_, i) => icons[unit[i % unit.length]]);
  const answer = items[items.length - 1];
  const shown = [...items.slice(0, -1), '?'];
  const used = Array.from(new Set(unit.map((u) => icons[u])));
  const distractors = [...used, ...shuffle(PATTERN_ICONS.filter((i) => !used.includes(i)))].slice(0, 4);
  return {
    id: uid('pattern'),
    key: `${unit.join('')}-${icons.join('')}`,
    prompt: 'What comes next in the flower bed?',
    spokenPrompt: 'Look at the pattern. What comes next?',
    scene: { kind: 'pattern', items: shown, answer },
    choices: labelChoices(answer, distractors, Math.max(3, used.length + 1)),
    explain: 'You found the pattern!',
  };
};

// ── 🦘 Skip-Counting Kangaroo ──────────────────────────────────────────
const skipCountingQuestion = (level: number): PathQuestion => {
  if (level === 4) {
    const step = pick([2, 5, 10]);
    const jumps = randomInt(2, 5);
    const answer = step * jumps;
    return {
      id: uid('jumps'),
      key: `${jumps}x${step}`,
      prompt: `The kangaroo makes ${jumps} jumps of ${step}. Where does it land?`,
      spokenPrompt: `${jumps} jumps of ${step}. Where does the kangaroo land?`,
      scene: { kind: 'jumps', jumps, step },
      choices: numberChoices(answer, answer - step, answer + step),
      explain: `${jumps} jumps of ${step} is ${answer}!`,
    };
  }
  const step = level === 1 ? 10 : level === 2 ? 5 : 2;
  const startIndex = randomInt(0, level === 1 ? 4 : 8);
  const values = Array.from({ length: 6 }, (_, i) => (startIndex + i + 1) * step);
  const blankIndex = randomInt(1, values.length - 1);
  const answer = values[blankIndex];
  return {
    id: uid('skip'),
    key: `${startIndex}-${blankIndex}`,
    prompt: `The kangaroo jumps by ${step}s. Which stone is missing?`,
    spokenPrompt: `Count by ${step}s. Which number is missing?`,
    scene: { kind: 'skip', values, blankIndex },
    choices: labelChoices(String(answer), [
      String(answer + 1),
      String(answer - 1),
      String(answer + step),
      String(Math.max(0, answer - step)),
    ]),
    explain: `Counting by ${step}s, ${answer} goes there!`,
  };
};

// ── 🐥 Duckling Partners ───────────────────────────────────────────────
const evenOddQuestion = (level: number): PathQuestion => {
  if (level === 3) {
    const wantEven = Math.random() < 0.5;
    const pool = Array.from({ length: 30 }, (_, i) => i + 1);
    const matches = pool.filter((n) => (n % 2 === 0) === wantEven);
    const others = shuffle(pool.filter((n) => (n % 2 === 0) !== wantEven)).slice(0, 3);
    const answer = pick(matches);
    const label = wantEven ? 'even' : 'odd';
    return {
      id: uid('spot'),
      key: `spot-${answer}`,
      prompt: `Which number is ${label}?`,
      spokenPrompt: `Which number is ${label}?`,
      scene: { kind: 'numbers', values: shuffle([answer, ...others]) },
      choices: labelChoices(String(answer), others.map(String)),
      explain: `${answer} is ${label}!`,
    };
  }
  const count = randomInt(level === 1 ? 2 : 1, level === 1 ? 12 : 20);
  const even = count % 2 === 0;
  const correct = even ? 'Even' : 'Odd';
  return {
    id: uid('pairs'),
    key: `${count}`,
    prompt:
      level === 1
        ? `${count} ducklings line up in pairs. Does every duckling have a partner?`
        : `Is ${count} even or odd?`,
    spokenPrompt: level === 1 ? `${count} ducklings. Even or odd?` : `Is ${count} even or odd?`,
    scene: level === 1 ? { kind: 'pairs', count, icon: '🐥' } : { kind: 'numeral', value: count },
    choices: labelChoices(correct, ['Even', 'Odd']),
    explain: even ? `${count} is even — everyone has a partner!` : `${count} is odd — one duckling is left over!`,
  };
};

// ── 🍕 Picnic Fractions ────────────────────────────────────────────────
const FRACTION_LABEL: Record<string, string> = {
  '1/2': '½',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/4': '¼',
  '2/4': '²⁄₄',
  '3/4': '¾',
  '1/6': '⅙',
  '1/8': '⅛',
};
const FRACTION_WORD: Record<string, string> = {
  '1/2': 'one half',
  '1/3': 'one third',
  '2/3': 'two thirds',
  '1/4': 'one quarter',
  '2/4': 'two quarters',
  '3/4': 'three quarters',
  '1/6': 'one sixth',
  '1/8': 'one eighth',
};

const fractionsQuestion = (level: number): PathQuestion => {
  if (level === 2) {
    const friends = pick([2, 3, 4]);
    const each = randomInt(1, friends === 4 ? 3 : 4);
    const items = friends * each;
    const icon = pick(['🍓', '🍪', '🍇', '🥕']);
    const friend = pick(['🐰', '🐻', '🐼', '🦊']);
    return {
      id: uid('share'),
      key: `${items}-${friends}`,
      prompt: `Share ${items} ${icon} fairly between ${friends} friends. How many does each get?`,
      spokenPrompt: `Share ${items} treats fairly between ${friends} friends. How many does each friend get?`,
      scene: { kind: 'share', items, friends, icon, friend },
      choices: numberChoices(each, 1, items),
      explain: `${items} shared between ${friends} is ${each} each!`,
    };
  }
  if (level === 3) {
    const [a, b] = shuffle([2, 3, 4, 6, 8]).slice(0, 2);
    const bigger = Math.min(a, b);
    return {
      id: uid('pie-compare'),
      key: `${Math.min(a, b)}-${Math.max(a, b)}`,
      prompt: 'Which slice of pizza is bigger?',
      spokenPrompt: `Which is bigger, ${FRACTION_WORD[`1/${a}`]} or ${FRACTION_WORD[`1/${b}`]}?`,
      scene: { kind: 'pie-compare', a, b },
      choices: labelChoices(FRACTION_LABEL[`1/${bigger}`], [FRACTION_LABEL[`1/${a}`], FRACTION_LABEL[`1/${b}`]]),
      explain: `Fewer slices means bigger pieces — ${FRACTION_WORD[`1/${bigger}`]} is bigger!`,
    };
  }
  const key = pick(['1/2', '1/3', '2/3', '1/4', '3/4']);
  const [shaded, slices] = key.split('/').map(Number);
  return {
    id: uid('pie'),
    key,
    prompt: 'How much of the pizza has toppings?',
    spokenPrompt: 'How much of the pizza has toppings?',
    scene: { kind: 'pie', slices, shaded },
    choices: labelChoices(
      FRACTION_LABEL[key],
      shuffle(['1/2', '1/3', '2/3', '1/4', '3/4'].filter((k) => k !== key))
        .slice(0, 3)
        .map((k) => FRACTION_LABEL[k]),
    ),
    explain: `That's ${FRACTION_WORD[key]}!`,
  };
};

// ── ⏰ Rooster's Clock ─────────────────────────────────────────────────
const timeLabel = (hour: number, minute: number, digital: boolean): string => {
  if (digital) return `${hour}:${String(minute).padStart(2, '0')}`;
  const next = (hour % 12) + 1;
  if (minute === 0) return `${hour} o'clock`;
  if (minute === 30) return `half past ${hour}`;
  if (minute === 15) return `quarter past ${hour}`;
  return `quarter to ${next}`;
};

const timeQuestion = (level: number): PathQuestion => {
  const hour = randomInt(1, 12);
  const minute =
    level === 1 ? 0 : level === 2 ? pick([0, 30, 30]) : level === 3 ? pick([15, 45, 30]) : randomInt(1, 11) * 5;
  const digital = level === 4;
  const correct = timeLabel(hour, minute, digital);
  const distractors = new Set<string>();
  // Mixing up the hour and minute hands is the most common clock mistake.
  if (level === 1 && hour !== 12) distractors.add(timeLabel(12, 0, false));
  while (distractors.size < 3) {
    const h = Math.random() < 0.5 ? hour : randomInt(1, 12);
    const m = level === 1 ? 0 : level === 2 ? pick([0, 30]) : level === 3 ? pick([0, 15, 30, 45]) : randomInt(0, 11) * 5;
    const label = timeLabel(h, m, digital);
    if (label !== correct) distractors.add(label);
  }
  return {
    id: uid('clock'),
    key: `${hour}-${minute}`,
    prompt: 'What time does the rooster’s clock show?',
    spokenPrompt: 'What time does the clock show?',
    scene: { kind: 'clock', hour, minute },
    choices: labelChoices(correct, Array.from(distractors)),
    explain: `It's ${correct}!`,
  };
};

// ── 📏 Measure & Weigh ─────────────────────────────────────────────────
const RIBBONS = [
  { color: '#e2453c', label: '🔴' },
  { color: '#2fa4e7', label: '🔵' },
  { color: '#4caf50', label: '🟢' },
  { color: '#ffb703', label: '🟡' },
  { color: '#9b6bdf', label: '🟣' },
];
const WEIGHTS = ['🪶', '🍒', '🍓', '🍎', '🍍', '🍉', '🎃', '🐘'];

const measureQuestion = (level: number): PathQuestion => {
  if (level === 2) {
    const length = randomInt(2, 9);
    const item = pick(['✏️', '🐍', '🥖', '🪱']);
    return {
      id: uid('ladybugs'),
      key: `${length}-${item}`,
      prompt: 'How many ladybugs long is it?',
      spokenPrompt: 'How many ladybugs long is it?',
      scene: { kind: 'ladybugs', length, item },
      choices: numberChoices(length, 1, 10),
      explain: `It is ${length} ladybugs long!`,
    };
  }
  if (level === 3) {
    const [lightI, heavyI] = shuffle(Array.from({ length: WEIGHTS.length }, (_, i) => i))
      .slice(0, 2)
      .sort((x, y) => x - y);
    const heavierSide = Math.random() < 0.5 ? 'left' : 'right';
    const left = heavierSide === 'left' ? WEIGHTS[heavyI] : WEIGHTS[lightI];
    const right = heavierSide === 'left' ? WEIGHTS[lightI] : WEIGHTS[heavyI];
    const askHeavy = Math.random() < 0.5;
    const correct = askHeavy ? WEIGHTS[heavyI] : WEIGHTS[lightI];
    const word = askHeavy ? 'heavier' : 'lighter';
    return {
      id: uid('seesaw'),
      key: `${lightI}-${heavyI}-${word}`,
      prompt: `Look at the seesaw. Which one is ${word}?`,
      spokenPrompt: `Look at the seesaw. Which one is ${word}?`,
      scene: { kind: 'seesaw', left, right, heavier: heavierSide },
      choices: labelChoices(correct, [left, right]),
      explain: `The heavier side goes down — ${correct} is ${word}!`,
    };
  }
  const ribbons = shuffle(RIBBONS).slice(0, 3);
  const lengths = shuffle([3, 5, 7, 9].slice(randomInt(0, 1))).slice(0, 3);
  const askLong = Math.random() < 0.5;
  const target = askLong ? Math.max(...lengths) : Math.min(...lengths);
  const correct = ribbons[lengths.indexOf(target)].label;
  const word = askLong ? 'longest' : 'shortest';
  return {
    id: uid('lengths'),
    key: `${lengths.join('')}-${word}`,
    prompt: `Which ribbon is the ${word}?`,
    spokenPrompt: `Which ribbon is the ${word}?`,
    scene: { kind: 'lengths', bars: ribbons.map((r, i) => ({ color: r.color, length: lengths[i] })) },
    choices: labelChoices(
      correct,
      ribbons.map((r) => r.label),
    ),
    explain: `That ribbon is the ${word}!`,
  };
};

// ── 🔷 Shape Garden ────────────────────────────────────────────────────
const FLAT_SHAPES: ShapeName[] = ['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond'];
const SIDED: Array<[ShapeName, number]> = [
  ['triangle', 3],
  ['square', 4],
  ['rectangle', 4],
  ['pentagon', 5],
  ['hexagon', 6],
  ['octagon', 8],
];
const SOLIDS = [
  { icon: '⚽', name: 'Sphere' },
  { icon: '🎲', name: 'Cube' },
  { icon: '🥫', name: 'Cylinder' },
  { icon: '🍦', name: 'Cone' },
  { icon: '🌍', name: 'Sphere' },
  { icon: '📦', name: 'Cube' },
  { icon: '🔋', name: 'Cylinder' },
];
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

const shapesQuestion = (level: number): PathQuestion => {
  if (level === 2) {
    const [shape, sides] = pick(SIDED);
    return {
      id: uid('sides'),
      key: shape,
      prompt: 'How many sides does this shape have?',
      spokenPrompt: 'Count the sides. How many sides does this shape have?',
      scene: { kind: 'shape', shape },
      choices: numberChoices(sides, 3, 8),
      explain: `A ${shape} has ${sides} sides!`,
    };
  }
  if (level === 3) {
    const target = pick(['circle', 'triangle', 'square'] as ShapeName[]);
    const count = randomInt(2, 6);
    const others = Array.from({ length: randomInt(3, 6) }, () =>
      pick(FLAT_SHAPES.filter((s) => s !== target && !(target === 'square' && s === 'diamond'))),
    );
    const shapes = shuffle([...Array.from({ length: count }, () => target), ...others]);
    return {
      id: uid('hunt'),
      key: `${target}-${count}`,
      prompt: `How many ${target}s can you find?`,
      spokenPrompt: `How many ${target}s can you find in the garden?`,
      scene: { kind: 'shape-hunt', shapes },
      choices: numberChoices(count, 1, 9),
      explain: `There are ${count} ${target}s!`,
    };
  }
  if (level === 4) {
    const solid = pick(SOLIDS);
    return {
      id: uid('solid'),
      key: solid.icon,
      prompt: 'What 3D shape is this?',
      spokenPrompt: 'What 3D shape is this?',
      scene: { kind: 'solid', icon: solid.icon },
      choices: labelChoices(solid.name, ['Sphere', 'Cube', 'Cylinder', 'Cone']),
      explain: `It's a ${solid.name.toLowerCase()}!`,
    };
  }
  const shape = pick(FLAT_SHAPES);
  return {
    id: uid('shape'),
    key: shape,
    prompt: 'What shape is this?',
    spokenPrompt: 'What shape is this?',
    scene: { kind: 'shape', shape },
    choices: labelChoices(
      cap(shape),
      shuffle(FLAT_SHAPES.filter((s) => s !== shape))
        .slice(0, 3)
        .map(cap),
    ),
    explain: `It's a ${shape}!`,
  };
};

// ── 📊 Garden Graph Detective ──────────────────────────────────────────
const BUGS = ['🐞', '🐝', '🦋', '🐛', '🐌'];

const graphsQuestion = (level: number): PathQuestion => {
  if (level === 1) {
    const count = randomInt(2, 17);
    return {
      id: uid('tally'),
      key: `${count}`,
      prompt: 'How many bugs do the tally marks show?',
      spokenPrompt: 'Count the tally marks. Each bundle is 5. How many?',
      scene: { kind: 'tally', count },
      choices: numberChoices(count, 1, 20),
      explain: `The tally shows ${count}!`,
    };
  }
  const icons = shuffle(BUGS).slice(0, level === 2 ? 3 : 4);
  // Distinct counts so "most" and "how many more" always have one answer.
  const counts = shuffle([1, 2, 3, 4, 5, 6, 7]).slice(0, icons.length);
  const rows = icons.map((icon, i) => ({ icon, count: counts[i] }));
  const scene: PathScene = { kind: 'graph', rows };
  const key = rows.map((r) => `${r.icon}${r.count}`).join('');

  if (level === 2) {
    const askMost = Math.random() < 0.6;
    const target = rows.reduce((best, r) => ((askMost ? r.count > best.count : r.count < best.count) ? r : best));
    const word = askMost ? 'the most' : 'the fewest';
    return {
      id: uid('graph-most'),
      key,
      prompt: `Which bug did we find ${word}?`,
      spokenPrompt: `Look at the graph. Which bug did we find ${word}?`,
      scene,
      choices: labelChoices(
        target.icon,
        rows.map((r) => r.icon),
      ),
      explain: `We found ${word} of ${target.icon}!`,
    };
  }
  if (level === 3) {
    const row = pick(rows);
    return {
      id: uid('graph-read'),
      key: `${key}-${row.icon}`,
      prompt: `How many ${row.icon} did we find?`,
      spokenPrompt: 'Read the graph. How many of that bug did we find?',
      scene,
      choices: numberChoices(row.count, 1, 8),
      explain: `We found ${row.count}!`,
    };
  }
  const [a, b] = shuffle(rows).slice(0, 2);
  const more = a.count > b.count ? a : b;
  const fewer = a.count > b.count ? b : a;
  const diff = more.count - fewer.count;
  return {
    id: uid('graph-diff'),
    key: `${key}-${more.icon}${fewer.icon}`,
    prompt: `How many more ${more.icon} than ${fewer.icon}?`,
    spokenPrompt: 'Read the graph. How many more?',
    scene,
    choices: numberChoices(diff, 0, 7),
    explain: `${more.count} take away ${fewer.count} is ${diff} more!`,
  };
};

// ── 🦋 Butterfly Life Cycle ───────────────────────────────────────────
const STAGE_NAME: Record<LifeStage, string> = {
  egg: 'Egg',
  caterpillar: 'Caterpillar',
  chrysalis: 'Chrysalis',
  butterfly: 'Butterfly',
};
const STAGE_FACT: Record<LifeStage, string> = {
  egg: 'A butterfly starts as a tiny egg on a leaf.',
  caterpillar: 'A caterpillar hatches and eats lots of leaves.',
  chrysalis: 'The caterpillar makes a chrysalis and changes inside.',
  butterfly: 'A butterfly comes out and spreads its wings!',
};
const stageNames = LIFE_STAGES.map((s) => STAGE_NAME[s]);

const BUTTERFLY_FACTS: Array<{ q: string; stage: LifeStage; correct: string; wrong: string[]; explain: string }> = [
  { q: 'What does a caterpillar love to eat?', stage: 'caterpillar', correct: 'Leaves', wrong: ['Nectar', 'Seeds', 'Fish'], explain: 'Caterpillars munch on leaves to grow big.' },
  { q: 'What does a butterfly drink from flowers?', stage: 'butterfly', correct: 'Nectar', wrong: ['Milk', 'Leaves', 'Seeds'], explain: 'Butterflies sip sweet nectar from flowers.' },
  { q: 'Where does a butterfly lay its eggs?', stage: 'egg', correct: 'On a leaf', wrong: ['In the sea', 'In a nest', 'In the sand'], explain: 'Eggs go on a leaf, so the baby caterpillar has food.' },
  { q: 'What hatches out of a butterfly egg?', stage: 'egg', correct: 'Caterpillar', wrong: ['Chick', 'Butterfly', 'Tadpole'], explain: 'A tiny caterpillar hatches from the egg.' },
  { q: 'What comes out of the chrysalis?', stage: 'chrysalis', correct: 'Butterfly', wrong: ['Caterpillar', 'Bee', 'Egg'], explain: 'A butterfly comes out of the chrysalis!' },
  { q: 'Which stage hangs still while it changes?', stage: 'chrysalis', correct: 'Chrysalis', wrong: ['Caterpillar', 'Butterfly', 'Egg'], explain: 'The chrysalis hangs very still while the caterpillar changes inside.' },
  { q: 'How many wings does a butterfly have?', stage: 'butterfly', correct: '4', wrong: ['2', '6', '8'], explain: 'A butterfly has 4 wings — 2 on each side.' },
  { q: 'How many legs does a butterfly have?', stage: 'butterfly', correct: '6', wrong: ['4', '8', '2'], explain: 'Butterflies are insects, and insects have 6 legs.' },
];

const butterflyQuestion = (level: number): PathQuestion => {
  if (level === 1) {
    const stage = pick(LIFE_STAGES);
    return {
      id: uid('stage'),
      key: stage,
      prompt: 'Which stage of the butterfly’s life is this?',
      spokenPrompt: 'Which stage of the butterfly’s life is this?',
      scene: { kind: 'lifecycle-stage', stage },
      choices: labelChoices(STAGE_NAME[stage], stageNames),
      explain: STAGE_FACT[stage],
    };
  }
  if (level === 2) {
    const index = randomInt(0, LIFE_STAGES.length - 1);
    const stage = LIFE_STAGES[index];
    const next = LIFE_STAGES[(index + 1) % LIFE_STAGES.length];
    return {
      id: uid('next'),
      key: stage,
      prompt: `What comes after the ${stage}?`,
      spokenPrompt: `What comes after the ${stage}?`,
      scene: { kind: 'lifecycle-next', stage },
      choices: labelChoices(STAGE_NAME[next], stageNames),
      explain:
        stage === 'butterfly'
          ? 'The butterfly lays eggs, and the cycle starts again!'
          : `After the ${stage} comes the ${next}!`,
    };
  }
  if (level === 3) {
    const missing = pick(LIFE_STAGES);
    return {
      id: uid('cycle'),
      key: missing,
      prompt: 'Which stage is missing from the life cycle?',
      spokenPrompt: 'Look at the circle. Which stage is missing?',
      scene: { kind: 'lifecycle-cycle', missing },
      choices: labelChoices(STAGE_NAME[missing], stageNames),
      explain: STAGE_FACT[missing],
    };
  }
  // Level 4 mixes facts with a hungry-caterpillar counting question.
  if (Math.random() < 0.25) {
    const first = randomInt(1, 5);
    const second = randomInt(1, 5);
    return {
      id: uid('leaves'),
      key: `leaves-${first}-${second}`,
      prompt: `The hungry caterpillar ate ${first} leaves, then ${second} more. How many leaves?`,
      spokenPrompt: `The hungry caterpillar ate ${first} leaves, then ${second} more. How many leaves did it eat?`,
      scene: { kind: 'leaves', first, second },
      choices: numberChoices(first + second, 2, 10),
      explain: `${first} and ${second} make ${first + second} leaves. Yum!`,
    };
  }
  const fact = pick(BUTTERFLY_FACTS);
  return {
    id: uid('fact'),
    key: fact.q,
    prompt: fact.q,
    spokenPrompt: fact.q,
    scene: { kind: 'lifecycle-stage', stage: fact.stage },
    choices: labelChoices(fact.correct, fact.wrong),
    explain: fact.explain,
  };
};

const GENERATORS: Partial<Record<ActivityId, (level: number) => PathQuestion>> = {
  'path-compare': compareQuestion,
  'path-bonds': bondsQuestion,
  'path-subtraction': subtractionQuestion,
  'path-place-value': placeValueQuestion,
  'path-patterns': patternsQuestion,
  'path-skip-counting': skipCountingQuestion,
  'path-even-odd': evenOddQuestion,
  'path-fractions': fractionsQuestion,
  'path-time': timeQuestion,
  'path-measure': measureQuestion,
  'path-shapes': shapesQuestion,
  'path-graphs': graphsQuestion,
  'path-butterfly': butterflyQuestion,
};

/** Generates the next question for a learning path, retrying a few times to
 * avoid a key already asked this level (small pools can still repeat). */
export const generatePathQuestion = (
  activityId: ActivityId,
  level: number,
  usedKeys: Set<string>,
): PathQuestion => {
  const generator = GENERATORS[activityId];
  if (!generator) throw new Error(`No learning-path generator for ${activityId}`);
  let question = generator(level);
  for (let attempt = 0; attempt < 12 && usedKeys.has(question.key); attempt += 1) {
    question = generator(level);
  }
  return question;
};

/** Suggested order on the Learning Paths map; side quests can be played any time. */
export const PATH_TRAIL: ActivityId[] = [
  'path-compare',
  'path-bonds',
  'path-subtraction',
  'path-place-value',
  'path-patterns',
  'path-skip-counting',
  'path-even-odd',
  'path-fractions',
  'path-time',
  'path-measure',
];
export const PATH_SIDE_QUESTS: ActivityId[] = ['path-shapes', 'path-graphs', 'path-butterfly'];
