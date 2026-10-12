export type ActivityId =
  | 'number-recognition'
  | 'word-match'
  | 'before-after'
  | 'missing-number'
  | 'between-numbers'
  | 'count-objects'
  | 'picture-addition'
  | 'number-ordering'
  | 'number-line'
  | 'mixed-challenge';

export type ActivityMode = 'choice' | 'match' | 'order' | 'numberline';

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
}

export interface LevelResult {
  activityId: ActivityId;
  level: number;
  correct: number;
  total: number;
  starsEarned: number;
  leveledUp: boolean;
}

export type Screen = 'welcome' | 'home' | 'game' | 'success' | 'parent' | 'settings';
