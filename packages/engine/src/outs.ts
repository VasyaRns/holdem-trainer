import { fullDeck, SUITS, type Card, type Rank } from "./cards.ts";
import { heroStrictlyWins } from "./showdown.ts";

function deadSet(dead: Card[]) {
  return new Set(dead);
}

export function rankOuts(ranks: Rank[], dead: Card[] = []): number {
  const gone = deadSet(dead);
  return ranks.reduce(
    (sum, rank) => sum + SUITS.filter((suit) => !gone.has(`${rank}${suit}`)).length,
    0,
  );
}

export function flushDrawOuts(hole: [Card, Card], board: Card[], extraDead: Card[] = []): number | null {
  if (hole[0][1] !== hole[1][1]) return null;
  const suit = hole[0][1];
  const drawCards = [...hole, ...board].filter((card) => card[1] === suit).length;
  if (drawCards !== 4) return null;
  const blocked = extraDead.filter(
    (card) => card[1] === suit && !hole.includes(card) && !board.includes(card),
  ).length;
  return 13 - drawCards - blocked;
}

export function winningOuts(hero: [Card, Card], villain: [Card, Card], board: Card[]): Card[] {
  const used = new Set<Card>([...hero, ...villain, ...board]);
  return fullDeck().filter((card) => !used.has(card) && heroStrictlyWins(hero, villain, [...board, card]));
}
