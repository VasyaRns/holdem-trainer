import { expect, it } from "vitest";
import { asPercent, callChoice, callEv, potOdds } from "./odds.ts";

it("пот-бет 33%, полпота 25%, треть банка 20%", () => {
  expect(asPercent(potOdds(20, 10))).toBe(33);
  expect(asPercent(potOdds(15, 5))).toBe(25);
  expect(asPercent(potOdds(40, 10))).toBe(20);
});

it("нулевой EV разрешает и колл, и фолд", () => {
  const price = potOdds(20, 10);
  expect(callEv(price, 20, 10)).toBeCloseTo(0);
  expect(callChoice(price, price)).toBe("either");
  expect(callChoice(price + 0.01, price)).toBe("call");
  expect(callChoice(price - 0.01, price)).toBe("fold");
});
