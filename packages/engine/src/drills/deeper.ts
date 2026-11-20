import type { Card as PlayingCard } from "../cards.ts";
import { alpha, minimumDefenseFrequency } from "../defense.ts";
import { hitPercent, rulePercent } from "../equity.ts";
import { asPercent, callChoice, callEv, potOdds } from "../odds.ts";
import { winningOuts } from "../outs.ts";
import type { Card } from "./make.ts";

function number(key: string, expected: number, prompt: string, formula: string): Card {
  return { key, kind: "number", expected, prompt, formula };
}

function choice(key: string, expected: "call" | "fold" | "either", prompt: string, formula: string): Card {
  return { key, kind: "choice", expected, prompt, formula };
}

function pair(key: string, expected: [number, number], prompt: string, formula: string): Card {
  return { key, kind: "pair", expected, prompt, formula };
}

const blockedFlushes = [
  ["Ah Kh", "Qh 7h 2c", "Jh", "червей"],
  ["Qd Jd", "Td 4d Kc", "9d", "бубен"],
  ["9s 8s", "2s 5s Ah", "Ks", "пик"],
  ["Ac 5c", "Kc 9c 2h", "Qc", "треф"],
  ["Ts 6s", "4s 2s Qh", "Js", "пик"],
  ["7h 6h", "5h Ad Kc", "3h", "червей"],
] as const;

const blockedStraights = [
  ["Jh Th", "9c 8d 2s", "Qh", 7, "одна дама уже открыта, семёрки целы"],
  ["Tc 9c", "8h 7d As", "6d", 7, "одна шестёрка уже открыта, валеты целы"],
  ["8d 7d", "6c 5h Ks", "9h", 7, "одна девятка уже открыта"],
  ["Jh 9h", "8c 7d 2s", "Td", 3, "гатшоту нужна десятка, и одна уже открыта"],
  ["Kh Td", "9c 8d 2s", "Jh", 3, "гатшоту нужен валет, и один уже открыт"],
] as const;

export const mediumOuts: Card[] = [
  ...blockedFlushes.map(([hand, board, dead, suit]) =>
    number(
      "flush-block",
      8,
      `У вас ${hand}, борд ${board}, и ${dead} уже видна. Флеш-дро в ${suit}. Сколько аутов?`,
      "Из девяти карт масти одна уже видна. Остаётся 8.",
    ),
  ),
  ...blockedStraights.map(([hand, board, dead, count, why]) =>
    number(
      "straight-block",
      count,
      `У вас ${hand}, борд ${board}, и ${dead} уже видна. ${why}. Сколько аутов?`,
      count === 7 ? "Было 8 карт, одна снята. Остаётся 7." : "Было 4 карты, одна снята. Остаётся 3.",
    ),
  ),
];

const hardSpots: { hero: [PlayingCard, PlayingCard]; villain: [PlayingCard, PlayingCard]; board: [PlayingCard, PlayingCard, PlayingCard]; line: string }[] = [
  { hero: ["Ah", "Kh"], villain: ["Qs", "Qd"], board: ["Qh", "7h", "2c"], line: "у оппонента сет дам" },
  { hero: ["Ah", "Kh"], villain: ["2c", "3d"], board: ["Qh", "7h", "2s"], line: "у оппонента пара двоек" },
  { hero: ["Jh", "Th"], villain: ["As", "Kd"], board: ["9c", "8d", "2s"], line: "у оппонента туз-король" },
  { hero: ["9h", "8h"], villain: ["Ac", "Ad"], board: ["7c", "6d", "2s"], line: "у оппонента пара тузов" },
  { hero: ["Ah", "5h"], villain: ["Kc", "Kd"], board: ["Qh", "9h", "3c"], line: "у оппонента пара королей" },
  { hero: ["6s", "5s"], villain: ["Ah", "Kd"], board: ["4c", "3d", "9h"], line: "у оппонента туз-король" },
  { hero: ["Qd", "Jd"], villain: ["As", "Kh"], board: ["Tc", "8h", "2s"], line: "у оппонента туз-король, гатшот" },
  { hero: ["Kc", "Qc"], villain: ["Ad", "Jd"], board: ["Jc", "4c", "2h"], line: "у оппонента туз и валет с борда" },
];

