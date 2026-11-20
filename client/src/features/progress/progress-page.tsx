import { LEVELS, QUOTAS, achievementTitle, levelCleared, levelOpen, pickToday, sessionsLeft, type LevelId, type LevelStat } from "@holdem/domain";
import { findDrill, registry } from "@holdem/engine";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Progress } from "@/components/ui/progress";
import { loadAchievements, loadMathStats } from "../session/api";

const labels: Record<LevelId, string> = { easy: "простой", medium: "средний", hard: "сложный" };

function sessionsText(count: number, percent: number, threshold: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word = mod10 === 1 && mod100 !== 11 ? "сессия" : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? "сессии" : "сессий";
  if (count > 0) return `ещё ${count} ${word}`;
  return percent >= threshold ? "квота взята" : `объём набран, порог ${threshold}%`;
}

export function ProgressPage() {
  const [stats, setStats] = useState<LevelStat[] | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);
  const [keys, setKeys] = useState<string[] | null>(null);
  const [keysFailed, setKeysFailed] = useState(false);

  useEffect(() => {
    loadMathStats()
      .then((body) => {
        setStats(body.stats);
        setStatsFailed(body.failed);
      })
      .catch(() => {
        setStats([]);
        setStatsFailed(true);
      });
    loadAchievements()
      .then((body) => setKeys(body.achievements))
      .catch(() => setKeysFailed(true));
  }, []);

  const known = stats ?? [];
  const loaded = [...new Set(known.map((stat) => stat.drillId))];
  const today = stats === null ? null : pickToday(known, loaded.length > 0 ? loaded : undefined);
  const todayDrill = today ? findDrill(today.drillId) : undefined;
  const complete = stats !== null && !statsFailed;
  const closed = complete
    ? registry.reduce((sum, drill) => sum + LEVELS.filter((level) => levelCleared(known.find((item) => item.drillId === drill.id && item.level === level), level)).length, 0)
    : null;

  return (
    <section className="space-y-8">
      <PageHeader title="Прогресс">
        <Card className="space-y-2 p-4">
          {today ? (
            <p>
              Сегодня:{" "}
              <Link className="text-primary" to={`/train/${today.drillId}?level=${today.level}&today=1`}>
                {todayDrill?.title ?? today.drillId}, {labels[today.level]}
              </Link>
            </p>
          ) : (
            <p className="text-muted-foreground">Загрузка…</p>
          )}
          {closed !== null ? (
            <p className="num text-sm text-muted-foreground">
              Закрыто уровней {closed}/{registry.length * LEVELS.length}
            </p>
          ) : null}
        </Card>
        {statsFailed ? <p className="text-muted-foreground">Часть прогресса не загрузилась.</p> : null}
      </PageHeader>
      <ul className="grid gap-4 md:grid-cols-2">
        {stats === null
          ? null
          : registry.map((drill) => {
              const missing = statsFailed && !loaded.includes(drill.id);
              const current = today?.drillId === drill.id ? today.level : null;
              return (
                <li key={drill.id}>
                  <Card className="h-full space-y-3 p-4">
                    <h2 className="text-lg">{drill.title}</h2>
                    {missing ? (
                      <p className="text-muted-foreground">Нет данных.</p>
                    ) : (
                      LEVELS.map((level) => {
                        const stat = known.find((item) => item.drillId === drill.id && item.level === level);
                        const total = stat?.total ?? 0;
                        const quota = QUOTAS[level].count;
                        const open = level === "easy" || levelOpen(known, drill.id, level);
                        const percent = stat ? Math.round(stat.accuracy * 100) : 0;
                        return (
                          <div key={level} className="space-y-1">
                            <p className="num text-sm">
                              {labels[level]} {total}/{quota}
                              {open ? ` · ${percent}% · ${sessionsText(sessionsLeft(total, level), percent, Math.round(QUOTAS[level].accuracy * 100))}` : " · закрыт"}
                              {open && current === level ? " · сейчас" : ""}
                            </p>
                            {open ? <Progress value={(total / quota) * 100} label={`${drill.title}, ${labels[level]}, ${total} из ${quota}`} /> : null}
                          </div>
                        );
                      })
                    )}
                  </Card>
                </li>
              );
            })}
      </ul>
      <div className="space-y-3">
        <h2 className="text-xl">Достижения</h2>
        {keysFailed ? <p>Достижения не загрузились.</p> : null}
        {keys === null && !keysFailed ? <p className="text-muted-foreground">Загрузка…</p> : null}
        {keys?.length === 0 ? <EmptyState title="Достижений пока нет." /> : null}
        {keys && keys.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {keys.map((key) => (
              <li key={key}>
                <Badge tone="accent">{achievementTitle(key)}</Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
