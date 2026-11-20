import { getJson, postJson } from "../session/api";

export type PairsSummary = {
  passedCount: number;
  bestSeconds: number | null;
  bestMoves: number | null;
};

export function loadPairs(level: string) {
  return getJson<PairsSummary>(`/api/pairs?level=${encodeURIComponent(level)}`);
}

export function postPairs(game: {
  id: string;
  level: string;
  chartId: string;
  moves: number;
  seconds: number;
  stars: number;
  passed: boolean;
}) {
  return postJson<{ id: string; unlocked?: string[] }>("/api/pairs", game);
}
