import { registry } from "@holdem/engine";
import { Link } from "react-router-dom";

export function CatalogPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl tracking-tight">Каталог</h1>
      {registry.length === 0 ? (
        <p className="text-muted-foreground">Тренажёры появятся следующими блоками.</p>
      ) : (
        <ul className="space-y-3">
          {registry.map((drill) => (
            <li key={drill.id}>
              <Link className="text-primary" to={`/train/${drill.id}`}>
                {drill.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
