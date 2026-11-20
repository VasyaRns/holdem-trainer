import { makeDrill } from "./make.ts";

export const spr = makeDrill("spr", "SPR", "spr", {
  easy: [
    { key: "even", kind: "number", expected: 5, formula: "Эффективный стек 100, банк 20: 100 / 20 = 5.", prompt: "Стек 100, банк 20. SPR?" },
  ],
  medium: [
    { key: "after", kind: "number", expected: 4, formula: "После ставки стек 80, банк 20: 80 / 20 = 4.", prompt: "После ставки стек 80, банк 20. SPR?" },
  ],
  hard: [
    { key: "odd", kind: "number", expected: 6.3, formula: "250 / 40 = 6,25, до десятой это 6,3.", prompt: "Стек 250, банк 40. SPR до одной десятой?" },
  ],
});
