import { QUOTAS, achievementTitle, findArticle, levelOpen, type LevelId } from "@holdem/domain";
import { afterAnswer, findDrill, type Grade, type Question, type RepeatTrack } from "@holdem/engine";
import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getJson, loadLevel, openSession, postJson, saveAnswer, type LevelSummary } from "./api";

const LEVELS: LevelId[] = ["easy", "medium", "hard"];
const SITTING = 20;

type CardPayload = { key: string; kind: "number" | "choice" | "pair"; formula: string };

export function SessionPage() {
  const { drillId = "" } = useParams();
  const [params] = useSearchParams();
  const requested = params.get("level");
  const level: LevelId = LEVELS.includes(requested as LevelId) ? (requested as LevelId) : "easy";
  const today = params.get("today") === "1";
  const drill = findDrill(drillId);
  const article = drill ? findArticle(drill.articleId) : undefined;
  const [seen, setSeen] = useState<boolean | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answered, setAnswered] = useState(0);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [draft, setDraft] = useState("");
  const [pair, setPair] = useState(["", ""]);
  const [saved, setSaved] = useState(true);
  const [openError, setOpenError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const previous: LevelId | null = level === "medium" ? "easy" : level === "hard" ? "medium" : null;
  const [gate, setGate] = useState<"open" | "locked" | "loading">(previous ? "loading" : "open");
  const [prior, setPrior] = useState<LevelSummary | null>(null);
  const [notices, setNotices] = useState<string[]>([]);
  const startedAt = useRef(Date.now());
  const opened = useRef("");
  const track = useRef<RepeatTrack>({ missed: false, streak: 0 });
  const shownHand = useRef("");
  const currentPlace = `${drillId}:${level}:${today ? "today" : "drill"}`;
  const [place, setPlace] = useState(currentPlace);
  if (place !== currentPlace) {
    setPlace(currentPlace);
    opened.current = "";
    track.current = { missed: false, streak: 0 };
    setSeen(null);
    setSessionId(null);
    setQuestion(null);
    setAnswered(0);
    setGrade(null);
    setDraft("");
    setPair(["", ""]);
    setSaved(true);
    setOpenError(false);
    setGate(level === "easy" ? "open" : "loading");
    setPrior(null);
  }

  useEffect(() => {
    if (!drill) return;
    let cancelled = false;
    getJson<{ seen: boolean }>(`/api/intros?drillId=${drill.id}&level=${level}`)
      .then((body) => {
        if (!cancelled) setSeen(body.seen);
      })
      .catch(() => {
        if (!cancelled) setSeen(false);
      });
    return () => {
      cancelled = true;
    };
  }, [drill, level]);

  useEffect(() => {
    if (!drill || !previous) return;
    let cancelled = false;
    loadLevel(drill.id, previous)
      .then((summary) => {
        if (cancelled) return;
        setPrior(summary);
        const stat = { drillId: drill.id, level: previous, total: summary.total, accuracy: summary.accuracy };
        setGate(levelOpen([stat], drill.id, level) ? "open" : "locked");
      })
      .catch(() => {
        if (!cancelled) setGate("locked");
      });
    return () => {
      cancelled = true;
    };
  }, [drill, level, previous]);

  useEffect(() => {
    if (!drill || seen !== true || gate !== "open") return;
    const key = `${drill.id}:${level}:${today ? "today" : "drill"}:${attempt}`;
    if (opened.current === key) return;
    opened.current = key;
    openSession(drill.id, level, today)
      .then((body) => {
        if (opened.current !== key) return;
        setSessionId(body.id);
        setQuestion(drill.generate(level));
        setOpenError(false);
        if (body.unlocked.length > 0) setNotices(body.unlocked.map(achievementTitle));
      })
      .catch(() => {
        if (opened.current !== key) return;
        opened.current = "";
        setOpenError(true);
      });
  }, [drill, seen, level, attempt, gate, today]);

  useEffect(() => {
    startedAt.current = Date.now();
    shownHand.current = question?.handId ?? "";
    setSaved(true);
  }, [question?.handId]);

  if (!drill) return <p>Такого тренажёра нет.</p>;
  if (drill.id === "ranges") return <Navigate to={`/ranges/play?level=${level}${today ? "&today=1" : ""}`} replace />;
  if (gate === "locked" && previous) {
    const quota = QUOTAS[previous];
    const title = level === "medium" ? "Средний" : "Сложный";
    const earlier = previous === "easy" ? "простой" : "средний";
    return (
      <section className="space-y-4">
        <h1 className="text-3xl tracking-tight">{title} закрыт</h1>
        <p>
          Он откроется, когда {earlier} наберёт {quota.count} ответов и {Math.round(quota.accuracy * 100)}% на последних 20.
          {prior ? ` Сейчас ${prior.total}/${quota.count} и ${Math.round(prior.accuracy * 100)}%.` : ""}
        </p>
        <Link className="text-primary" to="/">
          В каталог
        </Link>
      </section>
    );
  }
  if (gate === "loading" || seen === null) return <p className="text-muted-foreground">Загрузка…</p>;
  if (!seen && article) {
    return (
      <article className="space-y-4">
        <h1 className="text-3xl tracking-tight">{article.title}</h1>
        <p>{article.what}</p>
        <p className="num rounded-xl bg-card p-4">{article.example}</p>
        <Button
          onClick={() => {
            setSeen(true);
            void postJson("/api/intros", { drillId: drill.id, level }).catch(() => undefined);
          }}
        >
          Дальше
        </Button>
      </article>
    );
  }
  if (openError) {
    return (
      <section className="space-y-4">
        <p>Сессия не открылась.</p>
        <Button
          onClick={() => {
            setOpenError(false);
            setAttempt((value) => value + 1);
          }}
        >
          Ещё раз
        </Button>
      </section>
    );
  }
  if (answered >= SITTING && !grade && !track.current.missed) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl">Сессия записана</h1>
        <p className="num">Заход закрыт, ответов: {answered}. Квота уровня — {QUOTAS[level].count}.</p>
        {saved ? null : <p>Часть ответов не записалась. Квота могла не сдвинуться.</p>}
        <Link className="text-primary" to="/">
          В каталог
        </Link>
      </section>
    );
  }
  if (!question) return <p className="text-muted-foreground">Ждём сессию…</p>;

  const payload = question.payload as CardPayload;
  const finish = (nextGrade: Grade, repeat: boolean) => {
    const count = answered + 1;
    setAnswered(count);
    setDraft("");
    setPair(["", ""]);
    if (count >= SITTING && !repeat) {
      setGrade(nextGrade.correct ? null : nextGrade);
      return;
    }
    if (!nextGrade.correct) {
      setGrade(nextGrade);
      return;
    }
    setGrade(null);
    setQuestion(drill.generate(level, Math.random, repeat ? payload.key : undefined, question.prompt));
  };

  const submit = (answer: unknown) => {
    const nextGrade = drill.grade(question, answer);
    const next = afterAnswer(nextGrade.correct, track.current);
    track.current = next.track;
    const handId = question.handId;
    if (sessionId) {
      void saveAnswer(sessionId, {
        question: { key: payload.key, handId },
        response: answer,
        correct: nextGrade.correct,
        miss: nextGrade.miss,
        durationMs: Date.now() - startedAt.current,
      })
        .then((body) => {
          if (shownHand.current === handId) setSaved(true);
          if (body.unlocked.length > 0) setNotices(body.unlocked.map(achievementTitle));
        })
        .catch(() => {
          if (shownHand.current === handId) setSaved(false);
        });
    }
    finish(nextGrade, next.repeat);
  };

  const continueAfterMiss = () => {
    setGrade(null);
    setQuestion(drill.generate(level, Math.random, payload.key, question.prompt));
  };

  return (
    <section className="space-y-6">
      <p className="num text-sm text-muted-foreground">
        {drill.title} · {answered + 1}/20
        {saved ? "" : " · ответ не записан"}
      </p>
      {notices.length > 0 ? <p>Достижение: {notices.join(", ")}</p> : null}
      <h1 className="text-2xl leading-snug">{question.prompt}</h1>
      {grade ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            continueAfterMiss();
          }}
        >
          <p className="text-miss">Мимо. {grade.formula}</p>
          <Button type="submit" autoFocus>
            Дальше
          </Button>
        </form>
      ) : payload.kind === "choice" ? (
        <div className="flex gap-3">
          <Button onClick={() => submit("call")}>Колл</Button>
          <Button variant="quiet" onClick={() => submit("fold")}>
            Фолд
          </Button>
        </div>
      ) : payload.kind === "pair" ? (
        <form
          className="flex gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit(pair);
          }}
        >
          <input className="num w-24 rounded-xl border border-border bg-card px-3 py-2" inputMode="numeric" value={pair[0]} onChange={(event) => setPair([event.target.value, pair[1] ?? ""])} aria-label="MDF" />
          <input className="num w-24 rounded-xl border border-border bg-card px-3 py-2" inputMode="numeric" value={pair[1]} onChange={(event) => setPair([pair[0] ?? "", event.target.value])} aria-label="Альфа" />
          <Button type="submit">Ответить</Button>
        </form>
      ) : (
        <form
          className="flex gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            submit(draft);
          }}
        >
          <input className="num w-32 rounded-xl border border-border bg-card px-3 py-2 text-2xl" inputMode="decimal" autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} aria-label="Ответ" />
          <Button type="submit">Ответить</Button>
        </form>
      )}
    </section>
  );
}
