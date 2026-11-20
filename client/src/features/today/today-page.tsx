import { MATH_DRILLS, pickToday, type LevelId, type LevelStat } from "@holdem/domain";
import { findDrill } from "@holdem/engine";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getJson } from "../session/api";

const levels: LevelId[] = ["easy", "medium", "hard"];

export function TodayPage() {
  const [target, setTarget] = useState(pickToday([]));

  useEffect(() => {
    Promise.all(
      MATH_DRILLS.flatMap((drillId) =>
        levels.map(async (level) => {
          const body = await getJson<{ total: number; accuracy: number }>(`/api/drills/${drillId}/levels/${level}`);
          return { drillId, level, total: body.total, accuracy: body.accuracy };
        }),
      ),
    )
      .then((stats: LevelStat[]) => setTarget(pickToday(stats)))
      .catch(() => setTarget(pickToday([])));
  }, []);

  const drill = findDrill(target.drillId);
  return (
    <section className="space-y-4">
      <h1 className="text-3xl">Сегодня</h1>
      <p>
        {drill?.title ?? target.drillId}, уровень {target.level}
      </p>
      <Link className="text-primary" to={`/train/${target.drillId}?level=${target.level}`}>
        Начать
      </Link>
    </section>
  );
}
