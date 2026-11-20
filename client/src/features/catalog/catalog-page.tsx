import { levelOpen, type LevelStat } from "@holdem/domain";
import { registry } from "@holdem/engine";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadMathStats } from "../session/api";
import { loadSaved, type SavedSet } from "../ranges/api";

const levels = [
  ["easy", "Простой"],
  ["medium", "Средний"],
  ["hard", "Сложный"],
] as const;

export function CatalogPage() {
  const [stats, setStats] = useState<LevelStat[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState<SavedSet[]>([]);
  const [savedError, setSavedError] = useState(false);

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
  }, []);

  const known = stats ?? [];
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl tracking-tight">Каталог</h1>
        <Link className="inline-flex rounded-xl bg-primary px-4 py-2 text-primary-foreground" to="/today">
          Сегодня
        </Link>
        <Link className="text-primary" to="/mistakes">
          Повторить ошибки
        </Link>
        <Link className="text-primary" to="/ranges">
          Диапазоны
        </Link>
        {saved.map((item) => (
          <Link key={item.id} className="text-primary" to={`/ranges/${item.chartId}`}>
            {item.name}
            <span className="num text-muted-foreground">
              {" "}
              · {item.total} ответов, {Math.round(item.accuracy * 100)}%
            </span>
          </Link>
        ))}
        {failed ? <p className="text-muted-foreground">Часть прогресса не загрузилась. Незагруженные уровни остаются закрытыми.</p> : null}
        {savedError ? <p className="text-muted-foreground">Сохранённые наборы не загрузились.</p> : null}
      </div>
      {registry.length === 0 ? (
        <p className="text-muted-foreground">Тренажёры появятся следующими блоками.</p>
      ) : (
        <ul className="space-y-4">
          {registry.map((drill) => (
            <li key={drill.id} className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2">{drill.title}</p>
              <span className="flex gap-3 text-sm">
                {levels.map(([level, label]) =>
                  level === "easy" || (stats !== null && levelOpen(known, drill.id, level)) ? (
                    <Link key={level} className="text-primary" to={drill.id === "ranges" ? `/ranges/play?level=${level}` : `/train/${drill.id}?level=${level}`}>
                      {label}
                    </Link>
                  ) : (
                    <span key={level} className="text-muted-foreground">
                      {label}
                    </span>
                  ),
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
