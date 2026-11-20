import { MATH_DRILLS, levelCleared, type LevelId, type LevelStat } from "@holdem/domain";

export type AnswerRow = {
  drillId: string;
  level: string;
  correct: boolean;
  question: { key?: string; handId?: string };
  createdAt: Date;
};

export function questionKey(question: { key?: string; handId?: string }): string {
  return question.key ?? question.handId ?? "";
}

export function unresolvedMistakes(answers: AnswerRow[]): AnswerRow[] {
  const latest = new Map<string, AnswerRow>();
  const ordered = [...answers].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  for (const answer of ordered) {
    const key = `${answer.drillId}:${answer.level}:${questionKey(answer.question)}`;
    if (key.endsWith(":")) continue;
    latest.set(key, answer);
  }
  return [...latest.values()]
    .filter((answer) => !answer.correct)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

export type ProgressSnapshot = {
  sessionCount: number;
  correctStreak: number;
  maxCorrectInOneDrill: number;
  mediumOpen: boolean;
  hardOpen: boolean;
  accurateThirty: boolean;
  allEasyCleared: boolean;
  week: boolean;
  pairsClean: boolean;
};

export function achievementKeys(snapshot: ProgressSnapshot): string[] {
  const keys: string[] = [];
  if (snapshot.sessionCount >= 1) keys.push("first_session");
  if (snapshot.correctStreak >= 10) keys.push("streak_10");
  if (snapshot.maxCorrectInOneDrill >= 50) keys.push("fifty_correct");
  if (snapshot.mediumOpen) keys.push("medium_open");
  if (snapshot.hardOpen) keys.push("hard_open");
  if (snapshot.accurateThirty) keys.push("accurate_30");
  if (snapshot.allEasyCleared) keys.push("easy_sweep");
  if (snapshot.week) keys.push("week");
  if (snapshot.pairsClean) keys.push("pairs_clean");
  return keys;
}

export function statsFromAnswers(answers: AnswerRow[]): LevelStat[] {
  const groups = new Map<string, AnswerRow[]>();
  for (const answer of answers) {
    if (answer.level !== "easy" && answer.level !== "medium" && answer.level !== "hard") continue;
    const key = `${answer.drillId}:${answer.level}`;
    const list = groups.get(key) ?? [];
    list.push(answer);
    groups.set(key, list);
  }
  return [...groups.entries()].map(([key, rows]) => {
    const [drillId, level] = key.split(":") as [string, LevelId];
    const recent = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 20);
    const correct = recent.filter((row) => row.correct).length;
    return { drillId, level, total: rows.length, accuracy: recent.length === 0 ? 0 : correct / recent.length };
  });
}

export function mediumOpen(stats: LevelStat[]): boolean {
  return stats.some((stat) => stat.level === "easy" && levelCleared(stat, "easy"));
}

export function hardOpen(stats: LevelStat[]): boolean {
  return stats.some((stat) => stat.level === "medium" && levelCleared(stat, "medium"));
}

export function allEasyCleared(stats: LevelStat[]): boolean {
  return MATH_DRILLS.every((drillId) => levelCleared(stats.find((stat) => stat.drillId === drillId && stat.level === "easy"), "easy"));
}

export function lastThirtyAccurate(answers: { correct: boolean; createdAt: Date }[]): boolean {
  const recent = [...answers].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 30);
  if (recent.length < 30) return false;
  return recent.filter((row) => row.correct).length / recent.length >= 0.9;
}

export function hasDayRun(answers: { createdAt: Date; today?: boolean }[], days: number, perDay: number): boolean {
  const counts = new Map<string, number>();
  for (const answer of answers) {
    if (!answer.today) continue;
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Moscow",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(answer.createdAt);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  const qualified = [...counts.entries()]
    .filter(([, count]) => count >= perDay)
    .map(([day]) => day)
    .sort();
  let run = 0;
  let previous = "";
  for (const day of qualified) {
    const gap = previous ? Date.parse(`${day}T00:00:00Z`) - Date.parse(`${previous}T00:00:00Z`) : 0;
    run = gap === 86_400_000 ? run + 1 : 1;
    if (run >= days) return true;
    previous = day;
  }
  return false;
}
