import { makeDrill } from "./make.ts";

export const pot = makeDrill("pot", "Пот-оддсы", "pot", {
  easy: [
    { key: "pot", kind: "number", expected: 33, formula: "Банк перед вами 20, колл 10: 10 / 30 ≈ 33%.", prompt: "Банк перед вами 20, колл 10. Цена колла в процентах?" },
    { key: "half", kind: "number", expected: 25, formula: "Банк перед вами 15, колл 5: 5 / 20 = 25%.", prompt: "Банк перед вами 15, колл 5. Цена колла в процентах?" },
    { key: "third", kind: "number", expected: 20, formula: "Банк перед вами 40, колл 10: 10 / 50 = 20%.", prompt: "Банк перед вами 40, колл 10. Цена колла в процентах?" },
  ],
  medium: [
    { key: "odd", kind: "number", expected: 25, formula: "Колл 30 при банке 90: 30 / 120 = 25%.", prompt: "Банк перед вами 90, колл 30. Цена колла в процентах?" },
  ],
  hard: [
    { key: "call", kind: "choice", expected: "call", formula: "Эквити 40% больше цены 33%. Это колл.", prompt: "Цена колла 33%, ваша эквити 40%. Колл или фолд?" },
    { key: "tie", kind: "choice", expected: "either", formula: "Эквити равна цене, EV нулевой. Верны оба ответа.", prompt: "Цена колла 25%, ваша эквити 25%. Колл или фолд?" },
  ],
});
