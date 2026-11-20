import { SUITS, type Card, type Rank } from "./cards.ts";

function ranksLeft(rank: Rank, dead: Set<string>): number {
  return SUITS.filter((suit) => !dead.has(`${rank}${suit}`)).length;
}

export function pairCombos(rank: Rank, dead: Card[] = []): number {
  const left = ranksLeft(rank, new Set(dead));
  return (left * (left - 1)) / 2;
}

export function suitedCombos(high: Rank, low: Rank, dead: Card[] = []): number {
  const gone = new Set(dead);
  return SUITS.filter((suit) => !gone.has(`${high}${suit}`) && !gone.has(`${low}${suit}`)).length;
}

export function offsuitCombos(high: Rank, low: Rank, dead: Card[] = []): number {
  const gone = new Set(dead);
  let count = 0;
  for (const highSuit of SUITS) {
    if (gone.has(`${high}${highSuit}`)) continue;
    for (const lowSuit of SUITS) {
      if (highSuit === lowSuit || gone.has(`${low}${lowSuit}`)) continue;
      count += 1;
    }
  }
  return count;
}
