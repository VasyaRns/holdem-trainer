import { expect, it } from "vitest";
import { achievementKeys, unresolvedMistakes } from "../src/progress.ts";

it("ошибка закрывается следующим верным ответом на тот же ключ", () => {
  const first = new Date("2026-01-01T00:00:00Z");
  const later = new Date("2026-01-01T00:01:00Z");
  const open = unresolvedMistakes([
    { drillId: "outs", correct: false, question: { key: "flush" }, createdAt: first },
    { drillId: "outs", correct: true, question: { key: "flush" }, createdAt: later },
    { drillId: "outs", correct: false, question: { key: "gut" }, createdAt: later },
  ]);
  expect(open.map((row) => row.question.key)).toEqual(["gut"]);
});

it("достижение пишется один раз по условию", () => {
  expect(achievementKeys({ sessionCount: 0, correctStreak: 0, maxCorrectInOneDrill: 0 })).toEqual([]);
  expect(achievementKeys({ sessionCount: 1, correctStreak: 10, maxCorrectInOneDrill: 50 })).toEqual([
    "first_session",
    "streak_10",
    "fifty_correct",
  ]);
});
