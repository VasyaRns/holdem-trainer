import { makeDrill } from "./make.ts";

export const combos = makeDrill("combos", "Комбинации", "combos", {
  easy: [
    { key: "pair", kind: "number", expected: 6, formula: "Пара: 4×3 / 2 = 6.", prompt: "Сколько комбо у карманных тузов?" },
    { key: "suited", kind: "number", expected: 4, formula: "Одномастные: по одной на масть, 4.", prompt: "Сколько комбо у одномастного AK?" },
    { key: "offsuit", kind: "number", expected: 12, formula: "Разномастные: 16 − 4 = 12.", prompt: "Сколько комбо у разномастного AK?" },
  ],
  medium: [
    { key: "board-ace", kind: "number", expected: 3, formula: "На борде туз. У пары тузов остаётся C(3,2) = 3.", prompt: "На борде туз. Сколько комбо карманных тузов ещё живы?" },
  ],
  hard: [
    { key: "held-ace", kind: "number", expected: 3, formula: "Один туз у вас в руке. Остаётся 3 комбо чужих тузов.", prompt: "У вас As. Сколько комбо чужих карманных тузов осталось?" },
  ],
});
