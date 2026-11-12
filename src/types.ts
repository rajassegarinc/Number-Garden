export type ActivityId =
  | 'speech-practice'
  | 'dino-match'
  | 'number-recognition'
  | 'word-match'
  | 'before-after'
  | 'missing-number'
  | 'between-numbers'
  | 'count-objects'
  | 'picture-addition'
  | 'number-ordering'
  | 'number-ordering-desc'
  | 'flower-line'
  | 'caterpillar-trail'
  | 'number-line'
  | 'mixed-challenge'
  | 'path-compare'
  | 'path-bonds'
  | 'path-subtraction'
  | 'path-place-value'
  | 'path-patterns'
  | 'path-skip-counting'
  | 'path-even-odd'
  | 'path-fractions'
  | 'path-time'
  | 'path-measure'
  | 'path-shapes'
  | 'path-graphs'
  | 'path-butterfly';

export type ActivityMode = 'choice' | 'match' | 'order' | 'flowerline' | 'caterpillar' | 'numberline' | 'path' | 'dinomatch' | 'speech';

export type CardColor = 'pink' | 'yellow' | 'purple' | 'blue' | 'green';

export interface ActivityMeta {
  id: ActivityId;
  title: string;
  shortTitle: string;
  description: string;
  color: CardColor;
  emoji: string;
  mode: ActivityMode;
  levelCount: number;
  /** Questions per level (choice/order modes) or rounds per level (match mode). */
  questionsPerLevel: number;
  /** Pairs per round, only used by match mode. */
  pairsPerRound?: number;
  /** Numbers to order per round, only used by order mode. */
  orderSize?: number;
  /** Sort direction for order mode — defaults to ascending when omitted. */
  orderDirection?: 'asc' | 'desc';
  /** Learning-path activities live on the Learning Paths map instead of the home list. */
  group?: 'path';
  /** Per-level labels for learning paths, which progress by skill rather than number band. */
  levelLabels?: string[];
}

export interface AnswerChoice {
  id: string;
  label: string;
  value: number;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  prompt: string;
  spokenPrompt: string;
  displayNumber?: number;
  displayWord?: string;
  countIcon?: string;
  sequence?: number[];
  blankIndex?: number;
  addend1?: number;
  addend2?: number;
  additionIcon?: string;
  choices: AnswerChoice[];
}

export interface MatchPair {
  id: string;
  value: number;
  word: string;
}

export interface BandStat {
  correct: number;
  attempts: number;
}

export interface ActivityProgress {
  level: number;
  starsEarned: number;
  bestAccuracy: number;
  correctCount: number;
  attemptCount: number;
  levelsCompleted: number[];
  /** One entry per level/band this activity can reach (up to 10 decade bands, 1-10 ... 91-100). */
  bandStats: BandStat[];
}

export type ProgressMap = Record<ActivityId, ActivityProgress>;

export type MissionId = 'banana' | 'river' | 'eggs';

export interface MissionProgress {
  completed: boolean;
  starsEarned: number;
  timesPlayed: number;
}

export type MissionProgressMap = Record<MissionId, MissionProgress>;

export type DecorationId = 'sunflower' | 'butterfly' | 'kite' | 'fountain' | 'tent';

/** Each garden plot holds exactly one thing: nothing, a growing plant (which
 * advances seed -> sprout -> bloom as the child "waters" it), or a placed
 * decoration. Decorations are never consumed — once unlocked by stars they
 * can be placed, removed and replaced freely, like a sticker set. */
export type GardenPlotState =
  | { kind: 'empty' }
  | { kind: 'plant'; stage: 'seed' | 'sprout' | 'bloom' }
  | { kind: 'decoration'; id: DecorationId };

export interface GardenProgress {
  seeds: number;
  plots: GardenPlotState[];
}

export interface NumberSettings {
  /** The highest number the child should be challenged with right now (5-100, step 5). */
  maxNumber: number;
  /** The highest addition total picture-addition should ever ask for (5, 10, 20 or 50). */
  maxAdditionTotal: number;
  /** The highest number Match Number Words should ever use (5-100, step 5) — independent of maxNumber. */
  wordMatchMaxNumber: number;
}

export interface ProgressState extends NumberSettings {
  totalStars: number;
  soundOn: boolean;
  lastPlayedAt: string | null;
  childName: string | null;
  activities: ProgressMap;
  missions: MissionProgressMap;
  garden: GardenProgress;
}

export interface LevelResult {
  activityId: ActivityId;
  level: number;
  correct: number;
  total: number;
  starsEarned: number;
  leveledUp: boolean;
}

export type Screen =
  | 'welcome'
  | 'home'
  | 'game'
  | 'success'
  | 'parent'
  | 'settings'
  | 'adventure'
  | 'mission'
  | 'garden'
  | 'market'
  | 'adventures'
  | 'paths';
