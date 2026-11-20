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

const flushSpots = [
  ["Ah Kh", "Qh 7h 2c", "червей"],
  ["Qh Jh", "Th 4h Kd", "червей"],
  ["9s 8s", "2s 5s Ah", "пик"],
  ["Kd Qd", "Jd 3d 7c", "бубен"],
  ["Ac 5c", "Kc 9c 2h", "треф"],
  ["Ts 6s", "4s 2s Qh", "пик"],
  ["Jh Th", "8h 3h As", "червей"],
  ["7d 6d", "5d Ad Kc", "бубен"],
] as const;

const openEnders = [
  ["Jh Th", "9c 8d 2s", "даму или семёрку"],
  ["Tc 9c", "8h 7d As", "валета или шестёрку"],
  ["8d 7d", "6c 5h Ks", "девятку или четвёрку"],
  ["Kd Qd", "Jc Td 2h", "туза или девятку"],
  ["6h 5h", "4c 3d Qs", "семёрку или двойку"],
  ["Qs Js", "Th 9c 2d", "короля или восьмёрку"],
] as const;

const gutshots = [
  ["Jh 9h", "8c 7d 2s", "десятки"],
  ["Ac Qd", "Kd Jc 4h", "десятки"],
  ["Kh Td", "9c 8d 2s", "валета"],
  ["As Ts", "9d 7c 2h", "восьмёрки"],
  ["Qd Jd", "Tc 8h 3s", "девятки"],
  ["9c 7c", "6d 5h Ks", "восьмёрки"],
] as const;

export const easyOuts: Card[] = [
  ...flushSpots.map(([hand, board, suit]) =>
    number(
      "flush",
      9,
      `У вас ${hand}, борд ${board}. Это флеш-дро в ${suit}. Сколько аутов?`,
      "Две карты в руке и две на борде одной масти: 13 − 4 = 9.",
    ),
  ),
  ...openEnders.map(([hand, board, outs]) =>
    number(
      "oesd",
      8,
      `У вас ${hand}, борд ${board}. Двустороннее стрит-дро: не хватает ${outs}. Сколько аутов?`,
      "Два ранга по четыре карты: 8.",
    ),
  ),
  ...gutshots.map(([hand, board, rank]) =>
    number(
      "gut",
      4,
      `У вас ${hand}, борд ${board}. Гатшот, не хватает ${rank}. Сколько аутов?`,
      "Один ранг, четыре карты: 4.",
    ),
  ),
];

const potBets = [
  [20, 10],
  [40, 20],
  [60, 30],
  [8, 4],
  [100, 50],
  [14, 7],
] as const;
const halfBets = [
  [15, 5],
  [30, 10],
  [45, 15],
  [60, 20],
  [9, 3],
  [120, 40],
] as const;
const thirdBets = [
  [40, 10],
  [80, 20],
  [20, 5],
  [12, 3],
  [100, 25],
  [16, 4],
] as const;

export const easyPot: Card[] = [
  ...potBets.map(([pot, call]) =>
    number("pot", 33, `Баттон ставит. Перед вами в банке уже ${pot}, колл ${call}. Цена колла в процентах?`, `Колл ${call} при банке ${pot}: ${call} / ${pot + call} ≈ 33%.`),
  ),
  ...halfBets.map(([pot, call]) =>
    number("half", 25, `Большой блайнд защищается. Перед вами ${pot}, колл ${call}. Цена колла в процентах?`, `Колл ${call} при банке ${pot}: ${call} / ${pot + call} = 25%.`),
  ),
  ...thirdBets.map(([pot, call]) =>
    number("third", 20, `Катофф ставит треть. Перед вами ${pot}, колл ${call}. Цена колла в процентах?`, `Колл ${call} при банке ${pot}: ${call} / ${pot + call} = 20%.`),
  ),
];

const pairs = ["тузов", "королей", "дам", "валетов", "десяток", "девяток", "двоек"];
const suited = ["AK", "AQ", "KQ", "QJ", "JT", "T9", "76", "65"];
const offsuit = ["AK", "AQ", "AJ", "KQ", "KJ", "QJ", "JT", "T9"];

