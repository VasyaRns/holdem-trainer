import { levelOpen, POSITIONS, type LevelId } from "@holdem/domain";
import { BUCKET_LABELS, allHands, gradeRange, orbitQuestion, questionFromChart, type RangeChart, type RangeQuestion } from "@holdem/engine";
import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { openSession, saveAnswer, loadLevel } from "../session/api";
import { chartError, loadChart, loadChartList, type ChartSummary } from "./api";

const STEPS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

function asLevel(value: string | null): LevelId | "orbit" {
  if (value === "medium" || value === "hard" || value === "orbit") return value;
  return "easy";
}

export function RangePlayPage() {
  const [params] = useSearchParams();
  const level = asLevel(params.get("level"));
  const today = params.get("today") === "1";
  const previous: LevelId | null = level === "medium" ? "easy" : level === "hard" ? "medium" : null;
  const [spots, setSpots] = useState<ChartSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [stack, setStack] = useState<number | null>(null);
  const [hand, setHand] = useState("");
  const [seat, setSeat] = useState(0);
  const [question, setQuestion] = useState<RangeQuestion | null>(null);
  const [miss, setMiss] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [answered, setAnswered] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [locked, setLocked] = useState(false);
  const [done, setDone] = useState(false);
  const started = useRef(Date.now());

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

  const orbitSeats = (spots ?? [])
    .filter((spot) => spot.mode === "open" && spot.stack === stack)
    .sort((a, b) => POSITIONS.indexOf(a.hero as (typeof POSITIONS)[number]) - POSITIONS.indexOf(b.hero as (typeof POSITIONS)[number]));

  useEffect(() => {
    if (!spots || listError || question) return;
    if (level === "orbit" && stack == null) return;
    const fixedHand = hand || allHands()[Math.floor(Math.random() * allHands().length)] || "AA";
    if (level === "orbit" && !hand) {
      setHand(fixedHand);
      return;
    }
    const pool = spots.filter((spot) => (level === "hard" ? true : level === "medium" ? spot.mode === "open" || spot.mode === "vs" : spot.mode === "open"));
    const seatSpot = level === "orbit" ? orbitSeats[seat] : undefined;
    const order = seatSpot ? [seatSpot] : [...pool].sort(() => Math.random() - 0.5);
    let cancelled = false;
    void (async () => {
      for (const spot of order) {
        const body = await loadChart(spot.id);
        if (cancelled) return;
        const chart = body.chart as RangeChart;
        const next = level === "orbit" ? orbitQuestion(chart, fixedHand) : questionFromChart(chart, level);
        if (!next) continue;
        setQuestion(next);
        setMiss("");
        setPending(null);
        started.current = Date.now();
        return;
      }
      if (!cancelled) setNotice("В подключённых чартах нет вопроса этого уровня.");
    })().catch((reason: unknown) => {
      if (!cancelled) setNotice(chartError(reason));
    });
    return () => {
      cancelled = true;
    };
  }, [spots, listError, question, stack, seat, hand, level]);

  useEffect(() => {
    if (!previous || level === "orbit") return;
    let cancelled = false;
    loadLevel("ranges", previous)
      .then((summary) => {
        if (cancelled) return;
        const stat = { drillId: "ranges", level: previous, total: summary.total, accuracy: summary.accuracy };
        setLocked(!levelOpen([stat], "ranges", level));
      })
      .catch(() => {
        if (!cancelled) setLocked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [level, previous]);

  useEffect(() => {
    if (!spots || sessionId || listError || locked) return;
    openSession("ranges", level === "orbit" ? "easy" : level, today)
      .then((body) => setSessionId(body.id))
      .catch(() => setNotice("Сессия не открылась."));
  }, [spots, sessionId, level, listError, today, locked]);

  if (listError) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl tracking-tight">Диапазоны</h1>
        <p>{listError}</p>
        <p>Своего чарта нет.</p>
      </section>
    );
  }
  if (!spots) return <p className="text-muted-foreground">Загрузка…</p>;
  if (locked && previous) {
    const title = level === "medium" ? "Средний" : "Сложный";
    const earlier = previous === "easy" ? "простой" : "средний";
    return (
      <section className="space-y-4">
        <h1 className="text-3xl tracking-tight">{title} закрыт</h1>
        <p>Он откроется, когда {earlier} уровень диапазонов закроет квоту.</p>
        <Link className="text-primary" to="/ranges">
          К списку спотов
        </Link>
      </section>
    );
  }
  if (done) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl">Сессия записана</h1>
        <p className="num">Заход закрыт, ответов: {answered}.</p>
        <Link className="text-primary" to="/ranges">
          К списку спотов
        </Link>
      </section>
    );
  }
  if (level === "orbit" && stack == null) {
    const stacks = [...new Set(spots.filter((spot) => spot.mode === "open" && spot.stack != null).map((spot) => spot.stack as number))];
    return (
      <section className="space-y-4">
        <h1 className="text-3xl tracking-tight">Орбита</h1>
        <p>Один стек, та же рука в чарте открытия каждой позиции. Ответы пишутся в простой уровень.</p>
        <div className="flex flex-wrap gap-3">
          {stacks.map((item) => (
            <Button key={item} onClick={() => setStack(item)}>
              {item}bb
            </Button>
          ))}
        </div>
      </section>
    );
  }
  if (!question) return <p className="text-muted-foreground">{notice || "Ищем спот…"}</p>;

  const submit = (action: string, pickedStep?: number) => {
    if (!sessionId) {
      setNotice("Сессия не открылась.");
      return;
    }
    const result = gradeRange(question, action, pickedStep);
    const count = answered + 1;
    void saveAnswer(sessionId, {
      question: { key: `${question.chartId}:${question.hand}`, handId: crypto.randomUUID(), chartId: question.chartId },
      response: { value: action, step: pickedStep ?? null, miss: result.miss },
      correct: result.correct,
      miss: result.miss,
      durationMs: Date.now() - started.current,
    }).catch(() => setNotice("Ответ не записан"));
    setAnswered(count);
    if (!result.correct) {
      setMiss(result.formula);
      setPending(null);
      return;
    }
    setMiss("");
    if (count >= 20) {
      setDone(true);
      return;
    }
    if (level === "orbit" && orbitSeats[seat + 1]) {
      setSeat((value) => value + 1);
      setQuestion(null);
      return;
    }
    if (level === "orbit") {
      setHand("");
      setSeat(0);
    }
    setQuestion(null);
  };

  const label = (choice: string) => (question.kind === "bucket" ? BUCKET_LABELS[choice] ?? choice : choice === "fold" ? "Фолд" : choice);

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <p className="num text-sm text-muted-foreground">
        Диапазоны · {Math.min(answered + 1, 20)}/20{level === "orbit" ? ` · ${question.hero}` : ""}
      </p>
      <Card className="space-y-6 p-4 sm:p-6">
        <h1 className="text-2xl leading-snug">{question.prompt}</h1>
        {miss ? (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (answered >= 20) setDone(true);
              else setMiss("");
            }}
          >
            <p className="rounded-lg border border-miss/30 bg-miss/10 px-4 py-3 text-miss">Мимо. {miss}</p>
            <Button type="submit">Дальше</Button>
          </form>
        ) : pending ? (
          <div className="flex flex-wrap gap-2">
            {STEPS.map((item) => (
              <Button key={item} onClick={() => submit(pending, item)}>
                {item}%
              </Button>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {question.choices.map((choice) => (
              <Button key={choice} onClick={() => (question.kind === "mixed" ? setPending(choice) : submit(choice))}>
                {label(choice)}
              </Button>
            ))}
          </div>
        )}
      </Card>
      {notice ? <p>{notice}</p> : null}
      <Link className="inline-flex min-h-11 items-center text-primary" to="/ranges">
        К списку спотов
      </Link>
    </section>
  );
}
