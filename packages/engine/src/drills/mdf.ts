import { easyMdf } from "./variety.ts";
import { makeDrill } from "./make.ts";

export const mdf = makeDrill("mdf", "MDF и альфа", "mdf", {
  easy: easyMdf,
  medium: easyMdf,
  hard: easyMdf,
});
