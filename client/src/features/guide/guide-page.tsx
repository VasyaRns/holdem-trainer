import { ARTICLES, filterTerms } from "@holdem/domain";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

export function GuidePage() {
  const [query, setQuery] = useState("");
  const terms = useMemo(() => filterTerms(query), [query]);
  return (
    <div className="space-y-10">
      {ARTICLES.map((article) => (
        <article id={article.id} key={article.id} className="space-y-2">
          <h2 className="text-2xl">{article.title}</h2>
          <p>{article.what}</p>
          <p className="num rounded-xl bg-card p-4">{article.example}</p>
          <p className="text-muted-foreground">{article.caveat}</p>
          {article.drillId ? (
            <Link className="text-primary" to={`/train/${article.drillId}?level=easy`}>
              Тренировать
            </Link>
          ) : (
            <p>Тренажёра пока нет</p>
          )}
        </article>
      ))}
      <section id="terms" className="space-y-3">
        <h2 className="text-2xl">Термины</h2>
        <input className="w-full rounded-xl border border-border bg-card px-3 py-2" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Фильтр терминов" />
        <ul className="space-y-2">
          {terms.map((term) => (
            <li key={term.id}>
              {term.articleId ? <a href={`#${term.articleId}`}>{term.title}</a> : <span>{term.title}</span>}
              <span className="text-muted-foreground"> — {term.text}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
