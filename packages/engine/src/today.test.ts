import { pickToday } from "@holdem/domain";
import { expect, it } from "vitest";

it("сегодня берёт самый слабый незакрытый простой уровень", () => {
  const pick = pickToday([
    { drillId: "outs", level: "easy", total: 10, accuracy: 0.4 },
    { drillId: "rule", level: "easy", total: 10, accuracy: 0.9 },
  ]);
  expect(pick).toEqual({ drillId: "pot", level: "easy" });
});

it("закрытый простой открывает средний", () => {
  const pick = pickToday([
    { drillId: "outs", level: "easy", total: 60, accuracy: 0.95 },
    { drillId: "outs", level: "medium", total: 0, accuracy: 0 },
    { drillId: "rule", level: "easy", total: 60, accuracy: 1 },
  ]);
  expect(pick).toEqual({ drillId: "outs", level: "medium" });
});
