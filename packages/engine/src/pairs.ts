import type { LevelId } from "@holdem/domain";
import { BUCKET_LABELS, actionParts, allHands, easyBucket, shareStep, type RangeChart } from "./ranges.ts";

export const PAIRS_TABLE: Record<LevelId, { pairs: number; previewSeconds: number }> = {
  easy: { pairs: 4, previewSeconds: 6 },
  medium: { pairs: 6, previewSeconds: 5 },
  hard: { pairs: 8, previewSeconds: 4 },
};

export type PairSide = "hand" | "action";

export type PairCard = {
  id: string;
  pairId: string;
  side: PairSide;
  text: string;
  color: string | null;
};

export type PairsDeck = {
  chartId: string;
  level: LevelId;
  pairCount: number;
  previewSeconds: number;
  cards: PairCard[];
};

export type PairsScore = {
  stars: 0 | 1 | 2 | 3;
  passed: boolean;
};

type Seat = {
  hand: string;
  text: string;
  color: string | null;
  mixed: boolean;
};

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const swap = copy[i]!;
    copy[i] = copy[j]!;
    copy[j] = swap;
  }
  return copy;
}

function modeFits(chart: RangeChart, level: LevelId): boolean {
  if (chart.mode !== "open" && chart.mode !== "vs") return false;
  if (level === "easy") return chart.mode === "open";
  return true;
}

function seats(chart: RangeChart, level: LevelId): Seat[] {
  if (!modeFits(chart, level)) return [];
  const found: Seat[] = [];
  for (const hand of allHands()) {
    const parts = actionParts(chart.hands, hand);
    if (parts.length === 0) continue;
    const mixed = parts.length > 1;
    if (!mixed && parts[0]!.weight !== 1) continue;
    let best = parts[0]!;
    for (const part of parts.slice(1)) {
      if (part.weight > best.weight) best = part;
    }
    if (level !== "hard" && mixed) continue;
    if (level === "easy") {
      const bucket = easyBucket(best.action);
      if (!bucket || bucket === "fold") continue;
      found.push({ hand, text: BUCKET_LABELS[bucket] ?? bucket, color: best.color ?? null, mixed: false });
      continue;
    }
    const text = mixed ? `${best.action} ${shareStep(best.weight)}%` : best.action;
    found.push({ hand, text, color: best.color ?? null, mixed });
  }
  return found;
}

export function buildPairsDeck(chart: RangeChart, level: LevelId, random: () => number = Math.random): PairsDeck | null {
  const layout = PAIRS_TABLE[level];
  const pool = seats(chart, level);
  const mixed = pool.filter((seat) => seat.mixed);
  const pure = pool.filter((seat) => !seat.mixed);
  if (level === "hard" && mixed.length === 0) return null;
  const ordered = level === "hard" ? [...shuffle(mixed, random), ...shuffle(pure, random)] : shuffle(pool, random);
  const picked = ordered.slice(0, layout.pairs);
  if (picked.length < layout.pairs) return null;
  const cards = picked.flatMap((seat) => [
    { id: `${seat.hand}:hand`, pairId: seat.hand, side: "hand" as const, text: seat.hand, color: seat.color },
    { id: `${seat.hand}:action`, pairId: seat.hand, side: "action" as const, text: seat.text, color: seat.color },
  ]);
  return {
    chartId: chart.id,
    level,
    pairCount: layout.pairs,
    previewSeconds: layout.previewSeconds,
    cards: shuffle(cards, random),
  };
}

export function scorePairs(moves: number, pairs: number): PairsScore {
  if (!Number.isInteger(moves) || !Number.isInteger(pairs) || pairs <= 0 || moves < pairs || moves > pairs * 2) {
    return { stars: 0, passed: false };
  }
  if (moves === pairs) return { stars: 3, passed: true };
  if (moves <= pairs + Math.floor(pairs / 2)) return { stars: 2, passed: true };
  return { stars: 1, passed: true };
}
