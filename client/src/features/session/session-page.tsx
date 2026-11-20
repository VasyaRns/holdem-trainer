import { QUOTAS, findArticle, type LevelId } from "@holdem/domain";
import { afterAnswer, findDrill, type Grade, type Question } from "@holdem/engine";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getJson, postJson } from "./api";

const LEVELS: LevelId[] = ["easy", "medium", "hard"];
const SITTING = 20;

type CardPayload = { key: string; kind: "number" | "choice" | "pair"; formula: string };

export function SessionPage() {
  const { drillId = "" } = useParams();
  const [params] = useSearchParams();
  const requested = params.get("level");
  const level: LevelId = LEVELS.includes(requested as LevelId) ? (requested as LevelId) : "easy";
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

  useEffect(() => {
    if (!drill) return;
    getJson<{ seen: boolean }>(`/api/intros?drillId=${drill.id}&level=${level}`)
      .then((body) => setSeen(body.seen))
      .catch(() => setSeen(false));
  }, [drill, level]);

  useEffect(() => {
    if (!drill || seen !== true || sessionId) return;
    postJson<{ id: string }>("/api/sessions", { drillId: drill.id, level })
      .then((body) => {
        setSessionId(body.id);
        setQuestion(drill.generate(level));
      })
      .catch(() => setSaved(false));
  }, [drill, seen, sessionId, level]);

  if (!drill) return <p>Такого тренажёра нет.</p>;
  if (seen === null) return <p className="text-muted-foreground">Загрузка…</p>;
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
  if (answered >= SITTING && !grade) {
    return (
      <section className="space-y-4">
        <h1 className="text-3xl">Сессия записана</h1>
        <p className="num">20 вопросов этого захода закрыты. Квота уровня — {QUOTAS[level].count}.</p>
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
    if (count >= SITTING) {
      if (!nextGrade.correct) setGrade(nextGrade);
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
    const next = afterAnswer(nextGrade.correct);
    if (sessionId) {
      void postJson(`/api/sessions/${sessionId}/answers`, {
        question: { key: payload.key, handId: question.handId },
        response: answer,
        correct: nextGrade.correct,
        durationMs: 0,
      }).catch(() => setSaved(false));
    }
    finish(nextGrade, next.repeat);
  };

  const continueAfterMiss = () => {
    setGrade(null);
    if (answered >= SITTING) return;
    setQuestion(drill.generate(level, Math.random, payload.key, question.prompt));
  };

  return (
    <section className="space-y-6">
      <p className="num text-sm text-muted-foreground">
        {drill.title} · {answered + 1}/20
        {saved ? "" : " · ответ не записан"}
      </p>
      <h1 className="text-2xl leading-snug">{question.prompt}</h1>
      {grade ? (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            continueAfterMiss();
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
