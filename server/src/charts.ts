import { readFileSync } from "node:fs";

export type ChartSummary = {
  id: string;
  title: string;
  hero: string;
  mode: string;
  opponent: string | null;
  stack: number | null;
};

export type ChartFile = {
  charts: Array<ChartSummary & { hands: Record<string, unknown> }>;
};

export type LoadedCharts =
  | { ok: true; byId: Map<string, ChartFile["charts"][number]> }
  | { ok: false; error: string };

export function loadCharts(path: string | undefined): LoadedCharts {
  if (!path) return { ok: false, error: "Чарты не подключены" };
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as ChartFile;
    if (!Array.isArray(parsed.charts)) return { ok: false, error: "Чарты не подключены" };
    return { ok: true, byId: new Map(parsed.charts.map((chart) => [chart.id, chart])) };
  } catch {
    return { ok: false, error: "Чарты не подключены" };
  }
}

export function summaries(charts: LoadedCharts): ChartSummary[] {
  if (!charts.ok) return [];
  return [...charts.byId.values()].map(({ id, title, hero, mode, opponent, stack }) => ({
    id,
    title,
    hero,
    mode,
    opponent,
    stack,
  }));
}
