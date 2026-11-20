import type { PairCard, PairsDeck } from "@holdem/engine";
import { scorePairs } from "@holdem/engine";
import { useEffect, useRef, useState } from "react";

export const PAIRS_MISS_MS = 700;

type Phase = "preview" | "play" | "done";

export type PairsFinish = {
  moves: number;
  seconds: number;
  stars: number;
  passed: boolean;
};

export function PairsTable({
  title,
  stack,
  deck,
  onFinish,
}: {
  title: string;
  stack: number | null;
  deck: PairsDeck;
  onFinish?: (result: PairsFinish) => void;
}) {
  const [phase, setPhase] = useState<Phase>("preview");
  const [left, setLeft] = useState(deck.previewSeconds);
  const [up, setUp] = useState<string[]>([]);
  const [found, setFound] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const secondsRef = useRef(0);
  const hideTimer = useRef<number | null>(null);

  useEffect(() => {
    setPhase("preview");
    setLeft(deck.previewSeconds);
    setUp([]);
    setFound([]);
    setMoves(0);
    setSeconds(0);
    secondsRef.current = 0;
    if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
    const ticks = window.setInterval(() => {
      setLeft((value) => Math.max(0, value - 1));
    }, 1000);
    const close = window.setTimeout(() => {
      setPhase("play");
      setLeft(0);
      window.clearInterval(ticks);
    }, deck.previewSeconds * 1000);
    return () => {
      window.clearInterval(ticks);
      window.clearTimeout(close);
      if (hideTimer.current != null) window.clearTimeout(hideTimer.current);
    };
  }, [deck]);

  useEffect(() => {
    if (phase !== "play") return;
    const timer = window.setInterval(() => {
      setSeconds((value) => {
        const next = value + 1;
        secondsRef.current = next;
        return next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  function visible(card: PairCard): boolean {
    return phase === "preview" || phase === "done" || found.includes(card.pairId) || up.includes(card.id);
  }

  function openCard(card: PairCard) {
    if (phase !== "play" || found.includes(card.pairId) || up.includes(card.id) || up.length === 2) return;
    const next = [...up, card.id];
    if (next.length === 1) {
      setUp(next);
      return;
    }
    setMoves((value) => value + 1);
    const moveCount = moves + 1;
    const first = deck.cards.find((item) => item.id === next[0]);
    if (first && first.pairId === card.pairId) {
      const nextFound = [...found, card.pairId];
      setFound(nextFound);
      setUp([]);
      if (nextFound.length === deck.pairCount) {
        const result = scorePairs(moveCount, deck.pairCount);
        setPhase("done");
        onFinish?.({ moves: moveCount, seconds: secondsRef.current, stars: result.stars, passed: result.passed });
      }
      return;
    }
    setUp(next);
    hideTimer.current = window.setTimeout(() => {
      setUp([]);
      hideTimer.current = null;
    }, PAIRS_MISS_MS);
  }

  const score = phase === "done" ? scorePairs(moves, deck.pairCount) : null;

  return (
    <section className="space-y-4">
      <p>{title}</p>
      <p className="num">{stack == null ? "Стек не задан" : `${stack} bb`}</p>
      <p className="num">Ходы: {moves}</p>
      <p className="num">
        {phase === "preview" ? `Превью: ${left} с` : phase === "done" ? "Партия собрана" : "Карты закрыты"}
      </p>
      {phase !== "preview" ? <p className="num">Время: {seconds} с</p> : null}
      {score ? (
        <p className="num">
          Звёзды: {score.stars}. {score.passed ? "Зачтена" : "Не зачтена"}
        </p>
      ) : null}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        {deck.cards.map((card) => {
          const show = visible(card);
          const color = show ? card.color : null;
          return (
            <li key={card.id}>
              <button
                type="button"
                data-card={card.id}
                aria-label={show ? card.text : "Рубашка"}
                data-color={color ?? ""}
                disabled={phase !== "play" || found.includes(card.pairId)}
                onClick={() => openCard(card)}
                className={
                  show
                    ? "flex min-h-20 w-full items-center justify-center rounded-xl border border-border bg-card px-2 text-center text-base font-medium shadow-sm"
                    : "flex min-h-20 w-full items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
                }
                style={color ? { boxShadow: `inset 0 0 0 3px ${color}` } : undefined}
              >
                {show ? card.text : ""}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
