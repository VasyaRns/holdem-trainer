import { LEVELS, PAIRS_QUOTAS, achievementTitle, pairsLevelOpen, type LevelId } from "@holdem/domain";
import { buildPairsDeck, type PairsDeck, type RangeChart } from "@holdem/engine";
import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { chartError, loadChart, loadChartList, type Chart, type ChartSummary } from "../ranges/api";
import { loadPairs, postPairs } from "./api";
import { PairsTable, type PairsFinish } from "./pairs-table";

const labels: Record<LevelId, string> = {
  easy: "Простой",
  medium: "Средний",
  hard: "Сложный",
};

function asLevel(value: string | null): LevelId {
  if (value === "medium" || value === "hard") return value;
  return "easy";
}

function toRange(chart: Chart): RangeChart {
  return {
    id: chart.id,
    title: chart.title,
    hero: chart.hero,
    mode: chart.mode,
    stack: chart.stack,
    hands: chart.hands,
  };
}

function unfit(level: LevelId): string {
  if (level === "easy") return "В этом споте нет четырёх чистых действий открытия.";
  if (level === "medium") return "В этом споте нет шести чистых действий.";
  return "В этом споте нет восьми действий со смешанной клеткой.";
}

type LevelRecord = {
  passedCount: number | null;
  bestSeconds: number | null;
  bestMoves: number | null;
};

function countsOf(records: Partial<Record<LevelId, LevelRecord>> | null): Partial<Record<LevelId, number | null>> {
  const next: Partial<Record<LevelId, number | null>> = {};
  for (const item of LEVELS) next[item] = records?.[item]?.passedCount ?? null;
  return next;
}

type PendingSave = PairsFinish & { id: string; level: string; chartId: string };

function bestLine(record: LevelRecord | undefined): string | null {
  if (!record || record.passedCount == null) return null;
  if (record.bestSeconds == null || record.bestMoves == null) return "Лучших времени и ходов пока нет.";
  return `Лучшее время: ${record.bestSeconds} с. Лучшие ходы: ${record.bestMoves}.`;
}

function lockText(level: LevelId): string {
  if (level === "medium") return `Средний стол откроется после ${PAIRS_QUOTAS.easy} засчитанных партий на простом.`;
  return `Сложный стол откроется после ${PAIRS_QUOTAS.medium} засчитанных партий на среднем.`;
}

