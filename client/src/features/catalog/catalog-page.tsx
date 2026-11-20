import { LEVELS, QUOTAS, findArticle, levelCleared, levelOpen, pickToday, type LevelId, type LevelStat } from "@holdem/domain";
import { findDrill, registry } from "@holdem/engine";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { loadMathStats, loadMistakes } from "../session/api";
import { loadSaved, type SavedSet } from "../ranges/api";

const levels = [
  ["easy", "Простой"],
  ["medium", "Средний"],
  ["hard", "Сложный"],
] as const;

const levelNames: Record<LevelId, string> = { easy: "простой", medium: "средний", hard: "сложный" };

function DrillCard({ drillId, stats, failed }: { drillId: string; stats: LevelStat[] | null; failed: boolean }) {
  const drill = findDrill(drillId);
  if (!drill) return null;
  const known = stats ?? [];
  const missing = failed && !known.some((item) => item.drillId === drill.id);
  const article = findArticle(drill.articleId);
  return (
    <li>
      <Card className="flex h-full flex-col gap-4 p-4 transition-colors duration-150 hover:border-primary/40">
        <div className="space-y-2">
          <h3 className="text-lg">{drill.title}</h3>
          {article ? <p className="text-sm text-muted-foreground">{article.what}</p> : null}
        </div>
        {missing ? <p className="text-sm text-muted-foreground">Нет данных.</p> : null}
        <div className="mt-auto space-y-3">
          {levels.map(([level, label]) => {
            const stat = known.find((item) => item.drillId === drill.id && item.level === level);
            const open = level === "easy" || (stats !== null && levelOpen(known, drill.id, level));
            const quota = QUOTAS[level].count;
            const total = stat?.total ?? 0;
            const cleared = levelCleared(stat, level);
            const href = drill.id === "ranges" ? `/ranges/play?level=${level}` : `/train/${drill.id}?level=${level}`;
            return (
              <div key={level} className="space-y-1">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                  {open ? (
                    <Link className="inline-flex min-h-11 items-center text-primary" to={href}>
                      {label}
                    </Link>
                  ) : (
                    <span className="inline-flex min-h-11 items-center text-muted-foreground">{label}</span>
                  )}
                  {stats !== null && !missing ? (
                    <span className="num text-muted-foreground">
                      {total}/{quota}
                      {open ? "" : " · закрыт"}
                      {cleared ? " · квота взята" : ""}
                    </span>
                  ) : null}
                </div>
                {stats !== null && !missing && open ? <Progress value={(total / quota) * 100} label={`${drill.title}, ${levelNames[level]}, ${total} из ${quota}`} /> : null}
              </div>
            );
          })}
        </div>
      </Card>
    </li>
  );
}

export function CatalogPage() {
  const [stats, setStats] = useState<LevelStat[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState<SavedSet[]>([]);
  const [savedError, setSavedError] = useState(false);
  const [mistakeCount, setMistakeCount] = useState<number | null>(null);

  useEffect(() => {
    loadMathStats()
      .then((body) => {
        setStats(body.stats);
        setFailed(body.failed);
      })
      .catch(() => {
        setStats([]);
        setFailed(true);
      });
    loadSaved()
      .then((body) => setSaved(body.saved ?? []))
      .catch(() => setSavedError(true));
    loadMistakes()
      .then((body) => {
        if (Array.isArray(body.mistakes)) setMistakeCount(body.mistakes.length);
      })
      .catch(() => setMistakeCount(null));
  }, []);

  const known = stats ?? [];
  const loaded = [...new Set(known.map((item) => item.drillId))];
  const today = stats === null ? null : pickToday(known, loaded.length > 0 ? loaded : undefined);
  const todayDrill = today ? findDrill(today.drillId) : undefined;
  const complete = stats !== null && !failed;
  const closed = complete
    ? registry.reduce((sum, drill) => sum + LEVELS.filter((level) => levelCleared(known.find((item) => item.drillId === drill.id && item.level === level), level)).length, 0)
    : null;
  const answers = complete ? known.reduce((sum, item) => sum + item.total, 0) : null;
  const levelCount = registry.length * LEVELS.length;

  return (
    <section className="space-y-10">
      <PageHeader title="Тренируй покерное мышление" lede="Каталог открывает тренажёры. Следующий уровень ждёт квоту предыдущего.">
        <div className="grid gap-3 sm:grid-cols-3">
          <Card className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">Сегодня</p>
            {today ? (
              <Link className="text-primary" to={`/train/${today.drillId}?level=${today.level}&today=1`}>
                {todayDrill?.title ?? today.drillId}, {levelNames[today.level]}
              </Link>
            ) : (
              <Skeleton className="h-6 w-32" />
            )}
          </Card>
          <Card className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">Закрыто уровней</p>
            {stats === null ? <Skeleton className="h-8 w-16" /> : closed === null ? <p className="text-muted-foreground">Нет данных</p> : <p className="num text-2xl tracking-tight">{closed}/{levelCount}</p>}
          </Card>
          <Card className="space-y-2 p-4">
            <p className="text-sm text-muted-foreground">Ответов</p>
            {stats === null ? <Skeleton className="h-8 w-16" /> : answers === null ? <p className="text-muted-foreground">Нет данных</p> : <p className="num text-2xl tracking-tight">{answers}</p>}
          </Card>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Link className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground" to="/today">
            Сегодня
          </Link>
          <Link className="inline-flex min-h-11 items-center text-primary" to="/mistakes">
            Повторить ошибки
          </Link>
          <Link className="inline-flex min-h-11 items-center text-primary" to="/ranges">
            Диапазоны
          </Link>
          <Link className="inline-flex min-h-11 items-center text-primary" to="/pairs">
            Пары
          </Link>
          {mistakeCount === null ? null : (
            <p className="num text-sm text-muted-foreground">{mistakeCount === 0 ? "Открытых ошибок нет." : `В очереди ${mistakeCount}`}</p>
          )}
        </div>
      </PageHeader>
      {failed ? <p className="text-muted-foreground">Часть прогресса не загрузилась. Незагруженные уровни остаются закрытыми.</p> : null}
      {savedError ? <p className="text-muted-foreground">Сохранённые наборы не загрузились.</p> : null}
      {registry.length === 0 ? (
        <p className="text-muted-foreground">Тренажёры появятся следующими блоками.</p>
      ) : (
        <section className="space-y-4">
          <h2 className="text-xl">Тренажёры</h2>
          <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {registry.map((drill) => (
              <DrillCard key={drill.id} drillId={drill.id} stats={stats} failed={failed} />
            ))}
          </ul>
        </section>
      )}
      {saved.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-xl">Сохранённые наборы</h2>
          <ul className="space-y-2">
            {saved.map((item) => (
              <li key={item.id}>
                <Link className="text-primary" to={`/ranges/${item.chartId}`}>
                  {item.name}
                  <span className="num text-muted-foreground">
                    {" "}
                    · {item.total} ответов, {Math.round(item.accuracy * 100)}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}
