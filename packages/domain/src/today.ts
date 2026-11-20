import { QUOTAS, type LevelId } from "./quota.ts";

export const MATH_DRILLS = ["outs", "rule", "pot", "combos", "ev", "mdf", "spr"] as const;

export type LevelStat = {
  drillId: string;
  level: LevelId;
  total: number;
  accuracy: number;
};

export function levelCleared(stat: LevelStat | undefined, level: LevelId): boolean {
  if (!stat) return false;
  const quota = QUOTAS[level];
  return stat.total >= quota.count && stat.accuracy >= quota.accuracy;
}

export function pickToday(stats: LevelStat[], drills: readonly string[] = MATH_DRILLS): { drillId: string; level: LevelId } {
  const open: { drillId: string; level: LevelId; accuracy: number; ratio: number }[] = [];
  for (const drillId of drills) {
    const easy = stats.find((stat) => stat.drillId === drillId && stat.level === "easy");
    const medium = stats.find((stat) => stat.drillId === drillId && stat.level === "medium");
    const levels: LevelId[] = ["easy"];
    if (levelCleared(easy, "easy")) levels.push("medium");
    if (levelCleared(medium, "medium")) levels.push("hard");
    for (const level of levels) {
      const stat = stats.find((item) => item.drillId === drillId && item.level === level);
      if (levelCleared(stat, level)) continue;
      open.push({
        drillId,
        level,
        accuracy: stat?.accuracy ?? 0,
        ratio: (stat?.total ?? 0) / QUOTAS[level].count,
      });
    }
  }
  open.sort((a, b) => a.accuracy - b.accuracy || a.ratio - b.ratio);
  const weakest = open[0];
  return weakest ? { drillId: weakest.drillId, level: weakest.level } : { drillId: drills[0] ?? "outs", level: "easy" };
}
