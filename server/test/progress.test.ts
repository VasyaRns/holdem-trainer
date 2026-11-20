import { expect, it } from "vitest";
import { achievementKeys, allEasyCleared, chartStats, hardOpen, hasDayRun, lastThirtyAccurate, mediumOpen, statsFromAnswers, unresolvedMistakes } from "../src/progress.ts";

it("ошибка закрывается верным ответом того же уровня", () => {
  const first = new Date("2026-01-01T00:00:00Z");
  const later = new Date("2026-01-01T00:01:00Z");
  const row = (level: string, correct: boolean, key: string) => ({
    drillId: "outs",
    level,
    correct,
    question: { key },
    createdAt: correct ? later : first,
  });
  const older = new Date("2026-01-01T00:00:00Z");
  const newer = new Date("2026-01-01T00:02:00Z");
  const ordered = unresolvedMistakes([
    { drillId: "outs", level: "easy", correct: false, question: { key: "gut" }, createdAt: newer },
    { drillId: "outs", level: "easy", correct: false, question: { key: "flush" }, createdAt: older },
  ]);
  expect(ordered.map((item) => item.question.key)).toEqual(["flush", "gut"]);
  expect(unresolvedMistakes([row("easy", false, "flush"), row("medium", true, "flush")]).map((item) => item.question.key)).toEqual(["flush"]);
  expect(
    unresolvedMistakes([row("easy", false, "flush"), row("medium", true, "flush"), row("easy", true, "flush"), row("easy", false, "gut")]).map(
      (item) => item.question.key,
    ),
  ).toEqual(["gut"]);
});

const quiet = {
  sessionCount: 0,
  correctStreak: 0,
  maxCorrectInOneDrill: 0,
  mediumOpen: false,
  hardOpen: false,
  accurateThirty: false,
  allEasyCleared: false,
  week: false,
  pairsClean: false,
};

it("достижение пишется один раз по условию", () => {
  expect(achievementKeys(quiet)).toEqual([]);
  expect(achievementKeys({ ...quiet, sessionCount: 1, correctStreak: 10, maxCorrectInOneDrill: 50, mediumOpen: true, week: true })).toEqual([
    "first_session",
    "streak_10",
    "fifty_correct",
    "medium_open",
    "week",
  ]);
});

it("средний открывается квотой простого, а семь дней требуют подряд по 20 ответов", () => {
  const at = (day: number, index: number) => new Date(Date.parse("2026-01-01T00:00:00Z") + day * 86_400_000 + index * 1000);
  const easy = Array.from({ length: 60 }, (_, index) => ({
    drillId: "outs",
    level: "easy",
    correct: true,
    question: { key: "flush" },
    createdAt: at(0, index),
  }));
  expect(mediumOpen(statsFromAnswers(easy))).toBe(true);
  expect(hardOpen(statsFromAnswers(easy))).toBe(false);
  const days = [0, 1, 2].flatMap((day) =>
    Array.from({ length: day === 2 ? 19 : 20 }, (_, index) => ({ createdAt: at(day, index), today: true })),
  );
  expect(hasDayRun(days, 3, 20)).toBe(false);
  expect(hasDayRun([...days, { createdAt: at(2, 19), today: true }], 3, 20)).toBe(true);
  expect(hasDayRun(days.map((item) => ({ ...item, today: false })), 3, 20)).toBe(false);
  expect(
    hasDayRun(
      [
        ...Array.from({ length: 20 }, (_, index) => ({ createdAt: at(0, index), today: true })),
        ...Array.from({ length: 20 }, (_, index) => ({ createdAt: at(2, index), today: true })),
      ],
      3,
      20,
    ),
  ).toBe(false);
  const thirty = Array.from({ length: 30 }, (_, index) => ({ correct: index < 27, createdAt: at(0, index) }));
  expect(lastThirtyAccurate(thirty)).toBe(true);
  expect(lastThirtyAccurate(thirty.slice(0, 29))).toBe(false);
  expect(allEasyCleared(statsFromAnswers(easy))).toBe(false);
});

it("статистика набора считается только по ответам этого чарта", () => {
  const answers = [
    { question: { chartId: "utg-open-10" }, correct: true },
    { question: { chartId: "utg-open-10" }, correct: false },
    { question: { chartId: "bu-open-10" }, correct: true },
  ];
  expect(chartStats(answers, "utg-open-10")).toEqual({ total: 2, correct: 1, accuracy: 0.5 });
  expect(chartStats(answers, "missing")).toEqual({ total: 0, correct: 0, accuracy: 0 });
});
