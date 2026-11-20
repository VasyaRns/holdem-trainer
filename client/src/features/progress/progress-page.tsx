import { LEVELS, QUOTAS, achievementTitle, levelOpen, pickToday, sessionsLeft, type LevelId, type LevelStat } from "@holdem/domain";
import { findDrill, registry } from "@holdem/engine";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl tracking-tight">Прогресс</h1>
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
        {statsFailed ? <p className="text-muted-foreground">Часть прогресса не загрузилась.</p> : null}
      </div>
      <ul className="space-y-4">
        {stats === null
          ? null
          : registry.map((drill) => {
          const missing = statsFailed && !loaded.includes(drill.id);
          const current = today?.drillId === drill.id ? today.level : null;
          return (
            <li key={drill.id} className="space-y-2 rounded-xl border border-border bg-card p-4">
              <p>{drill.title}</p>
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
                    <p key={level} className="num text-sm">
                      {labels[level]} {total}/{quota}
                      {open ? ` · ${percent}% · ${sessionsText(sessionsLeft(total, level), percent, Math.round(QUOTAS[level].accuracy * 100))}` : " · закрыт"}
                      {open && current === level ? " · сейчас" : ""}
                    </p>
                  );
                })
              )}
            </li>
          );
        })}
      </ul>
      <div className="space-y-2">
        <h2 className="text-xl">Достижения</h2>
        {keysFailed ? <p>Достижения не загрузились.</p> : null}
        {keys === null && !keysFailed ? <p className="text-muted-foreground">Загрузка…</p> : null}
        {keys?.length === 0 ? <p>Достижений пока нет.</p> : null}
        {keys && keys.length > 0 ? (
          <ul className="space-y-2">
            {keys.map((key) => (
              <li key={key}>{achievementTitle(key)}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
