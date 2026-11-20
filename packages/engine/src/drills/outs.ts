import { winningOuts } from "../outs.ts";
import { makeDrill } from "./make.ts";

const exact = winningOuts(["Ah", "Kh"], ["2c", "3d"], ["Qh", "7h", "2s"]).length;

export const outs = makeDrill("outs", "Ауты", "outs", {
  easy: [
    { key: "flush", kind: "number", expected: 9, formula: "Две карты в руке и две на борде одной масти: 13 − 4 = 9.", prompt: "Флеш-дро. Сколько аутов?" },
    { key: "oesd", kind: "number", expected: 8, formula: "Двустороннее стрит-дро закрывают два ранга, по четыре карты: 8.", prompt: "Двустороннее стрит-дро. Сколько аутов?" },
    { key: "gut", kind: "number", expected: 4, formula: "Гатшот закрывает один ранг: 4 карты.", prompt: "Гатшот. Сколько аутов?" },
  ],
  medium: [
    {
      key: "flush-block",
      kind: "number",
      expected: 8,
      formula: "Из девяти червей одна уже видна. Остаётся 8.",
      prompt: "Флеш-дро в червях, и Jh уже видна. Сколько аутов?",
    },
  ],
  hard: [
    {
      key: "exact-flush",
      kind: "number",
      expected: exact,
      formula: `Против пары двоек выигрывают 9 червей и пары тузов или королей. Вместе ${exact}.`,
      prompt: "У вас AhKh, у оппонента 2c3d, борд Qh7h2s. Сколько карт дают вам победу на терне?",
    },
  ],
});
