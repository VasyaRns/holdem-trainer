import { hardCombos, mediumCombos } from "./deeper.ts";
import { easyCombos } from "./variety.ts";
import { makeDrill } from "./make.ts";

export const combos = makeDrill("combos", "Комбинации", "combos", {
  easy: easyCombos,
  medium: mediumCombos,
  hard: hardCombos,
});
