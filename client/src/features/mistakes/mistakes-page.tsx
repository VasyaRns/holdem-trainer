import { achievementTitle, type LevelId } from "@holdem/domain";
import { afterAnswer, findDrill, type Grade, type Question, type RepeatTrack } from "@holdem/engine";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { loadMistakes, openSession, saveAnswer, type Mistake } from "../session/api";

const LEVELS: LevelId[] = ["easy", "medium", "hard"];

type CardPayload = { key: string; kind: "number" | "choice" | "pair"; formula: string };

function knownLevel(value: string): LevelId | null {
  return LEVELS.includes(value as LevelId) ? (value as LevelId) : null;
}

export function MistakesPage() {
  const [mistakes, setMistakes] = useState<Mistake[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [cursor, setCursor] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [draft, setDraft] = useState("");
  const [pair, setPair] = useState(["", ""]);
  const [saved, setSaved] = useState(true);
  const [notices, setNotices] = useState<string[]>([]);
  const [openError, setOpenError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const track = useRef<RepeatTrack>({ missed: false, streak: 0 });
  const startedAt = useRef(Date.now());
  const shownHand = useRef("");
  const sessionPlace = useRef("");
  const item = mistakes?.[cursor];

  useEffect(() => {
    let cancelled = false;
    loadMistakes()
      .then((body) => {
        if (!cancelled) setMistakes(body.mistakes);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!item) return;
    const drill = findDrill(item.drillId);
    const level = knownLevel(item.level);
    if (!drill || !level) {
      setCursor((value) => value + 1);
      return;
    }
    track.current = { missed: false, streak: 0 };
    setGrade(null);
    setDraft("");
    setPair(["", ""]);
    setSaved(true);
    const nextQuestion = drill.generate(level, Math.random, item.key);
    shownHand.current = nextQuestion.handId;
    setQuestion(nextQuestion);
    startedAt.current = Date.now();
  }, [item]);

  useEffect(() => {
    if (!item) return;
    const place = `${item.drillId}:${item.level}`;
    if (sessionPlace.current === place) return;
    let cancelled = false;
    setSessionId(null);
    openSession(item.drillId, item.level)
      .then((body) => {
        if (cancelled) return;
        sessionPlace.current = place;
        setSessionId(body.id);
        setOpenError(false);
      })
      .catch(() => {
        if (!cancelled) setOpenError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [item, attempt]);

  if (failed) return <p>Очередь не загрузилась.</p>;
  if (!mistakes) return <p className="text-muted-foreground">Загрузка…</p>;
  if (mistakes.length === 0 || cursor >= mistakes.length) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl tracking-tight">Повторить ошибки</h1>
        <p>{mistakes.length === 0 ? "Открытых ошибок нет." : "Ошибки закрыты."}</p>
        <Link className="text-primary" to="/">
          В каталог
        </Link>
      </section>
    );
  }
  if (openError) {
    return (
      <section className="space-y-4">
        <p>Сессия не открылась.</p>
        <Button
          onClick={() => {
            sessionPlace.current = "";
            setOpenError(false);
            setAttempt((value) => value + 1);
          }}
        >
          Ещё раз
        </Button>
      </section>
    );
  }
    if (!item) return <p className="text-muted-foreground">Ждём сессию…</p>;
    if (item.drillId === "ranges") {
      const [chartId, handName] = item.key.split(":");
      return (
        <section className="space-y-4">
          <h1 className="text-3xl tracking-tight">Повторить ошибки</h1>
          <p>Рука {handName || item.key} из чарта.</p>
          {chartId ? (
            <Link className="text-primary" to={`/ranges/${chartId}`}>
              Открыть спот
            </Link>
          ) : null}
          <Button onClick={() => setCursor((value) => value + 1)}>Дальше</Button>
        </section>
      );
    }

  if (!question || !sessionId) return <p className="text-muted-foreground">Ждём сессию…</p>;
  const drill = findDrill(item.drillId);
  const level = knownLevel(item.level);
  if (!drill || !level) return <p className="text-muted-foreground">Ждём сессию…</p>;
  const payload = question.payload as CardPayload;

  const submit = (answer: unknown) => {
    const nextGrade = drill.grade(question, answer);
    const next = afterAnswer(nextGrade.correct, track.current);
    track.current = next.track;
    const handId = question.handId;
    shownHand.current = handId;
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
    setDraft("");
    setPair(["", ""]);
    if (!next.repeat) {
      setCursor((value) => value + 1);
      return;
    }
    if (!nextGrade.correct) {
      setGrade(nextGrade);
      return;
    }
    setGrade(null);
    const nextQuestion = drill.generate(level, Math.random, item.key, question.prompt);
    shownHand.current = nextQuestion.handId;
    setSaved(true);
    setQuestion(nextQuestion);
    startedAt.current = Date.now();
  };

  return (
    <section className="space-y-6">
      <p className="num text-sm text-muted-foreground">
        {drill.title} · ошибки {cursor + 1}/{mistakes.length}
        {saved ? "" : " · ответ не записан"}
      </p>
      {notices.length > 0 ? <p>Достижение: {notices.join(", ")}</p> : null}
      <h1 className="text-2xl leading-snug">{question.prompt}</h1>
      {grade ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            setGrade(null);
            const nextQuestion = drill.generate(level, Math.random, item.key, question.prompt);
            shownHand.current = nextQuestion.handId;
            setSaved(true);
            setQuestion(nextQuestion);
            startedAt.current = Date.now();
          }}
        >
          <p className="text-[#9b3d3d]">Мимо. {grade.formula}</p>
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