export const hardOuts: Card[] = hardSpots.map((spot) => {
  const count = winningOuts(spot.hero, spot.villain, spot.board).length;
  return number(
    "exact",
    count,
    `У вас ${spot.hero.join("")}, у оппонента ${spot.villain.join("")}, борд ${spot.board.join(" ")}. ${spot.line}. Сколько карт на терне дают вам победу?`,
    `Считаются только карты, после которых ваша рука старше. Ничья не аут. Таких карт ${count}.`,
  );
});

const ruleScenes = [
  [9, 1, "Флоп, впереди ещё ставка терна, флеш-дро"],
  [8, 1, "Флоп, впереди ещё ставка терна, двустороннее дро"],
  [4, 1, "Флоп, впереди ещё ставка терна, гатшот"],
  [6, 1, "Флоп, впереди ещё ставка терна, две оверкарты"],
  [9, 1, "Уже терн, флеш-дро"],
  [8, 1, "Уже терн, двустороннее дро"],
  [4, 1, "Уже терн, гатшот"],
  [9, 2, "Оппонент в олл-ине на флопе, флеш-дро"],
  [8, 2, "Оппонент в олл-ине на флопе, двустороннее дро"],
  [4, 2, "Оппонент в олл-ине на флопе, гатшот"],
] as const;

export const mediumRule: Card[] = ruleScenes.map(([outs, cards, scene]) => {
  const percent = rulePercent(outs, cards as 1 | 2);
  return number(
    cards === 2 ? "both" : "one",
    percent,
    `${scene}. Аутов ${outs}. Процент по правилу?`,
    cards === 2 ? `Обе карты видны за эту цену: ${outs} × 4 = ${percent}.` : `Оплачена одна карта: ${outs} × 2 = ${percent}.`,
  );
});

const exactSpecs = [
  [9, 47, 2, "две карты, карты оппонента закрыты"],
  [8, 47, 2, "две карты, карты оппонента закрыты"],
  [4, 47, 2, "две карты, карты оппонента закрыты"],
  [6, 47, 2, "две карты, карты оппонента закрыты"],
  [15, 47, 2, "две карты, флеш и стрит вместе"],
  [12, 47, 2, "две карты, карты оппонента закрыты"],
  [9, 46, 1, "одна карта, уже терн"],
  [8, 46, 1, "одна карта, уже терн"],
  [4, 46, 1, "одна карта, уже терн"],
  [6, 46, 1, "одна карта, уже терн"],
] as const;

export const hardRule: Card[] = exactSpecs.map(([outs, unseen, cards, scene]) => {
  const percent = hitPercent(outs, unseen, cards as 1 | 2);
  return number(
    "exact",
    percent,
    `${outs} аутов, ${unseen} неизвестных, ${scene}. Точный процент до ближайшего целого?`,
    `Точная вероятность добора — ${percent}%. Правило 2 и 4 здесь не ответ.`,
  );
});

const potRows = [
  [70, 30],
  [35, 15],
  [90, 60],
  [45, 30],
  [80, 20],
  [64, 16],
  [48, 16],
  [36, 12],
  [50, 50],
  [25, 25],
  [100, 25],
  [75, 25],
] as const;

export const mediumPot: Card[] = potRows.map(([pot, call]) => {
  const percent = asPercent(potOdds(pot, call));
  return number(
    "price",
    percent,
    `Катофф ставит. Перед вами в банке ${pot}, колл ${call}. Цена колла в процентах?`,
    `Колл ${call} при банке ${pot}: ${call} / ${pot + call} = ${percent}%.`,
  );
});

const decisions = [
  [40, 33],
  [35, 25],
  [20, 33],
  [16, 25],
  [25, 25],
  [33, 33],
  [50, 20],
  [18, 20],
  [30, 40],
  [45, 33],
  [10, 20],
  [28, 25],
] as const;

export const hardPot: Card[] = decisions.map(([equity, price]) => {
  const expected = callChoice(equity / 100, price / 100);
  const word = expected === "call" ? "колл" : expected === "fold" ? "фолд" : "и колл, и фолд";
  return choice(
    expected,
    expected,
    `Цена колла ${price}%, эквити ${equity}%. Колл или фолд?`,
    expected === "either" ? "Числа равны, EV нулевой. Верны оба ответа." : `${equity}% ${equity > price ? "больше" : "меньше"} ${price}%. Это ${word}.`,
  );
});

const evRows = [
  [50, 10, 10],
  [50, 30, 10],
  [50, 40, 20],
  [50, 50, 10],
  [40, 20, 10],
  [40, 50, 10],
  [40, 30, 10],
  [25, 30, 10],
  [25, 70, 10],
  [25, 50, 10],
  [20, 50, 10],
  [20, 40, 20],
] as const;

