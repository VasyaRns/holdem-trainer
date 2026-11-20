import { mediumRule, hardRule } from "./deeper.ts";
import { easyRule } from "./variety.ts";
import { makeDrill } from "./make.ts";

export const rule = makeDrill("rule", "Правило 2 и 4", "rule", {
  easy: easyRule,
  medium: mediumRule,
  hard: hardRule,
});
