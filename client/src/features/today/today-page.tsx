import { pickToday, type LevelId } from "@holdem/domain";
import { findDrill } from "@holdem/engine";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { loadMathStats } from "../session/api";

const labels: Record<LevelId, string> = { easy: "простой", medium: "средний", hard: "сложный" };

export function TodayPage() {
  const [target, setTarget] = useState(pickToday([]));
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadMathStats()
      .then(({ stats, failed: missed }) => {
        const loaded = [...new Set(stats.map((stat) => stat.drillId))];
        setTarget(pickToday(stats, loaded.length > 0 ? loaded : undefined));
        setFailed(missed);
        setReady(true);
      })
      .catch(() => {
        setTarget(pickToday([]));
        setFailed(true);
        setReady(true);
      });
  }, []);

  const drill = findDrill(target.drillId);
  return (
    <section className="mx-auto max-w-2xl">
      <PageHeader title="Сегодня" lede="Самый слабый открытый уровень среди загруженных тренажёров.">
        <Card className="space-y-4 p-4">
          {ready ? (
            <p>
              {drill?.title ?? target.drillId}, {labels[target.level]}
            </p>
          ) : (
            <p className="text-muted-foreground">Загрузка…</p>
          )}
          {failed ? <p className="text-muted-foreground">Часть прогресса не загрузилась.</p> : null}
          {ready ? (
            <Link className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-primary-foreground" to={`/train/${target.drillId}?level=${target.level}&today=1`}>
              Начать
            </Link>
          ) : null}
        </Card>
      </PageHeader>
    </section>
  );
}
