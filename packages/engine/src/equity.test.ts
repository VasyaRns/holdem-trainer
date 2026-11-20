import { expect, it } from "vitest";
import { acesVersusKingsEquity, backdoorFlushProbability, cardsToCome, hitPercent, rulePercent } from "./equity.ts";

it("правило 4 только когда видны обе карты, иначе 2", () => {
  expect(cardsToCome("flop", true)).toBe(2);
  expect(cardsToCome("flop", false)).toBe(1);
  expect(cardsToCome("turn", true)).toBe(1);
  expect(rulePercent(9, 2)).toBe(36);
  expect(rulePercent(9, 1)).toBe(18);
});

it("девять аутов точно 35 и 20, пятнадцать аутов точно 54", () => {
  expect(hitPercent(9, 47, 2)).toBe(35);
  expect(hitPercent(9, 46, 1)).toBe(20);
  expect(hitPercent(15, 47, 2)).toBe(54);
  expect(rulePercent(15, 2)).toBe(60);
});

it("бэкдорное флеш-дро около 4 процентов", () => {
  expect(backdoorFlushProbability()).toBeCloseTo(0.0416, 3);
  expect(Math.round(backdoorFlushProbability() * 100)).toBe(4);
});

it("AA против KK даёт 81,9% с учётом ничьих", async () => {
  expect((await acesVersusKingsEquity()) * 100).toBeCloseTo(81.9, 1);
}, 180_000);
