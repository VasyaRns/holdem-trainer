import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const suits = {
  s: { symbol: "♠", name: "пики", red: false },
  h: { symbol: "♥", name: "черви", red: true },
  d: { symbol: "♦", name: "бубны", red: true },
  c: { symbol: "♣", name: "трефы", red: false },
} as const;

export type Suit = keyof typeof suits;

type PlayingCardProps = {
  rank: string;
  suit: Suit;
  faceDown?: boolean;
};

export function PlayingCard({ rank, suit, faceDown = false }: PlayingCardProps) {
  if (faceDown) {
    return (
      <span
        role="img"
        aria-label="Рубашка"
        className="inline-flex h-16 w-11 shrink-0 items-center justify-center rounded-md border border-primary/30 bg-primary text-primary-foreground shadow-sm"
      >
        <span aria-hidden className="h-8 w-5 rounded-sm border border-primary-foreground/40" />
      </span>
    );
  }
  const meta = suits[suit];
  const face = rank.toUpperCase() === "T" ? "10" : rank;
  return (
    <span
      role="img"
      aria-label={`${face} ${meta.name}`}
      className={cn(
        "inline-flex h-16 w-11 shrink-0 flex-col justify-between rounded-md border border-border bg-card px-1 py-1 shadow-sm",
        meta.red ? "text-suit-red" : "text-foreground",
      )}
    >
      <span className={face === "10" ? "text-xs font-semibold leading-none" : "text-sm font-semibold leading-none"}>{face}</span>
      <span aria-hidden className="self-end text-lg leading-none">
        {meta.symbol}
      </span>
    </span>
  );
}

export function CardRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0 space-y-2">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
