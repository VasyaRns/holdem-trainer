import { hardOuts, mediumOuts } from "./deeper.ts";
import { easyOuts } from "./variety.ts";
import { makeDrill } from "./make.ts";

export const outs = makeDrill("outs", "Ауты", "outs", {
  easy: easyOuts,
  medium: mediumOuts,
  hard: hardOuts,
});
