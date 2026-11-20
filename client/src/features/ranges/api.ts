import { getJson, postJson } from "../session/api";

export type ChartSummary = {
  id: string;
  title: string;
  hero: string;
  mode: string;
  opponent: string | null;
  stack: number | null;
};

export type ChartHand = {
  parts: { action: string; weight: number }[];
};

export type Chart = ChartSummary & {
  hands: Record<string, ChartHand>;
};

export function loadChartList() {
  return getJson<{ charts: ChartSummary[] }>("/api/charts");
}

export function loadChart(id: string) {
  return getJson<{ chart: Chart }>(`/api/charts/${encodeURIComponent(id)}`);
}

export function chartError(reason: unknown): string {
  const raw = reason instanceof Error ? reason.message : "";
  try {
    const parsed = JSON.parse(raw) as { error?: string };
    if (parsed.error) return parsed.error;
  } catch {
    return raw || "Чарты не загрузились";
  }
  return raw || "Чарты не загрузились";
}

export type SavedSet = {
  id: string;
  name: string;
  chartId: string;
  total: number;
  correct: number;
  accuracy: number;
};

export function loadSaved() {
  return getJson<{ saved: SavedSet[] }>("/api/saved");
}

export function saveSet(name: string, chartId: string) {
  return postJson<{ id: string; name: string; chartId: string }>("/api/saved", { name, chartId });
}
