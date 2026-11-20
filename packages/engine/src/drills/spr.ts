import { hardSpr, mediumSpr } from "./deeper.ts";
import { easySpr } from "./variety.ts";
import { makeDrill } from "./make.ts";

export const spr = makeDrill("spr", "SPR", "spr", {
  easy: easySpr,
  medium: mediumSpr,
  hard: hardSpr,
});
