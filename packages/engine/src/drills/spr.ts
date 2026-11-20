import { easySpr } from "./variety.ts";
import { makeDrill, type Card } from "./make.ts";

const tenths: Card[] = [
  { key: "tenth", kind: "number", expected: 6.3, formula: "250 / 40 = 6,25, до десятой это 6,3.", prompt: "Стек 250, банк 40. SPR до одной десятой?" },
  { key: "tenth", kind: "number", expected: 3.5, formula: "70 / 20 = 3,5.", prompt: "Стек 70, банк 20. SPR до одной десятой?" },
  { key: "tenth", kind: "number", expected: 2.5, formula: "100 / 40 = 2,5.", prompt: "Стек 100, банк 40. SPR до одной десятой?" },
];

export const spr = makeDrill("spr", "SPR", "spr", {
  easy: easySpr,
  medium: easySpr,
  hard: tenths,
});
