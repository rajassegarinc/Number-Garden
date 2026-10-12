const ONES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
];
const TEENS = [
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen',
  'sixteen', 'seventeen', 'eighteen', 'nineteen',
];
const TENS = [
  '', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety',
];

export const numberToWord = (n: number): string => {
  if (n < 0 || n > 100) return String(n);
  if (n === 100) return 'one hundred';
  if (n < 10) return ONES[n];
  if (n < 20) return TEENS[n - 10];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  if (ones === 0) return TENS[tens];
  return `${TENS[tens]}-${ONES[ones]}`;
};

export const capitalize = (word: string): string =>
  word.charAt(0).toUpperCase() + word.slice(1);
