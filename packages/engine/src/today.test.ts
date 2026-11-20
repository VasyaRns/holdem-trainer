import { levelOpen, pickToday, sessionsLeft, type LevelStat } from "@holdem/domain";
import { expect, it } from "vitest";

it("до квоты 60 при 48 ответах остаётся одна сессия", () => {
  expect(sessionsLeft(48, "easy")).toBe(1);
  expect(sessionsLeft(60, "easy")).toBe(0);
  expect(sessionsLeft(61, "medium")).toBe(1);
});

it("сегодня берёт самый слабый незакрытый простой уровень", () => {
  const pick = pickToday([
    { drillId: "outs", level: "easy", total: 10, accuracy: 0.4 },
    { drillId: "rule", level: "easy", total: 10, accuracy: 0.9 },
  ]);
  expect(pick).toEqual({ drillId: "pot", level: "easy" });
});

it("средний закрыт, пока простой не набрал квоту и порог", () => {
  const short = [{ drillId: "outs", level: "easy" as const, total: 60, accuracy: 0.8 }];
  const ready = [{ drillId: "outs", level: "easy" as const, total: 60, accuracy: 0.9 }];
  expect(levelOpen(short, "outs", "medium")).toBe(false);
  expect(levelOpen(ready, "outs", "medium")).toBe(true);
  expect(levelOpen(ready, "outs", "hard")).toBe(false);
});

it("когда всё закрыто, сегодня берёт худшую точность", () => {
  const row = (drillId: string, level: LevelStat["level"], accuracy: number): LevelStat => ({
    drillId,
    level,
    total: level === "easy" ? 60 : level === "medium" ? 80 : 100,
    accuracy,
  });
  const stats = ["outs", "rule"].flatMap((drillId) => [
    row(drillId, "easy", drillId === "outs" ? 0.99 : 0.91),
    row(drillId, "medium", 0.9),
    row(drillId, "hard", drillId === "outs" ? 0.8 : 0.95),
  ]);
  expect(pickToday(stats, ["outs", "rule"])).toEqual({ drillId: "outs", level: "hard" });
});

it("закрытый простой открывает средний", () => {
  const pick = pickToday([
    { drillId: "outs", level: "easy", total: 60, accuracy: 0.95 },
    { drillId: "outs", level: "medium", total: 0, accuracy: 0 },
    { drillId: "rule", level: "easy", total: 60, accuracy: 1 },
  ]);
  expect(pick).toEqual({ drillId: "outs", level: "medium" });
});
