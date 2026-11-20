import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  lede?: string;
  children?: ReactNode;
};

export function PageHeader({ title, lede, children }: PageHeaderProps) {
  return (
    <header className="space-y-3">
      <div className="space-y-2">
        <h1 className="text-3xl tracking-tight">{title}</h1>
        {lede ? <p className="max-w-2xl text-muted-foreground">{lede}</p> : null}
      </div>
      {children}
    </header>
  );
}
