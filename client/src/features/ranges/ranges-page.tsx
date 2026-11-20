import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fieldClass } from "@/components/ui/field";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { chartError, loadChart, loadChartList, saveSet, type Chart, type ChartSummary } from "./api";

export function RangesPage() {
  const { chartId } = useParams();
  const [spots, setSpots] = useState<ChartSummary[] | null>(null);
  const [chart, setChart] = useState<Chart | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [spotError, setSpotError] = useState<string | null>(null);
  const [setName, setSetName] = useState("");
  const [savedNote, setSavedNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    loadChartList()
      .then((body) => {
        if (!cancelled) setSpots(body.charts);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setListError(chartError(reason));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!chartId) {
      setChart(null);
      setSpotError(null);
      setSetName("");
      setSavedNote("");
      return;
    }
    let cancelled = false;
    setChart(null);
    setSpotError(null);
    setSetName("");
    setSavedNote("");
    loadChart(chartId)
      .then((body) => {
        if (cancelled) return;
        setChart(body.chart);
        setSpotError(null);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setSpotError(chartError(reason));
      });
    return () => {
      cancelled = true;
    };
  }, [chartId]);

  return (
    <section className="space-y-8">
      <PageHeader title="Диапазоны" lede="Споты приходят с сервера. Уровни игры те же, что в каталоге.">
        {spots && spots.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-primary" to="/ranges/play?level=easy">
              Простой
            </Link>
            <Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-primary" to="/ranges/play?level=medium">
              Средний
            </Link>
            <Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-primary" to="/ranges/play?level=hard">
              Сложный
            </Link>
            <Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-primary" to="/ranges/play?level=orbit">
              Орбита
            </Link>
            <Link className="inline-flex min-h-11 items-center rounded-lg px-3 text-primary" to="/ranges/stacks">
              Стеки
            </Link>
          </div>
        ) : null}
      </PageHeader>
      {listError ? (
        <section className="space-y-3">
          <p>{listError}</p>
          <p>Своего чарта нет.</p>
        </section>
      ) : null}
      {spots === null && !listError ? <p className="text-muted-foreground">Загрузка…</p> : null}
      {spots?.length === 0 ? <p>Спотов нет.</p> : null}
      <ul className="grid gap-3 md:grid-cols-2">
        {spots?.map((spot) => (
          <li key={spot.id}>
            <Card className="p-4">
              <Link className="text-primary" to={`/ranges/${spot.id}`}>
                {spot.title}
              </Link>
              <span className="text-sm text-muted-foreground">
                {" "}
                · {spot.hero}
                {spot.stack == null ? "" : ` · ${spot.stack}bb`}
              </span>
            </Card>
          </li>
        ))}
      </ul>
      {chart ? (
        <form
          className="max-w-md space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const name = setName.trim() || chart.title;
            void saveSet(name, chart.id)
              .then(() => setSavedNote("Набор сохранён"))
              .catch(() => setSavedNote("Набор не сохранился"));
          }}
        >
          <p className="num">
            {chart.title}. Рук в споте: {Object.keys(chart.hands).length}.
          </p>
          <input className={cn(fieldClass, "w-full")} aria-label="Имя набора" value={setName} onChange={(event) => setSetName(event.target.value)} placeholder="Имя набора" />
          <Button type="submit">Сохранить набор</Button>
          {savedNote ? <p>{savedNote}</p> : null}
        </form>
      ) : null}
      {spotError ? <p>{spotError}</p> : null}
    </section>
  );
}
