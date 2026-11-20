import { expect, it } from "vitest";
import { buildPairsDeck, scorePairs, type RangeChart } from "./index.ts";

const openChart: RangeChart = {
  id: "utg-open-10",
  title: "UTG открытие 10bb",
  hero: "UTG",
  mode: "open",
  stack: 10,
  hands: {
    AA: { parts: [{ action: "Push", weight: 1, color: "#111" }] },
    AKs: { parts: [{ action: "Open-2bb", weight: 1, color: "#222" }] },
    KQo: { parts: [{ action: "Limp", weight: 1, color: "#333" }] },
    "77": { parts: [{ action: "Push", weight: 1, color: "#444" }] },
    A5s: {
      parts: [
        { action: "Open-2bb", weight: 0.36, color: "#555" },
        { action: "Push", weight: 0.64, color: "#666" },
      ],
    },
    KQs: { parts: [{ action: "пометка тренера", weight: 1, color: "#777" }] },
    "22": { parts: [{ action: "Open-2bb", weight: 0.4, color: "#888" }] },
  },
};

const defendChart: RangeChart = {
  id: "bb-vs-bu",
  title: "BB против BU",
  hero: "BB",
  mode: "vs",
  stack: null,
  hands: {
    AJo: { parts: [{ action: "Call", weight: 1, color: "#c1" }] },
    ATs: { parts: [{ action: "3bet 6-8bb", weight: 1, color: "#c2" }] },
    KQo: { parts: [{ action: "Call", weight: 1, color: "#c3" }] },
    A9o: { parts: [{ action: "Call", weight: 1, color: "#c4" }] },
    KJs: { parts: [{ action: "Raise", weight: 1, color: "#c5" }] },
    QTs: { parts: [{ action: "Call", weight: 1, color: "#c6" }] },
    A5s: {
      parts: [
        { action: "Call", weight: 0.4, color: "#c7" },
        { action: "3bet 6-8bb", weight: 0.6, color: "#c8" },
      ],
    },
    KQs: { parts: [{ action: "пометка тренера", weight: 1 }] },
  },
};

const hardChart: RangeChart = {
  id: "co-open-15",
  title: "CO открытие 15bb",
  hero: "CO",
  mode: "open",
  stack: 15,
  hands: {
    AA: { parts: [{ action: "Push", weight: 1, color: "#a1" }] },
    KK: { parts: [{ action: "Push", weight: 1, color: "#a2" }] },
    QQ: { parts: [{ action: "Open-2bb", weight: 1, color: "#a3" }] },
    JJ: { parts: [{ action: "Open-2bb", weight: 1, color: "#a4" }] },
    AKs: { parts: [{ action: "Open-2bb", weight: 1, color: "#a5" }] },
    AKo: { parts: [{ action: "Limp", weight: 1, color: "#a6" }] },
    A5s: {
      parts: [
        { action: "Open-2bb", weight: 0.36, color: "#b1" },
        { action: "Push", weight: 0.64, color: "#b2" },
      ],
    },
    KQs: {
      parts: [
        { action: "Open-2bb", weight: 0.5, color: "#b3" },
        { action: "Push", weight: 0.5, color: "#b4" },
      ],
    },
    "72o": { parts: [{ action: "заметка про PKO", weight: 1 }] },
  },
};

function handsOf(deck: NonNullable<ReturnType<typeof buildPairsDeck>>): string[] {
  return deck.cards.filter((card) => card.side === "hand").map((card) => card.text);
}

