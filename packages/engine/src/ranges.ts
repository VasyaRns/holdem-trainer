import { POSITIONS, type LevelId } from "@holdem/domain";

const ACTION_RE =
  /^(?:push|open(?:[-\s]?\d+(?:\.\d+)?bb)?|limp|raise(?:[-\s]?\d+(?:\.\d+)?bb)?|call|3bet(?:\s+\d+\s*-\s*\d+bb)?|raise\/3bet)$/i;

export type ChartPart = { action: string; weight: number; color?: string };

export type ChartHands = Record<string, { parts: ChartPart[] }>;

export type RangeChart = {
  id: string;
  title: string;
  hero: string;
  mode: string;
  stack: number | null;
  hands: ChartHands;
};

export type RangeKind = "bucket" | "action" | "mixed";

export type RangeQuestion = {
  chartId: string;
  hand: string;
  hero: string;
  prompt: string;
  kind: RangeKind;
  choices: string[];
  expectedAction: string;
  expectedStep: number | null;
  formula: string;
};

const RANKS = "AKQJT98765432";

export function allHands(): string[] {
  const hands: string[] = [];
  for (let i = 0; i < RANKS.length; i += 1) {
    const high = RANKS[i]!;
    hands.push(high + high);
    for (let j = i + 1; j < RANKS.length; j += 1) {
      const low = RANKS[j]!;
      hands.push(high + low + "s");
      hands.push(high + low + "o");
    }
  }
  return hands;
}

export function isActionLabel(text: string): boolean {
  return ACTION_RE.test(text.trim());
}

export function actionParts(hands: ChartHands, hand: string): ChartPart[] {
  return (hands[hand]?.parts ?? []).filter((part) => isActionLabel(part.action));
}

export function chartAnswer(hands: ChartHands, hand: string): string {
  const parts = actionParts(hands, hand);
  if (parts.length === 0) return "fold";
  let best = parts[0]!;
  for (const part of parts.slice(1)) {
    if (part.weight > best.weight) best = part;
  }
  return best.action;
}

export function gradeChart(hands: ChartHands, hand: string, answer: string): { correct: boolean; expected: string } {
  const expected = chartAnswer(hands, hand);
  return { correct: answer.trim().toLowerCase() === expected.trim().toLowerCase(), expected };
}

export function easyBucket(action: string): "fold" | "open" | "push" | "limp" | null {
  if (action.toLowerCase() === "fold") return "fold";
  if (/^push$/i.test(action)) return "push";
  if (/^limp$/i.test(action)) return "limp";
  if (/^open/i.test(action)) return "open";
  return null;
}

export function shareStep(weight: number): number {
  return Math.round(weight * 10) * 10;
}

function pureAction(hands: ChartHands, hand: string): string | null {
  const parts = actionParts(hands, hand);
  if (parts.length !== 1 || parts[0]!.weight !== 1) return null;
  return parts[0]!.action;
}

function formulaOf(hands: ChartHands, hand: string): string {
  const parts = actionParts(hands, hand);
  if (parts.length === 0) return "Руки нет в клетке: фолд.";
  return parts.map((part) => `${part.action} ${Math.round(part.weight * 100)}%`).join(", ");
}

function pick<T>(items: T[], random: () => number): T {
  return items[Math.floor(random() * items.length)]!;
}

export function questionFromChart(chart: RangeChart, level: LevelId, random: () => number = Math.random): RangeQuestion | null {
  const hands = allHands();
  if (level === "easy" && chart.mode !== "open") return null;
  if (level === "medium" && chart.mode !== "open" && chart.mode !== "vs") return null;
  if (level === "hard") {
    const mixed = hands.filter((hand) => actionParts(chart.hands, hand).length > 1);
    if (mixed.length === 0) return null;
    return mixedQuestion(chart, pick(mixed, random));
  }
  const played = hands.filter((hand) => {
    const action = pureAction(chart.hands, hand);
    if (!action) return false;
    return level === "easy" ? easyBucket(action) !== null : true;
  });
  const folds = hands.filter((hand) => actionParts(chart.hands, hand).length === 0);
  const useFold = folds.length > 0 && (played.length === 0 || random() < 0.5);
  const hand = useFold ? pick(folds, random) : played.length > 0 ? pick(played, random) : null;
  if (!hand) return null;
  const action = chartAnswer(chart.hands, hand);
  if (level === "easy") {
    const bucket = easyBucket(action);
    if (!bucket) return null;
    return {
      chartId: chart.id,
      hand,
      hero: chart.hero,
      prompt: `${chart.hero}, ${chart.stack ?? "—"}bb. Рука ${hand}.`,
      kind: "bucket",
      choices: ["fold", "open", "push", "limp"],
      expectedAction: bucket,
      expectedStep: null,
      formula: formulaOf(chart.hands, hand),
    };
  }
  const choices = ["fold", ...new Set(hands.flatMap((item) => actionParts(chart.hands, item).map((part) => part.action)))];
  return {
    chartId: chart.id,
    hand,
    hero: chart.hero,
    prompt: `${chart.title}. Рука ${hand}.`,
    kind: "action",
    choices,
    expectedAction: action,
    expectedStep: null,
    formula: formulaOf(chart.hands, hand),
  };
}

function mixedQuestion(chart: RangeChart, hand: string): RangeQuestion {
  const parts = actionParts(chart.hands, hand);
  let best = parts[0]!;
  for (const part of parts.slice(1)) {
    if (part.weight > best.weight) best = part;
  }
  return {
    chartId: chart.id,
    hand,
    hero: chart.hero,
    prompt: `${chart.title}. Рука ${hand}. Смешанная клетка.`,
    kind: "mixed",
    choices: parts.map((part) => part.action),
    expectedAction: best.action,
    expectedStep: shareStep(best.weight),
    formula: formulaOf(chart.hands, hand),
  };
}

export function gradeRange(question: RangeQuestion, action: string, step?: number): { correct: boolean; miss: number; formula: string } {
  const actionOk = action.trim().toLowerCase() === question.expectedAction.trim().toLowerCase();
  if (question.kind !== "mixed" || question.expectedStep == null) {
    return { correct: actionOk, miss: actionOk ? 0 : 1, formula: question.formula };
  }
  const given = step ?? Number.NaN;
  const stepOk = Number.isFinite(given) && Math.abs(given - question.expectedStep) <= 10;
  const miss = (actionOk ? 0 : 1) + (stepOk ? 0 : Math.abs((given || 0) - question.expectedStep) / 10);
  return { correct: actionOk && stepOk, miss, formula: question.formula };
}

export function orbitOrder(charts: RangeChart[], stack: number): RangeChart[] {
  return POSITIONS.flatMap((position) => {
    const chart = charts.find((item) => item.mode === "open" && item.hero === position && item.stack === stack);
    return chart ? [chart] : [];
  });
}

export function orbitQuestion(chart: RangeChart, hand: string): RangeQuestion {
  const action = chartAnswer(chart.hands, hand);
  const choices = ["fold", ...new Set(allHands().flatMap((item) => actionParts(chart.hands, item).map((part) => part.action)))];
  return {
    chartId: chart.id,
    hand,
    hero: chart.hero,
    prompt: `${chart.hero}, ${chart.stack ?? "—"}bb. Та же рука ${hand}.`,
    kind: "action",
    choices,
    expectedAction: action,
    expectedStep: null,
    formula: formulaOf(chart.hands, hand),
  };
}

export const BUCKET_LABELS: Record<string, string> = {
  fold: "Фолд",
  open: "Открытие",
  push: "Пуш",
  limp: "Лимп",
};