export function PairsPage() {
  const { chartId } = useParams();
  const [params] = useSearchParams();
  const level = asLevel(params.get("level"));
  const [spots, setSpots] = useState<ChartSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [records, setRecords] = useState<Partial<Record<LevelId, LevelRecord>> | null>(null);
  const [countsFailed, setCountsFailed] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [notices, setNotices] = useState<string[]>([]);
  const [chart, setChart] = useState<Chart | null>(null);
  const [spotError, setSpotError] = useState<string | null>(null);
  const [deck, setDeck] = useState<PairsDeck | null>(null);
  const saved = useRef(false);
  const sending = useRef(false);
  const pending = useRef<PendingSave | null>(null);
  const gameKey = useRef(0);
  const pendingKey = useRef(0);
  const attemptId = useRef<string | null>(null);
  const counts = countsOf(records);
  const waiting = level !== "easy" && records === null;
  const allowed = level === "easy" || (records !== null && pairsLevelOpen(counts, level));

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
    let cancelled = false;
    Promise.all(
      LEVELS.map(async (item) => {
        try {
          const body = await loadPairs(item);
          return [item, {
            passedCount: typeof body.passedCount === "number" ? body.passedCount : null,
            bestSeconds: typeof body.bestSeconds === "number" ? body.bestSeconds : null,
            bestMoves: typeof body.bestMoves === "number" ? body.bestMoves : null,
          }] as const;
        } catch {
          return [item, { passedCount: null, bestSeconds: null, bestMoves: null }] as const;
        }
      }),
    ).then((rows) => {
      if (cancelled) return;
      const next: Partial<Record<LevelId, LevelRecord>> = {};
      let failed = false;
      for (const [item, record] of rows) {
        next[item] = record;
        if (record.passedCount == null) failed = true;
      }
      setRecords(next);
      setCountsFailed(failed);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!chartId || !allowed) {
      setChart(null);
      setSpotError(null);
      setDeck(null);
      return;
    }
    let cancelled = false;
    setChart(null);
    setSpotError(null);
    setDeck(null);
    loadChart(chartId)
      .then((body) => {
        if (cancelled) return;
        if (body.chart.id !== chartId) {
          setSpotError("Спот не найден");
          return;
        }
        setChart(body.chart);
        setDeck(buildPairsDeck(toRange(body.chart), level));
        setSpotError(null);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setSpotError(chartError(reason));
      });
    return () => {
      cancelled = true;
    };
  }, [chartId, level, allowed]);

  useEffect(() => {
    gameKey.current += 1;
    attemptId.current = null;
    saved.current = false;
    sending.current = false;
    setNotices([]);
    if (!pending.current) setSaveError("");
  }, [chartId, level]);

  function href(next: LevelId): string {
    const query = `level=${next}`;
    return chartId ? `/pairs/${chartId}?${query}` : `/pairs?${query}`;
  }

  function write(payload: PendingSave, key: number) {
    sending.current = true;
    setSaveError("");
    postPairs(payload)
      .then((body) => {
        if (pending.current?.id === payload.id) {
          pending.current = null;
          setSaveError("");
        }
        if (gameKey.current === key) {
          saved.current = true;
          attemptId.current = null;
          if (body.unlocked && body.unlocked.length > 0) setNotices(body.unlocked.map(achievementTitle));
        }
        return loadPairs(payload.level)
          .then((fresh) => {
            setRecords((current) => ({
              ...current,
              [payload.level]: {
                passedCount: fresh.passedCount,
                bestSeconds: fresh.bestSeconds,
                bestMoves: fresh.bestMoves,
              },
            }));
          })
          .catch(() => {
            if (gameKey.current === key) setSaveError("Партия записана, счёт не обновился.");
          });
      })
      .catch(() => {
        if (pending.current?.id === payload.id) setSaveError("Партия не записалась.");
      })
      .finally(() => {
        if (gameKey.current === key) sending.current = false;
      });
  }

  function finish(result: PairsFinish) {
    if (!chartId || saved.current || sending.current) return;
    if (!attemptId.current) attemptId.current = crypto.randomUUID();
    const payload: PendingSave = { id: attemptId.current, level, chartId, ...result };
    pending.current = payload;
    pendingKey.current = gameKey.current;
    write(payload, pendingKey.current);
  }

  const line = bestLine(records?.[level]);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl tracking-tight">Пары</h1>
      <div className="flex flex-wrap gap-3 text-sm">
        {LEVELS.map((item) => {
          const open = item === "easy" || (records !== null && pairsLevelOpen(counts, item));
          const count = records?.[item]?.passedCount;
          const mark = typeof count === "number" ? ` ${count}/${PAIRS_QUOTAS[item]}` : "";
          return open ? (
            <Link key={item} className={item === level ? "text-primary" : "text-foreground"} to={href(item)}>
              {labels[item]}
              <span className="num">{mark}</span>
            </Link>
          ) : (
            <span key={item} className="text-muted-foreground">
              {labels[item]}
            </span>
          );
        })}
      </div>
      {line ? <p className="num">{line}</p> : null}
      {saveError ? <p>{saveError}</p> : null}
      {saveError === "Партия не записалась." ? (
        <button
          className="rounded-xl bg-primary px-4 py-2 text-primary-foreground"
          type="button"
          onClick={() => {
            const payload = pending.current;
            if (payload) write(payload, pendingKey.current);
          }}
        >
          Записать снова
        </button>
      ) : null}
      {notices.map((notice) => (
        <p key={notice}>{notice}</p>
      ))}
      {countsFailed && !chartId ? <p className="text-muted-foreground">Счёт партий не загрузился. Следующий стол остаётся закрытым.</p> : null}
      {!chartId && listError ? (
        <section className="space-y-3">
          <p>{listError}</p>
          <p>Своего чарта нет.</p>
        </section>
      ) : null}
      {!chartId && spots === null && !listError ? <p className="text-muted-foreground">Загрузка…</p> : null}
      {!chartId && spots?.length === 0 ? <p>Спотов нет.</p> : null}
      {!chartId ? (
        <ul className="space-y-2">
          {spots?.map((spot) => (
            <li key={spot.id}>
              <Link className="text-primary" to={`/pairs/${spot.id}?level=${level}`}>
                {spot.title}
              </Link>
              <span className="text-sm text-muted-foreground">
                {" "}
                · {spot.hero}
                {spot.stack == null ? "" : ` · ${spot.stack}bb`}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <Link className="text-primary" to={`/pairs?level=${level}`}>
          К списку спотов
        </Link>
      )}
      {chartId && waiting ? <p className="text-muted-foreground">Загрузка…</p> : null}
      {chartId && !waiting && !allowed ? <p>{lockText(level)}</p> : null}
      {chartId && allowed && !chart && !spotError ? <p className="text-muted-foreground">Загрузка…</p> : null}
      {spotError ? <p>{spotError}</p> : null}
      {chart && deck ? <PairsTable title={chart.title} stack={chart.stack} deck={deck} onFinish={finish} /> : null}
      {chart && !deck ? <p>{unfit(level)}</p> : null}
    </section>
  );
}
