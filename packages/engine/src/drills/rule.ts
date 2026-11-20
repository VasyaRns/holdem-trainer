import { easyRule } from "./variety.ts";
import { makeDrill } from "./make.ts";

export const rule = makeDrill("rule", "Правило 2 и 4", "rule", {
  easy: easyRule,
  medium: [
    { key: "flop-not-allin", kind: "number", expected: 18, formula: "На флопе впереди ещё ставка терна, оплачена одна карта: 9 × 2 = 18.", prompt: "Флоп, впереди ещё ставка терна, 9 аутов. Процент по правилу?" },
  ],
  hard: [
    { key: "exact-nine", kind: "number", expected: 35, formula: "Точно 35% из 47 неизвестных на две карты. Правило даёт 36.", prompt: "9 аутов, 47 неизвестных карт, две карты впереди. Точный процент?" },
    { key: "exact-one", kind: "number", expected: 20, formula: "9 / 46 ≈ 19,6%, до ближайшего процента это 20. Правило даёт 18.", prompt: "9 аутов, 46 неизвестных, одна карта. Точный процент?" },
  ],
});
