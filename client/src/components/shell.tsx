import { Link, NavLink, Outlet } from "react-router-dom";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Каталог", end: true },
  { to: "/progress", label: "Прогресс", end: false },
  { to: "/guide", label: "Справочник", end: false },
] as const;

function itemClass({ isActive }: { isActive: boolean }) {
  return cn(
    "inline-flex min-h-11 flex-1 items-center justify-center rounded-lg px-3 text-sm transition-colors duration-150 ease-standard sm:flex-none",
    isActive ? "bg-primary/10 font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );
}

export function Shell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[var(--z-overlay)] focus:rounded-lg focus:bg-card focus:px-3 focus:py-2"
      >
        К содержанию
      </a>
      <header className="sticky top-0 z-[var(--z-header)] border-b border-border bg-card/95 backdrop-blur-sm">
        <Container className="flex flex-col gap-1 py-2 sm:h-14 sm:flex-row sm:items-center sm:justify-between sm:py-0">
          <Link to="/" className="inline-flex min-h-11 items-center rounded-lg px-1 text-base font-semibold tracking-tight">
            Тренажёр холдема
          </Link>
          <nav aria-label="Разделы" className="flex gap-1">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={itemClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </Container>
      </header>
      <main id="content" className="mx-auto w-full max-w-[var(--content-width)] px-[var(--page-x)] py-[var(--page-y)]">
        <Outlet />
      </main>
    </div>
  );
}
