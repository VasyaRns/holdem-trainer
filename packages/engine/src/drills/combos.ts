import { easyCombos } from "./variety.ts";
import { makeDrill, type Card } from "./make.ts";

const blocked: Card[] = [
  { key: "board-ace", kind: "number", expected: 3, formula: "На борде туз. У пары тузов остаётся 3 комбо.", prompt: "На борде As. Сколько комбо карманных тузов ещё живы?" },
  { key: "board-king", kind: "number", expected: 3, formula: "На борде король. У пары королей остаётся 3 комбо.", prompt: "На борде Kd. Сколько комбо карманных королей ещё живы?" },
  { key: "held-ace", kind: "number", expected: 3, formula: "Один туз у вас в руке. Остаётся 3 комбо чужих тузов.", prompt: "У вас As5h. Сколько комбо чужих карманных тузов осталось?" },
  { key: "held-king", kind: "number", expected: 3, formula: "Один король у вас в руке. Остаётся 3 комбо чужих королей.", prompt: "У вас KhQd. Сколько комбо чужих карманных королей осталось?" },
];

export const combos = makeDrill("combos", "Комбинации", "combos", {
  easy: easyCombos,
  medium: blocked,
  hard: blocked,
});
