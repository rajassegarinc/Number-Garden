// Every line here is unconditionally positive — the result's score only
// ever chooses which pool of lines to draw from, never a discouraging line,
// per the requirement that an incorrect answer must never read as negative.
const NAMED_LINES = (name: string): string[] => [
  `Amazing work, ${name}!`,
  `${name}, you're a Number Champion!`,
  `Way to go, ${name}!`,
  `${name}, that was super counting!`,
];

const GENERIC_LINES = ['Fantastic effort!', 'Ready for another adventure?', 'Great job exploring numbers!'];

const PERFECT_LINES = (name: string | null): string[] => [
  name ? `Perfect score, ${name}! You're a superstar!` : 'Perfect score! You\'re a superstar!',
  'Wow, every single one correct!',
];

export const pickEncouragement = (childName: string | null, isPerfect: boolean): string => {
  const trimmedName = childName?.trim() || null;
  const pool = isPerfect
    ? PERFECT_LINES(trimmedName)
    : trimmedName
      ? [...NAMED_LINES(trimmedName), ...GENERIC_LINES]
      : GENERIC_LINES;
  return pool[Math.floor(Math.random() * pool.length)];
};
