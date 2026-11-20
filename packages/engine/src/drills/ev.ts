import { makeDrill } from "./make.ts";

export const ev = makeDrill("ev", "EV колла", "ev", {
  easy: [
    { key: "zero", kind: "number", expected: 0, formula: "0,5 × (10 + 10) − 10 = 0.", prompt: "Эквити 50%, банк перед вами 10, колл 10. EV в фишках?" },
  ],
  medium: [
    { key: "plus", kind: "number", expected: 2, formula: "0,4 × (20 + 10) − 10 = 2.", prompt: "Эквити 40%, банк перед вами 20, колл 10. EV в фишках?" },
  ],
  hard: [
    { key: "sign", kind: "choice", expected: "call", formula: "EV положительный: 0,4 × 30 − 10 = 2. Это колл.", prompt: "Эквити 40%, банк перед вами 20, колл 10. Колл или фолд?" },
  ],
});
