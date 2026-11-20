import { variedMdf } from "./deeper.ts";
import { makeDrill } from "./make.ts";

export const mdf = makeDrill("mdf", "MDF и альфа", "mdf", {
  easy: variedMdf,
  medium: variedMdf,
  hard: variedMdf,
});