export const easyCombos: Card[] = [
  ...pairs.map((name) => number("pair", 6, `Сколько комбо у карманных ${name}?`, "Пара: 4×3 / 2 = 6.")),
  ...suited.map((hand) => number("suited", 4, `Сколько одномастных комбо у ${hand}?`, "Одномастные: по одной на масть, 4.")),
  ...offsuit.map((hand) => number("offsuit", 12, `Сколько разномастных комбо у ${hand}?`, "Разномастные: 16 − 4 = 12.")),
];

const evSpots = [
  [50, 10, 10, 0],
  [50, 30, 10, 10],
  [50, 20, 10, 5],
  [50, 40, 20, 10],
  [25, 30, 10, 0],
  [40, 20, 10, 2],
] as const;

export const easyEv: Card[] = evSpots.map(([equity, pot, call, value]) =>
  number(
    "ev",
    value,
    `Эквити ${equity}%, банк перед вами ${pot}, колл ${call}. EV колла в фишках?`,
    `${equity / 100} × (${pot} + ${call}) − ${call} = ${value}.`,
  ),
);

const ruleSpots = [
  [9, 2, 36, "оппонент в олл-ине на флопе"],
  [8, 2, 32, "оппонент в олл-ине на флопе со стрит-дро"],
  [4, 2, 16, "оппонент в олл-ине на флопе с гатшотом"],
  [9, 1, 18, "ход уже на терне, флеш-дро"],
  [8, 1, 16, "ход уже на терне, двустороннее дро"],
  [4, 1, 8, "ход уже на терне, гатшот"],
  [6, 2, 24, "оппонент в олл-ине, две оверкарты"],
  [6, 1, 12, "терн, две оверкарты"],
] as const;

export const easyRule: Card[] = ruleSpots.map(([outs, cards, percent, scene]) =>
  number(
    cards === 2 ? "both" : "one",
    percent,
    `${scene}. Аутов ${outs}. Процент по правилу?`,
    cards === 2 ? `Обе карты видны за эту цену: ${outs} × 4 = ${percent}.` : `Осталась одна карта: ${outs} × 2 = ${percent}.`,
  ),
);

const mdfSpots = [
  [10, 10, 50, 50, "пот"],
  [40, 40, 50, 50, "пот"],
  [80, 80, 50, 50, "пот"],
  [10, 5, 67, 33, "полпота"],
  [20, 10, 67, 33, "полпота"],
  [30, 10, 75, 25, "треть"],
  [60, 20, 75, 25, "треть"],
] as const;

export const easyMdf: Card[] = mdfSpots.map(([pot, bet, defense, bluff, name]) =>
  pair(
    name,
    [defense, bluff],
    `Банк до вашей ставки ${pot}, вы ставите ${bet}. Это ${name}. MDF и альфа в процентах?`,
    `Банк до ставки ${pot}, ставка ${bet}. MDF ${defense}%, альфа ${bluff}%.`,
  ),
);

const sprSpots = [
  [100, 20, 5],
  [80, 20, 4],
  [60, 10, 6],
  [150, 30, 5],
  [90, 30, 3],
  [120, 20, 6],
  [50, 10, 5],
  [200, 25, 8],
] as const;

export const easySpr: Card[] = sprSpots.map(([stack, pot, value]) =>
  number("spr", value, `Эффективный стек ${stack}, банк ${pot}. SPR?`, `${stack} / ${pot} = ${value}.`),
);

export const easyChoices: Card[] = [
  choice("call", "call", "Цена колла 33%, эквити 40%. Колл или фолд?", "40% больше 33%. Это колл."),
  choice("call", "call", "Цена колла 25%, эквити 35%. Колл или фолд?", "35% больше 25%. Это колл."),
  choice("fold", "fold", "Цена колла 33%, эквити 20%. Колл или фолд?", "20% меньше 33%. Это фолд."),
  choice("fold", "fold", "Цена колла 25%, эквити 16%. Колл или фолд?", "16% меньше 25%. Это фолд."),
  choice("tie", "either", "Цена колла 25%, эквити 25%. Колл или фолд?", "Числа равны, EV нулевой. Верны оба ответа."),
  choice("tie", "either", "Цена колла 33%, эквити 33%. Колл или фолд?", "Числа равны, EV нулевой. Верны оба ответа."),
];
