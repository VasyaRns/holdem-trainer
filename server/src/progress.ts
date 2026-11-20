export type AnswerRow = {
  drillId: string;
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
    const key = `${answer.drillId}:${questionKey(answer.question)}`;
    if (key.endsWith(":")) continue;
    latest.set(key, answer);
  }
  return [...latest.values()].filter((answer) => !answer.correct);
}

export type ProgressSnapshot = {
  sessionCount: number;
  correctStreak: number;
  maxCorrectInOneDrill: number;
};

export function achievementKeys(snapshot: ProgressSnapshot): string[] {
  const keys: string[] = [];
  if (snapshot.sessionCount >= 1) keys.push("first_session");
  if (snapshot.correctStreak >= 10) keys.push("streak_10");
  if (snapshot.maxCorrectInOneDrill >= 50) keys.push("fifty_correct");
  return keys;
}
