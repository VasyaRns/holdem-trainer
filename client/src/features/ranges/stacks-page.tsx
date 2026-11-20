import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { chartAnswer, RANKS } from "@holdem/engine";
import { chartError, loadChart, loadChartList, type ChartSummary } from "./api";

function pocketKey(text: string): string {
  const raw = text.trim();
  const first = raw[0]?.toUpperCase() ?? "";
  const second = raw[1]?.toUpperCase() ?? "";
  const suit = raw.slice(2).toLowerCase();
  const order = RANKS as readonly string[];
  if (!order.includes(first) || !order.includes(second)) return raw;
  const [high, low] = [first, second].sort((left, right) => order.indexOf(left) - order.indexOf(right));
  return high === low ? `${high}${low}` : `${high}${low}${suit}`;
}

function stacksFor(spots: ChartSummary[], hero: string): number[] {
  return [...new Set(spots.filter((spot) => spot.hero === hero).map((spot) => spot.stack as number))].sort((a, b) => a - b);
}

export function StacksPage() {
  const [spots, setSpots] = useState<ChartSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hero, setHero] = useState("");
  const [hand, setHand] = useState("AA");
  const [left, setLeft] = useState<number | null>(null);
  const [right, setRight] = useState<number | null>(null);
  const [labels, setLabels] = useState<{ hero: string; hand: string; left: number; right: number; leftAction: string; rightAction: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadChartList()
      .then((body) => {
        if (cancelled) return;
        const open = body.charts.filter((spot) => spot.mode === "open" && spot.stack != null);
        setSpots(open);
        const first = open[0];
        if (!first) return;
        const stacks = stacksFor(open, first.hero);
        setHero(first.hero);
        setLeft(stacks[0] ?? null);
        setRight(stacks[1] ?? stacks[0] ?? null);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(chartError(reason));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const heroes = [...new Set((spots ?? []).map((spot) => spot.hero))];
  const stacks = stacksFor(spots ?? [], hero);

  useEffect(() => {
    if (!spots || left == null || right == null || !hero) return;
    const leftSpot = spots.find((spot) => spot.hero === hero && spot.stack === left);
    const rightSpot = spots.find((spot) => spot.hero === hero && spot.stack === right);
    if (!leftSpot || !rightSpot) {
      setLabels(null);
      return;
    }
    let cancelled = false;
    setLabels(null);
    setError(null);
    Promise.all([loadChart(leftSpot.id), loadChart(rightSpot.id)])
      .then(([leftBody, rightBody]) => {
        if (cancelled) return;
        const pocket = pocketKey(hand);
        setError(null);
        setLabels({
          hero,
          hand: pocket,
          left,
          right,
          leftAction: chartAnswer(leftBody.chart.hands, pocket),
          rightAction: chartAnswer(rightBody.chart.hands, pocket),
        });
      })
      .catch((reason: unknown) => {
        if (cancelled) return;
        setLabels(null);
        setError(chartError(reason));
      });
    return () => {
      cancelled = true;
    };
  }, [spots, hero, hand, left, right]);

  if (error && !spots) {
    return (
      <section className="space-y-3">
        <h1 className="text-3xl tracking-tight">Стеки</h1>
        <p>{error}</p>
        <p>Своего чарта нет.</p>
      </section>
    );
  }

  const shown = (action: string) => (action === "fold" ? "Фолд" : action);
  const pocket = pocketKey(hand);
  const fresh = labels?.hero === hero && labels.hand === pocket && labels.left === left && labels.right === right;

  return (
    <section className="space-y-6">
      <h1 className="text-3xl tracking-tight">Стеки</h1>
      <p className="text-muted-foreground">Одна рука на двух стеках. Это не вопрос.</p>
      {spots === null ? <p className="text-muted-foreground">Загрузка…</p> : null}
      {error && spots ? <p>{error}</p> : null}
      {spots?.length === 0 ? <p>Спотов открытия нет.</p> : null}
      {spots && spots.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          <select
            aria-label="Позиция"
            className="rounded-xl border border-border bg-card px-3 py-2"
            value={hero}
            onChange={(event) => {
              const next = event.target.value;
              const nextStacks = stacksFor(spots, next);
              setHero(next);
              setLeft(nextStacks[0] ?? null);
              setRight(nextStacks[1] ?? nextStacks[0] ?? null);
            }}
          >
            {heroes.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <input aria-label="Рука" className="w-24 rounded-xl border border-border bg-card px-3 py-2" value={hand} onChange={(event) => setHand(event.target.value)} />
          <select aria-label="Левый стек" className="rounded-xl border border-border bg-card px-3 py-2" value={left ?? ""} onChange={(event) => setLeft(Number(event.target.value))}>
            {stacks.map((item) => (
              <option key={item} value={item}>
                {item}bb
              </option>
            ))}
          </select>
          <select aria-label="Правый стек" className="rounded-xl border border-border bg-card px-3 py-2" value={right ?? ""} onChange={(event) => setRight(Number(event.target.value))}>
            {stacks.map((item) => (
              <option key={item} value={item}>
                {item}bb
              </option>
            ))}
          </select>
        </div>
      ) : null}
      {fresh && labels ? (
        <div className="grid grid-cols-2 gap-4">
          <p className="num rounded-xl bg-card p-4">
            {labels.left}bb · {shown(labels.leftAction)}
          </p>
          <p className="num rounded-xl bg-card p-4">
            {labels.right}bb · {shown(labels.rightAction)}
          </p>
        </div>
      ) : null}
      <Link className="text-primary" to="/ranges">
        К списку спотов
      </Link>
    </section>
  );
}
