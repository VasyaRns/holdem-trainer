import { pickToday } from "@holdem/domain";
import { findDrill } from "@holdem/engine";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { loadMathStats } from "../session/api";

export function TodayPage() {
  const [target, setTarget] = useState(pickToday([]));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadMathStats()
      .then(({ stats, failed: missed }) => {
        const loaded = [...new Set(stats.map((stat) => stat.drillId))];
        setTarget(pickToday(stats, loaded.length > 0 ? loaded : undefined));
        setFailed(missed);
      })
      .catch(() => {
        setTarget(pickToday([]));
        setFailed(true);
      });
  }, []);

  const drill = findDrill(target.drillId);
  return (
    <section className="space-y-4">
      <h1 className="text-3xl">Сегодня</h1>
      <p>
        {drill?.title ?? target.drillId}, уровень {target.level}
      </p>
      {failed ? <p className="text-muted-foreground">Часть прогресса не загрузилась.</p> : null}
      <Link className="text-primary" to={`/train/${target.drillId}?level=${target.level}&today=1`}>
        Начать
      </Link>
    </section>
  );
}
