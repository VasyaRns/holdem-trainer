import { registry } from "@holdem/engine";
import { Link } from "react-router-dom";

const levels = [
  ["easy", "Простой"],
  ["medium", "Средний"],
  ["hard", "Сложный"],
] as const;

export function CatalogPage() {
  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl tracking-tight">Каталог</h1>
        <Link className="inline-flex rounded-xl bg-primary px-4 py-2 text-primary-foreground" to="/today">
          Сегодня
        </Link>
      </div>
      {registry.length === 0 ? (
        <p className="text-muted-foreground">Тренажёры появятся следующими блоками.</p>
      ) : (
        <ul className="space-y-4">
          {registry.map((drill) => (
            <li key={drill.id} className="rounded-xl border border-border bg-card p-4">
              <p className="mb-2">{drill.title}</p>
              <span className="flex gap-3 text-sm">
                {levels.map(([level, label]) => (
                  <Link key={level} className="text-primary" to={`/train/${drill.id}?level=${level}`}>
                    {label}
                  </Link>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