export const mediumEv: Card[] = evRows.map(([equity, pot, call]) => {
  const value = callEv(equity / 100, pot, call);
  return number(
    "ev",
    value,
    `Эквити ${equity}%, банк перед вами ${pot}, колл ${call}. EV колла в фишках?`,
    `${equity / 100} × (${pot} + ${call}) − ${call} = ${value}.`,
  );
});

export const hardEv: Card[] = mediumEv.map((card) => {
  const value = card.expected as number;
  const expected = value > 0 ? "call" : value < 0 ? "fold" : "either";
  return choice(expected, expected, card.prompt.replace("EV колла в фишках?", "Колл или фолд?"), value === 0 ? "EV нулевой. Верны оба ответа." : `EV равен ${value}. ${value > 0 ? "Это колл." : "Это фолд."}`);
});

const mdfRows = [
  [10, 10],
  [40, 40],
  [100, 100],
  [10, 5],
  [20, 10],
  [40, 20],
  [30, 10],
  [60, 20],
  [90, 30],
  [100, 25],
  [80, 20],
  [40, 10],
  [10, 20],
  [20, 40],
  [50, 100],
] as const;

export const variedMdf: Card[] = mdfRows.map(([pot, bet]) => {
  const defense = asPercent(minimumDefenseFrequency(pot, bet));
  const bluff = asPercent(alpha(pot, bet));
  return pair(
    "mdf",
    [defense, bluff],
    `Банк до ставки ${pot}, ставка ${bet}. MDF и альфа в процентах?`,
    `MDF = ${pot} / ${pot + bet} = ${defense}%. Альфа = ${bet} / ${pot + bet} = ${bluff}%.`,
  );
});

const sprRows = [
  [100, 20],
  [80, 20],
  [60, 10],
  [150, 30],
  [90, 30],
  [120, 20],
  [50, 10],
  [200, 25],
  [70, 10],
  [40, 10],
  [180, 30],
  [240, 40],
] as const;

export const mediumSpr: Card[] = sprRows.map(([stack, pot]) =>
  number("spr", stack / pot, `После ставки эффективный стек ${stack}, банк ${pot}. SPR?`, `${stack} / ${pot} = ${stack / pot}.`),
);

const tenthRows = [
  [50, 20],
  [70, 20],
  [90, 20],
  [30, 20],
  [130, 20],
  [150, 20],
  [110, 20],
  [25, 10],
  [35, 10],
  [45, 10],
] as const;

export const hardSpr: Card[] = tenthRows.map(([stack, pot]) => {
  const value = Math.round((stack / pot) * 10) / 10;
  return number("tenth", value, `Стек ${stack}, банк ${pot}. SPR до одной десятой?`, `${stack} / ${pot} = ${value}.`);
});

const ranks = [
  ["тузов", "A", "As"],
  ["королей", "K", "Kd"],
  ["дам", "Q", "Qh"],
  ["валетов", "J", "Jc"],
  ["десяток", "T", "Ts"],
  ["девяток", "9", "9d"],
  ["восьмёрок", "8", "8h"],
  ["семёрок", "7", "7c"],
] as const;

export const mediumCombos: Card[] = ranks.flatMap(([name, , card]) => [
  number("board", 3, `На борде ${card}. Сколько комбо карманных ${name} ещё живы?`, "Одна карта ранга видна. Остаётся 3 комбо."),
]);

export const hardCombos: Card[] = [
  ...ranks.map(([name, , card]) =>
    number("held", 3, `У вас ${card} и разномастная пятёрка. Сколько комбо чужих карманных ${name} осталось?`, "Одна карта ранга у вас. Остаётся 3 комбо."),
  ),
  ...ranks.map(([name, , card]) =>
    number("two", 1, `На борде ${card}, и ещё одна карта этого ранга у вас. Сколько комбо чужих карманных ${name} осталось?`, "Видно две карты ранга. Остаётся 1 комбо."),
  ),
  number("suited-block", 3, "У вас As и король бубен. Сколько одномастных AK осталось у других?", "Туз пик снят. Одномастных AK остаётся 3."),
  number("offsuit-block", 9, "У вас As и король бубен. Сколько разномастных AK осталось у других?", "Туз пик снят. Разномастных AK остаётся 9."),
];
