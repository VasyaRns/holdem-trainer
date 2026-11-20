import { expect, it } from "vitest";
import { asPercent } from "./odds.ts";
import { alpha, minimumDefenseFrequency, stackToPot } from "./defense.ts";

it("пот-бет: MDF 50 и альфа 50; полпота 67 и 33; треть банка 75 и 25", () => {
  expect(asPercent(minimumDefenseFrequency(10, 10))).toBe(50);
  expect(asPercent(alpha(10, 10))).toBe(50);
  expect(asPercent(minimumDefenseFrequency(10, 5))).toBe(67);
  expect(asPercent(alpha(10, 5))).toBe(33);
  expect(asPercent(minimumDefenseFrequency(30, 10))).toBe(75);
  expect(asPercent(alpha(30, 10))).toBe(25);
});

it("альфа и MDF в сумме дают единицу, SPR — стек делить на банк", () => {
  expect(minimumDefenseFrequency(10, 5) + alpha(10, 5)).toBeCloseTo(1);
  expect(stackToPot(100, 20)).toBe(5);
});
