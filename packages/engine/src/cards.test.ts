import { expect, it } from "vitest";
import { fullDeck, handClass, parseCard } from "./cards.ts";

it("колода содержит 52 разные карты", () => {
  const deck = fullDeck();
  expect(deck).toHaveLength(52);
  expect(new Set(deck).size).toBe(52);
  expect(deck).toContain("As");
  expect(deck).toContain("2c");
});

it("имя руки отличает пару, одномастные и разномастные", () => {
  expect(handClass(parseCard("Ah"), parseCard("Ad"))).toBe("AA");
  expect(handClass(parseCard("As"), parseCard("Ks"))).toBe("AKs");
  expect(handClass(parseCard("Kd"), parseCard("Ac"))).toBe("AKo");
});

it("отклоняет мусор вместо карты", () => {
  expect(() => parseCard("A")).toThrow(/Не карта/);
  expect(() => parseCard("Ax")).toThrow(/Не карта/);
});
