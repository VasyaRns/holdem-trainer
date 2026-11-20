import { expect, it } from "vitest";
import { offsuitCombos, pairCombos, suitedCombos } from "./combos.ts";

it("пара 6, одномастные 4, разномастные 12", () => {
  expect(pairCombos("A")).toBe(6);
  expect(suitedCombos("A", "K")).toBe(4);
  expect(offsuitCombos("A", "K")).toBe(12);
});

it("один видимый туз оставляет 3 комбо тузов", () => {
  expect(pairCombos("A", ["As"])).toBe(3);
  expect(suitedCombos("A", "K", ["As"])).toBe(3);
});
