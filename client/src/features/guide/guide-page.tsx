import { ARTICLES, filterTerms, type Article, type Term } from "@holdem/domain";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/utils";
import { ArticleVisual } from "./visuals";

function matchesArticle(article: Article, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return `${article.title} ${article.what} ${article.example} ${article.caveat}`.toLowerCase().includes(needle);
}

function groupTitle(group: string): string {
  return group.charAt(0).toUpperCase() + group.slice(1);
}

export function GuidePage() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(() => window.location.hash.replace("#", ""));
  const terms = useMemo(() => filterTerms(query), [query]);
  const articles = useMemo(() => {
    const linked = new Set(terms.flatMap((term) => (term.articleId ? [term.articleId] : [])));
    return ARTICLES.filter((article) => matchesArticle(article, query) || linked.has(article.id));
  }, [query, terms]);
  const groups = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, Term[]>();
    for (const term of terms) {
      const list = map.get(term.group);
      if (list) list.push(term);
      else {
        map.set(term.group, [term]);
        order.push(term.group);
      }
    }
    return order.map((group) => ({ group, terms: map.get(group) ?? [] }));
  }, [terms]);
  const current = articles.some((article) => article.id === active) ? active : (articles[0]?.id ?? "");

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const nodes = articles.map((article) => document.getElementById(article.id)).filter((node) => node instanceof HTMLElement);
    if (nodes.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.2, 0.5] },
    );
    for (const node of nodes) observer.observe(node);
    return () => observer.disconnect();
  }, [articles]);

  function openArticle(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
      <nav aria-label="Статьи" className="hidden lg:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-1 overflow-y-auto pr-1">
          {articles.map((article) => (
            <a
              key={article.id}
              href={`#${article.id}`}
              aria-current={article.id === current ? "location" : undefined}
              className={cn(
                "block rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                article.id === current ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {article.title}
            </a>
          ))}
        </div>
      </nav>
      <div className="min-w-0 space-y-10">
        <PageHeader title="Справочник" lede="Определение, пример и оговорка к каждому понятию. Числа на странице те же, что в статье." />
        <input
          className="min-h-11 w-full rounded-lg border border-border bg-card px-3"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Фильтр терминов"
          placeholder="Термин или статья"
        />
        {articles.length > 0 ? (
          <label className="block text-sm lg:hidden">
            Тема
            <select className="mt-1 min-h-11 w-full rounded-lg border border-border bg-card px-3" value={current} onChange={(event) => openArticle(event.target.value)}>
              {articles.map((article) => (
                <option key={article.id} value={article.id}>
                  {article.title}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <EmptyState title="Статей по этому запросу нет." />
        )}
        <div className="space-y-10">
          {articles.map((article) => (
            <article id={article.id} key={article.id} className="space-y-4 border-b border-border pb-10">
              <h2 className="text-2xl">{article.title}</h2>
              <p>{article.what}</p>
              <ArticleVisual id={article.id} />
              <p className="num overflow-x-auto rounded-xl border border-border bg-card p-4">{article.example}</p>
              <p className="rounded-xl bg-muted px-4 py-3 text-muted-foreground">{article.caveat}</p>
              {article.drillId ? (
                <Link className="inline-flex min-h-11 items-center font-medium text-primary" to={`/train/${article.drillId}?level=easy`}>
                  Тренировать
                </Link>
              ) : (
                <p>Тренажёра пока нет</p>
              )}
            </article>
          ))}
        </div>
        <section id="terms" className="space-y-6">
          <h2 className="text-2xl">Термины</h2>
          {groups.length === 0 ? <EmptyState title="Терминов по этому запросу нет." /> : null}
          {groups.map((group) => (
            <div key={group.group} className="space-y-3">
              <h3 className="text-lg">{groupTitle(group.group)}</h3>
              <ul className="space-y-3">
                {group.terms.map((term) => (
                  <li key={term.id} className="rounded-xl border border-border bg-card px-4 py-3">
                    {term.articleId ? (
                      <a className="font-medium text-primary" href={`#${term.articleId}`}>
                        {term.title}
                      </a>
                    ) : (
                      <span className="font-medium">{term.title}</span>
                    )}
                    <p className="mt-1 text-muted-foreground">{term.text}</p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
