export const LEVELS = ["easy", "medium", "hard"] as const;

export type LevelId = (typeof LEVELS)[number];

export const QUOTAS: Record<LevelId, { count: number; accuracy: number }> = {
  easy: { count: 60, accuracy: 0.9 },
  medium: { count: 80, accuracy: 0.85 },
  hard: { count: 100, accuracy: 0.8 },
};
