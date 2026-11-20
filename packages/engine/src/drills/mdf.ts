import { makeDrill } from "./make.ts";

export const mdf = makeDrill("mdf", "MDF и альфа", "mdf", {
  easy: [
    { key: "pot", kind: "pair", expected: [50, 50], formula: "Банк до ставки 10, ставка 10. MDF 50%, альфа 50%.", prompt: "Банк до ставки 10, ставка 10. MDF и альфа в процентах?" },
  ],
  medium: [
    { key: "half", kind: "pair", expected: [67, 33], formula: "Полпота: MDF 67%, альфа 33%. Это не цена колла.", prompt: "Банк до ставки 10, ставка 5. MDF и альфа в процентах?" },
  ],
  hard: [
    { key: "third", kind: "pair", expected: [75, 25], formula: "Треть банка: MDF 75%, альфа 25%.", prompt: "Банк до ставки 30, ставка 10. MDF и альфа в процентах?" },
  ],
});
