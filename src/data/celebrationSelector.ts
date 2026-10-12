import { ANIMAL_KINDS, isAnimalKind } from './celebrationAnimals';
import type { AnimalKind } from './celebrationAnimals';

const CELEBRATION_HISTORY_KEY = 'number-garden-celebration-history-v1';
const GUIDE_HISTORY_KEY = 'number-garden-numberline-guide-history-v1';
const RECENT_MAIN_LIMIT = 3;

interface RotationHistory {
  lastLineup: AnimalKind[];
  recentMains: AnimalKind[];
}

const EMPTY_HISTORY: RotationHistory = { lastLineup: [], recentMains: [] };

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const randomInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const loadHistory = (key: string): RotationHistory => {
  if (typeof window === 'undefined') return EMPTY_HISTORY;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return EMPTY_HISTORY;
    const parsed = JSON.parse(raw) as Partial<RotationHistory>;
    const lastLineup = Array.isArray(parsed.lastLineup) ? parsed.lastLineup.filter(isAnimalKind) : [];
    const recentMains = Array.isArray(parsed.recentMains) ? parsed.recentMains.filter(isAnimalKind) : [];
    return { lastLineup, recentMains };
  } catch {
    return EMPTY_HISTORY;
  }
};

const saveHistory = (key: string, history: RotationHistory): void => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      key,
      JSON.stringify({ lastLineup: history.lastLineup, recentMains: history.recentMains.slice(-RECENT_MAIN_LIMIT) }),
    );
  } catch {
    // Storage unavailable — rotation still works for this session, it just
    // won't remember across a restart.
  }
};

const sameLineup = (a: AnimalKind[], b: AnimalKind[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const buildLineup = (size: number, avoidMain: AnimalKind | undefined): AnimalKind[] => {
  const pool = shuffle(ANIMAL_KINDS);
  if (avoidMain && pool[0] === avoidMain && pool.length > 1) {
    const swapIndex = pool.findIndex((kind) => kind !== avoidMain);
    if (swapIndex > 0) {
      [pool[0], pool[swapIndex]] = [pool[swapIndex], pool[0]];
    }
  }
  return pool.slice(0, size);
};

/**
 * Shared rotation core used by both the victory-celebration lineup and the
 * Number-Line Adventure guide: picks `size` animals from the full roster,
 * avoiding (whenever the roster allows it) both an immediate repeat of the
 * previous "main" animal and an exact repeat of the previous full picks.
 * Each caller supplies its own `historyKey` so the two features rotate
 * independently (picking a lion as today's number-line guide doesn't affect
 * which animal can appear in the next victory celebration, and vice versa),
 * while sharing the same no-immediate-repeat algorithm and persistence
 * pattern. Works automatically with however many species are actually
 * defined in ANIMAL_KINDS — nothing here assumes a fixed roster size, so
 * the system keeps working if the roster only partially loads or is
 * trimmed in the future.
 */
const pickRotatingAnimals = (size: number, historyKey: string): AnimalKind[] => {
  const history = loadHistory(historyKey);
  const previousMain = history.recentMains[history.recentMains.length - 1];
  const boundedSize = Math.min(Math.max(size, 1), ANIMAL_KINDS.length);

  let lineup = buildLineup(boundedSize, previousMain);
  let guard = 0;
  while (sameLineup(lineup, history.lastLineup) && guard < 4) {
    lineup = buildLineup(boundedSize, previousMain);
    guard += 1;
  }

  saveHistory(historyKey, {
    lastLineup: lineup,
    recentMains: [...history.recentMains, lineup[0]].slice(-RECENT_MAIN_LIMIT),
  });

  return lineup;
};

/**
 * Picks a fresh animal lineup for a victory celebration: a random size
 * (3-5), a main animal that differs from the previous celebration's main
 * animal whenever the roster allows it, and a full combination that won't
 * exactly repeat the immediately previous one. Call once per celebration
 * (e.g. from a lazy useState initializer) — never on every render.
 */
export const pickCelebrationLineup = (): AnimalKind[] => pickRotatingAnimals(randomInt(3, 5), CELEBRATION_HISTORY_KEY);

/**
 * Picks a single guide animal for Number-Line Adventure, using the same
 * rotation algorithm (and its own independent history) as the celebration
 * lineup. Call once per activity session (e.g. from a lazy useState
 * initializer) so the guide stays stable for the whole round/session and
 * only rotates the next time the activity is entered.
 */
export const pickGuideAnimal = (): AnimalKind => pickRotatingAnimals(1, GUIDE_HISTORY_KEY)[0];