it("простая колода — четыре чистые пары открытия, без сайзинга и без пометок", () => {
  const deck = buildPairsDeck(openChart, "easy", () => 0);
  expect(deck?.pairCount).toBe(4);
  expect(deck?.previewSeconds).toBe(6);
  expect(deck?.cards).toHaveLength(8);
  expect(handsOf(deck!).sort()).toEqual(["77", "AA", "AKs", "KQo"]);
  const action = deck!.cards.filter((card) => card.side === "action").map((card) => card.text);
  expect(action.sort()).toEqual(["Лимп", "Открытие", "Пуш", "Пуш"]);
  expect(action.join(" ")).not.toContain("Open");
  expect(handsOf(deck!)).not.toContain("A5s");
  expect(handsOf(deck!)).not.toContain("KQs");
  expect(handsOf(deck!)).not.toContain("22");
  const aks = deck!.cards.filter((card) => card.pairId === "AKs");
  expect(aks).toHaveLength(2);
  expect(aks.every((card) => card.color === "#222")).toBe(true);
  expect(buildPairsDeck(defendChart, "easy", () => 0)).toBeNull();
  expect(buildPairsDeck({ ...openChart, hands: { AA: openChart.hands.AA! } }, "easy", () => 0)).toBeNull();
});

it("средняя колода берёт открытие или защиту и точную подпись", () => {
  const deck = buildPairsDeck(defendChart, "medium", () => 0);
  expect(deck?.pairCount).toBe(6);
  expect(deck?.previewSeconds).toBe(5);
  expect(handsOf(deck!).sort()).toEqual(["A9o", "AJo", "ATs", "KJs", "KQo", "QTs"]);
  expect(deck!.cards.find((card) => card.pairId === "ATs" && card.side === "action")?.text).toBe("3bet 6-8bb");
  expect(handsOf(deck!)).not.toContain("A5s");
  expect(handsOf(deck!)).not.toContain("KQs");
  expect(buildPairsDeck(openChart, "medium", () => 0)).toBeNull();
  const mediumOpen = buildPairsDeck(
    {
      ...openChart,
      hands: {
        ...openChart.hands,
        QQ: { parts: [{ action: "Open-2.5bb", weight: 1 }] },
        AQo: { parts: [{ action: "Limp", weight: 1 }] },
      },
    },
    "medium",
    () => 0,
  );
  expect(mediumOpen?.cards.find((card) => card.pairId === "AKs" && card.side === "action")?.text).toBe("Open-2bb");
  expect(mediumOpen?.cards.find((card) => card.pairId === "QQ" && card.side === "action")?.text).toBe("Open-2.5bb");
});

it("сложная колода включает смешанную клетку и долю наибольшего веса", () => {
  const deck = buildPairsDeck(hardChart, "hard", () => 0);
  expect(deck?.pairCount).toBe(8);
  expect(deck?.previewSeconds).toBe(4);
  expect(deck?.cards).toHaveLength(16);
  expect(handsOf(deck!)).toContain("A5s");
  expect(handsOf(deck!)).toContain("KQs");
  expect(deck!.cards.find((card) => card.pairId === "A5s" && card.side === "action")?.text).toBe("Push 60%");
  expect(deck!.cards.filter((card) => card.pairId === "A5s").every((card) => card.color === "#b2")).toBe(true);
  expect(deck!.cards.find((card) => card.pairId === "KQs" && card.side === "action")?.text).toBe("Open-2bb 50%");
  expect(deck!.cards.find((card) => card.pairId === "AA" && card.side === "action")?.text).toBe("Push");
  expect(handsOf(deck!)).not.toContain("72o");
  expect(buildPairsDeck(openChart, "hard", () => 0)).toBeNull();
  const onlyMixed = {
    ...hardChart,
    hands: { A5s: hardChart.hands.A5s! },
  };
  expect(buildPairsDeck(onlyMixed, "hard", () => 0)).toBeNull();
});

it("три звезды за ход на пару, зачёт до двух ходов на пару", () => {
  expect(scorePairs(4, 4)).toEqual({ stars: 3, passed: true });
  expect(scorePairs(6, 4)).toEqual({ stars: 2, passed: true });
  expect(scorePairs(8, 4)).toEqual({ stars: 1, passed: true });
  expect(scorePairs(9, 4)).toEqual({ stars: 0, passed: false });
  expect(scorePairs(3, 4)).toEqual({ stars: 0, passed: false });
  expect(scorePairs(8, 8).stars).toBe(3);
  expect(scorePairs(16, 8).passed).toBe(true);
  expect(scorePairs(17, 8).passed).toBe(false);
});
