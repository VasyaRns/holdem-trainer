import { MATH_DRILLS, type LevelId, type LevelStat } from "@holdem/domain";

const json = { "content-type": "application/json" };
const levels: LevelId[] = ["easy", "medium", "hard"];

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", credentials: "include", headers: json, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(await response.text());
  return response.json() as Promise<T>;
}

export type WriteResult = { id: string; unlocked: string[] };

export type LevelSummary = {
  total: number;
  count: number;
  correct: number;
  accuracy: number;
};

export type AnswerDraft = {
  question: { key: string; handId: string };
  response: unknown;
  correct: boolean;
  miss: number;
  durationMs: number;
};

const opening = new Map<string, Promise<WriteResult>>();

export function openSession(drillId: string, level: string, today = false) {
  const key = `${drillId}:${level}:${today ? "today" : "drill"}`;
  const pending = opening.get(key);
  if (pending) return pending;
  const request = postJson<WriteResult>("/api/sessions", { drillId, level, today }).finally(() => {
    if (opening.get(key) === request) opening.delete(key);
  });
  opening.set(key, request);
  return request;
}

export function saveAnswer(sessionId: string, answer: AnswerDraft) {
  return postJson<WriteResult>(`/api/sessions/${sessionId}/answers`, {
    question: answer.question,
    response: { value: answer.response, miss: answer.miss },
    correct: answer.correct,
    durationMs: answer.durationMs,
  });
}

export type Mistake = { drillId: string; level: string; key: string };

export function loadMistakes() {
  return getJson<{ mistakes: Mistake[] }>("/api/mistakes");
}

export function loadAchievements() {
  return getJson<{ achievements: string[] }>("/api/achievements");
}

export function loadLevel(drillId: string, level: string) {
  return getJson<LevelSummary>(`/api/drills/${drillId}/levels/${level}`);
}

export async function loadMathStats(): Promise<{ stats: LevelStat[]; failed: boolean }> {
  const rows = await Promise.all(
    MATH_DRILLS.flatMap((drillId) =>
      levels.map(async (level) => {
        try {
          const body = await loadLevel(drillId, level);
          return { drillId, level, total: body.total, accuracy: body.accuracy, failed: false };
        } catch {
          return { drillId, level, total: 0, accuracy: 0, failed: true };
        }
      }),
    ),
  );
  const failedDrills = new Set(rows.filter((row) => row.failed).map((row) => row.drillId));
  return {
    failed: failedDrills.size > 0,
    stats: rows
      .filter((row) => !row.failed && !failedDrills.has(row.drillId))
      .map(({ drillId, level, total, accuracy }) => ({ drillId, level, total, accuracy })),
  };
}
