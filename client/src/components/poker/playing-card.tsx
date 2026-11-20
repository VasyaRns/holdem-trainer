import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

const suits = {
  s: { name: "пики", red: false },
  h: { name: "черви", red: true },
  d: { name: "бубны", red: true },
  c: { name: "трефы", red: false },
} as const;

export type Suit = keyof typeof suits;
type CardSize = "sm" | "md";

const sizeClass: Record<CardSize, string> = {
  sm: "h-16 w-11",
  md: "h-20 w-14",
};

function SuitMark({ suit, className, ...props }: { suit: Suit } & SVGProps<SVGSVGElement>) {
  const common = { viewBox: "0 0 24 24", "aria-hidden": true, className: cn("fill-current", className), ...props };
  if (suit === "h") {
    return (
      <svg {...common}>
        <path d="M12 20.5s-8-5.2-8-10.2a4.2 4.2 0 0 1 7.2-2.9A4.2 4.2 0 0 1 20 10.3c0 5-8 10.2-8 10.2z" />
      </svg>
    );
  }
  if (suit === "d") {
    return (
      <svg {...common}>
        <path d="M12 2.5 21 12 12 21.5 3 12 12 2.5z" />
      </svg>
    );
  }
  if (suit === "c") {
    return (
      <svg {...common}>
        <circle cx="12" cy="8" r="3.2" />
        <circle cx="7.6" cy="13.2" r="3.2" />
        <circle cx="16.4" cy="13.2" r="3.2" />
        <path d="M10.6 13.5h2.8l1 7.2h-4.8l1-7.2z" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 2.2c2.8 3.4 7.2 6.2 7.2 10.2A4.6 4.6 0 0 1 12 16.2 4.6 4.6 0 0 1 4.8 12.4C4.8 8.4 9.2 5.6 12 2.2z" />
      <path d="M10.7 15.2h2.6l1.1 6.2h-4.8l1.1-6.2z" />
    </svg>
  );
}

type PlayingCardProps = {
  rank: string;
  suit: Suit;
  faceDown?: boolean;
  size?: CardSize;
};

export function PlayingCard({ rank, suit, faceDown = false, size = "md" }: PlayingCardProps) {
  const box = sizeClass[size];
  if (faceDown) {
    return (
      <span
        role="img"
        aria-label="Рубашка"
        className={cn("inline-flex shrink-0 items-center justify-center rounded-lg border border-primary/40 bg-primary text-primary-foreground shadow-sm", box)}
      >
        <span aria-hidden className="h-8 w-5 rounded-sm border border-primary-foreground/50" />
      </span>
    );
  }
  const meta = suits[suit];
  const face = rank.toUpperCase() === "T" ? "10" : rank;
  const pip = size === "sm" ? "h-5 w-5" : "h-7 w-7";
  const index = size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3";
  return (
    <span
      role="img"
      aria-label={`${face} ${meta.name}`}
      className={cn(
        "relative inline-flex shrink-0 rounded-lg border border-foreground/15 bg-white shadow-sm",
        box,
        meta.red ? "text-suit-red" : "text-foreground",
      )}
    >
      <span className="absolute left-1 top-1 flex flex-col items-center leading-none">
        <span className={size === "sm" ? "text-[11px] font-semibold" : "text-sm font-semibold"}>{face}</span>
        <SuitMark suit={suit} className={index} />
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <SuitMark suit={suit} className={pip} />
      </span>
      <span className="absolute bottom-1 right-1 flex rotate-180 flex-col items-center leading-none">
        <span className={size === "sm" ? "text-[11px] font-semibold" : "text-sm font-semibold"}>{face}</span>
        <SuitMark suit={suit} className={index} />
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
