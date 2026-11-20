import { hardPot, mediumPot } from "./deeper.ts";
import { easyPot } from "./variety.ts";
import { makeDrill } from "./make.ts";

export const pot = makeDrill("pot", "Пот-оддсы", "pot", {
  easy: easyPot,
  medium: mediumPot,
  hard: hardPot,
});
