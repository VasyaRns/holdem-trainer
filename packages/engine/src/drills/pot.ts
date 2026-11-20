import { easyPot, easyChoices } from "./variety.ts";
import { makeDrill } from "./make.ts";

export const pot = makeDrill("pot", "Пот-оддсы", "pot", {
  easy: easyPot,
  medium: easyPot,
  hard: easyChoices,
});
