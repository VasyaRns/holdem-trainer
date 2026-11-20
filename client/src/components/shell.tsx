import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn("text-sm", isActive ? "text-primary" : "text-muted-foreground");

export function Shell() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-6 px-6 py-4">
          <p className="text-lg tracking-tight">Тренажёр холдема</p>
          <nav className="flex gap-4">
            <NavLink to="/" end className={linkClass}>
              Каталог
            </NavLink>
            <NavLink to="/progress" className={linkClass}>
              Прогресс
            </NavLink>
            <NavLink to="/guide" className={linkClass}>
              Справочник
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}
