import { Hand } from "pokersolver";
import type { Card } from "./cards.ts";

export function heroStrictlyWins(hero: [Card, Card], villain: [Card, Card], board: Card[]): boolean {
  const heroHand = Hand.solve([...hero, ...board]);
  const villainHand = Hand.solve([...villain, ...board]);
  const winners = Hand.winners([heroHand, villainHand]);
  return winners.length === 1 && winners[0] === heroHand;
}
