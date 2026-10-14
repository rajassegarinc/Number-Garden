import { useCallback, useState } from 'react';

const STORAGE_KEY = 'number-garden-flowerline-v1';
const MAX_ROUNDS_KEPT = 20;

export interface FlowerLineRoundRecord {
  at: string;
  firstTryCount: number;
  total: number;
  maxHintStage: number;
  struggledNumbers: number[];
}

export interface FlowerLineStats {
  perNumber: Record<number, { consecutiveFirstTry: number }>;
  rounds: FlowerLineRoundRecord[];
  pendingWarmupOffer: boolean;
}

const defaultStats = (): FlowerLineStats => ({
  perNumber: {},
  rounds: [],
  pendingWarmupOffer: false,
});

const load = (): FlowerLineStats => {
  if (typeof window === 'undefined') return defaultStats();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStats();
    const parsed = JSON.parse(raw) as Partial<FlowerLineStats>;
    return {
      perNumber: parsed.perNumber && typeof parsed.perNumber === 'object' ? parsed.perNumber : {},
      rounds: Array.isArray(parsed.rounds) ? parsed.rounds : [],
      pendingWarmupOffer: Boolean(parsed.pendingWarmupOffer),
    };
  } catch {
    return defaultStats();
  }
};

const save = (stats: FlowerLineStats) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // Storage unavailable (private mode, quota) — stats stay in memory only.
  }
};

interface RecordRoundInput {
  total: number;
  firstTryMap: Record<number, boolean>;
  maxHintStage: number;
  stage3Count: number;
}

/** Per-number mastery (for fading ten-frame dots) and round history (for the
 * Grown-ups panel), persisted independently of the app's main progress
 * store since this activity's "level" is always the same 1-10 round — what
 * matters here is which specific numbers are still shaky, not a level/stars
 * ladder. */
export const useFlowerLineStats = () => {
  const [stats, setStats] = useState<FlowerLineStats>(() => load());

  const dotsHiddenFor = useCallback(
    (value: number) => (stats.perNumber[value]?.consecutiveFirstTry ?? 0) >= 2,
    [stats],
  );

  const consumeWarmupOffer = useCallback(() => {
    setStats((prev) => {
      if (!prev.pendingWarmupOffer) return prev;
      const next = { ...prev, pendingWarmupOffer: false };
      save(next);
      return next;
    });
  }, []);

  const recordRound = useCallback((round: RecordRoundInput) => {
    setStats((prev) => {
      const perNumber = { ...prev.perNumber };
      const struggledNumbers: number[] = [];
      Object.entries(round.firstTryMap).forEach(([key, firstTry]) => {
        const n = Number(key);
        const existing = perNumber[n]?.consecutiveFirstTry ?? 0;
        perNumber[n] = { consecutiveFirstTry: firstTry ? existing + 1 : 0 };
        if (!firstTry) struggledNumbers.push(n);
      });
      const firstTryCount = Object.values(round.firstTryMap).filter(Boolean).length;
      const record: FlowerLineRoundRecord = {
        at: new Date().toISOString(),
        firstTryCount,
        total: round.total,
        maxHintStage: round.maxHintStage,
        struggledNumbers,
      };
      const rounds = [record, ...prev.rounds].slice(0, MAX_ROUNDS_KEPT);
      const next: FlowerLineStats = {
        perNumber,
        rounds,
        // Only offer a warm-up next time if THIS round needed heavy help —
        // never compounds across sessions, so she can't get permanently
        // stuck being offered it.
        pendingWarmupOffer: round.stage3Count >= 3,
      };
      save(next);
      return next;
    });
  }, []);

  return { stats, dotsHiddenFor, consumeWarmupOffer, recordRound };
};
