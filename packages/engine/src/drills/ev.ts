import { hardEv, mediumEv } from "./deeper.ts";
import { easyEv } from "./variety.ts";
import { makeDrill } from "./make.ts";

export const ev = makeDrill("ev", "EV колла", "ev", {
  easy: easyEv,
  medium: mediumEv,
  hard: hardEv,
});
