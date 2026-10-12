import { useCallback, useEffect, useState } from 'react';
import {
  ACTIVITIES,
  ADDITION_TOTAL_OPTIONS,
  DEFAULT_SETTINGS,
  LEVEL_BANDS,
  MAX_NUMBER_MAX,
  MAX_NUMBER_MIN,
  MAX_NUMBER_STEP,
  getEffectiveLevelCount,
} from '../data/activities';
import type { ActivityId, LevelResult, ProgressState } from '../types';

// v3: child name + configurable settings (maxNumber, maxAdditionTotal) added,
// decade bands extended from 5 to 10 (1-100) so bandStats grew — bump the key
// so old v1/v2 saves (which don't match the new schema) don't get merged in
// and corrupt state; they're simply superseded by a fresh default.
const STORAGE_KEY = 'number-garden-progress-v3';

const createDefaultProgress = (): ProgressState => {
  const activities = ACTIVITIES.reduce((acc, activity) => {
    acc[activity.id] = {
      level: 1,
      starsEarned: 0,
      bestAccuracy: 0,
      correctCount: 0,
      attemptCount: 0,
      levelsCompleted: [],
      bandStats: Array.from({ length: LEVEL_BANDS.length }, () => ({ correct: 0, attempts: 0 })),
    };
    return acc;
  }, {} as ProgressState['activities']);

  return {
    totalStars: 0,
    soundOn: true,
    lastPlayedAt: null,
    childName: null,
    maxNumber: DEFAULT_SETTINGS.maxNumber,
    maxAdditionTotal: DEFAULT_SETTINGS.maxAdditionTotal,
    wordMatchMaxNumber: DEFAULT_SETTINGS.wordMatchMaxNumber,
    activities,
  };
};

const isValidMaxNumber = (value: unknown): value is number =>
  typeof value === 'number' &&
  value >= MAX_NUMBER_MIN &&
  value <= MAX_NUMBER_MAX &&
  value % MAX_NUMBER_STEP === 0;

const isValidMaxAdditionTotal = (value: unknown): value is number =>
  typeof value === 'number' && (ADDITION_TOTAL_OPTIONS as readonly number[]).includes(value);

const loadProgress = (): ProgressState => {
  if (typeof window === 'undefined') return createDefaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const defaults = createDefaultProgress();
    const activities = { ...defaults.activities };
    for (const id of Object.keys(defaults.activities) as ActivityId[]) {
      const incoming = parsed.activities?.[id];
      if (!incoming) continue;
      activities[id] = {
        ...defaults.activities[id],
        ...incoming,
        bandStats:
          Array.isArray(incoming.bandStats) && incoming.bandStats.length === LEVEL_BANDS.length
            ? incoming.bandStats
            : defaults.activities[id].bandStats,
      };
    }
    const maxNumber = isValidMaxNumber(parsed.maxNumber) ? parsed.maxNumber : defaults.maxNumber;
    const maxAdditionTotal = isValidMaxAdditionTotal(parsed.maxAdditionTotal)
      ? parsed.maxAdditionTotal
      : defaults.maxAdditionTotal;
    const wordMatchMaxNumber = isValidMaxNumber(parsed.wordMatchMaxNumber)
      ? parsed.wordMatchMaxNumber
      : defaults.wordMatchMaxNumber;
    const childName =
      typeof parsed.childName === 'string' && parsed.childName.trim().length > 0
        ? parsed.childName.trim()
        : null;
    return { ...defaults, ...parsed, activities, maxNumber, maxAdditionTotal, wordMatchMaxNumber, childName };
  } catch {
    return createDefaultProgress();
  }
};

export const useProgress = () => {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      // Storage unavailable (private mode, quota). Progress stays in memory only.
    }
  }, [progress]);

  const toggleSound = useCallback(() => {
    setProgress((prev) => ({ ...prev, soundOn: !prev.soundOn }));
  }, []);

  const setMaxNumber = useCallback((value: number) => {
    setProgress((prev) => ({ ...prev, maxNumber: value }));
  }, []);

  const setMaxAdditionTotal = useCallback((value: number) => {
    setProgress((prev) => ({ ...prev, maxAdditionTotal: value }));
  }, []);

  const setWordMatchMaxNumber = useCallback((value: number) => {
    setProgress((prev) => ({ ...prev, wordMatchMaxNumber: value }));
  }, []);

  const setChildName = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setProgress((prev) => ({ ...prev, childName: trimmed }));
  }, []);

  const recordLevelResult = useCallback((result: LevelResult) => {
    setProgress((prev) => {
      const current = prev.activities[result.activityId];
      const activity = ACTIVITIES.find((a) => a.id === result.activityId);
      const maxLevel = getEffectiveLevelCount(result.activityId, activity?.levelCount ?? 5, {
        maxNumber: prev.maxNumber,
        maxAdditionTotal: prev.maxAdditionTotal,
        wordMatchMaxNumber: prev.wordMatchMaxNumber,
      });
      const nextLevel = result.leveledUp
        ? Math.min(current.level + 1, maxLevel)
        : current.level;
      const accuracy = result.total > 0 ? result.correct / result.total : 0;
      const levelsCompleted = current.levelsCompleted.includes(result.level)
        ? current.levelsCompleted
        : [...current.levelsCompleted, result.level];

      const bandIndex = Math.min(Math.max(result.level - 1, 0), current.bandStats.length - 1);
      const bandStats = current.bandStats.map((stat, i) =>
        i === bandIndex
          ? { correct: stat.correct + result.correct, attempts: stat.attempts + result.total }
          : stat,
      );

      return {
        ...prev,
        totalStars: prev.totalStars + result.starsEarned,
        lastPlayedAt: new Date().toISOString(),
        activities: {
          ...prev.activities,
          [result.activityId]: {
            level: nextLevel,
            starsEarned: current.starsEarned + result.starsEarned,
            bestAccuracy: Math.max(current.bestAccuracy, accuracy),
            correctCount: current.correctCount + result.correct,
            attemptCount: current.attemptCount + result.total,
            levelsCompleted,
            bandStats,
          },
        },
      };
    });
  }, []);

  const resetProgress = useCallback(() => {
    setProgress(createDefaultProgress());
  }, []);

  const getActivityProgress = useCallback(
    (id: ActivityId) => progress.activities[id],
    [progress],
  );

  return {
    progress,
    recordLevelResult,
    toggleSound,
    resetProgress,
    getActivityProgress,
    setMaxNumber,
    setMaxAdditionTotal,
    setWordMatchMaxNumber,
    setChildName,
  };
};
