import { expect, it } from "vitest";
import { readQuestion } from "./question-prompt";

it("гатшот показывает карты отдельно от вопроса", () => {
  const view = readQuestion("У вас 9c 7c, борд 6d 5h Ks. Гатшот, не хватает восьмёрки. Сколько аутов?");
  expect(view.ask).toBe("Гатшот, не хватает восьмёрки. Сколько аутов?");
  expect(view.groups.map((group) => [group.label, group.cards.map((card) => card.rank + card.suit).join(" ")])).toEqual([
    ["В руке", "9c 7c"],
    ["На борде", "6d 5h Ks"],
  ]);
});

it("склеенные карты оппонента тоже разбираются", () => {
  const view = readQuestion("У вас AhKh, у оппонента QsQd, борд Qh 7h 2c. у оппонента сет дам. Сколько карт на терне дают вам победу?");
  expect(view.ask).toBe("У оппонента сет дам. Сколько карт на терне дают вам победу?");
  expect(view.groups[1]?.cards.map((card) => card.rank + card.suit)).toEqual(["Qs", "Qd"]);
});

it("вопрос без карт остаётся текстом", () => {
  const prompt = "Сколько одномастных комбо у AKs?";
  expect(readQuestion(prompt)).toEqual({ groups: [], ask: prompt });
});
