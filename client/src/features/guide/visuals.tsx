import { CardRow, PlayingCard } from "@/components/poker/playing-card";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="num mt-1 text-2xl tracking-tight">{value}</p>
    </div>
  );
}

function Split({ parts }: { parts: { label: string; flex: number; className: string }[] }) {
  return (
    <div className="space-y-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" aria-hidden>
        {parts.map((part) => (
          <div key={part.label} className={part.className} style={{ flex: `${part.flex} 1 0%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {parts.map((part) => (
          <p key={part.label} className="num text-sm">
            {part.label}
          </p>
        ))}
      </div>
    </div>
  );
}

export function ArticleVisual({ id }: { id: string }) {
  if (id === "outs") {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-background p-4">
        <p className="text-sm text-muted-foreground">Иллюстрация примера</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <CardRow label="В руке">
            <PlayingCard rank="A" suit="h" />
            <PlayingCard rank="K" suit="h" />
          </CardRow>
          <CardRow label="На борде">
            <PlayingCard rank="Q" suit="h" />
            <PlayingCard rank="7" suit="h" />
            <PlayingCard rank="2" suit="c" />
          </CardRow>
        </div>
        <p className="num text-sm">Остаётся 9.</p>
      </div>
    );
  }
  if (id === "backdoor") {
    return (
      <div className="space-y-4 rounded-xl border border-border bg-background p-4">
        <p className="text-sm text-muted-foreground">После флопа нужны и терн, и ривер</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <CardRow label="В руке">
            <PlayingCard rank="A" suit="h" />
            <PlayingCard rank="K" suit="h" />
          </CardRow>
          <CardRow label="На борде">
            <PlayingCard rank="2" suit="h" />
            <PlayingCard rank="9" suit="c" />
            <PlayingCard rank="4" suit="d" />
          </CardRow>
        </div>
        <p className="num text-sm">Около 4%. Это не 9 аутов.</p>
      </div>
    );
  }
  if (id === "rule") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="9 аутов до ривера" value="36%" />
        <Stat label="Точно" value="35%" />
      </div>
    );
  }
  if (id === "pot") {
    return <Split parts={[{ label: "Банк 20", flex: 20, className: "bg-primary" }, { label: "Колл 10 · 33%", flex: 10, className: "bg-warn" }]} />;
  }
  if (id === "ev") {
    return <Stat label="0,4 × 30 − 10" value="2" />;
  }
  if (id === "combos") {
    return (
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Пара" value="6" />
        <Stat label="Одномастные" value="4" />
        <Stat label="Разномастные" value="12" />
      </div>
    );
  }
  if (id === "mdf") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Ставка в банк" value="50% и 50%" />
        <Stat label="Полпота" value="67% и 33%" />
      </div>
    );
  }
  if (id === "spr") {
    return <Stat label="Стек 100 и банк 20" value="5" />;
  }
  if (id === "icm") {
    return (
      <Split
        parts={[
          { label: "50", flex: 50, className: "bg-primary" },
          { label: "30", flex: 30, className: "bg-info" },
          { label: "20", flex: 20, className: "bg-warn" },
        ]}
      />
    );
  }
  if (id === "nodelock") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Колл" value="40%" />
        <Stat label="Колл" value="70%" />
      </div>
    );
  }
  return null;
}
