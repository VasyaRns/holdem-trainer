import { expect, it } from "vitest";
import { easyBucket, gradeRange, orbitOrder, orbitQuestion, questionFromChart, type RangeChart } from "./ranges.ts";

const openUtg: RangeChart = {
  id: "utg-open-10",
  title: "UTG открытие 10bb",
  hero: "UTG",
  mode: "open",
  stack: 10,
  hands: {
    AA: { parts: [{ action: "Push", weight: 1 }] },
    AKs: { parts: [{ action: "Open-2bb", weight: 1 }] },
    A5s: {
      parts: [
        { action: "Open-2bb", weight: 0.36 },
        { action: "Push", weight: 0.64 },
      ],
    },
    KQs: { parts: [{ action: "пометка тренера", weight: 1 }] },
  },
};

const openBu: RangeChart = {
  id: "bu-open-10",
  title: "BU открытие 10bb",
  hero: "BU",
  mode: "open",
  stack: 10,
  hands: {
    AA: { parts: [{ action: "Limp", weight: 1 }] },
  },
};

const defend: RangeChart = {
  id: "bb-vs-bu",
  title: "BB против BU",
  hero: "BB",
  mode: "vs",
  stack: null,
  hands: {
    AJo: { parts: [{ action: "Call", weight: 1 }] },
    ATs: { parts: [{ action: "3bet 6-8bb", weight: 1 }] },
  },
};

it("простой уровень не называет сайзинг и не берёт смешанную клетку", () => {
  const question = questionFromChart(openUtg, "easy", () => 0);
  expect(question?.kind).toBe("bucket");
  expect(question?.choices).toEqual(["fold", "open", "push", "limp"]);
  expect(["fold", "open", "push", "limp"]).toContain(question?.expectedAction);
  expect(questionFromChart(openUtg, "easy", () => 0.99)?.hand).not.toBe("A5s");
  expect(easyBucket("Open-2bb")).toBe("open");
});

it("средний уровень называет точное действие защиты", () => {
  const question = questionFromChart(defend, "medium", () => 0.99);
  expect(question?.kind).toBe("action");
  expect(question?.expectedAction === "Call" || question?.expectedAction === "3bet 6-8bb" || question?.expectedAction === "fold").toBe(true);
  expect(questionFromChart(defend, "easy")).toBeNull();
});

it("сложный уровень принимает долю в пределах 10 пунктов", () => {
  const question = questionFromChart(openUtg, "hard", () => 0);
  expect(question?.hand).toBe("A5s");
  expect(question?.expectedAction).toBe("Push");
  expect(question?.expectedStep).toBe(60);
  expect(gradeRange(question!, "Push", 70).correct).toBe(true);
  expect(gradeRange(question!, "Push", 40).correct).toBe(false);
  expect(question?.formula).toContain("Open-2bb 36%");
});

it("орбита идёт по позициям одного стека и держит одну руку", () => {
  const seats = orbitOrder([openBu, openUtg, defend], 10);
  expect(seats.map((chart) => chart.hero)).toEqual(["UTG", "BU"]);
  const first = orbitQuestion(seats[0]!, "AA");
  const second = orbitQuestion(seats[1]!, "AA");
  expect(first.hand).toBe(second.hand);
  expect(first.expectedAction).toBe("Push");
  expect(second.expectedAction).toBe("Limp");
});
