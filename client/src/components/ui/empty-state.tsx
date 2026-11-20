type EmptyStateProps = {
  title: string;
  text?: string;
};

export function EmptyState({ title, text }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center">
      <p className="font-medium">{title}</p>
      {text ? <p className="mt-1 text-sm text-muted-foreground">{text}</p> : null}
    </div>
  );
}
